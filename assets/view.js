const init = (Toolset) => {
    'use strict';
    let currentPresentationAvatarUser;

    const result = document.querySelector('#result');
    const resultBox = document.querySelector('.result-box');
    const queryInputBox = document.querySelector('.query-input-box');
    const img = document.querySelector('#avatar-preview');
    const avatarPreviewTips = document.querySelector('.avatar-preview-tips');
    const MenuOption = mw.config.get('wgMenuOption');

    const hideMenu = () => {
        MenuOption && (resultBox.style.height = `0px`);
    }

    const disabledBtn = (disabled = true) => {
        Toolset.changesDeleteBtnDisabled(disabled);
    }

    const parsedUrl = new URL(window.location.href);
    Toolset.addQueryInputValue(parsedUrl.searchParams.get("user"));
    currentPresentationAvatarUser = parsedUrl.searchParams.get("user");

    if (img.getAttribute('src') === '') {
        if(avatarPreviewTips.textContent === mw.msg('viewavatar-nouser')) {
            Toolset.setMsgBoxType('error');
            Toolset.setMsgBoxText(mw.msg('viewavatar-nouser'));
            Toolset.setMsgBoxShow(true);
        }
        disabledBtn(true);
    }

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
        Toolset.setMsgBoxShow(false);
        currentPresentationAvatarUser = '';
        const header = await fetch(`?q=${name}`)
        const json = await header.json();
        img.style.display = 'block';
        if (json.code !== '20000') {
            Toolset.setMsgBoxType('error');
            Toolset.setMsgBoxText(json.msg);
            Toolset.setMsgBoxShow(true);
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
        avatarPreviewTips.textContent = mw.msg('viewavatar-avatar-preview-tips', name);
        disabledBtn(false);
        currentPresentationAvatarUser = name;
    }

    // 查询
    queryInputBox.addEventListener('submit', (e) => { 
        e.preventDefault();
        q(Toolset.getQueryInputValue());
        hideMenu();
    });

    // // 菜单列表功能事件注册
    const Menu = () => {
        console.log('Menu')
        const input = document.querySelector('.avatar-nameinput input.cdx-text-input__input')
        if (!input || !resultBox || !result) {
            return console.error('Menu elements not found');
        };
        document.addEventListener('click', function (evt) {
            if (!resultBox.contains(evt.target) && !input.contains(evt.target)) {
                hideMenu();
            }
        });

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

    return function () { 
        const url = window.location.pathname + `?user=${currentPresentationAvatarUser}&delete=${currentPresentationAvatarUser}&reason=${Toolset.getDeleteInfoInputValue()}`;
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
            Toolset.setMsgBoxType('success');
            Toolset.setMsgBoxText(res.msg);
            Toolset.setMsgBoxShow(true);
            img.src = '';
            img.style.display = 'none';
            avatarPreviewTips.textContent = mw.msg('viewavatar-noavatar');
            disabledBtn();
            Toolset.controlDialogShow(false);
        }).catch((err) => {
            Toolset.setMsgBoxType('error');
            Toolset.setMsgBoxText(err.message);
            Toolset.setMsgBoxShow(true);
            Toolset.controlDialogShow(false);
        })
    };
};

module.exports = init;
