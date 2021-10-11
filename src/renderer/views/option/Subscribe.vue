<template>
  <div class="options-container px-2 pb-2 scroll-y">
    <div class="flex pb-1">
      <i-button type="primary" class="w-6r" @click="onCreate">{{$t('UI_ADD')}}</i-button>
      <i-button type="primary" class="w-6r ml-1" :disabled="selectedRows.length<1" @click="update">{{$t('UI_UPDATE')}}</i-button>
      <i-button type="warning" class="w-6r ml-1" @click="remove" :disabled="selectedRows.length<1">{{$t('UI_DELETE')}}</i-button>
      <div class="ml-auto flex-inline flex-ai-center">
        <i-input v-show="showNewUrl" class="mr-2 url-input" :class="{'input-error': urlError}"
          v-model="url" :placeholder="$t('UI_ENTER_VALID_URL')" icon="plus" ref="input"
          @keyup.enter.native="saveInput" @keyup.esc.native="cancelInput" @on-blur="cancelInput"/>
        <i-checkbox :value="appConfig.autoUpdateSubscribes" @on-change="onUpdateChange">{{$t('UI_SETTING_UPDATE_AUTO')}}</i-checkbox>
        <div v-if="appConfig.autoUpdateSubscribes" class="flex-inline flex-ai-center cycle-wrapper">
          <span>{{$t('UI_PER')}}&nbsp;</span>
          <i-input :value="cycle.number" :maxlength="2" number @input="onChangeCycleNumber"/>
          <i-select :value="cycle.unit" @input="onChangeCycleUnit">
            <i-option value="hour">{{$t('UI_PER_HOUR')}}</i-option>
            <i-option value="day">{{$t('UI_PER_DAY')}}</i-option>
            <i-option value="week">{{$t('UI_PER_WEEK')}}</i-option>
          </i-select>
        </div>
      </div>
    </div>
    <i-table stripe border :columns="columns" :data="tableData" size="small"
      :loading="loading" :no-data-text="$t('UI_NO_SUBS')" height="252"
      @on-selection-change="selectRows" @on-row-dblclick="onRowDBClick"></i-table>
  </div>
</template>
<script>
import { mapState, mapMutations, mapActions } from 'vuex'
import { isSubscribeContentValid } from '@/shared/utils'
import { saveUpdateTime } from '@/renderer/ipc'

const URL_REGEX = /^https?:\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/
// 单位对应的小时倍数
const unitMap = {
  hour: 1,
  day: 24,
  week: 168
}
export default {
  data () {
    return {
      url: '',
      showNewUrl: false,
      urlError: false,
      loading: false,
      columns: [
        { type: 'selection', width: 54, align: 'center' },
        { title: this.$t('UI_SUBSCRIPTION_URL'),
          key: 'URL',
          render: (h, params) => {
            const self = this
            const isEditing = params.index === this.editingRowIndex
            let element
            if (isEditing) {
              element = h('i-input', {
                ref: 'url',
                props: {
                  value: this.editingRowUrl,
                  placeholder: this.$t('UI_ENTER_NEW_SUB_URL')
                },
                attrs: {
                  id: 'editing-input'
                },
                on: {
                  'on-blur' () {
                    self.cancelEditing()
                  }
                },
                nativeOn: {
                  keyup (e) {
                    if (e.keyCode === 13) {
                      const url = self.editingRowUrl
                      // 未发生改变
                      if (url === self.appConfig.serverSubscribes[params.index].URL) {
                        self.cancelEditing()
                        return
                      }
                      self.loading = true
                      if (URL_REGEX.test(url)) {
                        self.requestSubscribeUrl(url).then(res => {
                          self.loading = false
                          const [groupCount, groupConfigs] = isSubscribeContentValid(res)
                          if (groupCount > 0) {
                            const clone = self.appConfig.serverSubscribes.slice()
                            clone.splice(params.index, 1)
                            let groups = ''
                            let configs = []
                            for (const groupName in groupConfigs) {
                              groups = groups + groupName + '|'
                              configs = configs.concat(groupConfigs[groupName])
                            }
                            clone.splice(params.index, 0, { URL: url, Group: groups.slice(0, -1) })
                            self.updateConfig({
                              serverSubscribes: clone,
                              configs: self.appConfig.configs.concat(configs)
                            })
                          }
                        }).catch(() => {
                          self.loading = false
                        })
                        self.cancelEditing()
                      } else {
                        self.editingUrlError = true
                      }
                    } else if (e.keyCode === 27) {
                      self.cancelEditing()
                    }
                  }
                }
              })
            } else {
              element = params.row.URL
            }
            return h('div', [element])
          }
        },
        { title: this.$t('UI_GROUP_NAME'), key: 'Group', width: 320 }
      ],
      selectedRows: [],
      editingRowIndex: -1,
      editingRowUrl: '',
      editingUrlError: false
    }
  },
  computed: {
    ...mapState(['appConfig']),
    tableData () {
      return this.appConfig.serverSubscribes
    },
    cycle () {
      const interval = this.appConfig.subscribeUpdateInterval
      const cycle = { number: 1, unit: 'hour' }
      if (interval % 24 === 0) {
        if (interval % 168 === 0) {
          cycle.unit = 'week'
          cycle.number = interval / 168
        } else {
          cycle.unit = 'day'
          cycle.number = interval / 24
        }
      } else {
        cycle.number = interval
      }
      return cycle
    }
  },
  watch: {
    url () {
      if (this.urlError) {
        this.urlError = false
      }
    },
    editingRowUrl () {
      if (this.editingUrlError) {
        this.editingUrlError = false
      }
    }
  },
  methods: {
    ...mapMutations(['updateView']),
    ...mapActions(['updateConfig', 'updateConfigs', 'updateSubscribes']),
    selectRows (rows) {
      this.selectedRows = rows
    },
    onRowDBClick (row, index) {
      if (this.editingRowIndex < 0) {
        this.editingRowIndex = index
        this.editingRowUrl = row.URL
      }
      this.$nextTick(() => {
        // hack，使用ref不行...
        document.getElementById('editing-input').querySelector('input').focus()
      })
    },
    onUpdateChange (v) {
      this.updateConfig({ autoUpdateSubscribes: v })
    },
    onChangeCycleNumber (v) {
      const value = parseInt(v) || 1
      this.updateConfig({ subscribeUpdateInterval: value * unitMap[this.cycle.unit] })
    },
    onChangeCycleUnit (v) {
      this.updateConfig({ subscribeUpdateInterval: this.cycle.number * unitMap[v] })
    },
    update () {
      this.loading = true
      this.updateSubscribes(this.selectedRows).then(({ updatedCount, updatedArr, failedArr }) => {
        saveUpdateTime()
        this.loading = false
        this.$Message.success(`已更新${updatedCount}个节点`)
      })
    },
    remove () {
      const removeGroup = this.selectedRows.map(row => row.Group)
      const clone = this.appConfig.serverSubscribes.filter(config => removeGroup.indexOf(config.Group) < 0)
      this.updateConfig({ serverSubscribes: clone })
      this.selectedRows = []
    },
    requestSubscribeUrl (url) {
      return fetch(url).then(res => res.text())
    },
    // 根据订阅返回的节点数据更新ssr配置项
    updateSubscribedConfigs (configs) {
      const group = configs[0].group
      const notInGroup = this.appConfig.configs.filter(config => config.group !== group)
      this.updateConfigs(notInGroup.concat(configs))
    },
    onCreate () {
      this.showNewUrl = true
      this.$nextTick(() => {
        this.$refs.input.focus()
      })
    },
    cancelInput () {
      this.showNewUrl = false
      this.url = ''
      this.urlError = false
      this.updateView({ active: false })
    },
    cancelEditing () {
      this.editingRowIndex = -1
      this.editingRowUrl = ''
      this.editingUrlError = false
    },
    saveInput () {
      if (URL_REGEX.test(this.url)) {
        this.loading = true
        const url = this.url
        const notExisted = this.appConfig.serverSubscribes.every(serverSubscribe => {
          return serverSubscribe.URL !== url
        })
        if (notExisted) {
          this.requestSubscribeUrl(url).then(textContent => {
            this.loading = false
            const [groupCount, groupConfigs] = isSubscribeContentValid(textContent)
            if (groupCount > 0) {
              const clone = this.appConfig.serverSubscribes.slice()
              let groups = ''
              let configs = []
              for (const groupName in groupConfigs) {
                groups = groups + groupName + '|'
                configs = configs.concat(groupConfigs[groupName])
              }
              clone.push({ URL: url, Group: groups.slice(0, -1) })
              this.updateConfig({
                serverSubscribes: clone,
                configs: this.appConfig.configs.concat(configs)
              })
              saveUpdateTime()
            }
          }).catch(() => {
            this.loading = false
          })
        } else {
          this.loading = false
        }
        this.cancelInput()
      } else {
        this.urlError = true
      }
    }
  },
  mounted () {
    // 支持初始化打开新增输入框
    if (this.$store.state.view.active) {
      this.showNewUrl = true
      setTimeout(() => {
        this.$refs.input.focus()
      }, 300)
    }
  }
}
</script>
<style lang="stylus">
.options-container
  .cycle-wrapper
    .ivu-input-wrapper
      width 60px
    .ivu-input
      padding 0
      height 24px
      border-left none
      border-top none
      border-right none
      border-radius 0
      text-align center
      &:focus
        box-shadow none
    .ivu-select
      &.ivu-select-visible
        .ivu-select-selection
          box-shadow none
      .ivu-select-selection
        height 24px
        border-left none
        border-top none
        border-right none
        border-radius 0
      .ivu-select-selected-value
        margin-right 0
        padding 0
        height 24px
        text-align center
        line-height 24px
      .ivu-select-arrow
        display none
      .ivu-select-dropdown
        .ivu-select-item
          padding-left 0
          padding-right 0
          text-align center
</style>
