(()=>{
	"use strict";

	const userpageurl = new URL(window.location.href);
	const username = userpageurl.pathname.match(/:(\w+)$/)[1];

	function newAvatarImg() {
		const img = document.createElement('img');
		img.className = 'userlink-avatar';
		img.style.width = '2.2rem';
		img.style.height = '2.2rem';
		img.style.borderRadius = '5px';
		const imgsrc = `${mw.config.get('wgServer')}/extensions/Avatar/avatar.php?user=${username}`;
		img.src = imgsrc;
		return img;
	}

	const pageTitleMain = document.querySelectorAll('.mw-page-title-main');
	console.log(pageTitleMain);
	if (pageTitleMain.length === 0) {
		const firstHeading = document.getElementById('firstHeading');
		if (!firstHeading) return;
		const img = newAvatarImg();
		firstHeading.insertBefore(img, firstHeading.firstChild);
	};
	
	for (let i = 0; i < pageTitleMain.length; i++) {
		const img = newAvatarImg();
		const pageTitle = pageTitleMain[i].parentElement;
		pageTitle.insertBefore(img, pageTitle.firstChild);
	}
})();
