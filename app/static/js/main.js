// Image Uploader Handler
document.getElementById("image-upload").addEventListener("change", function() {
    if (this.files.length == 0) {
        return;
    }

    let fd = new FormData();

    for (var i = 0; i < this.files.length; i++) {
        let file = this.files[i];
        let reader = new FileReader();

        // Checking for jpeg/jpg or png
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

            roiText = document.createElement("div");
            roiText.id = name + "-text-display";
            roiText.classList.add("roi-text");
            container.appendChild(roiText)

            uploadedImageContainer = document.createElement("div");
            uploadedImageContainer.id = name
            uploadedImageContainer.classList.add("uploaded-image");

            uploadedImage = document.createElement("img");
            uploadedImage.id = name + "-img";
            uploadedImage.setAttribute("src", evt.target.result);
            uploadedImageContainer.appendChild(uploadedImage);

            container.appendChild(uploadedImageContainer);
        };
        reader.onerror = function (evt) {
          console.error("An error ocurred while reading the image",evt);
        };
        reader.readAsDataURL(file);

        // Appending image to API payload
        fd.append(name, file);
    }

    // Sending images payload to API
    makeRequest("POST", "api/v1/imagerecognition", fd);
})


function makeRequest(method, apiEndpoint, data) {
    let httpRequest = new XMLHttpRequest();

    if (!httpRequest) {
        console.error('Cannot create an XMLHTTP instance');
        return false;
    }
    httpRequest.open(method, apiEndpoint);
    httpRequest.onreadystatechange = function(){
        if (httpRequest.readyState != 4) return;
        if (httpRequest.status != 200){
            console.error("Status: " + httpRequest.status);
        } else {
            console.log("Data Received:")
            data = JSON.parse(httpRequest.responseText);
            console.log(data)
            renderRecognitionData(data);
        }
    };
    httpRequest.send(data);
    console.log("Used method " + method + " on endpoint " + apiEndpoint + " with data:")
    console.log(data)
}


function CreateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


function renderRecognitionData(data) {
    for (let key in data) {
        let container = document.getElementById(key);
        let image = document.getElementById(key + "-img");
        let width = image.naturalWidth;
        let height = image.naturalHeight;
        let imageData = data[key];

        // Saving data to image element container
        container.setAttribute("data", JSON.stringify(imageData))

        // Iterating over data for each recognized word
        // and rendering bbox + text
        for (let text_key in imageData) {
            text_data = imageData[text_key];
            text = text_data["text"];
            bbox = text_data["bbox"];
            score = text_data["score"];
            roi = createROINode();

            // Adding the ROI properties as attributes
            roi.setAttribute("text", text)
            roi.setAttribute("bbox", JSON.stringify(bbox))
            roi.setAttribute("score", score)

            // Getting max and min coordinates
            xCoords = [bbox[0][0], bbox[1][0], bbox[2][0], bbox[3][0]]
            yCoords = [bbox[0][1], bbox[1][1], bbox[2][1], bbox[3][1]]

            // Creating/rendering bbox
            // Coords are [width, height] (AKA (x, y))
            tlCoord = [Math.min.apply(null, xCoords), Math.min.apply(null, yCoords)];
            brCoord = [Math.max.apply(null, xCoords), Math.max.apply(null, yCoords)];;
            // Getting relative coords
            roiX = tlCoord[0]/width
            roiY = tlCoord[1]/height
            roiW = (brCoord[0]-tlCoord[0])/width;
            roiH = (brCoord[1]-tlCoord[1])/height;

            roi.style.left = roiX*100 + "%";
            roi.style.top = roiY*100 + "%";
            roi.style.width = roiW*100 + "%";
            roi.style.height = roiH*100 + "%";

            container.insertBefore(roi, image);
        }
    }
}


function createROINode() {
    roi = document.createElement("div");
    roi.classList.add("roi");

    // Adding event listeners
    roi.addEventListener("touchstart", bboxActive)
    roi.addEventListener("mouseover", bboxActive)

    return roi
}


function bboxActive(event) {
    roi = event.target
    text = roi.getAttribute("text")
    score = roi.getAttribute("score")
    textContainer = document.getElementById(roi.parentElement.id + "-text-display")

    textContainer.innerHTML = text + " (" + (parseFloat(score)*100).toFixed(2) + "%)"
}
