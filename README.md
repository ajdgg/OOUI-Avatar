# Avatar

本拓展是基于[MediaWiki:Avatar](https://www.mediawiki.org/wiki/Extension:Avatar) ([MW-Avatar](https://github.com/nbdd0121/MW-Avatar))的修改版，使用OOUI重构部分代码

This extension is a modified version of [MediaWiki:Avatar](https://www.mediawiki.org/wiki/Extension:Avatar) ([MW-Avatar](https://github.com/nbdd0121/MW-Avatar)) and refactoring parts of the code using OOUI

配置完全兼容 Avatar

The configuration is fully compatible with Avatar


<!-- Yet another avatar architecture for MediaWiki

**Note.** There are API changes when upgrading 0.9.2 to 1.0.0. The change is very likely to break your site. See section below for details. -->

## 安装
* main Branches
    * 在根目录`composer.local.json`添加:

        ```json
            {
                "extra": {
                    "merge-plugin": {
                        "include": [
                            "extensions/Avatar/composer.json"
                        ]
                    }
                }
            }
        ```
    * 安装依赖
* NotOSS Branches
    * 无需依赖安装
* 安装 php-gd，这是此扩展的依赖项
* 克隆仓库，将其重命名为 Avatar 并复制到扩展文件夹
* 在 LocalSettings.php 中添加 `wfLoadExtension('Avatar');`
* 完成！

## 配置
* `$wgDefaultAvatar` (字符串)，应设置为默认头像的 URL。
* `$wgAllowedAvatarRes` (数组)，默认值是 array(64, 128)。当请求的大小在这个列表中时，会生成缩略图。
* `$wgMaxAvatarResolution` (整数)，默认值是 256。这限制了可上传图像的最大分辨率。
* `$wgDefaultAvatarRes` (整数)，默认值是 128。如果未指定分辨率，则使用此选项作为回退。
* `$wgVersionAvatar` (布尔值)，默认为 false。当设置为 true 时，每次重定向都会在查询中产生一个 `ver` 参数。
* `$wgAvatarServingMethod` (字符串)，默认为 redirect。这指示在找到用户头像时使用的提供方法
	* `redirect`：默认方法，创建一个 302 重定向到用户的真正头像。
	* `readfile`：使用 php 的 readfile 直接提供文件。
	* `accel`   ：使用 nginx 的 X-Accel-Redirect 直接提供文件。
	* `sendfile`：使用 X-SendFile 头直接提供文件。需要 lighttpd 或带有 mod_xsendfile 的 apache。
* `$wgAvatarLogInRC` (布尔值)，默认为 true。当设置为 true 时，头像日志将显示在最近更改中，因此更容易发现不良头像并采取行动。将其设置为 false 可以防止头像更改影响确定活跃用户。
* `$wgAvatarUploadPath` (字符串)，默认为 "$wgUploadPath/avatars"。这是头像的（Web）路径。
* `$wgAvatarUploadDirectory` (字符串)，默认为 "$wgUploadDirectory/avatars"。这是头像的存储路径。\
* `MenuOption` (布尔值) 是否启用在查看头像界面input的查询菜单
* `UserLinkAvatar` (布尔值) 是否启用在用户链接前加入头像
* `ShowAvatar` (布尔值) 是否在导航栏显示头像
* `UserPageTitleAvatar` (布尔值) 是否在用户页和用户讨论页面标题前加入头像
* 您可以设置用户权限：
	* `avatarupload`：用户需要此权限才能上传自己的头像。
	* `avataradmin`：用户需要此权限才能删除其他人的头像。

## OSS
```php
将$wgAvatarEnableS3 设置为true来启用OSS支持。

$wgAvatarS3URL 设置OSS的URL，例如：http://avatar.example.com/

$wgAvatarS3Path 设置OSS的目录，例如：avatar

$wgAvatarS3Config = [
    'region'  => 'oss-cn-hangzhou', 设置OSS的区域，例如：oss-cn-hangzhou
	'bucket' => 'awajie', 设置OSS的Bucket名称
	'endpoint' => 'http://oss-cn-hangzhou.aliyuncs.com', 设置OSS的Endpoint
	'credentials' => [
		'key'    => '********', 设置OSS的AccessKey ID
		'secret' => '********', 设置OSS的AccessKey Secret
	]
];
```

## 如何使用
* 在用户偏好设置中设置头像，然后 `$wgScriptPath/extensions/Avatar/avatar.php?user=username` 将被重定向到您的头像。
* 您可以为这个 php 设置别名以使其更短。

## 详细 API
* 上传头像：尚未提供 API，但可以发布到 `Special:UploadAvatar`（或其本地化等效项）。唯一需要的表单数据是 `avatar`，应将其设置为图像的数据 URI。
* 显示头像：此扩展提供了 MediaWiki 的 `avatar.php` 入口点。此入口点通过 302 重定向生成结果。这种方法用于在利用 MediaWiki 核心的同时最大化性能。目前有 4 个可用参数。
    * `user` 设置为要查询头像的用户
    * `res` 所需头像的首选分辨率。请注意，这只是提示，实际结果可能不是该分辨率。仅在设置了 `user` 时此参数才有效。
    * `ver` 附加到重定向位置字段的版本号。可用于绕过浏览器/CDN 缓存。
    * `nocache` 如果设置了此参数，则不会发出 `cache-control` 头。

