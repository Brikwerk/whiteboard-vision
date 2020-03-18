/**
 * Configures the behaviour for UIKit upload forms
 */
UIkit.upload('.js-upload', {
    url: '',
    multiple: true,

    beforeAll: function () {
        renderUploadedImages(arguments[1]);
    }
});

// Defines a global to keep track of recognition results
// that are used for rendering the final PDF export.
let DATA = [];


/**
 * Deletes all the children under a given HTML element.
 * @param {HTMLElement} elm A specified HTML element
 */
function deleteChildren(elm) {
    while (elm.hasChildNodes()) {
        elm.removeChild(elm.lastChild);
    }
}


/**
 * Creates an RFC 4122 compliant UUID
 * @returns {string}
 */
function createUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


/**
 * 
 * @param {string} buttonText What text is displayed in the button
 * @param {string} buttonType The type of button 
 * (only large is supported at this time)
 * @returns {HTMLButtonElement} button A UIKit styled button
 */
function createButton(buttonText, buttonType) {
    let button = document.createElement("button");
    button.classList.add("uk-button", "uk-button-primary");
    button.innerHTML = buttonText;

    if (buttonType === "large") {
        button.classList.add("uk-width-1-1", "uk-margin-small-bottom");
    }

    return button
}


/**
 * Creates an SVG element to be used as an overlay.
 * @param {int} width The width of the overlay
 * @param {int} height The height of the overlay
 * @param {string} id The CSS ID of the overlay
 * @returns {SVGElement} svgElm
 */
function createSVGOverlay(width, height, id) {
    let svgElm = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgElm.setAttribute("viewBox", "0 0 " + width.toString() + " " + height.toString());
    svgElm.id = id;
    svgElm.classList.add("svg-overlay");

    return svgElm;
}


/**
 * Creates an SVG circle element at position x, y with a set style.
 * @param {int} x The position on the X axis of the circle
 * @param {int} y The position on the Y axis of the circle
 * @returns {SVGCircleElement} svgCircle
 */
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


/**
 * Creates an SVG polygon element with no styling.
 * @returns {SVGPolygonElement} svgROIPoly 
 */
function createSVGPolygon() {
    let svgPoly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    svgPoly.setAttribute("points", "");

    return svgPoly;
}

/**
 * Creates an SVG polygon with svg-roi CSS styling.
 * @returns {SVGPolygonElement} svgROIPoly 
 */
function createSVGROIPolygon() {
    let svgROIPoly = createSVGPolygon();
    svgROIPoly.classList.add("svg-roi");

    return svgROIPoly
}

/**
 * Creates an SVG polygon with svg-outline CSS styling.
 * @returns {SVGPolygonElement} svgROIPoly 
 */
function createSVGOutlinePolygon() {
    let svgROIPoly = createSVGPolygon();
    svgROIPoly.classList.add("svg-outline");

    return svgROIPoly
}


/**
 * Adds a new point to a given polyon at a specified X/Y coord.
 * @param {SVGPolygonElement} poly The polygon element being edited
 * @param {int} x The X coordinate of the point being added
 * @param {int} y The Y coordinate of the point being added
 */
function addSVGPolygonPoint(poly, x, y) {
    let points = poly.getAttribute("points");
    points = points + " " + x + "," + y;
    poly.setAttribute("points", points);
}


/**
 * Gets the X/Y coordinates within a polygon.
 * @param {SVGPolygonElement} poly The SVG polygon being inspected
 * @returns {Array} points An array of 4 X/Y float coordinates
 */
function getPolygonPoints(poly) {
    let points = poly.getAttribute("points").split(" ");
    points = points.filter(Boolean); // Removing blank strings

    // Casting strings to double
    points.map(function(x) {
        parseFloat(x);
    })

    return points;
}

/**
 * Hides the loading cover when OpenCV has loaded.
 */
function onOpenCvReady() {
    cover = document.getElementById("loading-cover");
    cover.classList.add("uk-animation-fade", "uk-animation-reverse");
    setTimeout(function() {
        cover = document.getElementById("loading-cover");
        cover.classList.add("hidden");
    }, 300);
}


/**
 * Flattens arrays to a 1D view.
 * @param {Array} array An array of elements
 * @returns {Array}
 */
function flattenArray(array) {
    return [].concat.apply([], array);
}

/**
 * Orders 4 X/Y coordinates into a clockwise order with the
 * top left coordinate first. Please note this function only
 * works on reactangles.
 * @param {Array} coordinates 4 sets of X/Y coords in an array
 */
function orderCoords(coords) {
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


/**
 * Gets a bounding box from the four circles inside
 * the passed SVG element. Each circle represents an
 * X/Y coordinate of the bounding box.
 * @param {SVGElement} svgElm An SVG DOM element
 * @returns {Array} orderCoords The ordered coordinates 
 */
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


/**
 * Clears the SVG circles and Polygons from an SVG element used in
 * generating a whiteboard selection.
 * @param {MouseEvent} evt The even generated after a mouse click
 */
function clearSelection(evt) {
    let imageName = evt.target.getAttribute("imageName");
    let roi = document.getElementById(imageName + "-roi");
    let points = document.getElementById(imageName + "-points");
    deleteChildren(roi);
    deleteChildren(points);
}


/**
 * Crops a given bounding box selection out of a given image, rectifies the
 * cropped image, and displays it in a specified canvas element.
 * @param {HTMLImageElement} imageElm An HTML image element within the DOM
 * @param {HTMLCanvasElement || CanvasContext2D} canvasDst A canvas DOM element or
 * a 2D canvas context
 * @param {Array} selectionCoords An array of 4 integer X/Y coordinates
 */
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

/**
 * Switches to the specified index in a UIKit switcher/tab setup.
 * @param {Integer} index The index of the tab to switch to
 * @param {HTMLElement} switcher The HTML DOM element of the switcher
 * @param {HTMLElement} tabs The HTML DOM element of the tabs
 */
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
 * @param {callback} callback A callback function that fires and is passed the
 * received data after a success code.
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
 *  - "words": An array of JSON objects. Each object will have 3 keys:
 *      - bbox: An array of floating point coordinates for detected text's bounding box.
 *      - score: A decimal-value percent chance of the recognition's assuredness
 *      - text: The text that the recognition algorithm recognized within the bounding box.
 *  - "sentences":
 *      - An array of X/Y coordinates of type float
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


/**
 * Enlarges the bounding box by a specified percentage.
 * @param {Array} bbox An array of 4 X/Y integer coordinates
 * @param {Integer} enlargePercent The percent enlargement of
 * the bounding box.
 * @returns {Array} bboxC The enlarged bounding box 
 */
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


/**
 * 
 * @param {Array} bbox1 An array of 4 X/Y integer coordinates
 * @param {Array} bbox2 An array of 4 X/Y integer coordinates
 * @param {Integer} marginOfError An integer representing the percent
 * margin of error allowed between the two bounding boxes.
 * @returns {Boolean} 
 */
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


/**
 * Groups words from API results into sentences and paragraphs.
 * @param {JSON} recognitionData Detecion/Recognition data from the API (V1)
 * @returns {string} structuredText A string containing the grouped text 
 */
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


/**
 * Renders a PDF of all recognition results using
 * the DATA global and the PDFMake library.
 */
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
        let aspectRatio = DATA[i]["image"].width/DATA[i]["image"].height
        let imageContent = {
            image: imageURL,
            pageBreak: 'after',
            style: 'centered'
        }

        // Limit larger width/height so image scales to fit
        if (aspectRatio > 0.72) {
            console.log("Height dominant", aspectRatio);
            imageContent.maxHeight = 700;
            docDefinition.content.push(imageContent);
        } else {
            console.log("Width dominant", aspectRatio);
            imageContent.maxWidth = 500;
            docDefinition.content.push(imageContent);
        }
        docDefinition.content.push({
            text: text,
            pageBreak: 'after'
        });
    }

    // doc.save("recognition.pdf");
    pdfMake.createPdf(docDefinition).download('recognition.pdf');
}
