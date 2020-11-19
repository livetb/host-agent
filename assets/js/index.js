'use strict'
/* ------------------------------------ Toolkit ------------------------------------ */
function StorageHelper(app) {
    this.app = app;
}
StorageHelper.prototype.setItem = function (key, value) {
    key = this.app + "_" + key;
    localStorage.setItem(key, value);
    return value;
}
StorageHelper.prototype.getItem = function (key) {
    key = key = this.app + "_" + key;
    return localStorage.getItem(key);
}
StorageHelper.prototype.removeItems = function () {
    console.log(arguments);
    for (var i in arguments) {
        var key = this.app + "_" + arguments[i];
        localStorage.removeItem(key);
    }
}
StorageHelper.prototype.clear = function () {
    for (var key in localStorage) {
        if (key.match(this.app)) localStorage.removeItem(key);
    }
}
const storageHelper = new StorageHelper("Livehub");

/** config */
var config = {
    dialogShowNum: 0,
    dialogs: new Map(),
    isTest: true,
    domain: "t.livego.live"
}
/**
 * Api
 * @param {String} path - '/xxx/xx'
 */
function getUrl(path) {
    let url = `https://${config.domain}${path}`;
    console.log("Get Url => ", url);
    return url;
}
function getHeaders() {
    return {
        authorization: storageHelper.getItem("token") || "1111"
    }
}
/**
 * Get parent element by class name.
 * @param {HTMLElement} ele - Child HTMLELement
 * @param {String} classStr - Class Name
 */
function parentByClass(ele, classStr) {
    if (!ele) return false;
    if (ele.classList.contains(classStr)) return ele;
    if (ele.parentElement.classList.contains(classStr)) return ele.parentElement;
    return parentByClass(ele.parentElement, classStr);
}
/**
 * await sleep(num)
 * @param {Number} seconds
 */
async function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

function showView(ele, displayName) {
    if (ele.style.display === displayName) return false;
    ele.style.display = displayName;
    return true;
}

function dialog(show, cssSelector) {
    let dialog = document.querySelector(cssSelector);
    if (!dialog) return;
    if (showView(dialog, show ? "block" : "none")) {
        config.dialogs.set(dialog, show);
        config.dialogShowNum += (show ? 1 : -1);
        console.log(`Show： ${show} => ${config.dialogShowNum}`);
        showView(document.getElementById("dialog-modal"), config.dialogShowNum > 0 ? "flex" : "none");
    }
}
/* ------------------------------------ All Page ------------------------------------ */
var firebaseConfig = {
    apiKey: "AIzaSyBackILVX7DNOzavilBp92H6_UKGop9V6o",
    authDomain: "liveworld-cb549.firebaseapp.com",
    databaseURL: "https://liveworld-cb549.firebaseio.com",
    projectId: "liveworld-cb549",
    storageBucket: "liveworld-cb549.appspot.com",
    messagingSenderId: "51543539109",
    appId: "1:51543539109:web:63b65aa6b34e4ad1b9bc4c",
    measurementId: "G-7RT79YZ4TB"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();

/** login */
function md5Login(firebaseUid, requestTime) {
    var key = "fjsihWdgr;_#78JI9&)!kjdfgLKGRFeu342";
    var str = firebaseUid + requestTime + key;
    return hex_md5(str).toUpperCase();
}
function login(isManul) {
    console.log("Login => ", config.user);
    let url = getUrl("/api2/user/login");
    let requestTime = Date.now();
    let dataObj = {
        appId: "302",
        appKey: "fjsihWdgr;_#78JI9&)!kjdfgLKGRFeu342",
        loginId: config.user.email,
        thirdType: +storageHelper.getItem("thirdType") || 1,
        deviceCode: storageHelper.getItem("deviceCode") || storageHelper.setItem("deviceCode", Math.random().toString().substr(2)),
        deviceType: 4,
        requestTime: requestTime,
        firebaseCode: config.user.uid,
        sign: md5Login(config.user.email, requestTime)
    }
    axios.post(url, dataObj).then(res => {
        console.log(res.data);
        if (res.data.status == 0) {
            console.log("Login Success => ", res.data);
            storageHelper.setItem("token", res.data.data.token);
            alert("Login Success");
            window.location.href = "/agent/";
        } else if (res.data.status == 2001) alert(res.data.msg);
    }).catch(error => console.error(error));
}

firebase.auth().onAuthStateChanged(function (user) {
    console.log("FirebaseAuthChanged => ", user);
    config.user = user;
    storageHelper.setItem("user", JSON.stringify(user));
    if(document.querySelector(".login-and-signup")) document.querySelector(".login-and-signup").classList.remove("upload-await");
    if (user) {
        // User is signed in.
        var displayName = user.displayName;
        var email = user.email;
        var emailVerified = user.emailVerified;
        var photoURL = user.photoURL;
        var isAnonymous = user.isAnonymous;
        var uid = user.uid;
        var providerData = user.providerData;
        if(/\/login\//.test(location.pathname)) login();
    } else {
        // User is signed out.
        // ...
    }
});
/**
 * await or callback
 * @param {String} relateUid - other host uid
 * @param {Function} call - callback
 */
async function getHostInfo(relateUid, call){
    let url = getUrl("/api/user/info");
    let dataObj = relateUid ? { relateUid: relateUid} : {};
    let resultObj = { success: false};
    await axios.post(url, dataObj, { headers: getHeaders()}).then(res => {
        if(res.data.status === 0){
            resultObj.success = true;
            resultObj.data = res.data.data;
        }else throw res.data.msg;
    }).catch(error => {
        resultObj.error = error;
        console.error("Get Host Info => ", error);
    });
    if(typeof call === "function") call(resultObj);
    return resultObj;
}
/**
 * await or callback
 * @param {Function} call - callback
 */
async function getSelfInfo(call){
    let resultObj = await getHostInfo();
    if(typeof call === "function") call(resultObj);
    return resultObj;
}
/* ------------------------------------ Login Page ------------------------------------ */
var loginConfig = {
    inLogin: false
}
function initLoginPage() {
    console.log("Init LoginPage");
}
function signupByEmail() {
    var email = document.getElementById("email").value.trim();
    var password = document.getElementById("password").value.trim();
    if (!email || !password) {
        alert("Please check your login info.");
        return;
    }
    document.querySelector(".login-and-signup").classList.add("upload-await");
    firebase.auth().createUserWithEmailAndPassword(email, password).catch(function (error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log("SignupByEmail Failed => ", error);
        if (errorCode === "auth/email-already-in-use") loginByEmail(email, password);
        else document.querySelector(".login-and-signup").classList.remove("upload-await");
        // ...
    });
}
function loginByEmail(email, password) {
    if (!email || !password) {
        alert("Please check your login info.");
        return;
    }
    document.querySelector(".login-and-signup").classList.add("upload-await");
    storageHelper.setItem("thirdType", "1");
    firebase.auth().signInWithEmailAndPassword(email, password).catch(function (error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        storageHelper.removeItems("thirdType");
        document.querySelector(".login-and-signup").classList.remove("upload-await");
        console.log("SignupByEmail Failed => ", error);
        // ...
    });
}
function logout() {
    firebase.auth().signOut().then(function () {
        console.log("Logout Success");
        storageHelper.clear();
        window.location = "../../login/"
    }).catch(function (error) {
        console.log("Logout Failed => ", error);
    });
}
/* ------------------------------------ Apply Page ------------------------------------ */
var applyViews = {
    applyAgent: document.querySelector(".role-items .apply-agent"),
    applyHost: document.querySelector(".role-items .apply-host"),
    
}

var applyConfig = {
    upImgs: new Array()
}

function initApplyPage() {
    console.log("Init ApplyPage");
    
}


var applyViews = {
    imageList: document.querySelector(".image-list")
}

function chooseImage(ele) {
    let file = ele.files[0];
    if (!/image/.test(file.type)) {
        alert("Should choose a image file.");
        return;
    }
    if(applyConfig.upImgs.length > 1) applyConfig.upImgs.shift()
    applyConfig.upImgs.push(file);
    applyViews.imageList.firstElementChild.remove();
    let newImg = document.createElement("img");
    newImg.src = URL.createObjectURL(file);
    applyViews.imageList.insertBefore(newImg, ele.parentElement);
}

var submitApply = (() => {
    var inSubmit = false;
    return function(){
        if(inSubmit) return;
        let url = getUrl("/api/apply/agent");
        
    }
})();

/* ------------------------------------ Agent Page ------------------------------------ */
var agentConfig = {
    uploadHostAvatar: null,
    addHostUid: null,
    addHostFromExists: true
}
var agentViews = {
}

function changeAddHostMethod(isChecked) {
    agentConfig.addHostFromExists = isChecked;
    console.log(isChecked);
    let nickname = document.querySelector(".agent-upload-host-info-container .host-nickname");
    let avatar = document.querySelector(".agent-upload-host-info-container .host-avatar");
    if (!isChecked) {
        nickname.setAttribute("disabled", "true");
        avatar.setAttribute("disabled", "true");
    }
    else {
        nickname.removeAttribute("disabled");
        avatar.removeAttribute("disabled");
    }
}

function agentUploadHostAvatar(ele) {
    let file = ele.files[0];
    if (!/image/.test(file.type)) {
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

function agentUploadHostInfo(ele) {
    let parent = parentByClass(ele, "dialog");
    let inputs = parent.querySelectorAll("input:not(.no-text)");
    let form = new FormData();
    form.append("avatar", agentConfig.uploadHostAvatar);
    let hasEmpty = false;
    for (let i = 0; i < inputs.length; i++) {
        let value = inputs[i].value;
        if (value.trim() === "") hasEmpty = true;
        form.append(inputs[i].name, value);
    }
    if (agentConfig.addHostFromExists) {
        if (!agentConfig.uploadHostAvatar) {
            alert("Please upload a avatar");
            return;
        }
        if (hasEmpty) {
            alert("Please check your input");
            return;
        }
    }

    form.forEach((v, k) => {
        console.log(`${k} => ${v}`);
    });
}

// 
function agentDeleteHost(ele) {
    let parent = parentByClass(ele, "agent-host-item");
    let uid = parent.querySelector(".uid");
    alert("Delete: " + uid.innerText);
}
function agentFreezeHost(ele) {
    let parent = parentByClass(ele, "agent-host-item");
    let status = parent.querySelector(".status");
    status.innerText = ele.checked ? "valid" : "invalid";
}

function renderAgentHostList(arr){
    let listNode = document.querySelector(".agent-host-lists");
    let header = listNode.firstElementChild;
    listNode.innerHTML = "";
    listNode.appendChild(header);
    let itemNode = null;
    arr.forEach(value => {
        itemNode = document.createElement("div");
        itemNode.setAttribute("class", "agent-host-item");
        itemNode.innerHTML = `<div class="uid">${value.uid}</div><div class="nickname">${value.nickname}</div><div class="avatar"><img src="${value.avatar}"></div><div class="other-info">${value.otherInfo || "No Other Info"}</div><div class="time-of-calls">${value.calls}</div><div class="work-hours">${(value.minutes / 60).toFixed(2)}</div><div class="status">Invalid</div><div class="manage"><span onclick="agentDeleteHost(this)" class="delete manage-option">Delete</span><label class="freeze"><input onchange="agentFreezeHost(this)" type="checkbox" class="agent-freeze-host" /><span class="manage-option">Freeze</span></label></div>`;
        listNode.appendChild(itemNode);
    });
}

function renderAgentSelfInfo(obj){
    if(!obj.success) return;
    let data = obj.data;
    document.querySelector(".agent-info-container .uid").innerText = data.uid;
    document.querySelector(".agent-info-container .status").innerText = data.status;
}

function agentGetHostList(){
    let url = getUrl("/api/agent/hostList");
    axios.post(url, {"query":{},"pageSize":20,"pageNum":1}, { headers: getHeaders()}).then(res => {
        if(res.data.status === 0){
            renderAgentHostList(res.data.data.records);
        }else throw res.data.msg;
    }).catch(error => {
        console.error(error);
    })
}

function initAgentPage() {
    console.log("Init AgentPage");
    document.querySelector("#dialog-modal").addEventListener("click", function (event) {
        if (event.target.id === "dialog-modal") {
            console.log("You Click dialog-modal");
            config.dialogs.forEach((v, k) => {
                if (v && k.getAttribute("uncancellable") !== "true") dialog(false, "#" + k.id);
            });
        }
    });
    getSelfInfo(renderAgentSelfInfo);
    agentGetHostList();
}

/* ------------------------------------ Host Page ------------------------------------ */
var hostViews = {}

function renderHostSelfInfo(obj){
    if(!obj.success) return;
    let data = obj.data;
    hostViews.hostSelf.avatarImg.src = data.avatar || "../assets/img/photo-2.png";
    hostViews.hostSelf.uid.innerText = data.uid;
    if(data.nickname) hostViews.hostSelf.nickname.value = data.nickname;
    else hostViews.hostSelf.nickname.setAttribute("placeholder", "No Set NickName");
    hostViews.hostSelf.age.value = data.age || 0;
    if(data.introduction) hostViews.hostSelf.introduction.value = data.introduction;
    else hostViews.hostSelf.introduction.setAttribute("placeholder", "No Set Introduction");
}

function initHostPageViews(){
    hostViews = {}
    hostViews.statisticBlock = document.querySelector(".host-info-content-block-container > .host-info-statistic-table");
    hostViews.giftLogs = document.querySelector(".host-info-content-block-container > .host-info-gift-logs-container");
    hostViews.callLogs = document.querySelector(".host-info-content-block-container > .host-info-call-logs-container");
    hostViews.hostSelf = {};
    hostViews.hostSelf.avatarImg = document.querySelector(".host-info-avatar img.avatar");
    let hostInfoList = document.querySelector(".host-info-list");
    hostViews.hostSelf.uid = hostInfoList.querySelector(".uid");
    hostViews.hostSelf.nickname = hostInfoList.querySelector("input[name=nickname]");
    hostViews.hostSelf.age = hostInfoList.querySelector("input[name=age]");
    hostViews.hostSelf.introduction = hostInfoList.querySelector("input[name=introduction]");
}

async function initHostPage() {
    console.log("Init HostPage");
    initHostPageViews();
    getSelfInfo(renderHostSelfInfo)
}

function toggleHostInfoBlock(ele) {
    let position = +ele.value;
    let pages = [hostViews.statisticBlock, hostViews.giftLogs, hostViews.callLogs];
    for (let i = 0; i < pages.length; i++) {
        showView(pages[i], i === position ? (0 === position ? "grid" : "block") : "none");
    }
}

async function uploadFile(file, type){
    let resultObj = { success: false};
    let url = getUrl("/api/user/upload");
    let form = new FormData();
    form.append("filename", file);
    form.append("type", type);
    await axios.post(url, form, { headers: getHeaders()}).then(res => {
        if(res.data.status === 0){
            resultObj.success = true;
            resultObj.data = res.data.data;
        }else throw res.data.msg;
    }).catch(error => {
        resultObj.error = error;
    });
    return resultObj;
}

async function uploadCustomAvatar(avatar) {
    let url = getUrl("/api2/setProfile");
    let resultObj = { success: false }
    let upfileResult = await uploadFile(avatar, 3);
    if(!upfileResult.success){
        resultObj.error = upfileResult.error;
        return resultObj;
    }
    let form = new FormData();
    form.append("avatar", upfileResult.data);
    await axios.post(url, form, {headers: getHeaders()}).then(res => {
        if(res.data.status === 0){
            resultObj.success = true;
            resultObj.data = res.data.data;
        }else throw res.data.error;
    }).catch(error => {
        resultObj.error = error;
    });
    return resultObj;
}

var hostUploadAvatar = (() => {
    var inUpload = false;
    return async function (ele) {
        if (inUpload) {
            console.log("In Upload");
            return;
        }
        let file = ele.files && ele.files[0] || null;
        if (!file) {
            console.log("No Choose File.");
            return;
        } else if (!/image/.test(file.type)) {
            alert("You Should Choose An Image File.");
            return;
        }
        inUpload = true;
        document.getElementById("host_avatar").setAttribute("disabled", "true");
        let parent = parentByClass(ele, "host-info-avatar");
        let avatarDiv = parent.querySelector("div:first-child");
        avatarDiv.classList.add("upload-await");
        let result = await uploadCustomAvatar(file);
        avatarDiv.classList.remove("upload-await");
        if (0 === result.status) {
            alert("上传成功");
            avatarDiv.firstElementChild.src = URL.createObjectURL(file);
        } else {
            alert("上传失败");
        }
        inUpload = false;
        document.getElementById("host_avatar").removeAttribute("disabled");
    }
})();

function saveHostProfile(ele) {
    let parent = parentByClass(ele, "item");
    console.log(ele.checked, parent)
    if (ele.checked) parent.querySelector("input.content").removeAttribute("disabled");
    else parent.querySelector("input.content").setAttribute("disabled", "true");
}
/* ------------------------------------ Init Page ------------------------------------ */
function initPage() {
    let path = location.pathname;
    console.log("Init Page => ", path);
    if (/\/login\//.test(path)) initLoginPage();
    else if (/\/agent\//.test(path)) initAgentPage();
    else if (/\/host\//.test(path)) initHostPage();
    else initApplyPage();
}
initPage();