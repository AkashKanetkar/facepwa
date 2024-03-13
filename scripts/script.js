if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/facepwa/service-worker.js')
    .then((registration) => {
      console.log('Service Worker registered with scope:', registration.scope);
    })
    .catch((error) => {
      console.error('Service Worker registration failed:', error);
    });
}

const video = document.getElementById("video");
const statusElement = document.getElementById("status");
const waitingTimeout = 7000; // 9 seconds
const displayDelay = 6500; // 6.5 seconds

let lastFaceDetectionTime = 0;
let waitingTimeoutId;

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/facepwa/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/facepwa/models"),
]).then(startWebcam);

function startWebcam() {
  navigator.mediaDevices
    .enumerateDevices()
    .then((devices) => {
      const videoDevices = devices.filter((device) => device.kind === "videoinput");

      if (videoDevices.length > 0) {
        const deviceId = videoDevices[0].deviceId; // Change index if needed
        return navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId } },
          audio: false,
        });
      } else {
        console.error("No video devices found.");
        throw new Error("No video devices found.");
      }
    })
    .then((stream) => {
      video.srcObject = stream;
    })
    .catch((error) => {
      console.error(error);
    });
}

video.addEventListener("play", () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  faceapi.matchDimensions(canvas, { height: video.height, width: video.width });

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();

    const currentTime = Date.now();

    if (detections.length > 0) {
      // Face detected
      lastFaceDetectionTime = currentTime;
      showOccupiedStatus();
    } else {
      // No face detected
      const elapsedTimeSinceLastDetection = currentTime - lastFaceDetectionTime;

      if (elapsedTimeSinceLastDetection < waitingTimeout) {
        // Still within the waiting timeout, show "Waiting..."
        showWaitingStatus();
      } else {
        // Waiting timeout exceeded, show "Seat not occupied"
        showNotOccupiedStatus();
      }
    }
  }, 100); // Set the interval duration to 100 milliseconds
});

function showOccupiedStatus() {
  statusElement.textContent = "Seat occupied";
}

function showNotOccupiedStatus() {
  statusElement.textContent = "Seat not occupied";
}

function showWaitingStatus() {
  statusElement.textContent = "Waiting...";
}





// const video = document.getElementById("video");

// Promise.all([
//   faceapi.nets.tinyFaceDetector.loadFromUri("/facepwa/models"),
//   faceapi.nets.faceLandmark68Net.loadFromUri("/facepwa/models"),
// ]).then(startWebcam);

// function startWebcam() {
//   navigator.mediaDevices
//     .getUserMedia({
//       video: true,
//       audio: false,
//     })
//     .then((stream) => {
//       video.srcObject = stream;
//     })
//     .catch((error) => {
//       console.error(error);
//     });
// }

// video.addEventListener("play", () => {
//   const canvas = faceapi.createCanvasFromMedia(video);
//   document.body.append(canvas);
//   faceapi.matchDimensions(canvas, { height: video.height, width: video.width });

//   setInterval(async () => {
//     const detections = await faceapi
//       .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
//       .withFaceLandmarks();

//     const resizedDetections = faceapi.resizeResults(detections, {
//       height: video.height,
//       width: video.width,
//     });
//     canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
//     faceapi.draw.drawDetections(canvas, resizedDetections);
//     faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

//     console.log(detections);
//   }, 100);
// });

