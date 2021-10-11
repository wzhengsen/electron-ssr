<template>
  <app-view name="setup" class="px-2">
    <template v-if="(autoDownload || manualDownload) && !autoError">
      <i-spin />
      <p class="text-center mt-1">
        {{$t('UI_DOWNLOADING_FOR_YOU')}}
        <dot></dot>
      </p>
    </template>
    <div v-else class="flex flex-column flex-ai-center w-100">
      <div class="flex flex-ai-center w-100 flex-jc-center">
        <i-button
          type="primary"
          @click="restart"
        >{{autoError ? $t('UI_CLICK_TO_RETRY') : $t('UI_AUTO_DOWNLOAD')}}</i-button>
        <span class="mx-2">OR</span>
        <div>
          <i-form ref="form" class="flex-1" :model="form" :rules="rules">
            <i-form-item prop="ssrPath" style="margin-bottom:0">
              <i-button type="primary" @click="selectPath">{{$t('UI_SELECT_MANAULLY')}}</i-button>
              <i-input
                v-model="form.ssrPath"
                readonly
                :placeholder="$t('UI_LOCAL_PY_FILE_REQUIRED')"
                style="width:200px;margin-left:8px;"
              />
            </i-form-item>
          </i-form>
        </div>
      </div>
    </div>
  </app-view>
</template>
<script>
import { ipcRenderer } from 'electron'
import { join } from 'path'
import { mapState, mapMutations } from 'vuex'
import { openDialog } from '../ipc'
import { isSSRPathAvaliable } from '@/shared/utils'
import { STORE_KEY_AUTO_DOWNLOAD } from '../constants'
import {
  EVENT_SSR_DOWNLOAD_RENDERER,
  EVENT_SSR_DOWNLOAD_MAIN
} from '@/shared/events'
import Dot from '../components/Dot'

export default {
  data () {
    return {
      autoDownload: localStorage.getItem(STORE_KEY_AUTO_DOWNLOAD) === '1',
      // 手动下载
      manualDownload: false,
      // 自动模式下载出错
      autoError: '',
      form: {
        ssrPath: ''
      },
      rules: {
        ssrPath: [
          { required: true, message: this.$t('UI_PLEASE_SELECT_SS_FOLDER') },
          {
            validator: (_, value) => {
              return isSSRPathAvaliable(value).then(exists => {
                if (exists) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error(this.$t('UI_INCORRECT_FOLDER')))
              })
            }
          }
        ]
      }
    }
  },
  computed: {
    ...mapState(['meta'])
  },
  components: {
    Dot
  },
  watch: {
    autoError (v) {
      if (v) {
        this.$Message.error({
          content: v,
          duration: 0
        })
      } else {
        this.$Message.destroy()
      }
    }
  },
  methods: {
    ...mapMutations(['updateConfig']),
    restart () {
      this.autoError = ''
      this.autoStart()
    },
    // 自动模式
    autoStart () {
      this.manualDownload = true
      this.autoError = ''
      const self = this

      function callback (e, errMessage) {
        console.log('download ssr result', e, errMessage)
        ipcRenderer.removeListener(EVENT_SSR_DOWNLOAD_MAIN, callback)
        if (errMessage) {
          self.autoError = errMessage
        } else {
          self.$nextTick(() => {
            // 需要在下载目录后追加shadowsocks子目录
            self.setup(join(self.meta.defaultSSRDownloadDir, 'shadowsocks'))
          })
        }
      }

      ipcRenderer.send(EVENT_SSR_DOWNLOAD_RENDERER)
      ipcRenderer.on(EVENT_SSR_DOWNLOAD_MAIN, callback)
    },
    // 选择目录
    async selectPath () {
      this.manualDownload = false
      const path = await openDialog({
        properties: ['openDirectory']
      })
      if (path && path.length) {
        this.form.ssrPath = path[0]
        this.$refs.form.validate(valid => {
          if (valid) {
            this.setup()
          }
        })
      }
    },
    // 完成初始化
    setup (ssrPath) {
      this.$Message.destroy()
      this.updateConfig([{ ssrPath: ssrPath || this.form.ssrPath }, true])
      this.$emit('finished')
    }
  },
  created () {
    if (this.autoDownload) {
      this.autoStart()
    }
  }
}
</script>
<style lang="stylus">
@import '../assets/styles/variable';

.view-setup {
  .ivu-spin-dot {
    width: 48px;
    height: @width;
  }
}
</style>
