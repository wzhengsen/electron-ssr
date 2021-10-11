<template>
  <app-view name="feature">
    <h1>{{$t('UI_ELECTRON_SSR_NAME')}}</h1>
    <i-row type="flex" :gutter="24" class="mt-64">
      <i-col class="col flex flex-column flex-ai-center flex-jc-center">
        <icon-cross/>
        <b class="font-18 my-1">{{$t('UI_FEATURE_CROSS_PLATFORM')}}</b>
        <p>{{$t('UI_FEATURE_CP_DETAIL')}}</p>
      </i-col>
      <i-col class="col flex flex-column flex-ai-center flex-jc-center">
        <icon-functions/>
        <b class="font-18 my-1">{{$t('UI_FEATURE_FULL_FEATURES')}}</b>
        <p>{{$t('UI_FEATURE_FF_DETAIL')}}</p>
      </i-col>
      <i-col class="col flex flex-column flex-ai-center flex-jc-center">
        <icon-open/>
        <b class="font-18 my-1">{{$t('UI_FEATURE_OPEN_SOURCE')}}</b>
        <p>{{$t('UI_FEATURE_OS_DETAIL')}}</p>
      </i-col>
    </i-row>
    <div class="flex flex-ai-center mt-64">
      <i-checkbox v-model="autoDownload" @on-change="updateAutoDownload">{{$t('UI_AUTO_DOWNLOAD_SSR')}}</i-checkbox>
      <i-tooltip placement="top" :content="$t('UI_AUTO_DOWNLOAD_SSR_IF_CHECKED')">
        <i-icon color="#495060" type="ios-help-circle-outline" style="vertical-align:text-bottom;"></i-icon>
      </i-tooltip>
    </div>
    <i-button type="primary" class="w-6r mt-1" @click="done">{{$t('UI_UNDERSTAND')}}</i-button>
  </app-view>
</template>
<script>
import IconCross from '../assets/icon_cross_platform.svg'
import IconFunctions from '../assets/icon_functions.svg'
import IconOpen from '../assets/icon_open_source.svg'
import { STORE_KEY_FEATURE, STORE_KEY_AUTO_DOWNLOAD } from '../constants'
export default {
  data () {
    return {
      autoDownload: true
    }
  },
  components: {
    IconCross, IconFunctions, IconOpen
  },
  methods: {
    updateAutoDownload (v) {
      localStorage.setItem(STORE_KEY_AUTO_DOWNLOAD, v ? '1' : '0')
    },
    done () {
      localStorage.setItem(STORE_KEY_FEATURE, 'read')
      this.$emit('finished')
    }
  },
  created () {
    this.updateAutoDownload(true)
  }
}
</script>
<style lang="stylus">
@import '../assets/styles/variable.styl'
.view-feature
  .mt-64
    margin-top 64px
  .col
    width 240px
  svg
    width 40px
    height 40px
    > path
      fill $color-primary
</style>
