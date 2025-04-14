const mw_userlink = document.querySelectorAll('.mw-userlink');
for (let i of mw_userlink) {
	i.innerHTML = '<img class="userlink-avatar" src="' + mw.config.get('wgScriptPath') + '/extensions/Avatar/avatar.php?user=' + i.textContent + '">' + i.innerHTML;
}