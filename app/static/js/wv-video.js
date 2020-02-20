/**
 * Attempts to Initialize a video only MediaStream and place into a passed HTMLElement.
 * @param {HTMLElement} videoElement An element for the initialized MediaStream to be placed in.
 */
async function initMediaStream(videoElement) {
    const constraints = {
        audio: false,
        video: true
    };
    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        window.stream = stream;
        videoElement.srcObject = stream;
    } catch (e) {
        console.error(`navigator.getUserMedia error:${e.toString()}`);
    }
}


/**
 * Creates and renders the MediaStream for selection and snapshotting 
 */
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
    videoSection.insertBefore(videoContainer, videoSection.firstChild);

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

    initMediaStream(video);

    let clearPointsButton = document.getElementById("webcam-stream-clear-points");
    clearPointsButton.addEventListener("click", clearSelection);
}


/**
 * Draws a point within the ROI and Point SVGs on the media stream.
 * @param {MouseEvent} evt A MouseEvent with the relevant target information 
 */
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
            roi.appendChild(createSVGROIPolygon());
        }

        addSVGPolygonPoint(roi.children[0], x, y);
    }
}


/**
 * Capturing the full or selected portion of the media stream frame and rendering to a timestamped section
 */
function captureVideoFrame() {
    let videoSection = document.getElementById("video-section");
    let video = document.getElementById("webcam-stream");
    let points = document.getElementById("webcam-stream-points");

    let snapshotContainer = document.createElement("div");
    snapshotContainer.classList.add("snapshot-container");

    // Adding date captured as header
    let dt = new Date().toLocaleString()
    let dtHeading = document.createElement("h3");
    dtHeading.classList.add("uk-heading");
    dtHeading.innerHTML = "<span>" + dt + "&nbsp;&nbsp;<div uk-spinner='ratio: 0.9'></div></span>";
    snapshotContainer.appendChild(dtHeading);

    // Creating and drawing media stream to a canvas
    let canvas = document.createElement("canvas");
    canvas.height = video.videoHeight;
    canvas.width = video.videoWidth;
    canvas.classList.add("webcam-snapshot");

    let ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Cropping (optional) and rendering
    if (points.childElementCount === 4) {
        imgb64 = canvas.toDataURL();
        let image = document.createElement("img");

        image.onload = function() {
            // Creating new canvas for cropped video frame
            // let canvasCrop = document.createElement("canvas");
            // canvasCrop.classList.add("webcam-snapshot");
            snapshotContainer.appendChild(canvas);
            videoSection.appendChild(snapshotContainer);

            coords = getSelectionCoords(points);
            cropSelection(this, canvas, coords);

            performRecognition(canvas, function(data) {
                appendResults(data, dtHeading, canvas, snapshotContainer)
            });
        }

        image.setAttribute("src", imgb64);
    } else {
        snapshotContainer.appendChild(canvas);
        videoSection.appendChild(snapshotContainer);

        performRecognition(canvas, function(data) {
            appendResults(data, dtHeading, canvas, snapshotContainer);
        });
    }
}


function appendResults(data, dtHeading, canvas, container) {
    dtHeading.innerHTML = dtHeading.innerText + " <span uk-icon='check'></span>";
    let recognitionRoisName = createUUID() + "-sel-roi";
    let recognitionRois;
    recognitionRois = createSVGOverlay(canvas.width, canvas.height, recognitionRoisName);

    // Rendering ROIs to the SVG
    imageData = data[Object.keys(data)[0]] // Getting first image data since we only sent one image
    // Iterating over words within the image data
    for (let i = 0; i < Object.keys(imageData).length; i++) {
        let bbox = imageData[i]["bbox"];
        let text = imageData[i]["text"];
        let score = Math.round(imageData[i]["score"] * 100)

        let polygon = createSVGROIPolygon();
        polygon.classList.add("recognition-roi");
        polygon.setAttribute("uk-tooltip", "" + text + " (" + score + "%)");
        addSVGPolygonPoint(polygon, bbox[0][0], bbox[0][1])
        addSVGPolygonPoint(polygon, bbox[1][0], bbox[1][1])
        addSVGPolygonPoint(polygon, bbox[2][0], bbox[2][1])
        addSVGPolygonPoint(polygon, bbox[3][0], bbox[3][1])
        recognitionRois.appendChild(polygon);
    }

    container.insertBefore(recognitionRois, container.children[1]);
}
