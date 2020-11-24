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
/**
 * -1 & 0: failed ; 1: success
 * @param {HTMLElement} ele
 * @param {Boolean} isDisabled - true: add disabled / false: remove disabled
 */
function disabledView(ele, isDisabled){
    if(!ele) return -1;
    if(ele.classList.contains("disabled") && isDisabled) return 0;
    if(isDisabled){
        ele.setAttribute("disabled", "true");
        ele.classList.add("disabled");
    }else {
        ele.removeAttribute("disabled");
        ele.classList.remove("disabled");
    }
    return 1;
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
var firebaseUI = null;

/** login */
function md5Login(firebaseUid, requestTime) {
    var key = "fjsihWdgr;_#78JI9&)!kjdfgLKGRFeu342";
    var str = firebaseUid + requestTime + key;
    return hex_md5(str).toUpperCase();
}
function isLogin(){
    return (storageHelper.getItem("token"));
}
function login() {
    console.log("Login => ", config.user);
    let url = getUrl("/api2/user/login");
    let requestTime = Date.now();
    let dataObj = {
        appId: "302",
        appKey: "fjsihWdgr;_#78JI9&)!kjdfgLKGRFeu342",
        loginId: config.user.email,
        thirdType: 1,
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
            if(typeof config.loginCall === "function") {
                config.loginCall = null;
            }
            else{
                alert("Login Success");
                window.location.href = "../agent/";
            }
            dialog(false, ".dialog-login");
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
        if(/\/login\//.test(location.pathname) || config.inLogin) login();
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
    config.inLogin = true;
    firebase.auth().signInWithEmailAndPassword(email, password).catch(function (error) {
        // Handle Errors here.
        document.querySelector(".login-and-signup").classList.remove("upload-await");
        console.log("SignupByEmail Failed => ", error);
        config.inLogin = false;
        alert("Login Failed");
        // ...
    });
}
function loginByOther(method){
    console.log("Login By ",method);
    let provider = null;
    switch(method){
        case "Google":
            provider = new firebase.auth.GoogleAuthProvider(); break;
        case "Facebook": 
            provider = new firebase.auth.FacebookAuthProvider(); break;
        default : provider = new firebase.auth.GoogleAuthProvider();
    }
    firebase.auth().signInWithPopup(provider).then(function(result) {
        var token = result.credential.accessToken;
        config.user = result.user;
        login();
        config.loginCall = null;
      }).catch(function(error) {
        console.error(error);
      });
}
firebase.auth().getRedirectResult().then(function(result) {
    console.log("Firebase auth redirect");
    if (result.credential) {
      // This gives you a Google Access Token. You can use it to access the Google API.
      var token = result.credential.accessToken;
      console.log("Firebase Redirect token => ", token);
    }
    // The signed-in user info.
    var user = result.user;
  }).catch(function(error) {
      console.log("Firebase Redirect Error => ", error);
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // The email of the user's account used.
    var email = error.email;
    // The firebase.auth.AuthCredential type that was used.
    var credential = error.credential;
    // ...
  });
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
        if(!isLogin()){
            dialog(true, ".dialog-login");
            config.loginCall = function(){
                dialog(false, ".dialog-login");
            }
            return;
        }
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

function changeApplyType(ele){
    let value = ele.value;
    if(!ele.checked) return;
    if(value === "agent") showView(document.querySelector(".only-host-view"), "none");
    else showView(document.querySelector(".only-host-view"), "block");
}

/* ------------------------------------ Agent Page ------------------------------------ */
var agentConfig = {
    uploadHostAvatar: null,
    addHostUid: null
}
var agentViews = {
}

function changeAddHostMethod(isChecked) {
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

function showTips(tipsId, msg){
    let tips = document.querySelector(`.tips[tips-id=${tipsId}]`);
    if(tips) tips.innerText = msg;
}

var agentInputNewHostUid = null;
var createAgentInputNewHostUid = () => {
    var timeOut = null;
    // 
    let container = document.querySelector(".dialog-create-new-host");
    let submitBtn = container.querySelector('.submit');
    let uid = container.querySelector("input[name=uid]");
    let nickname = container.querySelector("input[name=nickname]");
    let avatarTitle = container.querySelector(".title.avatar");
    let avatar = container.querySelector("input[name=avatar]");
    let avatarLabel = container.querySelector("label.avatar");
    let previewTitle = container.querySelector(".title.show-avatar");
    let preview = container.querySelector("img.show-avatar");
    let existsHide = [avatarLabel, avatarTitle]
    let preViews = [preview, previewTitle];
    let notUid = document.querySelectorAll(".agent-upload-host-info-container > *:not(.uid)");
    notUid.forEach(element => showView(element, "none"));
    //
    var addExistsHost = function(result){
        agentConfig.addNewHostType = 1;
        notUid.forEach(element => {
            if(existsHide.indexOf(element) >= 0) showView(element, "none");
            else showView(element, "inline-block");
        });
        uid.value = result.data.uid;
        nickname.value = result.data.nickname;
        preview.src = result.data.avatar;
        disabledView(nickname, true);
        submitBtn.innerText = "Add";
    }
    var createNewHost = function(result){
        agentConfig.addNewHostType = 0;
        showTips("add-host-tips", result.error);
        notUid.forEach(element => {
            if(preViews.indexOf(element) >= 0) showView(element, "none");
            else showView(element, "inline-block");
        });
        nickname.value = "";
        showView(avatarLabel, "flex");
        disabledView(nickname, false);
        submitBtn.innerText = "Create New Host";
    }
    return async function(ele){
        if(timeOut) clearTimeout(timeOut);
        timeOut = setTimeout(async () => {
            let newHostUid = ele.value;
            console.log("New Host UID: ", newHostUid);
            if(newHostUid.length < 16) {
                showTips("add-host-tips", "uid length = 16");
                agentConfig.addNewHostType = -1;
                notUid.forEach(element => showView(element, "none"));
                return;
            }
            let result = await getHostInfo(newHostUid);
            if(!result.success){
                createNewHost(result);
                return;
            }
            addExistsHost(result);
        }, 500);
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

async function agentUploadHostInfo(ele) {
    if(!agentConfig.addNewHostType || agentConfig.addNewHostType !== 1){
        alert("Only support add exists host");
        return;
    }
    let parent = parentByClass(ele, "dialog");
    let inputs = parent.querySelectorAll("input:not(.no-text)");
    let form = new FormData();
    form.append("avatar", agentConfig.uploadHostAvatar);
    let dataObj = {}
    let hasEmpty = false;
    for (let i = 0; i < inputs.length; i++) {
        let value = inputs[i].value;
        if (value.trim() === "") hasEmpty = true;
        form.append(inputs[i].name, value);
        dataObj[inputs[i].name] = value;
    }
    if (agentConfig.addNewHostType === 0) {
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
    let url = getUrl("/api/agent/addHost");
    let result = null;
    await axios.post(url, {relateUid: dataObj.uid, code: ""}, { headers: getHeaders()}).then(res => {
        if(res.data.status === 0){
            alert("Success");
        }else throw res.data.msg;
    }).catch(error => {
        console.error(error);
        alert("failed");
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
        itemNode.innerHTML = `<div class="uid"><a href="../host/${value.isSelf ? "" : "?uid="+value.uid}">${value.uid}</a></div><div class="nickname">${value.nickname}</div><div class="avatar"><img src="${value.avatar}"></div><div class="other-info">${value.otherInfo || "No Other Info"}</div><div class="time-of-calls">${value.calls}</div><div class="work-hours">${(value.minutes / 60).toFixed(2)}</div><div class="status">Invalid</div><div class="manage"><span onclick="agentDeleteHost(this)" class="delete manage-option">Delete</span><label class="freeze"><input onchange="agentFreezeHost(this)" type="checkbox" class="agent-freeze-host" /><span class="manage-option">Freeze</span></label></div>`;
        listNode.appendChild(itemNode);
    });
}

function renderAgentSelfInfo(obj){
    if(!obj.success) return;
    let data = obj.data;
    data.isSelf = true;
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
    agentInputNewHostUid = createAgentInputNewHostUid();
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


function renderHostStatisticLogs(obj){
    console.log("RenderHostStatisticLogs => ", obj);
}
function renderHostGiftLogs(obj){
    console.log("renderHostGiftLogs => ", obj);
    if(obj.status !== 0) return;
    let data = obj.data;
    let defaultValue = 666;
    document.querySelector(".host-info-gift-logs-header .total").innerText = data.total || defaultValue;
    document.querySelector(".host-info-gift-logs-header .lastWeeklyDiamond").innerText = data.lastWeeklyDiamond || defaultValue;
    let records = data.recordList;
    if(!records || records.length < 1) records = [{giftName: "gift1"},{giftName: "gift2"},{giftName: "gift3"},{giftName: "gift4"}];
    let callLogTable = document.querySelector(".host-info-call-logs-container .host-info-call-log-table");
    let logHTML = new Array();
    let giftIcons = ["../assets/img/photo-2.png", "../assets/img/photo-1.png", "../assets/img/facebook-icon.png", "../assets/img/tiktok-icon.png"]
    let defaultNum = 1;
    let giftData = {
        gitf1:{ num: 0, price: 100}
    }
    records.forEach(value => {
        switch(value.giftName){
            case "gift1": 
        }
    });
}
function renderHostCallLogs(obj){
    console.log("renderHostCallLogs => ", obj);
    if(obj.status !== 0) return;
    let data = obj.data;
    let defaultValue = 666;
    document.querySelector(".host-info-call-logs-header .total").innerText = data.total || defaultValue;
    document.querySelector(".host-info-call-logs-header .last-week-total").innerText = data.lastWeeklyCallNums || defaultValue;
    let records = data.records;
    if(!records || records.length < 1) records = [{},{},{}];
    let callLogTable = document.querySelector(".host-info-call-logs-container .host-info-call-log-table");
    let logHTML = new Array();
    records.forEach(value => {
        let item = `
        <span class="chat-type" style="display: ${value.chatType === "answer" ? "flex" : "none"};"><svg class="icon" viewBox="0 0 1026 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3711" width="20" height="20"><path d="M1003.303907 809.923646L844.81501 651.410065c-31.569428-31.433672-83.847809-30.483381-116.515627 2.196778l-79.836839 79.84918c-5.047653-2.801509-10.268086-5.70175-15.760031-8.787112-50.427164-27.928701-119.452892-66.248902-192.082323-138.903017-72.814553-72.814553-111.171779-141.926672-139.186871-192.415543-2.974289-5.356189-5.800481-10.502574-8.639014-15.389788l53.586574-53.524867 26.398361-26.38602c32.717183-32.717183 33.630451-84.995564 2.110388-116.515626L216.400731 22.995786c-31.49538-31.483038-83.798444-30.532747-116.515627 2.196778l-44.676048 44.922877 1.234145 1.234145a257.553714 257.553714 0 0 0-36.802203 64.916026 268.710385 268.710385 0 0 0-16.389446 65.841634c-20.980465 173.508442 58.350374 332.071388 273.523551 547.269247 297.428939 297.428939 537.124575 274.942817 547.46671 273.832087a267.661362 267.661362 0 0 0 66.039098-16.586909 257.936299 257.936299 0 0 0 64.693879-36.641764l0.974975 0.85156 45.256096-44.318146c32.655476-32.717183 33.593426-84.995564 2.098046-116.589675z" p-id="3712" fill="#000000"></path><path d="M841.112575 110.237494l94.128237 94.671261-235.956178 236.005544 94.239311 94.362724-283.372028-0.111073V252.201191l94.510822 94.288676L841.112575 110.237494z" p-id="3713" fill="#000000"></path></svg></span>
        <span class="chat-type" style="display: ${value.chatType !== "answer" ? "flex" : "none"};"><svg class="icon" viewBox="0 0 1026 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2834" width="20" height="20"><path d="M1003.269016 809.896692L844.787063 651.390065c-31.570553-31.434845-83.89205-30.472554-116.52359 2.195998l-79.845493 79.845493c-5.04586-2.788177-10.264439-5.687388-15.754434-8.783991-50.42159-27.88177-119.435138-66.225372-192.063447-138.915366-72.788691-72.788691-111.169304-141.950284-139.186781-192.458234-2.973233-5.354287-5.798421-10.498843-8.635947-15.384321l53.592216-53.530531 26.339637-26.376647c32.7179-32.7179 33.630843-84.990049 2.121975-116.523591L216.386257 23.001596c-31.49653-31.49653-83.793354-30.534239-116.52359 2.195998l-44.66018 44.919258 1.233706 1.233707a258.190122 258.190122 0 0 0-36.838479 64.905305 269.120763 269.120763 0 0 0-16.35895 65.793575c-20.923664 173.557848 58.304975 332.113823 273.525095 547.296932 297.409656 297.397319 537.106516 274.943858 547.444978 273.882871a267.3689 267.3689 0 0 0 66.040315-16.593354 257.289516 257.289516 0 0 0 64.695576-36.641087l0.974628 0.851258 45.252359-44.302405c32.643877-32.730237 33.593831-84.990049 2.097301-116.597613z" p-id="2835" fill="#000000"></path><path d="M576.67794 547.006148l-100.941876-103.767064 253.057902-258.683605-101.077583-103.409289 303.923627 0.111033v310.153845l-101.361337-103.35994-253.600733 258.95502z" p-id="2836" fill="#000000"></path></svg></span>
        <div class="host-avatar"><img class="avatar" src="${value.avatar ? value.avatar : "../assets/img/photo-2.png"}" /></div>
        <span class="host-name">${value.nickname ? value.nickname : "Nickname"}</span>
        <span class="chat-duration">${value.seconds ? (+value.seconds).toFixed(0) : 2}mins</span>
        <div class="chat-info">
          <div><span class="title-1">RoomId: </span><span class="content-1 room-id">${value.roomId ? value.roomId : "000000000000000"}</span></div>
          <div><span class="title-1">UserUid: </span><span class="content-1 user-uid">${value.userUid ? value.userUid : "111111111111111"}</span></div>
          <div><span class="title-1">Date: </span><span class="content-1 chat-datetime">${value.dateTime ? value.dateTime : "1970-01-01 00:00"}</span></div>
        </div>
        <div>
          <span class="diamond">${value.diamond ? value.diamond : "000"}</span>
          <svg t="1605668905839" class="icon" viewBox="0 0 1130 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4550" width="15" height="15"><path d="M0 366.09337l545.725858 649.023967a25.824527 25.824527 0 0 0 38.980418 0L1129.944879 366.09337H0z" fill="#299ACC" p-id="4551"></path><path d="M978.895758 45.966684A64.804946 64.804946 0 0 0 907.756494 0.651947H252.398209a65.292201 65.292201 0 0 0-70.652008 42.878461L0 366.09337h1129.944879z" fill="#38B1E7" p-id="4552"></path><path d="M828.333892 21.603922a48.725523 48.725523 0 0 0-38.980419-18.028443L367.877699 0.651947a48.725523 48.725523 0 0 0-36.544142 18.028444 48.725523 48.725523 0 0 0-9.745105 40.929439l48.725523 306.970796h417.577733l48.725523-303.560009A48.725523 48.725523 0 0 0 828.333892 21.603922z" fill="#89D0EF" p-id="4553"></path><path d="M369.339465 366.09337l170.53933 638.304352a25.824527 25.824527 0 0 0 48.725523 0l194.902092-639.278862h-414.166945z" fill="#61C0EA" p-id="4554"></path></svg>
        </div>
        `;
        logHTML.push(item);
    })
    callLogTable.innerHTML += logHTML.join("");
}

async function initHostLogs(){
    let url1 = getUrl("/api/call/weekly/total");
    let url2 = getUrl("/api/reward/weekly/list");
    let url3 = getUrl("/api/call/weekly/list");
    let VideoCallToal = axios.post(url1, {}, { headers: getHeaders()});
    let giftLog = axios.post(url2, {}, { headers: getHeaders()});
    let VideoCallList = axios.post(url3, {}, { headers: getHeaders()});
    Promise.allSettled([VideoCallToal, giftLog, VideoCallList]).then(results => {
        if(results[0].status === "fulfilled") renderHostStatisticLogs(results[0].value.data);
        else console.error(results[0].reason);
        if(results[1].status === "fulfilled") renderHostGiftLogs(results[1].value.data);
        else console.error(results[1].reason);
        if(results[2].status === "fulfilled") renderHostCallLogs(results[2].value.data);
        else console.error(results[2].reason);
    }).catch(error => console.error(error));
}

async function initHostMediaList(){
    let url = getUrl("/api/user/mediaList");
    let resultObj = { success: false};
    let dataObj = {}
    if(config.relateUid) dataObj.relateUid = config.relateUid;
    await axios.post(url, dataObj, { headers: getHeaders()}).then(res => {
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
    initHostLogs();
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
                    if(typeof call === "function") call(result);
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
    let parent = parentByClass(cur, "host-already-upload-item");
    let tags = new Array();
    if(cur.classList.contains("delete")){
        var x = confirm("Delete Confirm?");
        if(!x) return;
        tags.push("delete");
        hostSetMediaItemTag(fileId)(tags, function(){
            parent.remove();
        });
        return;
    }
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
    if(!storageHelper.getItem("token") && !/\/login\//.test(path) && !/\/apply\//.test(path)) window.location.href = "../login/";
    if(/\/index.html/.test(path)) window.location.href = path.replace("index.html", "");
    if (/\/login\//.test(path)) initLoginPage();
    else if (/\/agent\//.test(path)) initAgentPage();
    else if (/\/host\//.test(path)) initHostPage();
    else initApplyPage();
}
initPage();