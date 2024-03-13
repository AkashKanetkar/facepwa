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
const controlButton = document.getElementById("controlButton");
const waitingTimeout = 7000; // 7 seconds

let lastFaceDetectionTime = 0;
let waitingTimeoutId;
let isOccupancyDetectionRunning = false;
let initialStream = null;

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/facepwa/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/facepwa/models"),
]).then(() => {
  controlButton.addEventListener("click", toggleSeatOccupancy);
});

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
      initialStream = stream;
    })
    .catch((error) => {
      console.error(error);
    });
}

function startSeatOccupancy() {
  startWebcam();

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

  isOccupancyDetectionRunning = true;
  updateControlButtonLabel();
}

function stopSeatOccupancy() {
  // Stop the webcam and face detection
  const stream = video.srcObject;
  const tracks = stream.getTracks();

  tracks.forEach(track => track.stop());

  // Remove canvas
  const canvas = document.querySelector('canvas');
  if (canvas) {
    canvas.remove();
  }

  // Restore initial stream
  video.srcObject = initialStream;

  isOccupancyDetectionRunning = false;
  updateControlButtonLabel();
  showWaitingStatus();
}

function toggleSeatOccupancy() {
  if (isOccupancyDetectionRunning) {
    stopSeatOccupancy();
  } else {
    startSeatOccupancy();
  }
}

function showOccupiedStatus() {
  statusElement.textContent = "Seat occupied";
}

function showNotOccupiedStatus() {
  statusElement.textContent = "Seat not occupied";
}

function showWaitingStatus() {
  statusElement.textContent = "Waiting...";
}

function updateControlButtonLabel() {
  controlButton.textContent = isOccupancyDetectionRunning ? "Stop Seat Occupancy Detection" : "Start Seat Occupancy Detection";
}
