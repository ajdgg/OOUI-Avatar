<?php
namespace Avatar;

use MediaWiki\Html\Html;
use MediaWiki\MediaWikiServices;
use OOUI;

use Avatar\OSSdispose;

class SpecialUpload extends \SpecialPage {

	public function __construct() {

		parent::__construct('UploadAvatar');
	}

	public function execute($par) {
		$this->requireLogin('prefsnologintext2');

		OOUI\Theme::setSingleton(new OOUI\WikimediaUITheme);
		OOUI\Element::setDefaultDir('rtl');

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
		$this->getOutput()->addModules('ext.avatar.upload');

		if ($request->wasPosted()) {
			if ($this->processUpload()) {
				$this->getOutput()->redirect(\SpecialPage::getTitleFor('Preferences')->getLinkURL());
			}
		} else {
			$this->displayMessage('');
		}
		$this->displayForm();
	}

	private function displayMessage($msg) {
		$infoBox = new OOUI\MessageWidget(
			[
				'type' => 'error',
				'infusable' => true,
				'id' => 'errorMsg',
				'label' => $msg,
				'data' => [
					'data-ooui' => json_encode([
						'type' => 'error',
						'label' => $msg
					])
				]
			]
		);
		$this->getOutput()->addHTML($infoBox);
	}

	private function processUpload() {
		$request = $this->getRequest();
		$dataurl = $request->getVal('avatar');
		if (!$dataurl || parse_url($dataurl, PHP_URL_SCHEME) !== 'data') {
			$this->displayMessage($this->msg('avatar-notuploaded'));
			return false;
		}

		$img = Thumbnail::open($dataurl);

		global $wgMaxAvatarResolution;

		switch ($img->type) {
		case IMAGETYPE_GIF:
		case IMAGETYPE_PNG:
		case IMAGETYPE_JPEG:
			break;
		default:
			$this->displayMessage($this->msg('avatar-invalid'));
			return false;
		}

		// Must be square
		if ($img->width !== $img->height) {
			$this->displayMessage($this->msg('avatar-notsquare'));
			return false;
		}

		// Check if image is too small
		if ($img->width < 32 || $img->height < 32) {
			$this->displayMessage($this->msg('avatar-toosmall'));
			return false;
		}

		// Check if image is too big
		if ($img->width > $wgMaxAvatarResolution || $img->height > $wgMaxAvatarResolution) {
			$this->displayMessage($this->msg('avatar-toolarge'));
			return false;
		}

		// 判断进oss存储逻辑
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

			$this->displayMessage($this->msg('avatar-saved'));

		} else {
			// OSS
			if (strpos($dataurl, 'data:image/') !== 0) {
				$this->displayMessage($this->msg('avatar-invalid'));
				return false;
			}
			
			// 3. 去除 data:image/png;base64, 前缀
			OSSdispose::deleteOSS($this -> getUser()->getId());
			$base64Data = explode(',', $dataurl, 2)[1];
			$imgBinaryData = base64_decode($base64Data);
			$UpResultsA = OSSdispose::submitOSS($imgBinaryData, $this -> getUser()->getId());
			if ($UpResultsA['code']) {
				$this->displayMessage($UpResultsA['msg']);
				return false;
			}
			$thumbnailImgBinaryData = $img -> getThumbnailImageBinaryData($wgDefaultAvatarRes);
			$UpResultsB = OSSdispose::submitOSS($thumbnailImgBinaryData, $this -> getUser()->getId(), $wgDefaultAvatarRes);
			if ($UpResultsB['code']) {
				$this->displayMessage($UpResultsB['msg']);
				return false;
			}
		}

		global $wgAvatarLogInRC;

		$logEntry = new \ManualLogEntry('avatar', 'upload');
		$logEntry->setPerformer($this->getUser());
		$logEntry->setTarget($this->getUser()->getUserPage());
		$logId = $logEntry->insert();
		$logEntry->publish($logId, $wgAvatarLogInRC ? 'rcandudp' : 'udp');

		return true;
	}

	public function displayForm() {

		$inputAvatar = Html::hidden('avatar', '', ['id' => 'avatar']);
		$customWidget = new OOUI\Widget([
			'content' => [
				new OOUI\HtmlSnippet('<p id="avatar-error"></p>'),
				new OOUI\HtmlSnippet($inputAvatar),
				new OOUI\HtmlSnippet('<div id="crop"></div>')
			]
		]);

		$pickfile = new OOUI\ButtonWidget([
			'label' => $this->msg('uploadavatar-selectfile')->text(),
			'id' => 'pickfile',
		]);

		$submit = new OOUI\ButtonInputWidget([
			'label' => $this->msg('uploadavatar-submit')->text(),
			'type' => 'submit',
			'id' => 'submit',
			'disabled' => 'disabled',
			'useInputTag' => true,
			'infusable' => true,
			'flags' => [
				'primary',
				'progressive'
			],
			'data' => [
				'data-ooui' => json_encode([
					'type' => 'submit',
					'label' => $this->msg('uploadavatar-submit')->text()
				])
			]
		]);

		$as = new OOUI\FormLayout([
			'id' => 'avatar-form',
			'method' => 'post',
			'action' => $this->getPageTitle()->getLinkURL(),
			'classes' => ['avatar-form'],
			'items' => [
				$customWidget,
				$pickfile,
				$submit,
			]
		]);
		$this->getOutput()->addWikiMsg('uploadavatar-notice');
		$this->getOutput()->addHTML($as);

	}

	public function isListed() {
		return false;
	}
}
