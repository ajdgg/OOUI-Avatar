// Some fields
const CropBox = require("ext.avatar.canvas");

const minDimension = 64;
const maxRes = mw.config.get('wgMaxAvatarResolution');
const FileType = ['image/png', 'image/gif', 'image/jpeg', 'image/webp', 'image/svg+xml']
const inputAcceptFlieType = '.png, .gif, .jpg, .jpeg, .webp, .svg'
const currentAvatar = document.createElement('img')
currentAvatar.className = 'current-avatar';
currentAvatar.src = mw.config.get('wgScriptPath') + '/extensions/Avatar/avatar.php?user=' + mw.user.id() + '&res=original&nocache&ver=' + Math.floor(Date.now()/1000).toString(16);
console.log('as:', mw.msg('uploadavatar-nofile'))
console.log('as:', mw.msg('uploadavatar-hint'))
console.log('as:', mw.msg('avatar-toosmall'))
console.log('as:', mw.msg('avatar-invalid'))

let msgBelow = document.createElement('p');
msgBelow.textContent = mw.msg('uploadavatar-nofile');
const OOSubmit = OO.ui.infuse(document.getElementById('submit'));
const OOerrorMsg = OO.ui.infuse(document.getElementById('errorMsg'));
OOerrorMsg.getLabel() ? OOerrorMsg.toggle(true) : OOerrorMsg.toggle(false);
const hiddenField = document.getElementById('avatar');
const pickfile = document.getElementById('pickfile');
const crop = document.getElementById('crop')
crop.innerHTML = `
  <canvas id="avatar-canvas"></canvas>
  <div id="cropper" class="cropper" name="cropper" >
    <div class="up"></div>
    <div class="down"></div>
    <div class="left"></div>
    <div class="right"></div>
    <div class="tl-resizer"></div>
    <div class="tr-resizer"></div>
    <div class="bl-resizer"></div>
    <div class="br-resizer"></div>
    <div class="x"></div>
    <div class="y"></div>
  </div>
`
const canvas = document.getElementById('avatar-canvas');
const cropper = document.querySelector('.cropper');
const tlResizer = document.querySelector('.tl-resizer');
const trResizer = document.querySelector('.tr-resizer');
const blResizer = document.querySelector('.bl-resizer');
const brResizer = document.querySelector('.br-resizer');
const up = document.querySelector('.up');
const down = document.querySelector('.down');
const left = document.querySelector('.left');
const right = document.querySelector('.right');

const CorpBoxClass = new CropBox(canvas, maxRes);

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

window.onpointermove = (event) => {
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
  console.log(cropdDom);
  if (!cropdDom) return;
  offsetX = translateX;
  offsetY = translateY;
  startX = 0;
  startY = 0;
  ifKeyDown = false;
  contact = "";
  const inputValue = CorpBoxClass.clip(offsetX, offsetY, cropperWidth, cropperWidth);
  hiddenField.setAttribute('value', inputValue);
}

const cropperCSSsetup = (valve, tX, tY) => {
  cropper.style.width = `${valve}px`;
  cropper.style.height = `${valve}px`;
  translateX = tX;
  translateY = tY;
  cropper.style.transform = `translate(${translateX}px, ${translateY}px)`;
}

function cropperMove(event) {
  const e = event || window.event;
  const newOffsetX = offsetX + e.clientX - startX;
  const newOffsetY = offsetY + e.clientY - startY;
  // 边界检查
  translateX = Math.max(0, Math.min(newOffsetX, canvas.offsetWidth - cropper.offsetWidth));
  translateY = Math.max(0, Math.min(newOffsetY, canvas.offsetHeight - cropper.offsetHeight));
  cropper.style.transform = `translate(${translateX}px, ${translateY}px)`;
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
    offsetY + max  < 0 ||
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

pickfile.onclick = (event) => {
  let picker = document.createElement('input');
  picker.type = 'file';
  picker.accept = inputAcceptFlieType;
  picker.onchange = (event) => {
    var file = event.target.files[0];
    console.log(file);
    if (!FileType.includes(file.type)) {
      OOerrorMsg.toggle(true);
      OOerrorMsg.setLabel(mw.msg('avatar-invalid'));
      return;
    }

    if (file) {
      var reader = new FileReader();
        reader.onloadend = () => {
          currentAvatar.style.display = 'none';
          canvas.style.display = 'block';
          OOSubmit.setDisabled("");
          msgBelow.textContent = mw.msg('uploadavatar-hint');
          OOerrorMsg.toggle(false)
          InitCanvas(reader.result);
        }
      reader.readAsDataURL(file);
    }
  }
  picker.click();
  event.preventDefault();
}

const InitCanvas = async (base64) => {
  try {
    const sizs = await getBase64ImageSize(base64);
    CorpBoxClass.init(sizs.img);
    const inputValue = CorpBoxClass.clip(offsetX, offsetY, cropperWidth, cropperWidth);
    hiddenField.setAttribute('value', inputValue);
  } catch (e) {
    OOerrorMsg.toggle(true);
    OOerrorMsg.setLabel(e.message);
  }
}

hiddenField.before(currentAvatar);
pickfile.before(msgBelow);
