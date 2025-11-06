(()=> {
	"use strict";
	const mw_userlink = document.querySelectorAll('.mw-userlink');

	for (let i of mw_userlink) {
		const img = document.createElement('img');
		img.className = 'userlink-avatar';
		img.src = mw.config.get('wgScriptPath') + '/extensions/Avatar/avatar.php?user=' + i.textContent;
		i.insertBefore(img, i.firstChild);
	}
})()
