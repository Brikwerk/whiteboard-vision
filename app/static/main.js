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
            var imgTag = '<div class="uploaded-image" id="'+name+'"><img src="'+evt.target.result+'"/></div>';
            document.getElementById("uploads-container").innerHTML += imgTag;
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
            renderRecognitionData(JSON.parse(httpRequest.responseText));
        }
    };
    httpRequest.send(data);
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
        let image = container.firstChild;
        let width = image.naturalWidth;
        let height = image.naturalHeight;
        let imageData = data[key];

        // Iterating over data for each recognized word
        // and rendering bbox + text
        for (let text_key in imageData) {
            text_data = imageData[text_key];
            text = text_data["text"];
            bbox = text_data["bbox"];
            roi = createROINode();

            // Creating/rendering bbox
            // Coords are [width, height] (AKA (x, y))
            tlCoord = bbox[0];
            brCoord = bbox[2];
            // Getting relative coords
            roiX = tlCoord[0]/width
            roiY = tlCoord[1]/height
            roiW = (brCoord[0]-tlCoord[0])/width;
            roiH = (brCoord[1]-tlCoord[1])/width;

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
    return roi
}
