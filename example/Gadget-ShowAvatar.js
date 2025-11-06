(() => {
	"use strict";

	const avatarDomList = document.querySelectorAll('.mw-ui-icon-userAvatar.mw-ui-icon-wikimedia-userAvatar');
	if (!avatarDomList.length) return;
	let username = typeof mw.user.getName == 'function' && mw.user.getName().replace(' ', '_');
	const imgsrc = username ? `${mw.config.get('wgServer')}/extensions/Avatar/avatar.php?user=${username}` : mw.config.get('wgDefaultAvatar');
	for (let i = 0; i < avatarDomList.length; i++) {
		avatarDomList[i].style.background = `url(${imgsrc}) no-repeat center / 100%`
		avatarDomList[i].style.maskImage = 'none';
		avatarDomList[i].style.webkitMaskImage = 'none';
		avatarDomList[i].style.width = '2rem';
		avatarDomList[i].style.height = '2rem';
		avatarDomList[i].style.borderRadius = '5px';
	}
})();
