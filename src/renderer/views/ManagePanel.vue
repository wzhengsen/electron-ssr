<template>
  <app-view name="panel" class="px-2 py-2" row>
    <node-list-panel></node-list-panel>
    <info-panel></info-panel>
  </app-view>
</template>
<script>
import NodeListPanel from './panel/SSRNodeListPanel'
import InfoPanel from './panel/InfoPanel'
export default {
  components: {
    NodeListPanel,
    InfoPanel
  }
}
</script>
<style >
</style>
