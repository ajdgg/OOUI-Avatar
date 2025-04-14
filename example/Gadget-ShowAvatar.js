const img = document.createElement('img');
img.src = mw.config.get('wgScriptPath') + '/extensions/Avatar/avatar.php?user=' + mw.user.id();
const link = document.createElement('a');
link.href = mw.util.getUrl('Special:UploadAvatar');
link.appendChild(img);
document.getElementById('pt-userpage').before(document.createElement('li').appendChild(link));
