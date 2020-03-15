UIkit.upload('.js-upload', {
    url: '',
    multiple: true,

    beforeAll: function () {
        renderUploadedImages(arguments[1]);
    }
});

let DATA = [];


function deleteChildren(elm) {
    while (elm.hasChildNodes()) {
        elm.removeChild(elm.lastChild);
    }
}


function createUUID() {
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

    return svgPoly;
}

function createSVGROIPolygon() {
    let svgROIPoly = createSVGPolygon();
    svgROIPoly.classList.add("svg-roi");

    return svgROIPoly
}

function createSVGOutlinePolygon() {
    let svgROIPoly = createSVGPolygon();
    svgROIPoly.classList.add("svg-outline");

    return svgROIPoly
}


function addSVGPolygonPoint(poly, x, y) {
    let points = poly.getAttribute("points");
    points = points + " " + x + "," + y;
    poly.setAttribute("points", points);
}


function getPolygonPoints(poly) {
    let points = poly.getAttribute("points").split(" ");
    points = points.filter(Boolean); // Removing blank strings

    // Casting strings to double
    points.map(function(x) {
        parseFloat(x);
    })

    return points;
}


function onOpenCvReady() {
    cover = document.getElementById("loading-cover");
    cover.classList.add("uk-animation-fade", "uk-animation-reverse");
    setTimeout(function() {
        cover = document.getElementById("loading-cover");
        cover.classList.add("hidden");
    }, 300);
}


function flattenArray(array) {
    return [].concat.apply([], array);
}


function orderCoords(coords) {
    // Orders coordinates into a clockwise order
    // with the top left coordinate first

    // **This function only works with rectangles**

    let ordered = [[],[],[],[]];

    // Searching for top left/bottom right
    let min = Infinity;
    let max = -1;
    coords.forEach(function(coord) {
        sum = coord[0] + coord[1];
        if (sum > max) {
            max = sum;
            ordered[2] = coord;
        }
        if (sum < min) {
            min = sum;
            ordered[0] = coord;
        }
    });
    
    // Searching for top right/bottom left
    min = Infinity;
    max = -Infinity;
    coords.forEach(function(coord) {
        diff = coord[1] - coord[0];
        if (diff > max) {
            max = diff;
            ordered[3] = coord;
        }
        if (diff < min) {
            min = diff;
            ordered[1] = coord;
        }
    });

    return ordered;
}


function getSelectionCoords(svgElm) {
    // Gets an sorts coords in clockwise order from top left

    let coords = [];
    let numChildren = svgElm.childElementCount;

    for (let i = 0; i < numChildren; i++) {
        let child = svgElm.children[i];
        let x = child.getAttribute("cx");
        let y = child.getAttribute("cy");
        coords.push([Number(x),Number(y)]);
    }

    return orderCoords(coords);
}

function clearSelection(evt) {
    let imageName = evt.target.getAttribute("imageName");
    let roi = document.getElementById(imageName + "-roi");
    let points = document.getElementById(imageName + "-points");
    deleteChildren(roi);
    deleteChildren(points);
}


function cropSelection(imageElm, canvasDst, selectionCoords) {
    // Ensuring coords are ordered
    coords = orderCoords(selectionCoords);
    // Unpacking ordered coords
    tl = coords[0];
    tr = coords[1];
    br = coords[2];
    bl = coords[3];

    // Computing the width of the new image
    widthA = Math.sqrt(Math.pow(br[0] - bl[0], 2) + Math.pow(br[1] - bl[1], 2))
    widthB = Math.sqrt(Math.pow(tr[0] - tl[0], 2) + Math.pow(tr[1] - tl[1], 2))
    maxWidth = Math.max(Math.round(widthA), Math.round(widthB));

    // Computing the height of the new image
    heightA = Math.sqrt(Math.pow(tr[0] - br[0], 2) + Math.pow(tr[1] - br[1], 2))
    heightB = Math.sqrt(Math.pow(tl[0] - bl[0], 2) + Math.pow(tl[1] - bl[1], 2))
    maxHeight = Math.max(Math.round(heightA), Math.round(heightB));

    // Defining the dimensions of the new image
    // and flattening coords
    warpDest = [
        [0, 0],
        [maxWidth - 1, 0],
        [maxWidth - 1, maxHeight - 1],
        [0, maxHeight - 1]
    ]
    // Flattening coordinates for usage with OpenCV
    warpDest = flattenArray(warpDest);
    coords = flattenArray(coords);

    // Computing how much to scale the image
    // as the canvas and image size can be different
    let image = cv.imread(imageElm);
    let imageWidth = imageElm.naturalWidth;
    let renderedWidth = imageElm.clientWidth;
    let scaleAmount = imageWidth/renderedWidth;
    
    // If the image element hasn't been rendered, no scaling
    if (renderedWidth < 1) {
        scaleAmount = 1;
    }

    coords = coords.map(function(coord) {
        return coord/scaleAmount;
    })

    // Computing the perspective transform
    let dimensions = new cv.Size(maxWidth, maxHeight);
    let srcCoords = cv.matFromArray(4, 1, cv.CV_32FC2, coords);
    let dstCoords = cv.matFromArray(4, 1, cv.CV_32FC2, warpDest);

    let warpMatrix = cv.getPerspectiveTransform(srcCoords, dstCoords);
    let warpedImage = new cv.Mat();
    cv.warpPerspective(image, warpedImage, warpMatrix, dimensions, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

    cv.imshow(canvasDst, warpedImage);
}


function changeTabSwitcher(index, switcher, tabs) {
    // Getting tab/switcher to toggle off
    let currentTab = tabs.getElementsByClassName("uk-active")[0];
    let currentSwitcher = switcher.getElementsByClassName("uk-active")[0];

    // Getting tab/switcher to toggle on
    let toggleTab = tabs.children[index];
    let toggleSwitcher = switcher.children[index];

    // Toggling
    currentTab.classList.remove("uk-active");
    currentTab.setAttribute("aria-expanded", "false");
    currentSwitcher.classList.remove("uk-active");
    toggleTab.classList.add("uk-active");
    toggleTab.setAttribute("aria-expanded", "true");
    toggleSwitcher.classList.add("uk-active");
}


/**
 * Creates and opens and XMLHTTP Request at the specified endpoint with the specified method.
 * @param {String} method A string representing the method of request. Either ("post" or "get").
 * @param {String} apiEndpoint A string representing the API string to append to the site URL
 * @param {FormData} data A FormData object that is to be sent to the API endpoint
 * @param {callback} callback A callback function that fires and is passed received data after success code.
 */
function makeRequest(method, apiEndpoint, data, callback) {
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
            let message = "Error: Recieved Status " + httpRequest.status + " on submission";
            callback({"error": message});
        } else {
            console.log("Data Received:")
            data = JSON.parse(httpRequest.responseText);
            console.log(data)
            callback(data);
        }
    };
    httpRequest.send(data);
    console.log("Used method " + method + " on endpoint " + apiEndpoint + " with data:")
    console.log(data)
}


/**
 * Checks if the passed argument is an HTMLImageElement or HTMLCanvasElement.
 * An error will be thrown if the passed argument is not.
 * @param {HTMLImageElement || HTMLCanvasElement} elm An Image or Canvas HTML node
 */
function checkForImage(elm) {
    if (!elm instanceof HTMLElement) {
        throw "Passed image was not of type HTMLElement";
    } else if (!elm.nodeName === "IMG" && !elm.nodeName === "CANVAS") {
        throw "Passed image was not node IMAGE or CANVAS";
    } else if (elm.nodeName === "IMG") {
        if (!elm.naturalWidth > 0) {
            throw "Passed image of type IMAGE has no dimensions";
        }
    } else if (elm.nodeName === "CANVAS") {
        if (!elm.width > 0) {
            throw "Passed image of type CANVAS has no dimensions";
        }
    }
}


/**
 * Performs text recognition on the passed Image or Canvas element
 * and returns JSON detection/recognition results.
 * @param {HTMLImageElement || HTMLCanvasElement} elm An Image or Canvas HTML node
 * @param {callback} callback A callback function that is called and passed the recognition data
 * @returns {JSON} JSON results from the detection/recognition REST endpoint. Takes the following form
 * as of V1 of the API:
 * - Top Level: Name of the image, can be multiple (Eg: image.png)
 * - Second Level: An array of JSON objects. Each object will have 3 keys:
 *  - bbox: An array of floating point coordinates for detected text's bounding box.
 *  - score: A decimal-value percent chance of the recognition's assuredness
 *  - text: The text that the recognition algorithm recognized within the bounding box.
 */
function performRecognition(elm, callback) {
    checkForImage(elm);

    let canvas;
    if (elm.nodeName === "IMG") {
        canvas = document.createElement("canvas");
        let ctx = canvas.getContext('2d');
        ctx.drawImage(elm, 0, 0);
    } else {
        canvas = elm;
    }

    let localCallback = callback;
    canvas.toBlob(function(imageBlob) {
        let fd = new FormData();
        fd.append(createUUID() + ".png", imageBlob);

        makeRequest("post", API_ENDPOINT + "/v1/imagerecognition", fd, localCallback);
    })
}


function enlargeRectangle(bbox, enlargePercent) {
    // Please note that a new array must be created and values pushed
    // Array must be deep copied since shallow copies in JS pass-by-ref
    // Pass-by-ref means we'd be enlarging the passed array
    enlargePercent = enlargePercent/100;
    let width = bbox[1][0] - bbox[0][0];
    let height = bbox[2][1] - bbox[0][1];
    let xinc = width*enlargePercent;
    let bboxC = [[],[],[],[]];
    bboxC[0].push(bbox[0][0] - xinc); // TL
    bboxC[0].push(bbox[0][1] - xinc);
    bboxC[1].push(bbox[1][0] + xinc); // TR
    bboxC[1].push(bbox[1][1] - xinc);
    bboxC[2].push(bbox[2][0] + xinc); // BR
    bboxC[2].push(bbox[2][1] + xinc);
    bboxC[3].push(bbox[3][0] - xinc); // BL
    bboxC[3].push(bbox[3][1] + xinc);

    return bboxC;
}


function bboxInsideBbox(bbox1, bbox2, marginOfError) {
    bbox1 = orderCoords(bbox1);
    bbox2 = orderCoords(bbox2);

    // Enlarging bbox2 by marginOfError
    let bbox2C = enlargeRectangle(bbox2, marginOfError);

    // Checking if bbox1 is inside bbox2C
    if (
        bbox1[2][0] < bbox2C[2][0] &&
        bbox1[0][0] > bbox2C[0][0] &&
        bbox1[0][1] > bbox2C[0][1] &&
        bbox1[2][1] < bbox2C[2][1]
    ) {
        return true;
    } else {
        return false;
    }
}


function getStructuredText(recognitionData) {
    let words = recognitionData[Object.keys(recognitionData)[0]]["words"];
    let sentences = recognitionData[Object.keys(recognitionData)[0]]["sentences"];

    // Filing words into a temp list
    let tempWords = [];
    for (let i = 0; i < Object.keys(words).length; i++) {
        word = words[i];
        tempWords.push(word);
    }

    // Filing words into sentences
    tempText = [];
    for (let i = 0; i < sentences.length; i++) {
        let sentence = sentences[i];
        let sentenceText = [];

        for (let j = 0; j < tempWords.length; j++) {
            word = tempWords[j];
            word_bbox = word["bbox"];

            if (bboxInsideBbox(word_bbox, sentence, 5)) {
                sentenceText.push(word);
            }
        }

        tempText.push({"text": sentenceText, "bbox": sentence});
    }

    // Sorting words within sentences
    for (let i = 0; i < tempText.length; i++) {
        let sentence = tempText[i]["text"];
        sentence.sort(function(wordA, wordB) {
            aX = wordA["bbox"][0][0];
            bX = wordB["bbox"][0][0];
            if (aX < bX) {
                return false;
            } else {
                return true;
            }
        });
    }

    // Gathering sentences into columns
    let text = [];
    for (let i = 0; i < tempText.length; i++) {
        // Getting sentence stats to file into
        // the appropriate column
        let bbox = tempText[i]["bbox"];
        let origin = bbox[0][0];
        let midpoint = origin + bbox[1][0]/2;
        
        // Preparing text for concatenation
        // onto the column
        let words = tempText[i]["text"];
        let sentence = "";
        for (let j = 0; j < words.length; j++) {
            let word = words[j]["text"];
            if (j === words.length-1) {
                sentence = sentence + word;
            } else {
                sentence = sentence + word + " ";
            }
        }

        // Filing sentences into columns
        if (text.length < 1) {
            text.push({
                "rangeStart": origin - (midpoint - origin),
                "rangeEnd": bbox[1][0],
                "text": sentence
            })
        } else {
            let foundColumn = false;
            for (let j = 0; j < text.length; j++) {
                let column = text[j];
                if (origin > column["rangeStart"] && origin < column["rangeEnd"]) {
                    foundColumn = true;
                    text[j]["text"] = text[j]["text"] + " \n" + sentence;
                }
            }

            if (!foundColumn) {
                text.push({
                    "rangeStart": origin - (midpoint - origin),
                    "rangeEnd": bbox[1][0],
                    "text": sentence
                })
            }
        }
    }

    // Sorting columns, far left first
    text.sort(function(colA, colB) {
        rangeStartA = colA["rangeStart"];
        rangeStartB = colB["rangeStart"];
        if (rangeStartA < rangeStartB) {
            return false;
        } else {
            return true;
        }
    })

    let structuredText = ""
    for (let i = 0; i < text.length; i++) {
        structuredText = structuredText + text[i]["text"] + "\n\n";
    }
    console.log(structuredText);
    
    return structuredText;
}


function renderPDF() {
    let docDefinition = {
        content: [],
        styles: {
            centered: {   
                alignment: 'center'
            }
        }
    };
    for (let i = 0; i < DATA.length; i++) {
        let imageURL = DATA[i]["image"].toDataURL();
        let text = DATA[i]["text"];
        docDefinition.content.push({
            image: imageURL,
            width: 500,
            style: 'centered'
        });
        docDefinition.content.push({
            text: text
        });
    }

    // doc.save("recognition.pdf");
    pdfMake.createPdf(docDefinition).download('recognition.pdf');
}
