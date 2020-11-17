'use strict'
/* ------------------------------------ Toolkit ------------------------------------ */
var config = {
    dialogShowNum: 0,
    dialogs: new Map()
}
/**
 * Get parent element by class name.
 * @param {HTMLElement} ele - Child HTMLELement
 * @param {String} classStr - Class Name
 */
function parentByClass(ele, classStr){
    if(!ele) return false;
    if(ele.classList.contains(classStr)) return ele;
    if(ele.parentElement.classList.contains(classStr)) return ele.parentElement;
    return parentByClass(ele.parentElement, classStr);
}
/**
 * await sleep(num)
 * @param {Number} seconds
 */
async function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

function showView(ele, displayName){
    if(ele.style.display === displayName) return false;
    ele.style.display = displayName;
    return true;
}

function dialog(show, cssSelector){
    let dialog = document.querySelector(cssSelector);
    if(!dialog) return;
    if(showView(dialog, show ? "block" : "none")){
        config.dialogs.set(dialog, show);
        config.dialogShowNum += (show ? 1 : -1);
        console.log(`Show： ${show} => ${config.dialogShowNum}`);
        showView(document.getElementById("dialog-modal"), config.dialogShowNum>0 ? "flex" : "none");
    }
}

document.querySelector("#dialog-modal").addEventListener("click", function(event){
    if(event.target.id === "dialog-modal"){
        console.log("You Click dialog-modal");
        config.dialogs.forEach((v, k) => {
            if(v && k.getAttribute("uncancellable") !== "true") dialog(false, "#"+k.id);
        });
    }
});
/* ------------------------------------ Apply Page ------------------------------------ */

var applyViews = {
    imageList: document.querySelector(".image-list")
}

function chooseImage(ele){
    let file = ele.files[0];
    if(!/image/.test(file.type)){
        alert("Should choose a image file.");
        return;
    }
    applyViews.imageList.firstElementChild.remove();
    let newImg = document.createElement("img");
    newImg.src = URL.createObjectURL(file);
    applyViews.imageList.insertBefore(newImg, ele.parentElement);
}

/* ------------------------------------ Apply Page ------------------------------------ */
var agentConfig = {
    uploadHostAvatar: null
}
var agentViews = {

}

function agentUploadHostAvatar(ele){
    let file = ele.files[0];
    if(!/image/.test(file.type)){
        alert("Should choose a image file.");
        return;
    }
    agentConfig.uploadHostAvatar = file;
    let parent = parentByClass(ele, "dialog");
    let title = parent.querySelector("h4.show-avatar");
    let preview = parent.querySelector("img.show-avatar");
    preview.src = URL.createObjectURL(file);
    showView(title, "inline-block");
    showView(preview, "inline-block");
}

function agentUploadHostInfo(ele){
    if(!agentConfig.uploadHostAvatar) {
        alert("Please upload a avatar");
        return;
    }
    let parent = parentByClass(ele, "dialog");
    let inputs = parent.querySelectorAll("input:not(.host-avatar)");
    let form = new FormData();
    form.append("avatar", agentConfig.uploadHostAvatar);
    for(let i=0; i<inputs.length; i++){
        let value = inputs[i].value;
        if(value.trim() === ""){
            alert("Please check your input.");
            return;
        }
        form.append(inputs[i].name, value);
    }
    form.forEach((v, k) => {
        console.log(`${k} => ${v}`);
    })
}