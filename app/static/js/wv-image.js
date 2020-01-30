function deleteChildren(elm) {
    while (elm.hasChildNodes()) {
        elm.removeChild(elm.lastChild);
    }
}


function showPhotoUploadSection() {
    let buttonContainer = document.getElementById("button-container");
    let imageUploadSection = document.getElementById("image-upload-section")

    // Hide Buttons and Show Upload Section
    buttonContainer.classList.add("hidden");
    imageUploadSection.classList.remove("hidden");
}


function CreateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function createButton(buttonText, buttonType) {
    let button = document.createElement("button");
    button.classList.add("uk-button", "uk-button-primary");
    button.innerHTML = buttonText;

    if (buttonType === "large") {
        button.classList.add("uk-width-1-1", "uk-margin-small-bottom");
    }

    return button
}


function createSVGOverlay(width, height, id) {
    let svgElm = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgElm.setAttribute("viewBox", "0 0 " + width.toString() + " " + height.toString());
    svgElm.id = id;
    svgElm.classList.add("svg-overlay");

    return svgElm;
}


function createSVGCircle(x, y) {
    let svgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    svgCircle.setAttribute("cx", x.toString());
    svgCircle.setAttribute("cy", y.toString());
    svgCircle.setAttribute("r", "6");
    svgCircle.setAttribute("stroke", "white");
    svgCircle.setAttribute("stroke-width", "2");
    svgCircle.setAttribute("fill", "red");

    return svgCircle;
}


function createSVGPolygon() {
    let svgPoly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    svgPoly.setAttribute("points", "");
    svgPoly.style.fill = "lime";
    svgPoly.style.opacity = "0.5";

    return svgPoly;
}


function addSVGPolygonPoint(poly, x, y) {
    let points = poly.getAttribute("points");
    points = points + " " + x + "," + y;
    poly.setAttribute("points", points);
}

function createTab(tabName) {
    let tab = document.createElement("li");
    let tabAnchor = document.createElement("a");
    tabAnchor.setAttribute("href", "#");
    tabAnchor.innerHTML = tabName
    
    tab.appendChild(tabAnchor);

    return tab
}


function renderUploadedImages(imageFiles) {
    if (imageFiles.length == 0) {
        return;
    }

    for (let i = 0; i < imageFiles.length; i++) {
        let file = imageFiles[i];
        let reader = new FileReader();

        // Checking for an image
        if (!file || !file.type.match(/image.*/)) {
            continue;
        }

        // Getting unique filename
        let extension = file.name.split('.').pop();
        if (extension === file.name) {
            extension = "";
        }
        let name = CreateUUID() + "." + extension;

        // Loading image onto page
        reader.onload = function(evt) {
            container = document.getElementById("uploads-container");

            imageContainer = renderImageContainer(evt.target.result, name);

            container.appendChild(imageContainer);
        };
        reader.onerror = function (evt) {
          console.error("An error ocurred while reading the image",evt);
        };
        reader.readAsDataURL(file);
    }
}


function renderImageContainer(imageBase64, imageName) {
    let imageContainer = document.createElement("div");
    imageContainer.id = imageName + "-container";
    imageContainer.setAttribute("imageName", imageName);
    imageContainer.classList.add("image-upload-container");

    // Making tab section
    let tabContainer = document.createElement("ul");
    tabContainer.id = imageName + "-tabs";
    let firstTab = document.createElement("li");

    firstTab.innerHTML = "<a href='#'>Original</a>";
    firstTab.classList.add("uk-active");

    tabContainer.appendChild(firstTab);
    tabContainer.classList.add("uk-tab", "image-tabs");

    // Making switcher section
    let switcherContainer = document.createElement("ul")
    switcherContainer.id = imageName + "-switcher";
    let firstSwitcher = document.createElement("li");
    let image = document.createElement("img");

    image.id = imageName;

    // Inserting SVG overlays on Image load
    image.addEventListener("load", function() {
        // Making SVG overlays for ROIs and ROI points
        // Overlays are added on image load through a callback
        let svgROI = createSVGOverlay(this.naturalWidth, this.naturalHeight, this.id + "-roi");
        let svgPoints = createSVGOverlay(this.naturalWidth, this.naturalHeight, this.id + "-points");
        svgPoints.classList.add("svg-overlay-points");

        // Creating detection plane for registering clicks on image
        let svgDetector = createSVGOverlay(this.naturalWidth, this.naturalHeight, this.id + "-detector");

        // Registering click detection for ROI drawing
        svgDetector.addEventListener("click", drawPoint)
        svgDetector.classList.add("svg-overlay-detector");
        svgDetector.setAttribute("imageName", this.id);
        svgDetector.setAttribute("imageWidth", this.naturalWidth);
        svgDetector.setAttribute("imageHeight", this.naturalHeight);

        let parent = this.parentElement;
        parent.insertBefore(svgROI, parent.firstChild);
        parent.insertBefore(svgPoints, parent.firstChild);
        parent.insertBefore(svgDetector, parent.firstChild);
    });

    image.setAttribute("src", imageBase64);

    firstSwitcher.appendChild(image);
    firstSwitcher.classList.add("uk-active");

    // Making & Adding buttons to first switcher for ROI selection
    let buttonContainer = document.createElement("p")
    buttonContainer.classList.add("uk-margin");

    let clearButton = createButton("Clear Selection", "large");
    clearButton.setAttribute("imageName", imageName);
    clearButton.addEventListener("click", clearSelection);
    let detectButton = createButton("Detect Text in Selection", "large");
    detectButton.setAttribute("imageName", imageName);
    detectButton.addEventListener("click", getImageSelection);

    buttonContainer.appendChild(clearButton);
    buttonContainer.appendChild(detectButton);

    firstSwitcher.appendChild(buttonContainer);

    switcherContainer.appendChild(firstSwitcher);
    switcherContainer.classList.add("uk-switcher", "image-switcher");

    // Appending tabs & switcher to container
    imageContainer.appendChild(tabContainer);
    imageContainer.appendChild(switcherContainer);

    // Initializing switcher/tabs
    UIkit.switcher(switcherContainer);
    UIkit.tab(tabContainer);

    return imageContainer
}


function drawPoint(evt) {
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


function clearSelection(evt) {
    let imageName = evt.target.getAttribute("imageName");
    let roi = document.getElementById(imageName + "-roi");
    let points = document.getElementById(imageName + "-points");
    deleteChildren(roi);
    deleteChildren(points);
}


function getImageSelection(evt) {
    let imageName = evt.target.getAttribute("imageName");
    let points = document.getElementById(imageName + "-points");

    if (points.children.length !== 4) {
        UIkit.notification({message: 'Not enough points for selection!', status: 'danger'});
        return;
    }

    // Adding new tab/switcher
    let tabs = document.getElementById(imageName + "-tabs");
    let switcher = document.getElementById(imageName + "-switcher");
    // Creating new elements
    let newSwitcher = document.createElement("li");
    switcher.appendChild(newSwitcher);
    let tabNum = tabs.childElementCount;
    let newTab = createTab('Selection ' + tabNum + '&nbsp;&nbsp;<div uk-spinner="ratio: 0.4"></div>');
    tabs.appendChild(newTab);

    // Getting and rectifying selection
    let selectCanvas = document.createElement("canvas");
    let image = document.getElementById(imageName);
    let coords = getSelectionCoords(points);
    cropSelection(image, selectCanvas, coords);

    newSwitcher.appendChild(selectCanvas);
}
