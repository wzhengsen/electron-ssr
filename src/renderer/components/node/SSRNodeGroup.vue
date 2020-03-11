<template>
  <div class="ssr-node-group">
     <div class="node-group-node"
      :class="{selected:selectedGroupName===node.title}"
      @click="groupClick" @dblclick="handleToggleClick">
        <span class="group-expand-icon" :class="{expanded:expanded}" @click.stop="handleToggleClick"/>
        <div class="group-selection-background">
            <span class="node-group-title" >{{groupName}}</span>
        </div>
     </div>
     <div class="group-children-area" v-show="expanded">
        <SSRNode v-for="node in node.children" :key="node.id"
        :selected="node.id===selectedConfigId"
         :id="node.id"
         :activated="node.id===activatedConfigId"
         :name="node.title"
         :disabled="disabled"
         @nodeSelected="nodeSelected"
         @nodeActivated="nodeActivated"/>
     </div>
  </div>
</template>

<script>
import SSRNode from './SSRNode'
export default {
  name: 'NodeGroup',
  components: {
    SSRNode
  },
  props: {
    node: Object,
    selectedConfigId: String,
    activatedConfigId: String,
    selectedGroupName: String,
    disabled: Boolean
  },
  data () {
    return {
      expanded: true
    }
  },
  computed: {
    groupName () {
      return this.node.title === '$ungrouped$' ? this.$t('SSR_UNGROUPED') : this.node.title
    }
  },
  methods: {
    nodeSelected (id) {
      this.$emit('nodeSelected', { group: false, id })
    },
    nodeActivated (id) {
      this.$emit('nodeActivated', id)
    },
    handleToggleClick () {
      this.expanded = !this.expanded
    },
    groupClick () {
      this.$emit('nodeSelected', { group: true, title: this.node.title })
    }
  }
}
</script>

<style scoped>
.ssr-node-group{
    padding-left: 4px;
    width: 100%;
    height: 100%;
}
.node-group-node{
    height: 32px;
    display: flex;
    margin-bottom: 4px;
    align-items: center;
}

.group-expand-icon{
    display: inline-block;
    padding-right: 4px;
    padding-left: 8px;
    transition: all 200ms;
    font-family: Ionicons,serif;
    font-size: 20px;
    color: #515151;
    vertical-align: text-bottom;
}
.group-expand-icon.expanded{
    transform: rotate(90deg);
}
.group-expand-icon::before{
    content: "\F341";
}

.group-children-area{
    padding-left: 8px;
}
.group-selection-background {
    height: 32px;
    border: 1px solid transparent;
    box-sizing: border-box;
    padding-left: 4px;
    width: 100%;
    border-radius: 4px;
    transition: all 200ms linear;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.node-group-node.selected .group-selection-background {
    background-color: #CDE8F0;
    border-color: #34C3F0;
}
.group-selection-background:hover {
    background-color: rgba(205, 232, 240, 0.8);
}
.node-group-title{
    font-size: 18px;
    color: #303133;
}
</style>
