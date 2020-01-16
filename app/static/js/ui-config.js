UIkit.upload('.js-upload', {

    url: '',
    multiple: true,

    beforeAll: function () {
        renderUploadedImages(arguments[1]);
    }

});