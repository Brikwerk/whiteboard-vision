// Success
function handleSuccess(stream, videoElement) {
    window.stream = stream;
    videoElement.srcObject = stream;
}


async function init(videoElement) {
    const constraints = {
        audio: false,
        video: true
    };
    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        handleSuccess(stream, videoElement);
    } catch (e) {
        console.error(`navigator.getUserMedia error:${e.toString()}`);
    }
}


function renderVideoSection() {
    let buttonContainer = document.getElementById("button-container");
    let videoSection = document.getElementById("video-section")

    // Hide Buttons and Show Upload Section
    buttonContainer.classList.add("hidden");
    videoSection.classList.remove("hidden");

    let videoContainer = document.createElement("div");
    videoContainer.id = "video-container";
    let video = document.createElement("video");
    video.id = "webcam-stream";
    video.controls = false;
    video.autoplay = true
    videoContainer.appendChild(video);
    videoSection.appendChild(videoContainer);

    init(video);
}


function captureVideoFrame() {
    let videoSection = document.getElementById("video-section");
    let video = document.getElementById("webcam-stream");

    let canvas = document.createElement("canvas");
    canvas.height = video.videoHeight;
    canvas.width = video.videoWidth;
    canvas.classList.add("webcam-snapshot");

    let ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    videoSection.appendChild(canvas);
}
