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
    let svgElm = document.createElement("svg");
    svgElm.setAttribute("width", width.toString());
    svgElm.setAttribute("height", height.toString());
    svgElm.id = id;

    return svgElm;
}


function getDimensionsFromBase64Image(base64) {
    let hiddenImage = new Image();
    hiddenImage.src = base64;
    hiddenImage.classList.add("hidden");
    hiddenImageID = CreateUUID();
    hiddenImage.id = hiddenImageID;

    document.body.append(hiddenImage);
    loadedImage = document.getElementById(hiddenImageID);
    dimensions = [loadedImage.naturalWidth, loadedImage.naturalHeight];
    loadedImage.outerHTML = "";

    console.log(dimensions);
    return dimensions
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

            console.log(evt);
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
    let firstTab = document.createElement("li");

    firstTab.innerHTML = "<a href='#'>Original</a>";
    firstTab.classList.add("uk-active");

    tabContainer.appendChild(firstTab);
    tabContainer.classList.add("uk-tab", "image-tabs");

    // Making switcher section
    let switcherContainer = document.createElement("ul")
    let firstSwitcher = document.createElement("li");
    let image = document.createElement("img");

    image.id = imageName;

    // Inserting SVG overlays on Image load
    image.addEventListener("load", function() {
        // Making SVG overlays for ROIs and ROI points
        // Overlays are added on image load through a callback
        let svgROI = createSVGOverlay(this.naturalWidth, this.naturalHeight, this.id + "-roi");
        let svgPoints = createSVGOverlay(this.naturalWidth, this.naturalHeight, this.id + "-points");

        // Creating detection plane for registering clicks on image
        let svgDetector = document.createElement("div");
        svgDetector.style.width = this.naturalWidth.toString() + "px";
        svgDetector.style.height = this.naturalHeight.toString() + "px";
        svgDetector.style.display = "block";

        // Registering click detection for ROI drawing
        svgDetector.addEventListener("click", function(){console.log("clicked")})

        let parent = this.parentElement;
        parent.insertBefore(svgROI, parent.firstChild);
        parent.insertBefore(svgPoints, parent.firstChild);
        parent.insertBefore(svgDetector, parent.firstChild);
    })

    image.setAttribute("src", imageBase64);

    firstSwitcher.appendChild(image);
    firstSwitcher.classList.add("uk-active");

    // Making & Adding buttons to first switcher for ROI selection
    let buttonContainer = document.createElement("p")
    buttonContainer.classList.add("uk-margin");

    let clearButton = createButton("Clear Selection", "large");
    let detectButton = createButton("Detect Text in Selection", "large");
    buttonContainer.appendChild(clearButton);
    buttonContainer.appendChild(detectButton);

    firstSwitcher.appendChild(buttonContainer);

    switcherContainer.appendChild(firstSwitcher);
    switcherContainer.classList.add("uk-switcher", "image-switcher");

    // Appending tabs & switcher to container
    imageContainer.appendChild(tabContainer);
    imageContainer.appendChild(switcherContainer);

    return imageContainer
}
