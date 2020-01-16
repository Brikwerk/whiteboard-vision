function showPhotoUploadSection() {
    let buttonContainer = document.getElementById("button-container");
    let imageUploadSection = document.getElementById("image-upload-section")

    // Hide Buttons and Show Upload Section
    buttonContainer.classList.add("hidden");
    imageUploadSection.classList.remove("hidden");
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

            imageContainer = renderImageContainer(evt.target.result);

            container.appendChild(imageContainer);
        };
        reader.onerror = function (evt) {
          console.error("An error ocurred while reading the image",evt);
        };
        reader.readAsDataURL(file);
    }
}


function renderImageContainer(imageBase64) {
    let imageContainer = document.createElement("div");

    // Making tab section
    let tabContainer = document.createElement("ul");
    let firstTab = document.createElement("li");
    firstTab.innerHTML = "Original";
    firstTab.classList.add("uk-active");
    tabContainer.appendChild(firstTab);
    UIkit.tab(tabContainer);

    // Making switch section
    let switcherContainer = document.createElement("ul")
    let firstSwitcher = document.createElement("li");
    let image = document.createElement("img");
    image.setAttribute("src", imageBase64);
    firstSwitcher.appendChild(image);
    switcherContainer.appendChild(firstSwitcher);
    switcherContainer.classList.add("uk-switcher")
    switcherContainer.classList.add("uk-margin")
    UIkit.switcher(switcherContainer);

    // Appending tabs & switcher to container
    imageContainer.appendChild(tabContainer);
    imageContainer.appendChild(switcherContainer);

    return imageContainer
}
