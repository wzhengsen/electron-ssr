<template>
  <div class="panel-nodes flex flex-column h-100">
    <div class="node-group" ref="nodeGroup">
      <div class="wrapper" v-if="groupedNodes&&groupedNodes.length !== 0">
        <SSRNodeGroup
          v-for="group in groupedNodes"
          :activatedConfigId="activatedConfigId"
          :selectedConfigId="selectedConfigId"
          :selectedGroupName="selectedConfigId || selectedGroupName"
          :key="group.id"
          :node="group"
          :disabled="!appConfig.enable"
          @nodeSelected="nodeSelected"
          @nodeActivated="nodeActivated"
        />
      </div>
      <div class="empty-nodes" v-else>{{$t('UI_NO_NODE')}}</div>
    </div>
  </div>
</template>
<script>
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import { groupConfigs } from '@/shared/utils'

import SSRNodeGroup from '@/renderer/components/node/SSRNodeGroup'

export default {
  components: {
    SSRNodeGroup
  },
  data () {
    return {
      buttonProps: {
        type: 'ghost',
        size: 'small'
      }
    }
  },
  computed: {
    ...mapState(['appConfig', 'editingGroup', 'selection']),
    ...mapGetters(['activatedConfig', 'configs']),
    selectedGroupName () {
      return this.editingGroup.title
    },
    // 分组后的配置节点
    groupedConfigs () {
      return groupConfigs(this.configs)
    },
    // 分组后的ssr节点
    groupedNodes () {
      return Object.keys(this.groupedConfigs).map(groupName => {
        return {
          title: groupName,
          children: this.groupedConfigs[groupName]
        }
      })
    },
    activatedConfigId () {
      if (this.appConfig.index >= 0 && this.configs.length > 0) {
        return (this.configs[this.appConfig.index] && this.configs[this.appConfig.index].id) || ''
      }
      return ''
    },
    selectedConfigId () {
      return this.selection.selectedConfigId
    }
  },
  watch: {
    'appConfig.index' (v) {
      this.setSelected(this.activatedConfig ? this.activatedConfig.id : '')
    },
    'editingGroup.updated' (v) {
      if (v) {
        this.updateEditingGroup({ updated: false })
      }
    }
  },
  methods: {
    ...mapMutations([
      'updateEditingGroup',
      'resetState',
      'setSelectedConfigId',
      'setSelectedGroupName'
    ]),
    ...mapActions(['updateConfigs', 'updateConfig', 'setSelected']),

    nodeSelected (data) {
      let { id, group, title } = data
      if (group) {
        this.setSelected('')
        // === '$ungrouped$' ? '$ungrouped$' : title
        this.updateEditingGroup({ show: true, title: title })
      } else {
        this.setSelected(id)
        this.updateEditingGroup({ show: false })
      }
    },
    nodeActivated (id) {
      this.updateConfig({
        index: this.appConfig.configs.findIndex(config => config.id === id),
        enable: true
      })
      this.resetState()
    }
    // flat分组
    // flatNodeGroups (groups) {
    //   groups = groups || this.groupedNodes
    //   const flatArr = []
    //   groups.forEach(group => {
    //     flatArr.push(...group.children)
    //   })
    //   return flatArr
    // }
    // 从剪切板导入
    // copyFromClipboard () {
    //   ipcRenderer.send(EVENT_CONFIG_COPY_CLIPBOARD)
    // },
    // 上/下移 direction = 1 上移 其它 下移
    // updown (direction = 1) {
    //   const clone = this.groupedNodes.slice()
    //   if (this.selectedGroupName) {
    //     // 分组上/下移
    //     const index = clone.findIndex(node => node.title === this.selectedGroupName)
    //     const group = clone.splice(index, 1)
    //     clone.splice(direction === 1 ? index - 1 : index + 1, 0, group[0])
    //   } else {
    //     // 节点上/下移
    //     const currentGroup = this.selectedConfigNode.group || '未分组'
    //     const group = clone.find(node => node.title === currentGroup)
    //     const childrenClone = group.children.slice()
    //     const inGroupIndex = childrenClone.findIndex(node => node.id === this.selectedConfigId)
    //     childrenClone.splice(direction === 1 ? inGroupIndex - 1 : inGroupIndex + 1, 0, childrenClone.splice(inGroupIndex, 1)[0])
    //     group.children = childrenClone
    //   }
    //   preventIndexAffect = true
    //   this.updateConfigs(this.flatNodeGroups(clone))
    // }
  },
  mounted () {
    // Auto scroll to selected(activated) node.
    if (this.$refs.nodeGroup) {
      const selectedNode = this.$refs.nodeGroup.querySelector(
        '.node-root.selected'
      )
      if (selectedNode) {
        this.$refs.nodeGroup.scrollTop = selectedNode.offsetTop - 200
      }
    }
  }
}
</script>
<style lang="stylus">
@import '../../assets/styles/variable';

.panel-nodes {
  width: 25rem;

  .empty-tree {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .node-tree {
    border: 1px solid $color-border;
    border-radius: 4px;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .ivu-tree-children {
    .ivu-tree-children {
      .ivu-tree-arrow {
        display: none;
      }
    }
  }

  .node-group {
    border: 1px solid #DCDFE6;
    border-radius: 4px;
    box-sizing: border-box;
    padding-right: 12px;
    padding-top: 4px;
    overflow: scroll;
    overflow-x: hidden;
    height: 100%;
    width: 100%;
    .empty-nodes{
      width 100%;
      text-align center;
      margin-top 150px;
    }
  }
}
</style>
