let missingFileErrorMessage = "Veuillez sélectionner une image.";
let maxImageSize = 15000000;
var currentId = 0;

// Accepted file formats
let acceptedFileFormat = "image/jpeg,image/jpg,image/gif,image/png,image/bmp,image/webp,image/avif";

$(document).ready(() => {
    /* you can have more than one file uploader */
    initImageUploaders();
});

function initImageUploaders() {
    $('.imageUploader').each(function () {
        let id = $(this).attr('id');
        let controlId = $(this).attr('controlId');
        let waitingImage = $(this).attr('waitingImage');
        let newImage = $(this).attr('newImage') == 'true';
        $(this).css("display","flex");
        $(this).css("flex-direction","column");
        $(this).css("align-items","center");
        $(this).css("border","1px solid lightgray");
        $(this).css("border-radius","6px");
        $(this).css("padding","6px");
        $(this).css("padding-bottom","3px");

        let imageData = $(this).attr('imageSrc');
        $(this).append(`<img 
                         id="${controlId}_UploadedImage" 
                         name="${controlId}_UploadedImage" 
                         tabindex=0 
                         class="UploadedImage"
                         style="width:100%"
                         src="${imageData}"
                         title="Cliquez pour sélectionner un fichier, ou cliquer-déposer une image";
                         waitingImage ="${waitingImage}">`);

        $(this).append(`<input 
                         id="${controlId}_ImageUploader" 
                         type="file" style="visibility:hidden;height:0px;margin:0px !important"
                         accept="${acceptedFileFormat}">`);

        if (newImage) {
            $(this).append(`<input 
                            id="${controlId}" 
                            name="${controlId}" 
                            required
                            RequireMessage ="${missingFileErrorMessage}" 
                            waitingImage ="${waitingImage}">`);
        } else {
            $(this).append(`<input 
                            id="${controlId}" 
                            name="${controlId}" 
                            waitingImage ="${waitingImage}">`);
        }
        
        
        $(`#${controlId}_UploadedImage`).on('dragenter', function (e) {
            $(this).css('border', '2px solid blue');
        });

        $(`#${controlId}_UploadedImage`).on('dragover', function (e) {
            $(this).css('border', '2px solid blue');
            e.preventDefault();
        });

        $(`#${controlId}_UploadedImage`).on('dragleave', function (e) {
            $(this).css('border', '2px solid white');
            e.preventDefault();
        });

        $(`#${controlId}_UploadedImage`).on('drop', function (e) {
            var image = e.originalEvent.dataTransfer.files[0];
            $(this).css('background', '#D8F9D3');
            e.preventDefault();
            let id = $(this).attr('id').split('_')[0];
            let UploadedImage = document.querySelector('#' + id + '_UploadedImage');
            let waitingImage = UploadedImage.getAttribute("waitingImage");
            let ImageData = document.querySelector('#' + id);
            // store the previous uploaded image in case the file selection is aborted
            UploadedImage.setAttribute("previousImage", UploadedImage.src);

            // set the waiting image
            if (waitingImage !== "") UploadedImage.src = waitingImage;
            /* take some delai before starting uploading process in order to let browser to update UploadedImage new source affectation */
            let t2 = setTimeout(function () {
                if (UploadedImage !== null) {
                    let len = image.name.length;

                    if (len !== 0) {
                        let fname = image.name;
                        //console.log(fname)
                        let ext = fname.split('.').pop().toLowerCase();

                        if (!validExtension(ext)) {
                            alert(wrongFileFormatMessage);
                            UploadedImage.src = UploadedImage.getAttribute("previousImage");
                        }
                        else {
                            let fReader = new FileReader();
                            fReader.readAsDataURL(image);
                            fReader.onloadend = () => {
                                UploadedImage.src = fReader.result;
                                ImageData.value = UploadedImage.src;
                                ImageData.setCustomValidity('');
                            };
                        }
                    }
                    else {
                        UploadedImage.src = null;
                    }
                }
            }, 30);
            $(this).css('border', '2px solid white');
            return true;
        });
        ImageUploader_AttachEvent(controlId);
        let controlIdTop = - $(this).height() / 2;
        let controlIdLeft = 4;
        $(`#${controlId}`).css("z-index","-1");
        $(`#${controlId}`).css("height","0px");
        $(`#${controlId}`).css("width","0px");
        $(`#${controlId}`).css("margin","0px");
        $(`#${controlId}`).css("position","relative");
        $(`#${controlId}`).css("left",`${controlIdLeft}px`);
        $(`#${controlId}`).css("top",`${controlIdTop}px`);
    });
}

function ImageUploader_AttachEvent(controlId) {
    // one click will be transmitted to #ImageUploader
    document.querySelector('#' + controlId + '_UploadedImage').
        addEventListener('click', () => {
            document.querySelector('#' + controlId + '_ImageUploader').click();
        });
    document.querySelector('#' + controlId + '_ImageUploader').addEventListener('change', preLoadImage);
}

function validExtension(ext) {
    return acceptedFileFormat.indexOf("/" + ext) > 0;
}

function preLoadImage(event) {
    // extract the id of the event target
    let id = event.target.id.split('_')[0];
    let UploadedImage = document.querySelector('#' + id + '_UploadedImage');
    let waitingImage = UploadedImage.getAttribute("waitingImage");
    let ImageUploader = document.querySelector('#' + id + '_ImageUploader');
    let ImageData = document.querySelector('#' + id);
    // store the previous uploaded image in case the file selection is aborted
    UploadedImage.setAttribute("previousImage", UploadedImage.src);
    // is there a file selection
    if (ImageUploader.value.length > 0) {

        // set the waiting image
        if (waitingImage !== "") UploadedImage.src = waitingImage;
        /* take some delai before starting uploading process in order to let browser to update UploadedImage new source affectation */
        let t2 = setTimeout(function () {
            if (UploadedImage !== null) {
                let len = ImageUploader.value.length;

                if (len !== 0) {
                    let fname = ImageUploader.value;
                    let ext = fname.split('.').pop().toLowerCase();

                    if (!validExtension(ext)) {
                        alert(wrongFileFormatMessage);
                        UploadedImage.src = UploadedImage.getAttribute("previousImage");
                    }
                    else {
                        let fReader = new FileReader();
                        //console.log(ImageUploader.files[0])
                        fReader.readAsDataURL(ImageUploader.files[0]);
                        fReader.onloadend = () => {
                            UploadedImage.src = fReader.result;
                            ImageData.value = UploadedImage.src;
                            ImageData.setCustomValidity('');
                        };
                    }
                }
                else {
                    UploadedImage.src = null;
                }
            }
        }, 30);
    }
    return true;
}

document.onpaste = function (event) {
    //console.log(event.target)
    let id = event.target.id.split('_')[0];
    let UploadedImage = document.querySelector('#' + id + '_UploadedImage');
    if (UploadedImage) {
        let ImageData = document.querySelector('#' + id);
        let waitingImage = UploadedImage.getAttribute("waitingImage");
        if (waitingImage !== "") UploadedImage.src = waitingImage;
        // use event.originalEvent.clipboard for newer chrome versions
        var items = (event.clipboardData || event.originalEvent.clipboardData).items;
        // find pasted image among pasted items
        var blob = null;
        for (var i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") === 0) {
                blob = items[i].getAsFile();
            }
        }
        // load image if there is a pasted image
        if (blob !== null) {
            var reader = new FileReader();
            reader.onload = function (event) {
                // console.log(event.target.result); // data url!
                UploadedImage.src = event.target.result;
                ImageData.value = UploadedImage.src;
                ImageData.setCustomValidity('');
            };
            reader.readAsDataURL(blob);
        }
    }
}