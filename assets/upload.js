// Some fields
const CropBox = require("ext.avatar.canvas");
const avatarLog = require("ext.avatar.log");

const avatarLogI = new avatarLog();
avatarLogI.init();

const minDimension = 64;
const maxRes = mw.config.get('wgMaxAvatarResolution');
const FileType = ['image/png', 'image/gif', 'image/jpeg', 'image/webp', 'image/svg+xml']
const inputAcceptFlieType = '.png, .gif, .jpg, .jpeg, .webp, .svg'
const currentAvatar = document.querySelector('.current-avatar');
const uploadButton = document.getElementById('upload-avatar-btn');
const reselectTtheAvatar = document.getElementById('reselect-the-avatar');
const cancelAvatarUpload = document.getElementById('cancel-avatarupload');
const determineUploadBtn = document.getElementById('determine-upload-btn');
const avatarPresentationRegion = document.getElementById('avatar-presentation-region');
const avatarPresentation = document.getElementById('avatar-presentation');
avatarPresentation.insertBefore(currentAvatar, avatarPresentation.firstChild);
const clippingArea = document.getElementById('clipping-area');
const tips = document.getElementById('tips');

const canvas = document.getElementById('avatar-canvas');
const pcanvas = document.getElementById('avatar-preview-canvas');
const cropper = document.querySelector('.cropper');
const tlResizer = document.querySelector('.tl-resizer');
const trResizer = document.querySelector('.tr-resizer');
const blResizer = document.querySelector('.bl-resizer');
const brResizer = document.querySelector('.br-resizer');
const up = document.querySelector('.up');
const down = document.querySelector('.down');
const left = document.querySelector('.left');
const right = document.querySelector('.right');

const CorpBoxClass = new CropBox(canvas, pcanvas, maxRes);

let ifKeyDown = false;
let contact = "";
let cropperWidth = cropper.offsetWidth, canvasWidth = 0, canvasHeight = 0;
let startX, startY;
let offsetX = 0, offsetY = 0;
let translateX = offsetX, translateY = offsetY;

let cropdDom = false;

const init = (event) => {
    const e = event || window.event;
    e.stopPropagation();
    e.preventDefault();
    startX = e.clientX;
    startY = e.clientY;
    cropperWidth = cropper.offsetWidth;
    canvasWidth = canvas.offsetWidth;
    canvasHeight = canvas.offsetHeight;
    ifKeyDown = true;
    cropdDom = true;
}

const cropremove = (event) => {
    offsetX = 0;
    offsetY = 0;
    cropper.style.width = `100px`;
    cropper.style.height = `100px`;
    cropper.style.transform = `translate(0px, 0px)`;
}

cropper.onpointerdown = (event) => {
    init(event);
    contact = "cropper";
}
tlResizer.onpointerdown = (event) => {
    init(event);
    contact = "tlResizer";
}
trResizer.onpointerdown = (event) => {
    init(event);
    contact = "trResizer";
}
blResizer.onpointerdown = (event) => {
    init(event);
    contact = "blResizer";
}
brResizer.onpointerdown = (event) => {
    init(event);
    contact = "brResizer";
}
up.onpointerdown = (event) => {
    init(event);
    contact = "up";
}
down.onpointerdown = (event) => {
    init(event);
    contact = "down";
}
left.onpointerdown = (event) => {
    init(event);
    contact = "left";
}
right.onpointerdown = (event) => {
    init(event);
    contact = "right";
}

const updatePreview = throttle((x, y, width, height) => {
    CorpBoxClass.updatePreview(x, y, width, height);
}, 100);

window.onpointermove = (event) => {
    if (!cropdDom) return;
    switch (contact) {
        case "cropper":
            cropperMove(event);
            break;
        case "tlResizer":
            tlResizerMove(event);
            break;
        case "trResizer":
            trResizerMove(event);
            break;
        case "blResizer":
            blResizerMove(event);
            break;
        case "brResizer":
            brResizerMove(event);
            break;
        case "up":
            upMove(event);
            break;
        case "down":
            downMove(event);
            break;
        case "left":
            leftMove(event);
            break;
        case "right":
            rightMove(event);
            break;
    }
}
window.onpointerup = () => {
    if (!cropdDom) return;
    offsetX = translateX;
    offsetY = translateY;
    startX = 0;
    startY = 0;
    ifKeyDown = false;
    cropdDom = false;
    contact = "";
}

const cropperCSSsetup = (valve, tX, tY) => {
    cropper.style.width = `${valve}px`;
    cropper.style.height = `${valve}px`;
    translateX = tX;
    translateY = tY;
    cropper.style.transform = `translate(${translateX}px, ${translateY}px)`;
    updatePreview(translateX, translateY, valve, valve);
}

function cropperMove(event) {
    const e = event || window.event;
    const newOffsetX = offsetX + e.clientX - startX;
    const newOffsetY = offsetY + e.clientY - startY;
    // 边界检查
    translateX = Math.max(0, Math.min(newOffsetX, canvas.offsetWidth - cropper.offsetWidth));
    translateY = Math.max(0, Math.min(newOffsetY, canvas.offsetHeight - cropper.offsetHeight));
    cropper.style.transform = `translate(${translateX}px, ${translateY}px)`;
    updatePreview(translateX, translateY, cropperWidth, cropperWidth);
}

function tlResizerMove(event) {
    const e = event || window.event;
    max = Math.max(e.clientX - startX, e.clientY - startY);
    if (
        offsetX + max < 0 ||
        offsetY + max < 0 ||
        cropperWidth - max < minDimension
    ) return;
    cropperCSSsetup(cropperWidth - max, offsetX + max, offsetY + max);
}
function trResizerMove(event) {
    const e = event || window.event;
    max = Math.min(e.clientX - startX, - (e.clientY - startY));
    if (
        offsetX + cropperWidth + max > canvasWidth ||
        offsetY - max < 0 ||
        cropperWidth + max < minDimension
    ) return;
    cropperCSSsetup(cropperWidth + max, offsetX, offsetY - max);
}
function blResizerMove(event) {
    const e = event || window.event;
    max = Math.max(e.clientX - startX, - (e.clientY - startY));
    if (
        offsetX + max < 0 ||
        offsetY + cropperWidth + max > canvasHeight ||
        cropperWidth - max < minDimension
    ) return;
    cropperCSSsetup(cropperWidth - max, offsetX + max, offsetY);
}
function brResizerMove(event) {
    const e = event || window.event;
    max = Math.max(e.clientX - startX, e.clientY - startY);
    if (
        offsetX + cropperWidth + max > canvasWidth ||
        offsetY + cropperWidth + max > canvasHeight ||
        cropperWidth + max < minDimension
    ) return;
    cropperCSSsetup(cropperWidth + max, offsetX, offsetY);
}
function upMove(event) {
    const e = event || window.event;
    max = e.clientY - startY;
    if (
        offsetX + max / 2 < 0 ||
        offsetY + max < 0 ||
        offsetX + cropperWidth + max / 2 > canvasWidth ||
        cropperWidth - max < minDimension
    ) return;
    cropperCSSsetup(cropperWidth - max, offsetX + max / 2, offsetY + max);
}
function downMove(event) {
    const e = event || window.event;
    max = e.clientY - startY;
    if (
        offsetX + max / 2 < 0 ||
        offsetY + cropperWidth + max > canvasHeight ||
        offsetX + cropperWidth + max / 2 > canvasWidth ||
        cropperWidth + max < minDimension
    ) return;
    cropperCSSsetup(cropperWidth + max, offsetX - max / 2, offsetY);
}
function leftMove(event) {
    const e = event || window.event;
    max = e.clientX - startX;
    if (
        offsetX + max < 0 ||
        offsetY + max / 2 < 0 ||
        offsetY + cropperWidth - max / 2 > canvasHeight ||
        cropperWidth - max < minDimension
    ) return;
    cropperCSSsetup(cropperWidth - max, offsetX + max, offsetY + max / 2);
}
function rightMove(event) {
    const e = event || window.event;
    max = e.clientX - startX;
    if (
        offsetY - max / 2 < 0 ||
        offsetX + cropperWidth + max > canvasWidth ||
        offsetY + cropperWidth + max / 2 > canvasHeight ||
        cropperWidth + max < minDimension
    ) return;
    cropperCSSsetup(cropperWidth + max, offsetX, offsetY - max / 2);
}

function getBase64ImageSize(base64) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({
            img,
        });
        img.onerror = reject;
        img.src = base64;
    });
}

const InitCanvas = async (base64) => {
    try {
        const sizs = await getBase64ImageSize(base64);
        CorpBoxClass.init(sizs.img);
        updatePreview(translateX, translateY, cropperWidth, cropperWidth);
    } catch (e) {
        avatarLogI.show(e.message, 'error', 5000)
    }
}


const displayAvatar = () => {
    cropremove();
    let picker = document.createElement('input');
    picker.type = 'file';
    picker.accept = inputAcceptFlieType;
    picker.onchange = (event) => {
        window.innerWidth < 480 ? tips.style.display = "none" : null;
        avatarPresentationRegion.style.display = "none";
        clippingArea.style.display = "flex";
        var file = event.target.files[0];
        if (!FileType.includes(file.type)) {
            avatarLogI.show(mw.msg('avatar-invalid'), 'error', 5000);
            return;
        }

        if (file) {
            var reader = new FileReader();
            reader.onloadend = () => {

                currentAvatar.style.display = 'none';
                canvas.style.display = 'block';
                avatarLogI.show(mw.msg('uploadavatar-hint'), 'info')
                cropperWidth = cropper.offsetWidth;
                InitCanvas(reader.result);
            }
            reader.readAsDataURL(file);
        }
    }
    picker.click();
}

// 上传头像按钮
uploadButton.onclick = (event) => {
    displayAvatar();
    event.preventDefault();
}

// 重新选择头像按钮
reselectTtheAvatar.onclick = (event) => {
    displayAvatar();
    event.preventDefault();
}

// 取消上传按钮
cancelAvatarUpload.onclick = () => {
    window.innerWidth < 480 || tips.style.display !== "block" ? tips.style.display = "block" : null;
    avatarPresentationRegion.style.display = "flex";
    clippingArea.style.display = "none";
    currentAvatar.style.display = 'block';
    cropremove();
}

// 确定上传按钮
determineUploadBtn.onclick = () => {

    window.innerWidth < 480 ? tips.style.display = "block" : null;
    avatarPresentationRegion.style.display = "flex";
    clippingArea.style.display = "none";
    currentAvatar.style.display = 'block';
    fetch(window.location.pathname, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'avatar=' + encodeURIComponent(CorpBoxClass.clip())
    }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.msg);
        }
        return data;
    }).then((res) => {
        avatarLogI.show(res.msg, 'success');
        currentAvatar.src = mw.config.get('wgScriptPath') + '/extensions/Avatar/avatar.php?user=' + mw.user.id() + '&res=original&nocache&ver=' + Math.floor(Date.now() / 1000).toString(16);
    }).catch((err) => {
        console.log(err)
        avatarLogI.show(err.message, 'error');
    })
}

function throttle(func, wait) {
    let timeout = null;
    let lastArgs = null;
    let lastThis = null;
    let lastCallTime = 0;

    function throttled(...args) {
        const now = Date.now();
        const remainingTime = wait - (now - lastCallTime);

        lastArgs = args;
        lastThis = this;

        if (remainingTime <= 0 || remainingTime > wait) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            lastCallTime = now;
            func.apply(lastThis, lastArgs);
        } else if (!timeout) {
            timeout = setTimeout(() => {
                lastCallTime = Date.now();
                timeout = null;
                func.apply(lastThis, lastArgs);
            }, remainingTime);
        }
    }

    return throttled;
}
