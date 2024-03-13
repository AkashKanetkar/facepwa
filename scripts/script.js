document.addEventListener("DOMContentLoaded", function () {
  const video = document.getElementById("video");
  const statusDiv = document.getElementById("status");
  const controlButton = document.getElementById("controlButton"); // Added this line

  let isOccupied = false;
  let detectionInterval;

  async function startDetection() {
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/facepwa/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/facepwa/models");

      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          video.srcObject = stream;
          controlButton.innerText = "Stop Seat Occupancy Detection";
          isOccupied = false;
          statusDiv.innerText = "Status: Waiting...";
          detectionInterval = setInterval(checkSeatOccupancy, 5000);
        })
        .catch((error) => {
          console.error(error);
        });
    } catch (error) {
      console.error(error);
    }
  }

  function stopDetection() {
    if (detectionInterval) {
      clearInterval(detectionInterval);
    }
    if (video.srcObject) {
      const tracks = video.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      video.srcObject = null;
    }
    controlButton.innerText = "Start Seat Occupancy Detection";
  }

  async function checkSeatOccupancy() {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();

    if (detections.length > 0) {
      // Face detected
      isOccupied = true;
      statusDiv.innerText = "Status: Seat Occupied";
    } else {
      // Face not detected
      isOccupied = false;
      statusDiv.innerText = "Status: Seat Not Occupied";
    }
  }

  function toggleSeatOccupancy() {
    if (!isOccupied) {
      startDetection();
    } else {
      stopDetection();
    }
  }

  controlButton.addEventListener("click", toggleSeatOccupancy);
});
