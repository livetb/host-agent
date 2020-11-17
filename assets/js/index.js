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
/* ------------------------------------ Apply Page ------------------------------------ */

function initApplyPage(){

}

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

/* ------------------------------------ Agent Page ------------------------------------ */
var agentConfig = {
    uploadHostAvatar: null,
    addHostUid: null,
    addHostFromExists: true
}
var agentViews = {
}

function initAgentPage(){
    document.querySelector("#dialog-modal").addEventListener("click", function(event){
        if(event.target.id === "dialog-modal"){
            console.log("You Click dialog-modal");
            config.dialogs.forEach((v, k) => {
                if(v && k.getAttribute("uncancellable") !== "true") dialog(false, "#"+k.id);
            });
        }
    });
}

function changeAddHostMethod(isChecked){
    agentConfig.addHostFromExists = isChecked;
    console.log(isChecked);
    let nickname = document.querySelector(".agent-upload-host-info-container .host-nickname");
    let avatar = document.querySelector(".agent-upload-host-info-container .host-avatar");
    if(!isChecked) {
        nickname.setAttribute("disabled", "true");
        avatar.setAttribute("disabled", "true");
    }
    else {
        nickname.removeAttribute("disabled");
        avatar.removeAttribute("disabled");
    }
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
    let parent = parentByClass(ele, "dialog");
    let inputs = parent.querySelectorAll("input:not(.no-text)");
    let form = new FormData();
    form.append("avatar", agentConfig.uploadHostAvatar);
    let hasEmpty = false;
    for(let i=0; i<inputs.length; i++){
        let value = inputs[i].value;
        if(value.trim() === "") hasEmpty = true;
        form.append(inputs[i].name, value);
    }
    if(agentConfig.addHostFromExists) {
        if(!agentConfig.uploadHostAvatar){
            alert("Please upload a avatar");
            return;
        }
        if(hasEmpty){
            alert("Please check your input");
            return;
        }
    }
    
    form.forEach((v, k) => {
        console.log(`${k} => ${v}`);
    });
}

// 
function agentDeleteHost(ele){
    let parent = parentByClass(ele, "agent-host-item");
    let uid = parent.querySelector(".uid");
    alert("Delete: " + uid.innerText);
}
function agentFreezeHost(ele){
    let parent = parentByClass(ele, "agent-host-item");
    let status = parent.querySelector(".status");
    status.innerText = ele.checked ? "valid" : "invalid";
}

/* ------------------------------------ Agent Page ------------------------------------ */

function initHostPage(){

}