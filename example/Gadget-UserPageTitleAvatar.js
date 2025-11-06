(()=>{
	"use strict";
	const pageTitleMain = document.querySelectorAll('.mw-page-title-main');
	if (!pageTitleMain) return;
	
	for (let i = 0; i < pageTitleMain.length; i++) {
		const img = document.createElement('img');
		img.className = 'userlink-avatar';
		img.style.width = '2.2rem';
		img.style.height = '2.2rem';
		img.style.borderRadius = '5px';
		const imgsrc = `${mw.config.get('wgServer')}/extensions/Avatar/avatar.php?user=${document.querySelector('.mw-page-title-main').textContent.trim()}`;
		img.src = imgsrc;
		const pageTitle = pageTitleMain[i].parentElement;
		pageTitle.insertBefore(img, pageTitle.firstChild);
	}
})();
