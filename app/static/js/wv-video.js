function showVideoSection() {
    let buttonContainer = document.getElementById("button-container");
    let videoSection = document.getElementById("video-section")

    // Hide Buttons and Show Upload Section
    buttonContainer.classList.add("hidden");
    videoSection.classList.remove("hidden");

    let video = document.createElement("video");
    video.controls = false;
    videoSection.appendChild(video);

    navigator.getMedia = navigator.mediaDevices.getUserMedia;
    webcamOptions = {
        video: true,
        audio: false
    }
    navigator.getMedia(
        webcamOptions, 
        function success(stream) {
            video.src = window.URL.createObjectURL(stream);
            video.play();
        },
        function error(e) {
            console.error(e);
        }
    )
}
