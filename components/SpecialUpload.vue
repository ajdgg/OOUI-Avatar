<script>
const { CdxButton, CdxIcon, CdxMessage } = require( '../codex.js' );
const icons = require( './icons.json');

const upload = require("ext.avatar.upload");

module.exports = exports = {
    name: 'SpecialUpload',
    components: { 
        CdxButton,
        CdxIcon,
		CdxMessage,
    },
    data() {
        return {
            mw,
            icons,
			msgType: 'notice',
			msgText: '',
			msgShow: false,
        };
    },
    props: {
        icon: {
			type: [ String, Object ],
			default: ''
		},
		language: {
			type: String,
			default: 'cn'
		},
		size: {
			type: String,
			default: 'medium'
		}
	},
	mounted() {
		upload(this.Toolset());
	},
	methods: {
		Toolset() {
			return {
				setMsgBoxType: this.setMsgBoxType,
				setMsgBoxText: this.setMsgBoxText,
				setMsgBoxShow: this.setMsgBoxShow
			}
		},
		setMsgBoxType( msgboxtype ) {
			this.msgType = msgboxtype;
		},
		setMsgBoxText( msgboxtext ) {
			this.msgText = msgboxtext;
		},
		setMsgBoxShow( msgboxshow ) {
			if ( this.msgShow !== msgboxshow ) this.msgShow = msgboxshow;
		}
	}
}
</script>

<template>
	<Teleport to="#msg">
		<cdx-message :type="msgType" v-if="msgShow">{{ msgText }}</cdx-message>
	</Teleport>
    <div id="avatar-presentation-region">
        <cdx-button  id="upload-avatar-btn">
            <cdx-icon
                :icon="icons.cdxIconUpload"
                :size="size"
                :lang="language"
            ></cdx-icon>
			{{ $i18n('action-avatarupload').text() }}
		</cdx-button>
        <i style="margin: 0 1rem;"></i>
        <div id="avatar-presentation">
            <img class="current-avatar" :alt="$i18n('uploadavatar-nofile').text()" :src=" mw.config.get('wgScriptPath') + '/extensions/Avatar/avatar.php?user=' + mw.user.id() + '&amp;res=original&amp;nocache&amp;ver=' + Math.floor(Date.now() / 1000).toString(16)" />
            <span>{{ $i18n('uploadavatar-nofile').text() }}</span>
        </div>
    </div>
    <div id="clipping-area" style="display: none;">
			<div id="clipping-function-area">
				<div id="crop">
					<canvas id="avatar-canvas"></canvas>
					<div id="cropper" class="cropper" name="cropper" >
						<div class="up"></div>
						<div class="down"></div>
						<div class="left"></div>
						<div class="right"></div>
						<div class="tl-resizer"></div>
						<div class="tr-resizer"></div>
						<div class="bl-resizer"></div>
						<div class="br-resizer"></div>
						<div class="x"></div>
						<div class="y"></div>
					</div>
				</div>
			</div>
			<i style="margin: 0 1rem;"></i>
			<div class="avatar-preview-region">
				<div id="avatar-preview">
					<canvas id="avatar-preview-canvas"></canvas>
					<span>{{ $i18n('preview-avatar').text() }}</span>
				</div>
				<div class="function-button-area"> 
                    <cdx-button action="progressive" weight="primary" id="determine-upload-btn">{{ $i18n('action-avatarupload').text() }}</cdx-button>
                    <cdx-button id="reselect-the-avatar">{{ $i18n('reselect-the-avatar').text() }}</cdx-button>
                    <cdx-button id="cancel-avatarupload">{{ $i18n('cancel-avatarupload').text() }}</cdx-button>
				</div>
			</div>
		</div>
</template>

<style lang="less">
#SpecialUploadVue {
	margin: 2rem 0;
}
</style>