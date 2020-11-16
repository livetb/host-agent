'use strict'

var views = {
    imageList: document.querySelector(".image-list")
}

function chooseImage(ele){
    var  file = ele.files[0];
    if(!/image/.test(file.type)){
        alert("Should choose a image file.");
        return;
    }
    views.imageList.firstElementChild.remove();
    let newImg = document.createElement("img");
    newImg.src = URL.createObjectURL(file);
    views.imageList.insertBefore(newImg, ele.parentElement);
}