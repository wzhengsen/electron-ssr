<template>
  <app-view name="panel" class="px-2 py-2" row>
    <SSRNodePanel/>
    <InfoPanel/>
  </app-view>
</template>
<script>
import SSRNodePanel from './panel/SSRNodePanel'
import InfoPanel from './panel/InfoPanel'
export default {
  components: {
    SSRNodePanel,
    InfoPanel
  }
}
</script>
<style >
</style>
