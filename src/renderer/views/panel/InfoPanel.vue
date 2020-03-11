<template>
  <div class="info-panel">
    <SSRNodeForm v-show="!displaySSR&&!editingGroup.show" class="flex-1 mx-1"/>
    <ssr-group v-show="inGroupNode" class="flex-1 ml-1"/>
    <ssr-qrcode v-show="displaySSR&&!inGroupNode"/>
    <div class="control-panel">
      <i-button class="w-6r" type="error" @click="removeClick" :disabled="buttonState">{{$t('UI_DELETE')}}</i-button>
      <i-button class="w-6r ml-3" type="primary" @click="save">{{$t('UI_SAVE')}}</i-button>
      <i-checkbox class="ml-3" v-model="displaySSR">{{$t('UI_DISPLAY_QRCODE')}}</i-checkbox>
    </div>
  </div>
</template>

<script>
import SSRNodeForm from '@/renderer/components/form/SSRNodeForm'
import SsrGroup from '@/renderer/components/form/SSRGroupForm'
import SsrQrcode from '@/renderer/components/node/SSRQrcode'
import { mapState, mapGetters, mapActions } from 'vuex'
import { isValidSSRConfig } from '@/shared/ssr'

export default {
  components: {
    SSRNodeForm,
    SsrGroup,
    SsrQrcode
  },
  data () {
    return {
      displaySSR: false
    }
  },
  computed: {
    ...mapState(['editingGroup', 'appConfig', 'editingConfig']),
    ...mapGetters(['isEditingConfigUpdated', 'configs', 'buttonState']),
    inGroupNode () {
      return this.editingGroup && this.editingGroup.show && this.editingGroup.title
    }
  },
  methods: {
    ...mapActions(['removeEditingNode', 'renameEditingGroup', 'removeEditingGroup', 'saveEditingNode']),
    save () {
      if (this.inGroupNode) {
        this.renameEditingGroup()
      } else {
        if (isValidSSRConfig(this.editingConfig)) {
          this.saveEditingNode()
        } else {
          window.alert('服务器配置信息不完整')
        }
      }
    },
    removeClick () {
      if (!this.inGroupNode) {
        this.removeEditingNode()
      } else {
        this.removeEditingGroup()
      }
    }
  }
}
</script>

<style scoped>
  .info-panel {
    width: 50%;
    height: 100%;
    position: relative;
  }

  .control-panel {
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    bottom: 0px;
    width: 100%;
  }
</style>
