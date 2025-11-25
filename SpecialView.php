<?php
namespace Avatar;

use MediaWiki\MediaWikiServices;


class SpecialView extends \SpecialPage {

	public function __construct() {
		parent::__construct('ViewAvatar');
	}
    public function delAvatarlog($userObj, $opt) {
        global $wgAvatarLogInRC;
        $logEntry = new \ManualLogEntry('avatar', 'delete');
        $logEntry->setPerformer($this->getUser());
        $logEntry->setTarget($userObj->getUserPage());
        $logEntry->setComment($opt->getValue('reason'));
        $logId = $logEntry->insert();
        $logEntry->publish($logId, $wgAvatarLogInRC ? 'rcandudp' : 'udp');
    }
	public function execute($par) {

		// Shortcut by using $par
		if ($par) {
			$this->getOutput()->redirect($this->getPageTitle()->getLinkURL(array(
				'user' => $par,
			)));
			return;
		}

		$this->setHeaders();
		$this->outputHeader();

		// Parse options
		$opt = new \FormOptions;
		$opt->add('user', '');
		$opt->add('delete', '');
		$opt->add('reason', '');
		$opt->add('q', '');
		$opt->fetchValuesFromRequest($this->getRequest());
		$user = $opt->getValue('user');
		$q = $opt->getValue('q');


		$users = $user ? $user : $q;

		$userObj = \User::newFromName($users);
		$userExists = $userObj && $userObj->getId() !== 0;
		$haveAvatar = $userObj && Avatars::hasAvatar($userObj);
		
		// Parse user
		// 在拥有q参数时，返回用户是否有头像，并终止脚本执行
		if ($q) {
			header( 'Content-Type: application/json' );
			$out = $this->getOutput();
			$out -> disable();
			if (!$userExists) {
				echo json_encode([ 'code' => '50001', 'msg' => $this -> msg('viewavatar-nouser') -> text()]);
				exit;
			}
			
			echo json_encode([
				'code' => '20000', 
				'avatar' => $haveAvatar ? "true" : "false", 
				'msg' => $haveAvatar ? $this -> msg('uploadavatar-nofile') -> text() : $this -> msg('viewavatar-noavatar') -> text()
			]);
			exit;
		}
		
		

		// If current task is delete and user is not allowed
		$canDoAdmin = MediaWikiServices::getInstance()->getPermissionManager()->userHasRight($this->getUser(), 'avataradmin');
		if ($opt->getValue('delete')) {
			header( 'Content-Type: application/json' );
			$out = $this->getOutput();
			$out -> disable();
			if (!$canDoAdmin) {
				echo json_encode([
					'code' => '50002',
					'msg' => $this -> msg('viewavatar-insufficient-permissions') -> text()
				]);
				exit;
			}
			// Delete avatar if the user exists
			if (!$userExists) {
				echo json_encode([ 'code' => '50001', 'msg' => $this -> msg('viewavatar-nouser') -> text()]);
				exit;
			}

			$deleteAvatar = Avatars::deleteAvatar($userObj);
			if (!$deleteAvatar[0]) {
				echo json_encode([ 'code' => '50003', 'msg' => $deleteAvatar[1]]);
				exit;
			}

			$this -> delAvatarlog( $userObj, $opt);
			echo json_encode([ 'code' => '20000', 'msg' => $this -> msg('delete-avatar-success') -> text()]);
		}

		$this->getOutput()->addModules(array('mediawiki.userSuggest'));
		$this->getOutput()->addModules('ext.avatar.viewapp');

		if (!$opt->getValue('delete')) {
			$this -> showInterface($user, $users, $canDoAdmin, $haveAvatar, $userObj, $userExists);
		}
	}

	private function showInterface($user, $users, $canDoAdmin, $haveAvatar, $userObj, $userExists) {
		global $wgScriptPath;
		global $wgDefaultAvatar;
		global $wgMenuOption;
		$this->getOutput()->addJsConfigVars('wgDefaultAvatar', $wgDefaultAvatar);
		$this->getOutput()->addJsConfigVars('wgMenuOption', $wgMenuOption);
		$this->showForm($users, $canDoAdmin, $haveAvatar);

		$state = 'no_avatar';
		if (!$userObj) {
			$state = 'invalid_object';
		} elseif (!$userExists) {
			$state = 'user_not_exists';
		} elseif ($haveAvatar) {
			$state = 'has_avatar';
		}

		$message = '';
		switch ($state) {
			case 'invalid_object':
				break;
			case 'user_not_exists':
				$message = $this->msg('viewavatar-nouser')->text();
				break;
			case 'has_avatar':
				$message = $this->msg('viewavatar-avatar-preview-tips', $users)->text();
				break;
			case 'no_avatar':
				$message = $this->msg('viewavatar-noavatar')->text();
				break;
		}

		$this->getOutput()-> addHTML('
		<div>
			<img id="avatar-preview" alt="avatar" style="display:' . ($user && $userExists && $haveAvatar ? 'block' : 'none') . ';width: 100%;height: 100%;" src="' . ($user && $userExists && $haveAvatar ? $wgScriptPath . '/extensions/Avatar/avatar.php?user=' . $user .'&amp;res=original&amp;nocache&amp;ver='. strtolower(dechex(floor(time()))) : '') . '" />
			<span class="avatar-preview-tips">' . $message . '</span>
		</div>
		');
	}

	private function showForm($users, $canDoAdmin, $haveAvatar) {
		$this->getOutput()->addHTML('<div id="SpecialViewApp"></div>');
	}
}
