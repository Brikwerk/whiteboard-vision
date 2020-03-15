function showPhotoUploadSection() {
    let buttonContainer = document.getElementById("button-container");
    let imageUploadSection = document.getElementById("image-upload-section")

    // Hide Buttons and Show Upload Section
    buttonContainer.classList.add("hidden");
    imageUploadSection.classList.remove("hidden");
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
        let name = createUUID() + "." + extension;

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
            roi.appendChild(createSVGROIPolygon());
        }

        addSVGPolygonPoint(roi.children[0], x, y);
    }
}


function getImageSelection(evt) {
    let imageName = evt.target.getAttribute("imageName");
    let points = document.getElementById(imageName + "-points");

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
    selectCanvas.id = imageName + "-" + tabNum
    let image = document.getElementById(imageName);

    if (points.children.length !== 4) {
        selectCanvas.width = image.naturalWidth;
        selectCanvas.height = image.naturalHeight;
        let ctx = selectCanvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
    } else {
        let coords = getSelectionCoords(points);
        cropSelection(image, selectCanvas, coords);
    }

    // Adding switcher with selected image page
    newSwitcher.appendChild(selectCanvas);
    changeTabSwitcher(tabNum, switcher, tabs);
    // UIkit.switcher(switcher).show(tabNum);

    // Beginning the recognition process
    performRecognition(selectCanvas, function(data){
        // Checking for errors in data
        if (data.hasOwnProperty("error")) {
            newTab.firstChild.innerHTML = "Selection " + tabNum + " <span uk-icon='close'></span>";
            let message = data["error"];
            UIkit.notification({message: '<span uk-icon=\'icon: ban\'></span> ' + message});
            return;
        }

        newTab.firstChild.innerHTML = "Selection " + tabNum + " <span uk-icon='check'></span>";
        let recognitionRoisName = imageName + "-sel-" + tabNum + "-roi";
        let recognitionRois = createSVGOverlay(selectCanvas.width, selectCanvas.height, recognitionRoisName);

        // Rendering ROIs to the SVG
        imageData = data[Object.keys(data)[0]]["words"]; // Getting first image data since we only sent one image
        sentenceData = data[Object.keys(data)[0]]["sentences"];
        // Iterating over words within the image data
        for (let i = 0; i < Object.keys(imageData).length; i++) {
            let bbox = imageData[i]["bbox"];
            let text = imageData[i]["text"];
            let score = Math.round(imageData[i]["score"] * 100);

            let polygon = createSVGROIPolygon();
            polygon.classList.add("recognition-roi");
            polygon.setAttribute("uk-tooltip", "" + text + " (" + score + "%)");
            addSVGPolygonPoint(polygon, bbox[0][0], bbox[0][1]);
            addSVGPolygonPoint(polygon, bbox[1][0], bbox[1][1]);
            addSVGPolygonPoint(polygon, bbox[2][0], bbox[2][1]);
            addSVGPolygonPoint(polygon, bbox[3][0], bbox[3][1]);
            recognitionRois.appendChild(polygon);
        }
        // Outlining detected sentences
        for (let i = 0; i < sentenceData.length; i++) {
            let bbox = enlargeRectangle(sentenceData[i], 5);
            let polygon = createSVGOutlinePolygon();
            addSVGPolygonPoint(polygon, bbox[0][0], bbox[0][1]);
            addSVGPolygonPoint(polygon, bbox[1][0], bbox[1][1]);
            addSVGPolygonPoint(polygon, bbox[2][0], bbox[2][1]);
            addSVGPolygonPoint(polygon, bbox[3][0], bbox[3][1]);
            recognitionRois.appendChild(polygon);
        }
        newSwitcher.insertBefore(recognitionRois, newSwitcher.firstChild);

        let structuredText = getStructuredText(data);
        DATA.push({
            "image": selectCanvas,
            "text": structuredText
        })

        // Show download button if it's not already shown
        document.getElementById("download-button-section").classList.remove("hidden");
    });
}
