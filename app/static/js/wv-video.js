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

    // Loading SVG Overlays on webcam stream load
    video.addEventListener("loadedmetadata", function(){
        // Making SVG overlays for ROIs and ROI points
        // Overlays are added on image load through a callback
        let svgROI = createSVGOverlay(this.videoWidth, this.videoHeight, this.id + "-roi");
        let svgPoints = createSVGOverlay(this.videoWidth, this.videoHeight, this.id + "-points");
        svgPoints.classList.add("svg-overlay-points");

        // Creating detection plane for registering clicks on image
        let svgDetector = createSVGOverlay(this.videoWidth, this.videoHeight, this.id + "-detector");

        // Registering click detection for ROI drawing
        svgDetector.addEventListener("click", drawVideoPoint)
        svgDetector.classList.add("svg-overlay-detector");
        svgDetector.setAttribute("imageName", this.id);
        svgDetector.setAttribute("imageWidth", this.videoWidth);
        svgDetector.setAttribute("imageHeight", this.videoHeight);

        let parent = this.parentElement;
        parent.insertBefore(svgROI, parent.firstChild);
        parent.insertBefore(svgPoints, parent.firstChild);
        parent.insertBefore(svgDetector, parent.firstChild);
    });

    init(video);
}

function drawVideoPoint(evt) {
    let detector = evt.target
    let imageName = detector.getAttribute("imageName");
    let rect = evt.target.getBoundingClientRect();
    let imageWidth = detector.getAttribute("imageWidth");
    let imageHeight = detector.getAttribute("imageHeight");
    // Getting mouse position relative to the image/detector
    let rx = (evt.clientX - rect.left)/detector.clientWidth;
    let ry = (evt.clientY - rect.top)/detector.clientHeight;
    // Getting coords relative to the real image size
    let x = Math.round(imageWidth * rx);
    let y = Math.round(imageHeight * ry);
    
    // Drawing circle and polygon point at clicked point
    let points = document.getElementById(imageName + "-points");
    let roi = document.getElementById(imageName + "-roi");
    // Append only if there are less than 4 points
    if (points.children.length < 4) {
        let circle = createSVGCircle(x, y);
        points.appendChild(circle);

        // Create poly if it doesn't exist
        if (roi.children.length === 0) {
            roi.appendChild(createSVGPolygon());
        }

        addSVGPolygonPoint(roi.children[0], x, y);
    }
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
