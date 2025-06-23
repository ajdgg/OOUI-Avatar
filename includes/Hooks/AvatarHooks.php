<?php
namespace Avatar;

use MediaWiki\Parser\Parser;
use MediaWiki\Html\Html;
use MediaWiki\User\User;

class AvatarHooks {

    public static function onParserFirstCallInit( Parser $parser ) {
        $parser->setFunctionHook( 'Avatar', 'Avatar\AvatarHooks::renderAvatar' );
    }

    public static function renderAvatar( Parser $parser, ...$value) {

        $user = User::newFromName($value[0]);
        $src = '/images/avatars' . Avatars::getAvatar( $user, 256);
        $html = Html::element( 'img', [
            'src' => $src,
            'alt' => 'Avatar',
            'width' => isset($value[1]) ? $value[1] : '',
            'height' => isset($value[2]) ? $value[2] : '',
        ]);

        return [ $html, 'noparse' => true, 'isHTML' => true ];
    }
}