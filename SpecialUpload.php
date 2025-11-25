<?php
namespace Avatar;

use MediaWiki\MediaWikiServices;

class SpecialUpload extends \SpecialPage {

	public function __construct() {

		parent::__construct('UploadAvatar');
	}

	public function execute($par) {
		$this->requireLogin('prefsnologintext2');

		$this->setHeaders();
		$this->outputHeader();
		$request = $this->getRequest();

		if ($this->getUser()->getBlock()) {
			throw new \UserBlockedError($this->getUser()->getBlock());
		}

		if (!MediaWikiServices::getInstance()->getPermissionManager()->userHasRight($this->getUser(), 'avatarupload')) {
			throw new \PermissionsError('avatarupload');
		}

		global $wgMaxAvatarResolution;
		$this->getOutput()->addJsConfigVars('wgMaxAvatarResolution', $wgMaxAvatarResolution);
		$this->getOutput()->addModules('ext.avatar.uploadapp');

		if ($request->wasPosted()) {
			$this->processUpload();
		}
		else {
			$this->displayForm();
		}
	}

	private function processUpload() {
		$request = $this->getRequest();
		$out = $this->getOutput();
		$out -> disable();
		header( 'Content-Type: application/json' );
		$dataurl = $request->getVal('avatar');
		if (!$dataurl || parse_url($dataurl, PHP_URL_SCHEME) !== 'data') {
			http_response_code(500);
			echo json_encode( [ 'msg' => $this->msg('avatar-notuploaded')-> text() ] );
			exit;
		}

		$img = Thumbnail::open($dataurl);

		global $wgMaxAvatarResolution;

		switch ($img->type) {
		case IMAGETYPE_GIF:
		case IMAGETYPE_PNG:
		case IMAGETYPE_JPEG:
			break;
		default:
			http_response_code(500);
			echo json_encode( [ 'msg' => $this->msg('avatar-invalid')-> text() ] );
			exit;
		}

		// Must be square
		if ($img->width !== $img->height) {
			http_response_code(500);
			echo json_encode( [ 'msg' => $this->msg('avatar-notsquare')-> text() ] );
			exit;
		}

		// Check if image is too small
		if ($img->width < 32 || $img->height < 32) {
			http_response_code(500);
			echo json_encode( [ 'msg' => $this->msg('avatar-toosmall')-> text() ] );
			exit;
		}

		// Check if image is too big
		if ($img->width > $wgMaxAvatarResolution || $img->height > $wgMaxAvatarResolution) {
			http_response_code(500);
			echo json_encode( [ 'msg' => $this->msg('avatar-toolarge')-> text() ] );
			exit;
		}

		$results = $this->fileUpload($img, $dataurl);

		global $wgAvatarLogInRC;

		$logEntry = new \ManualLogEntry('avatar', 'upload');
		$logEntry->setPerformer($this->getUser());
		$logEntry->setTarget($this->getUser()->getUserPage());
		$logId = $logEntry->insert();
		$logEntry->publish($logId, $wgAvatarLogInRC ? 'rcandudp' : 'udp');

		header( 'Content-Type: application/json' );
		!$results[0] && http_response_code(500);
		echo json_encode( [ 'msg' => $results[0] ? $this->msg('upload-avatar-success')->text() : $results[1] ] );
	}

	public function fileUpload($img, $dataurl) {
		// 判断进oss存储逻辑
		global $wgMaxAvatarResolution;
		global $wgDefaultAvatarRes;
		global $wgAvatarEnableS3;
		if (!$wgAvatarEnableS3) {
			$user = $this->getUser();
			Avatars::deleteAvatar($user);

			// Avatar directories
			global $wgAvatarUploadDirectory;
			$uploadDir = $wgAvatarUploadDirectory . '/' . $this->getUser()->getId() . '/';
			@mkdir($uploadDir, 0755, true);

			// We do this to convert format to png
			$img->createThumbnail($wgMaxAvatarResolution, $uploadDir . 'original.png');

			// We only create thumbnail with default resolution here. Others are generated on demand
			$img->createThumbnail($wgDefaultAvatarRes, $uploadDir . $wgDefaultAvatarRes . '.png');

			$img->cleanup();

			return [true, 'avatar_success'];

		} else { 
			// OSS
			if (strpos($dataurl, 'data:image/') !== 0) {
				return [false, 'avatar_invalid'];
			}
			
			// 3. 去除 data:image/png;base64, 前缀
			OSSdispose::deleteOSS($this -> getUser()->getId());
			$base64Data = explode(',', $dataurl, 2)[1];
			$imgBinaryData = base64_decode($base64Data);
			$UpResultsA = OSSdispose::submitOSS($imgBinaryData, $this -> getUser()->getId());
			if ($UpResultsA['code']) {
				return [false, $UpResultsA['msg']];
			}
			$thumbnailImgBinaryData = $img -> getThumbnailImageBinaryData($wgDefaultAvatarRes);
			$UpResultsB = OSSdispose::submitOSS($thumbnailImgBinaryData, $this -> getUser()->getId(), $wgDefaultAvatarRes);
			if ($UpResultsB['code']) {
				return [false, $UpResultsB['msg']];
			}

			return [true, 'avatar_success'];
		}
	}

	public function displayForm() {
		global $wgScriptPath;

		$this->getOutput()->addHTML('<div id="msg"></div>');

		$this->getOutput()->addHTML('<div id="tips">' . $this->msg('uploadavatar-notice')->parseAsBlock() . '</div>');

		$this->getOutput()->addHTML('<div id="SpecialUploadApp"></div>');
	}

	public function isListed() {
		return false;
	}
}
