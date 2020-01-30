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
    }, 500);
}