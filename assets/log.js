class avatarLog {
    constructor() { 
        this.log = document.createElement('div')
    }
    static typeObj = {
        info: '--boarder-color: #2196F3; --background-color: #E3F2FD; --icon-color: #0D47A1;',
        error: '--boarder-color: #F44336; --background-color: #FFEBEE; --icon-color: #D32F2F;',
        success: '--boarder-color: #4CAF50; --background-color: #E8F5E9; --icon-color: #2E7D32;'
    };

    i = null;

    init() {
        this.log.className = 'avatar-msg'
        this.log.innerHTML = `<div class="avatar-msg-centent"><i class="avatar-msg-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free v6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24l0 112c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-112c0-13.3 10.7-24 24-24zM224 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z"/></svg>
                </i><span>K</span></div>`
        document.body.append(this.log)
    }

    show(msg, type='info', time=2000) {
        this.log.querySelector('span').innerText = msg
        this.log.classList.add('avatar-msg-show')
        this.log.setAttribute('style', avatarLog.typeObj[type])
        clearTimeout(this.i)
        this.i = setTimeout(() => {
            this.log.classList.remove('avatar-msg-show')
        }, time);
    }
}

module.exports = avatarLog;