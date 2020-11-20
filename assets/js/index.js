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
 * await or callback
 * @param {Function} call - callback
 */
async function getSelfInfo(call){
    let resultObj = await getHostInfo();
    if(typeof call === "function") call(resultObj);
    return resultObj;
}
/**
 * Analyze url to get paramter
 * @param {String} key - Query Key
 */
function getQueryParamter(key){
    if(location.search.length < 1 || !key) return false;
    let arr = location.search.substr(1).split("&");
    if(arr.length < 1) return false;
    let result = false;
    arr.forEach(value => {
        let kv = value.split("=");
        if(key === kv[0]){
            result = kv[1];
            return;
        }
    });
    return result;
}
/**
 * Get parent element by class name.
 * @param {HTMLElement} ele - Child HTMLELement
 * @param {String} classStr - Class Name
 */
function parentByClass(ele, classStr) {
    if (!ele || !ele.parentElement) return false;
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

/**
 * No use
 * @param {Object} obj1 
 * @param {Object} obj2 
 */
function isSame(obj1, obj2){
    if(JSON.stringify(obj1) === JSON.stringify(obj2)) return true;
    for(let key in obj1){
        if(obj1[key] != obj2[key]) return false;
    }
    return true;
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
 * url = result.data;
 * @param {File} file 
 * @param {Integer} type - 1: video / 3: image / 5: audio
 */
async function uploadFile(file, type, code){
    let resultObj = { success: false};
    let url = getUrl("/api/user/upload");
    let form = new FormData();
    form.append("filename", file);
    form.append("type", type);
    if(code) form.append("code", code);
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
var applyViews = { }

var applyConfig = {
    upImgs: new Array()
}

function initApplyPageViews(){
    applyViews.imageList = document.querySelector(".image-list")
    applyViews.applyAgent = document.querySelector(".role-items .apply-agent");
    applyViews.applyHost = document.querySelector(".role-items .apply-host");
    applyViews.phone = document.querySelector(".apply-info input[name=phone]");
    applyViews.email = document.querySelector(".apply-info input[name=email]");
    applyViews.reason = document.querySelector(".apply-info textarea[name=reason]");
}
function initApplyPage() {
    console.log("Init ApplyPage");
    initApplyPageViews();
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
    return async function(){
        if(inSubmit){
            console.log("in submit...");
            return;
        }
        if(!applyViews.applyAgent.checked){
            alert("Now not apply host.");
            return;
        }
        if(applyConfig.upImgs.length > 0 && applyConfig.alreadyUpImages === applyConfig.upImgs){
            alert("Application has been submitted..");
            return;
        }
        inSubmit = true;
        let url = getUrl("/api/apply/agent");
        let phone = applyViews.phone.value.trim();
        let email = applyViews.email.value.trim();
        let reason = applyViews.reason.value.trim();
        let socialItems = document.querySelectorAll(".social-items input");
        let socialLinks = {};
        let tips = new Array();
        if(phone.length < 5) tips.push("Phone");
        if(!/.+?@.+?\..+?/.test(email)) tips.push("Email");
        if(reason.length < 3) tips.push("Apply Reason");
        if(tips.length > 0) {
            alert("Please check your " + tips.join(","));
            inSubmit = false;
            return;
        }
        for(let i=0; i<socialItems.length; i++){
            let link = socialItems[i].value.trim();
            if(link.length > 5) socialLinks[socialItems[i].name] = link;
        }
        let dataObj = {
            phone: phone, email: email, reason: reason, socialLinks: socialLinks
        }
        let imgUrls = new Array();
        for(let i=0; i<applyConfig.upImgs.length; i++){
            let upResult = await uploadFile(applyConfig.upImgs[i], 3);
            if(upResult.success) imgUrls.push(upResult.data);
        }
        dataObj.imgUrls = imgUrls.join(",");  
        console.log(dataObj);
        if(JSON.stringify(applyConfig.applyObj) === JSON.stringify(dataObj)){
            alert("Application has been submitted.");
            inSubmit = false;
            return;
        }
        await axios.post(url, dataObj, { headers: getHeaders()}).then(res => {
            if(res.data.status === 0){
                alert("Application has been submitted");
                applyConfig.applyObj = dataObj;
                applyConfig.alreadyUpImages = applyConfig.upImgs;
            }else throw res.data.msg;
        }).catch(error => {
            console.error(error);
        });
        inSubmit = false;
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
    let first = listNode.querySelector(".agent-host-item:nth-child(2)")
    listNode.innerHTML = "";
    listNode.appendChild(header);
    if(first) listNode.appendChild(first);
    let itemNode = null;
    arr.forEach(value => {
        itemNode = document.createElement("div");
        itemNode.setAttribute("class", "agent-host-item");
        itemNode.innerHTML = `<div class="uid"><a href="../../host/?uid=${value.uid}">${value.uid}</a></div><div class="nickname">${value.nickname}</div><div class="avatar"><img src="${value.avatar}"></div><div class="other-info">${value.otherInfo || "No Other Info"}</div><div class="time-of-calls">${value.calls}</div><div class="work-hours">${(value.minutes / 60).toFixed(2)}</div><div class="status">Invalid</div><div class="manage"><span onclick="agentDeleteHost(this)" class="delete manage-option">Delete</span><label class="freeze"><input onchange="agentFreezeHost(this)" type="checkbox" class="agent-freeze-host" /><span class="manage-option">Freeze</span></label></div>`;
        listNode.appendChild(itemNode);
    });
}

function renderAgentSelfInfo(obj){
    if(!obj.success) return;
    let data = obj.data;
    document.querySelector(".agent-info-container .uid").innerText = data.uid;
    document.querySelector(".agent-info-container .status").innerText = data.status;
    console.log("renderAgentSelfInfo => ", obj);
    renderAgentHostList([data]);
}

function agentGetHostList(){
    let url = getUrl("/api/agent/hostList");
    axios.post(url, {query:{},pageSize:20,pageNum:1}, { headers: getHeaders()}).then(res => {
        if(res.data.status === 0){
            renderAgentHostList(res.data.data.records);
        }else throw res.data.msg;
    }).catch(error => {
        console.error(error);
    })
}

async function initAgentPage() {
    console.log("Init AgentPage");
    document.querySelector("#dialog-modal").addEventListener("click", function (event) {
        if (event.target.id === "dialog-modal") {
            console.log("You Click dialog-modal");
            config.dialogs.forEach((v, k) => {
                if (v && k.getAttribute("uncancellable") !== "true") dialog(false, "#" + k.id);
            });
        }
    });
    await getSelfInfo(renderAgentSelfInfo);
    agentGetHostList();
}

/* ------------------------------------ Host Page ------------------------------------ */
var hostViews = {}
var hostConfig = {
    fileIdMap: new Map()
}

function renderHostInfo(obj){
    if(!obj.success) return;
    let data = obj.data;
    hostConfig.alreadyUpProfile = {};
    hostConfig.alreadyUpProfile.nickname = data.nickname;
    hostConfig.alreadyUpProfile.age = (data.age || 0) + "";
    hostConfig.alreadyUpProfile.remark = data.remark;
    hostViews.hostSelf.avatarImg.src = data.avatar || "../assets/img/photo-2.png";
    hostViews.hostSelf.uid.innerText = data.uid;
    if(data.nickname) hostViews.hostSelf.nickname.value = data.nickname;
    else hostViews.hostSelf.nickname.setAttribute("placeholder", "No Set NickName");
    hostViews.hostSelf.age.value = data.age || 0;
    if(data.remark) hostViews.hostSelf.remark.value = data.remark;
    else hostViews.hostSelf.remark.setAttribute("placeholder", "No Set Introduction");
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
    hostViews.hostSelf.remark = hostInfoList.querySelector("input[name=remark]");
}

async function initHostLogs(){
    let url1 = getUrl("/api/call/weekly/total");
    let url2 = getUrl("/api/reward/weekly/list");
    let url3 = getUrl("/api/call/weekly/list");
    let VideoCallToal = axios.post(url1, {}, { headers: getHeaders()});
    let giftLog = axios.post(url2, {}, { headers: getHeaders()});
    let VideoCallList = axios.post(url3, {}, { headers: getHeaders()});
    Promise.allSettled([VideoCallToal, giftLog, VideoCallList]).then(results => {
        results.forEach(result => console.log(result));
    }).catch(error => console.error(error));
}

async function initHostMediaList(){
    let url = getUrl("/api/user/mediaList");
    let resultObj = { success: false};
    await axios.post(url, {}, { headers: getHeaders()}).then(res => {
        if(res.data.status === 0){
            resultObj.success = true;
            resultObj.data = res.data.data;
            let records = res.data.data.records;
            records.forEach(value => {
                renderHostMediaFile(value.url, value.type === 3 ? "image" : "video", value.id, value.tag);
            });
        }else throw res.data.msg;
    }).catch(error => {
        resultObj.error = error;
        console.error(error);
    });
    return resultObj;
}
async function initHostPage() {
    if(config.relateUid){
        document.body.classList.add("agent-view");
        let views = document.querySelectorAll(".only-host-self-view");
        views.forEach(element => element.remove());
        console.log("Delete all only-host-self-view");
    }
    console.log("Init HostPage");
    initHostPageViews();
    if(!config.relateUid) getSelfInfo(renderHostInfo);
    else getHostInfo(config.relateUid, renderHostInfo);
    // initHostLogs();
    initHostMediaList();
}

async function uplaodMediaFile(file){
    let resultObj = await uploadFile(file, file.type, "hub");
    return resultObj;
}

function renderHostMediaFile(src, type, fileId, tag){
    let mediaList = document.querySelector(".host-all-upload-list");
    let mediaNode = document.createElement("div");
    mediaNode.setAttribute("class", "host-already-upload-item");
    mediaNode.setAttribute("file-id", fileId);
    let tags = tag ? new Set(tag.split(",")) : new Set();
    console.log(fileId, tags);
    if(/image/.test(type)) mediaNode.innerHTML = `
        <img src="${src}" />
    `;
    else mediaNode.innerHTML = `
    <div class="host-video">
        <video>
        Sorry, your browser doesn't support embedded videos.
        </video>
        <div class="video-play">
        <div onclick="playHostVideo(this, '${src}')">
            <svg t="1605615685955" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4900" width="32" height="32"><path d="M512 1024A512 512 0 1 1 512 0a512 512 0 0 1 0 1024zM383.232 287.616v448l384-223.104-384-224.896z" fill="#FFFFFF" p-id="4901"></path></svg>            </div>
        </div>
    </div>
    `;
    mediaNode.innerHTML += `
    <div class="manage only-host-self-view">
        <label class="item"> <input type="checkbox" name="host-file-tag" ${tags.has("home") ? "checked" : ""} value="home" /> <span class="btn-2">Home</span> </label>
        <label class="item"> <input type="checkbox" name="host-file-tag" ${tags.has("moments") ? "checked" : ""} value="moments" /> <span class="btn-2">Moments</span> </label>
        <label class="item"> <input type="checkbox" name="host-file-tag" ${tags.has("other") ? "checked" : ""} value="other" /> <span class="btn-2">Other</span> </label>
        <label class="item">  </label>
        <div class="item"> <span class="btn-2 delete">Delete</span> </div>
        <label class="item"> <input type="checkbox" name="host-file-tag" ${tags.has("hide") ? "checked" : ""} value="Hide" /> <span class="btn-2 hide">Hide</span> </label>
    </div>
    `;
    mediaList.appendChild(mediaNode);
    mediaNode.addEventListener("click", hostManageMediaItem);
}

async function hostUploadMediaFile(ele){
    let file = ele.files[0];
    if(!file) {
        console.log("No MediaFile");
        return;
    }
    console.log(file);
    if(!/image/.test(file.type) && !/video/.test(file.type)){
        alert("You should choose a image or video file.");
        return;
    }
    let result = await uplaodMediaFile(file);
    if(result.success) {
        let arr = result.data.split(",");
        console.log("Upload Media Success => ", arr);
        let fileId = arr[1] ? arr[1] : Math.random().toString().substr(2,5);
        renderHostMediaFile(URL.createObjectURL(file), file.type, fileId);
    }
    else alert("Upload Media Failed.");
}

function toggleHostInfoBlock(ele) {
    let position = +ele.value;
    let pages = [hostViews.statisticBlock, hostViews.giftLogs, hostViews.callLogs];
    for (let i = 0; i < pages.length; i++) {
        showView(pages[i], i === position ? (0 === position ? "grid" : "block") : "none");
    }
}

async function uploadCustomAvatar(avatar) {
    let url = getUrl("/api2/user/setProfile");
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
        if (result.success) {
            alert("Upload Avatar Success");
            avatarDiv.firstElementChild.src = URL.createObjectURL(file);
        } else {
            alert("Upload Avatar Failed");
            console.log(result.error);
        }
        inUpload = false;
        document.getElementById("host_avatar").removeAttribute("disabled");
    }
})();

async function hostSetProfile(form){
    if(hostConfig.inSetProfile){
        console.log("In SetProfile...");
        return;
    }
    hostConfig.inSetProfile = true;
    let url = getUrl("/api2/user/setProfile");
    let resultObj = { success: false}
    await axios.post(url, form, { headers: getHeaders()}).then(res => {
        if(res.data.status === 0){
            resultObj.success = true;
            resultObj.data = res.data.data;
        }else throw res.data.msg;
    }).catch(error => {
        resultObj.error = error;
        console.error(error);
    });
    hostConfig.inSetProfile = false;
    return resultObj;
}

async function saveHostProfile(ele) {
    let parent = parentByClass(ele, "host-info-list");
    let inputs = parent.querySelectorAll("input.content");
    let dataObj = {};
    let form = new FormData();
    for(let i=0; i<inputs.length; i++){
        let cur = inputs[i];
        if(ele.checked) cur.removeAttribute("disabled");
        else {
            let value = cur.value.trim();
            cur.setAttribute("disabled", "true");
            dataObj[cur.name] = value;
            form.append(cur.name, value || "");
        }
    }
    if(ele.checked || hostConfig.inSetProfile) {
        if(hostConfig.inSetProfile) console.log("In SetProfile...");
        return;
    }
    if(JSON.stringify(hostConfig.alreadyUpProfile) === JSON.stringify(dataObj)){
        console.log("No Change, No Upload.");
        return;
    }
    let result = await hostSetProfile(form);
    if(result.success){
        hostConfig.alreadyUpProfile = dataObj;
        alert("Save Success.");
    }else alert("Save Failed, Please after a minute to try again.");
}
/**
 * @param {String} fileId - fileId
 * @param {String} code - tags
 */
async function hostUpdateMediaItemTag(fileId, tags){
    let url = getUrl("/api/user/updateMediaType");
    let dataObj = {
        id: +fileId,
        code: tags.join(",")
    }
    if(config.relateUid) dataObj.relateUid = config.relateUid;
    let resultObj = { success: false}
    await axios.post(url, dataObj, { headers: getHeaders()}).then(res => {
        if(res.data.status === 0){
            resultObj.success = true;
            resultObj.data = res.data.data;
        }else throw res.data.msg;
    }).catch(error => {
        resultObj.error = error;
        console.error(error)
    });
    return resultObj;
}
var hostSetMediaItemTag = (() => {
    var map = new Map();
    return ((fileId) => {
        if(map.has(fileId)) return map.get(fileId);
        console.log("return new fun");
        let fun =  (() => {
            var delay = null;
            return async function(tags, call){
                if(delay !== null){
                    console.log("Restart Submit...");
                    clearTimeout(delay);
                }
                delay = setTimeout(async () => {
                    console.log(`${fileId} / ${tags.join(",")} / ${typeof call}`);
                    let result = await hostUpdateMediaItemTag(fileId, tags);
                    if(result.success) console.log("Update Media Tag Success");
                }, 1500);
            }
        })();
        map.set(fileId, fun);
        return fun;
    });
})();

async function hostManageMediaItem(event){
    await sleep(0.01);
    let cur = event.target;
    if(!cur.classList.contains("btn-2")) return;
    let fileId = this.getAttribute("file-id");
    if(!fileId) return;
    let tags = new Array();
    if(cur.classList.contains("delete")){
        tags.push("delete");
        hostSetMediaItemTag(fileId)(tags, console.warn);
        return;
    }
    let parent = parentByClass(cur, "host-already-upload-item");
    let inputs = parent.querySelectorAll("input");
    inputs.forEach(element => {
        if(element.checked) tags.push(element.value.toLowerCase());
    });
    hostSetMediaItemTag(fileId)(tags);
}

async function playHostVideo(ele, src){
    let parent = parentByClass(ele, "host-video");
    let video = parent.querySelector("video");
    let source = document.createElement("source");
    source.src = src;
    video.appendChild(source);
    // video.setAttribute("controls", "true");
    video.addEventListener("click", function(event){
        if(!this.paused) this.pause();
        else this.play();
    })
    video.addEventListener("dblclick", function(event){
        this.requestFullscreen();
    })
    video.play();
    ele.parentElement.remove();
}
/* ------------------------------------ Init Page ------------------------------------ */
function initPage() {
    config.relateUid = getQueryParamter("uid");
    let path = location.pathname;
    console.log("Init Page => ", path);
    if (/\/login\//.test(path)) initLoginPage();
    else if (/\/agent\//.test(path)) initAgentPage();
    else if (/\/host\//.test(path)) initHostPage();
    else initApplyPage();
}
initPage();