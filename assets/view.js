(() => {
    'use strict';
    let currentPresentationAvatarUser;

    const input = document.querySelector('#query-input');
    const result = document.querySelector('#result');
    const resultBox = document.querySelector('.result-box');
    const queryInputBox = document.querySelector('.query-input-box');
    const img = document.querySelector('#avatar-preview');
    const avatarPreviewTips = document.querySelector('.avatar-preview-tips');
    const MenuOption = mw.config.get('wgMenuOption');
    const deletionInputBox = document.querySelector('.deletion-input-box');
    const shutDownDeletePopupBtn = document.querySelector('.shut-down-delete-popup-btn');
    const deletionAvatarBtn = document.querySelector('.deletion-avatar-btn');
    const deleteAvatarPopup = document.querySelector('.delete-avatar-popup');
    const deletionInput = document.querySelector('#deletion-input');

    if (img.src !== '') {
        const parsedUrl = new URL(window.location.href);
        input.value = parsedUrl.searchParams.get("user");
        currentPresentationAvatarUser = parsedUrl.searchParams.get("user");
    }

    const avatarLog = require("ext.avatar.log");
    
    const avatarLogI = new avatarLog();
    avatarLogI.init();

    let isComposing = false;


    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(this, args);
            }, wait);
        };
    }

    const hideMenu = () => {
        MenuOption && (resultBox.style.height = `0px`);
    }

    const disabledBtn = (disabled = true) => {
        deletionAvatarBtn.disabled !== disabled && (deletionAvatarBtn.disabled = disabled);
    }

    const showDeletePopup = (show = true) => { 
        deleteAvatarPopup.style.opacity = show ? '1' : '0';
        deleteAvatarPopup.style.pointerEvents = show ? 'all' : 'none';
        !show && deletionInput.value && (deletionInput.value = '');
    }

    document.addEventListener('click', function (evt) {
        if (!resultBox.contains(evt.target) && !input.contains(evt.target)) {
            hideMenu();
        }
    });


    // 跟新菜单列表
    const funResult = (list) => {
        if (result.children.length === 0 || result.children.length !== list.length) {
            result.innerHTML = '';

            const fragment = document.createDocumentFragment();
            list.forEach((item) => {
                const li = document.createElement('li');
                li.textContent = item.name;
                fragment.appendChild(li);
            });
            result.appendChild(fragment);
            const h = result.scrollHeight;
            resultBox.style.height = `0px`;
            window.getComputedStyle(result).height;
            resultBox.style.height = `${h}px`;
            return;
        }

        for (let i = 0; i < result.children.length; i++) {
            if (result.children[i].textContent !== list[i].name) {
                result.children[i].textContent = list[i].name;
            }
        }

        if (resultBox.style.height === '0px') {
            const h = result.scrollHeight;
            resultBox.style.height = `0px`;
            window.getComputedStyle(result).height;
            resultBox.style.height = `${h}px`;
        }
    }

    // 防抖后的菜单列表http请求函数
    const debouncedLog = debounce(async (event) => {
        if (isComposing) {
            return;
        }
        if (event.target.value.length === 0) {
            hideMenu();
            return;
        };
        const h = await fetch(`/api.php?action=query&format=json&list=allusers&auprefix=${event.target.value}&aulimit=10&auexcludetemp=1`)
        const json = await h.json();
        funResult(json.query.allusers);
    }, 500);

    // 查询头像
    const q = async (name) => {
        currentPresentationAvatarUser = '';
        const header = await fetch(`?q=${name}`)
        const json = await header.json();
        img.style.display = 'block';
        if (json.code !== '20000') {
            avatarLogI.show(json.msg, 'error', 5000);
            img.src = '';
            img.style.display = 'none';
            avatarPreviewTips.textContent = mw.msg('viewavatar-nouser');
            disabledBtn();
            return;
        }
        if (json.avatar !== 'true') {
            img.src = '';
            img.style.display = 'none';
            avatarPreviewTips.textContent = mw.msg('viewavatar-noavatar');
            disabledBtn();
            return;
        }
        img.style.display = 'block';
        img.src = mw.config.get('wgScriptPath') + '/extensions/Avatar/avatar.php?user=' + name + '&res=original&nocache&ver=' + Math.floor(Date.now()/1000).toString(16);
        avatarLogI.show(json.msg, 'success');
        avatarPreviewTips.textContent = mw.msg('viewavatar-avatar-preview-tips', name);
        disabledBtn(false);
        currentPresentationAvatarUser = name;
    }

    // 查询
    queryInputBox.addEventListener('submit', (e) => { 
        e.preventDefault();
        q(input.value);
        hideMenu();
    });

    // 显示删除头像弹窗
    if (deletionAvatarBtn) {
        deletionAvatarBtn.addEventListener('click', () => { 
            showDeletePopup();
        });
    }

    // 关闭删除头像弹窗
    if (shutDownDeletePopupBtn) {
        shutDownDeletePopupBtn.addEventListener('click', (e) => { 
            e.preventDefault();
            showDeletePopup(false);
        });
    }

    // 删除<form>
    if (deletionInputBox) {
        deletionInputBox.addEventListener('submit', (e) => { 
            e.preventDefault();
            const url = window.location.pathname + `?user=${currentPresentationAvatarUser}&delete=${currentPresentationAvatarUser}&reason=${deletionInput.value}`;
            fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }).then(async (res) => {
                const data = await res.json();

                if (data.code !== '20000') {
                    throw new Error(data.msg);
                }
                return data;
            }).then((res) => {
                avatarLogI.show(res.msg, 'success');
                img.src = '';
                img.style.display = 'none';
                avatarPreviewTips.textContent = mw.msg('viewavatar-noavatar');
                disabledBtn();
                showDeletePopup(false);

            }).catch((err) => {
                avatarLogI.show(err.message, 'error');
                showDeletePopup(false);
            })
        });
    }

    // 菜单列表功能事件注册
    const Menu = () => {
        input.addEventListener('compositionstart', () => {
            isComposing = true;
        });

        input.addEventListener('compositionend', () => {
            isComposing = false;
        });

        input.addEventListener('input', debouncedLog);

        result.addEventListener('click', (event) => {
            event.preventDefault();
            event.target.closest('li') && (input.value = event.target.closest('li').textContent);
            hideMenu();
            q(event.target.closest('li').textContent);
        });
    }

    // 在启用菜单时，注册事件
    MenuOption && Menu();

})();
