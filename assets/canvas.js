class CropBox {
    constructor(canvas, pcanvas, maxRes) {
        this.canvas = canvas;
        this.pcanvas = pcanvas;
        this.ctx = this.canvas.getContext('2d', {
            willReadFrequently: false
        });
        this.pctx = this.pcanvas.getContext('2d', {
            willReadFrequently: false
        });
        this.newWidth = 0;
        this.newHeight = 0;
        this.maxRes = maxRes || 64;
        this.YoN = false;
        this.ratio = window.devicePixelRatio || 1;
    }

    init(img) {;
        const maxWidth = 500;
        const scale = Math.min(maxWidth / img.naturalWidth, maxWidth / img.naturalHeight, 1);
        this.newWidth = Math.floor(img.naturalWidth * scale) * this.ratio;
        this.newHeight = Math.floor(img.naturalHeight * scale) * this.ratio;
        this.canvas.width = this.newWidth;
        this.canvas.height = this.newHeight;
        this.ctx.drawImage(img, 0, 0, this.newWidth , this.newHeight);
        this.YoN = true;

        this.pcanvas.width =  this.maxRes;
        this.pcanvas.height =  this.maxRes;
    }

    updatePreview(x = 0, y = 0, width = 0, height = 0) {
        this.pctx.clearRect(0, 0, this.pcanvas.width, this.pcanvas.height);
        const c = this.canvas.getBoundingClientRect();
        const w = this._round(this.canvas.width / c.width, 2);
        const h = this._round(this.canvas.height / c.height, 2);
        const longest = Math.max(w, h);
        const dataImg = this.ctx.getImageData(x * longest, y * longest, width * longest, height * longest);
        const tempCanvas = document.createElement("canvas");
        const tempContext = tempCanvas.getContext("2d");
        tempCanvas.width = width * longest;
        tempCanvas.height = height * longest;
        tempContext.putImageData(dataImg, 0, 0);
        this.pctx.drawImage(tempCanvas, 0, 0, this.pcanvas.width, this.pcanvas.height);
    }

    cleanUp() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.pctx.clearRect(0, 0, this.pcanvas.width, this.pcanvas.height);
        this.YoN = false;
    }

    clip() {
        return this._getBase64Image();
    }
    _getBase64Image() {
        return this.pcanvas.toDataURL('image/png');
    }
    _round(number, precision) {
        return Math.round(number * Math.pow(10, precision)) / Math.pow(10, precision);
    }
}

module.exports = CropBox
