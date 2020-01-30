UIkit.upload('.js-upload', {

    url: '',
    multiple: true,

    beforeAll: function () {
        renderUploadedImages(arguments[1]);
    }

});


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


function cropSelection(imageElm, canvasDst, selectionCoords) {
    // Ensuring coords are ordered
    coords = orderCoords(selectionCoords);
    // Unpacking ordered coords
    console.log(selectionCoords, coords);
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
    warpDest = [
        [0, 0],
        [maxWidth - 1, 0],
        [maxWidth - 1, maxHeight - 1],
        [0, maxHeight - 1]
    ]

    // Computing how much to scale the image
    // as the canvas and image size can be different
    let image = cv.imread(imageElm);
    let imageWidth = imageElm.naturalWidth;
    let renderedWidth = imageElm.clientWidth;
    let scaleAmount = imageWidth/renderedWidth;

    maxWidth = maxWidth / scaleAmount;
    maxHeight = maxHeight / scaleAmount;
    console.log(maxWidth, maxHeight, scaleAmount);

    // Computing the perspective transform
    let dimensions = new cv.Size(maxWidth, maxHeight);
    let srcCoords = cv.matFromArray(4, 1, cv.CV_32FC2, flattenArray(coords));
    let dstCoords = cv.matFromArray(4, 1, cv.CV_32FC2, flattenArray(warpDest));

    let warpMatrix = cv.getPerspectiveTransform(srcCoords, dstCoords);
    let warpedImage = new cv.Mat();
    cv.warpPerspective(image, warpedImage, warpMatrix, dimensions, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

    cv.imshow(canvasDst, warpedImage);
}