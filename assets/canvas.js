class CropBox {
    constructor(canvas, maxRes) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d', {
            willReadFrequently: false
        });
        this.newWidth = 0;
        this.newHeight = 0;
        this.maxRes = maxRes || 64;
        this.YoN = false;
    }

    init(img) {
        const ratio = window.devicePixelRatio || 1;
        console.log(img.naturalWidth, img.naturalHeight);
        const maxWidth = 500;
        const scale = Math.min(maxWidth / img.naturalWidth, 1);
        this.newWidth = Math.floor(img.naturalWidth * scale) * ratio;
        this.newHeight = Math.floor(img.naturalHeight * scale) * ratio;
        this.canvas.width = this.newWidth;
        this.canvas.height = this.newHeight;
        this.ctx.drawImage(img, 0, 0, this.newWidth , this.newHeight);
        this.YoN = true;
    }
    clip(x, y, w, h) {
        return this._getBase64Image(x, y, w, h);
    }
    _getBase64Image(x = 0, y = 0, width = 0, height = 0) {
        const c = this.canvas.getBoundingClientRect();
        const w = this._round(this.canvas.width / c.width, 2);
        const h = this._round(this.canvas.height / c.height, 2);
        const longest = Math.max(w, h);
        const dataImg = this.ctx.getImageData(x * longest, y * longest, width * longest, height * longest);
        const canvas2 = document.createElement("canvas");
        const context2 = canvas2.getContext("2d");
        canvas2.width = this.maxRes;
        canvas2.height = this.maxRes;
        const tempCanvas = document.createElement("canvas");
        const tempContext = tempCanvas.getContext("2d");
        tempCanvas.width = width * longest;
        tempCanvas.height = height * longest;
        tempContext.putImageData(dataImg, 0, 0);
        context2.drawImage(tempCanvas, 0, 0, canvas2.width, canvas2.height);
        const res = canvas2.toDataURL('image/png');
        this.YoN = false;
        return res;
    }
    _round(number, precision) {
        return Math.round(number * Math.pow(10, precision)) / Math.pow(10, precision);
    }
}

module.exports = CropBox
