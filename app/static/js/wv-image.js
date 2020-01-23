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
        reader.onload = function (evt) {
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


function renderImageContainer(imageBase64, containerName) {
    let imageContainer = document.createElement("div");
    imageContainer.id = containerName + "-container";
    imageContainer.setAttribute("imageName", containerName);
    imageContainer.classList.add("image-upload-container");

    // Making tab section
    let tabContainer = document.createElement("ul");
    let firstTab = document.createElement("li");

    firstTab.innerHTML = "<a href='#'>Original</a>";
    firstTab.classList.add("uk-active");

    tabContainer.appendChild(firstTab);
    tabContainer.classList.add("uk-tab", "image-tabs");

    // Making switch section
    let switcherContainer = document.createElement("ul")
    let firstSwitcher = document.createElement("li");
    let image = document.createElement("img");

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
