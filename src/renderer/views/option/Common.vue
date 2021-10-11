<template>
  <div class="options-container px-2 pb-2 scroll-y">
    <i-form ref="form" class="mt-1" :model="form" :rules="rules">
      <i-form-item prop="ssrPath" :label="$t('UI_SETTING_SSR_PYTHON_DIR')">
        <i-input
          v-model="form.ssrPath"
          :placeholder="$t('UI_SETTING_SSR_INPUT_PLACEHOLDER')"
          @on-change="changeSSRPath"
          style="width:200px; margin-right:8px;"
        />
        <i-button type="primary" @click="selectPath">{{$t('UI_SETTING_SELECT_SSR_PYTHON_DIR')}}</i-button>
      </i-form-item>
      <div class="flex flex-jc-between">
        <i-form-item class="flex" :label="$t('UI_SETTING_AUTO_START')">
          <i-checkbox v-model="form.autoLaunch" @on-change="update('autoLaunch')" />
        </i-form-item>
        <i-form-item class="flex"  :label="$t('UI_SETTING_HIDE_WINDOW')">
          <i-checkbox v-model="form.hideWindow" @on-change="update('hideWindow')" />
        </i-form-item>
        <i-form-item class="flex"  :label="$t('UI_SETTING_SHARE_LAN')">
          <i-checkbox v-model="form.shareOverLan" @on-change="update('shareOverLan')" />
        </i-form-item>
      </div>
      <div class="flex flex-jc-between">
        <i-form-item class="flex" :label="$t('UI_SETTING_PAC_PORT')">
          <i-input-number
            v-model="form.pacPort"
            :min="0"
            :max="65535"
            @on-change="update('pacPort')"
          />
        </i-form-item>
        <i-form-item class="flex" :label="$t('UI_SETTING_LOCAL_LISTEN_PORT')">
          <i-input-number
            v-model="form.localPort"
            :min="0"
            :max="65535"
            @on-change="update('localPort')"
          />
        </i-form-item>
        <i-form-item class="flex" :label="$t('UI_SETTING_HTTP_PORT')">
          <i-input-number
            v-model="form.httpProxyPort"
            :min="0"
            :max="65535"
            @on-change="update('httpProxyPort')"
          />
        </i-form-item>
        <i-form-item class="flex" :label="$t('UI_SETTING_PREFER_HTTP')">
          <i-checkbox v-model="form.preferHTTPGlobal" :disabled="diabledPreferSwitch" @on-change="update('preferHTTPGlobal')" />
        </i-form-item>
      </div>
      <i-form-item prop="lang" label="Language">
        <i-select v-model="form.lang" class="language-selector-view" @input="update('lang')">
          <i-option value="zh-CN">简体中文</i-option>
          <i-option value="en-US">English</i-option>
        </i-select>
      </i-form-item>
    </i-form>
  </div>
</template>
<script>
import { mapActions } from 'vuex'
import { isSSRPathAvaliable, debounce } from '@/shared/utils'
import { openDialog } from '@/renderer/ipc'
import i18n from '@/renderer/i18n'
import { isWin } from '@/shared/env'
export default {
  data () {
    const appConfig = this.$store.state.appConfig
    return {
      form: {
        ssrPath: appConfig.ssrPath,
        autoLaunch: appConfig.autoLaunch,
        hideWindow: appConfig.hideWindow,
        shareOverLan: appConfig.shareOverLan,
        localPort: appConfig.localPort,
        pacPort: appConfig.pacPort,
        httpProxyPort: appConfig.httpProxyPort,
        lang: appConfig.lang,
        preferHTTPGlobal: isWin ? true : appConfig.preferHTTPGlobal === 1
      },
      rules: {
        ssrPath: [
          {
            validator: (_, value) => {
              return isSSRPathAvaliable(value).then(exists => {
                if (exists) {
                  return Promise.resolve()
                }
                return Promise.reject(
                  new Error(this.$t('UI_INCORRECT_FOLDER'))
                )
              })
            }
          }
        ]
      },
      diabledPreferSwitch: isWin
    }
  },
  watch: {
    'appConfig.ssrPath' (v) {
      this.ssrPath = v
    },
    'appConfig.autoLaunch' (v) {
      this.autoLaunch = v
    },
    'appConfig.shareOverLan' (v) {
      this.shareOverLan = v
    },
    'appConfig.localPort' (v) {
      this.localPort = v
    },
    'appConfig.pacPort' (v) {
      this.pacPort = v
    }
  },
  methods: {
    ...mapActions(['updateConfig']),
    changeSSRPath () {
      this.$refs.form.validate(valid => {
        if (valid) {
          this.updateConfig({ ssrPath: this.form.ssrPath })
        }
      })
    },
    // 选择目录
    async selectPath () {
      const path = await openDialog({
        properties: ['openDirectory']
      })
      if (path && path.length) {
        this.form.ssrPath = path[0]
        this.$refs.form.validate(valid => {
          if (valid) {
            this.updateConfig({ ssrPath: this.form.ssrPath })
          }
        })
      }
    },
    update: debounce(function (field) {
      if (field === 'preferHTTPGlobal') {
        this.updateConfig({ [field]: this.form[field] ? 1 : 0 })
        return
      }
      if (this.form[field] !== this.$store.state.appConfig[field]) {
        this.updateConfig({ [field]: this.form[field] })
        if (field === 'lang') {
          i18n.locale = this.form[field]
        }
      }
    }, 1000)
  }
}
</script>
<style lang="stylus" scoped>
.language-selector-view {
  width: 180px;
}
</style>
