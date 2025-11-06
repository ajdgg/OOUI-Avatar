<?php
namespace Avatar;

class Avatars {

	public static function getLinkFor($username, $res = false) {
		global $wgScriptPath;
		global $wgAvatarEnableS3;
		$user = \MediaWiki\User\User::newFromName($username);
		// $path = "$wgScriptPath/extensions/Avatar/avatar.php?user=$username";
		$path = null;
		if ($wgAvatarEnableS3) {
			$path = OSSdispose::getOssImgUrl($user -> getId(), $res ? $res : 'original');
		} else {
			$path = "$wgScriptPath/extensions/Avatar/avatar.php?user=$username";
		}
		if ($res !== false && !$wgAvatarEnableS3) {
			return $path . '&res=' . $res;
		} else {
			return $path;
		}
	}

	public static function normalizeResolution($res) {
		if ($res === 'original') {
			return 'original';
		}
		$res = intval($res);

		global $wgAllowedAvatarRes;
		foreach ($wgAllowedAvatarRes as $r) {
			if ($res <= $r) {
				return $r;
			}
		}

		return 'original';
	}

	public static function getAvatar(\User $user, $res) {
		global $wgDefaultAvatarRes;
		global $wgAvatarEnableS3;
		$path = null;

		// If user exists
		if ($user && $user->getId()) {
			global $wgAvatarUploadDirectory;
			$avatarPath = "/{$user->getId()}/$res.png";

			if (!$wgAvatarEnableS3) {
				// Check if requested avatar thumbnail exists
				if (file_exists($wgAvatarUploadDirectory . $avatarPath)) {
					$path = $avatarPath;
				} else if ($res !== 'original') {
					// Dynamically generate upon request
					$originalAvatarPath = "/{$user->getId()}/original.png";
					if (file_exists($wgAvatarUploadDirectory . $originalAvatarPath)) {
						$image = Thumbnail::open($wgAvatarUploadDirectory . $originalAvatarPath);
						$image->createThumbnail($res, $wgAvatarUploadDirectory . $avatarPath);
						$image->cleanup();
						$path = $avatarPath;
					}
				}
			} else {
				// OSS
				$hFile = OSSdispose::CheckFileExist($user->getId(), $res);
				if (!$hFile['code']) {
					$path = OSSdispose::getOssImgUrl($user->getId(), $res);
				} else if ($hFile['code'] === 1 && $res !== 'original') {
					$BinData = OSSdispose::getImgBinData($user->getId(), $res);
					if (!$BinData['code']) {
					    return false;
					}
					$thumbnail = Thumbnail::generateThumbnailFromBinary($BinData['data'], $res);
					OSSdispose::submitOSS($thumbnail, $user->getId(), $res);
					$path = OSSdispose::getOssImgUrl($user->getId(), $res);
				}
			}
		}
		return $path;
	}

	public static function hasAvatar(\User $user) {
		global $wgDefaultAvatar;
		global $wgAvatarEnableS3;

		if (!$wgAvatarEnableS3) {
			return self::getAvatar($user, 'original') !== null;
		}

		return OSSdispose::CheckFileExist($user->getId(), 'original')['code'] === 0;
		
	}

	public static function deleteAvatar(\User $user) {
		global $wgAvatarUploadDirectory;
		global $wgAvatarEnableS3;

		if ($wgAvatarEnableS3) {
			$delResults = OSSdispose::deleteOSS($user->getId(), true);
			if (!$delResults['code']) {
				return [true, ''];
			}
			return [false, $delResults['msg']];
		}
		$dirPath = $wgAvatarUploadDirectory . "/{$user->getId()}/";
		if (!is_dir($dirPath)) {
			return [false, 'no_avatar_dir'];
		}
		$files = glob($dirPath . '*', GLOB_MARK);
		foreach ($files as $file) {
			unlink($file);
		}
		rmdir($dirPath);
		return [true, ''];
	}

}
