<script>
const { CdxButton, CdxSearchInput, CdxMessage, CdxDialog, CdxTextInput, CdxField } = require( '../codex.js' );

const view = require("ext.avatar.view");

module.exports = exports = {
    name: 'SpecialView',
    components: { 
        CdxButton,
        CdxSearchInput,
		CdxMessage,
        CdxDialog,
        CdxTextInput,
        CdxField
    },
    data() {
        return {
            msgType: 'notice',
			msgText: '',
			msgShow: false,
            deleteBtnShow: false,
            deleteBtnDisabled: false,
            user: '123',
            dialogShow: false,
            deleteInfoInput: '',
            deleteFun: null,
            MenuOption: mw.config.get('wgMenuOption')
        }
    },
    async mounted() {
        const isAvataradmin = await mw.user.getRights()
        this.deleteBtnShow = isAvataradmin.includes('avataradmin');
        this.deleteFun = view(this.Toolset());
    },
    methods: {
		Toolset() {
			return {
				setMsgBoxType: this.setMsgBoxType,
				setMsgBoxText: this.setMsgBoxText,
				setMsgBoxShow: this.setMsgBoxShow,
                addQueryInputValue: this.addQueryInputValue,
                getQueryInputValue: this.getQueryInputValue,
                changesDeleteBtnDisabled: this.changesDeleteBtnDisabled,
                controlDialogShow: this.controlDialogShow,
                getDeleteInfoInputValue: this.getDeleteInfoInputValue,
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
		},
        addQueryInputValue( value ) {
            this.user = value;
        },
        getQueryInputValue() {
            return this.user;
        },
        changesDeleteBtnDisabled( status ) {
            if ( this.deleteBtnDisabled !== status ) this.deleteBtnDisabled = status;
        },
        controlDialogShow( status ) {
            if ( this.dialogShow !== status ) this.dialogShow = status;
        },
        getDeleteInfoInputValue() {
            return this.deleteInfoInput;
        },
        k() {
            console.log('dismissed');
            this.msgShow = false;
        }
    }
}
</script>

<template>
    <cdx-message :type="msgType" v-if="msgShow" dismiss-button-label="Close" @user-dismissed="k">{{ msgText }}</cdx-message>
    <div class="query-avatar-area" style="display: flex;">
        <form autocomplete="off" class="query-input-box">
            <label for="query-input">{{ $i18n('viewavatar-username').text() }}</label>
            <div style="display: flex;">
                <cdx-search-input class="avatar-nameinput" v-model="user" use-button />
            </div>
            <div class="result-box" v-if="MenuOption">
                <ul id="result"></ul>
            </div>
        </form>
        <cdx-button v-if="deleteBtnShow" :disabled="deleteBtnDisabled" @click="dialogShow = true" action="progressive" weight="primary">{{ $i18n('viewavatar-delete-submit').text() }}</cdx-button>
    </div>
    <cdx-dialog 
        v-model:open="dialogShow"
        :title="$i18n('viewavatar-delete-legend').text()"
    >   
        <cdx-field class="avatar-del-label">
            <template #label>
                {{ $i18n('viewavatar-delete-reason').text() }}
            </template>
            <cdx-text-input v-model="deleteInfoInput" />
        </cdx-field>
        <template #footer>
            <div class="dialog-footer">
                <cdx-button @click="controlDialogShow(false)">{{ $i18n('cancel-avatarupload').text() }}</cdx-button>
                <cdx-button @click="deleteFun()" action="progressive" weight="primary">{{ $i18n('viewavatar-delete-submit').text() }}</cdx-button>
            </div>
        </template>
    </cdx-dialog>
</template>