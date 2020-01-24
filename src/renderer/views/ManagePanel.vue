<template>
  <app-view name="panel" class="px-2 py-2" row>
    <ssr-nodes ></ssr-nodes>
    <info-panel></info-panel>
    <!-- <div v-show="editingGroup.show&&!editingGroup.title" class="flex-1"></div> -->
  </app-view>
</template>
<script>
/* eslint-disable vue/no-unused-components */
import { mapState } from 'vuex'
import SsrNodes from './panel/SSRNodes'
import InfoPanel from './panel/InfoPanel'
export default {
  components: {
    SsrNodes, InfoPanel
  },
  computed: {
    ...mapState(['editingGroup'])
  }
}
</script>
<style >

</style>
