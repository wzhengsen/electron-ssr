<template>
  <div class="node-root" :class="{selected:selected,activated:activated,disabled:disabled}">
    <span class="active-indicator" />
    <div class="node-selection-area" @click="click" @dblclick="dblclick">
      <span class="node-name">{{trimmedTitle}}</span>
      <span class="latency-block">
        <span class="latency-value" :class="latencyClass">{{latencyText}}</span>
        <span v-if="latency>0">&nbsp;ms</span>
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SSRNode',
  props: {
    selected: {
      type: Boolean,
      default: false
    },
    id: {
      type: String,
      required: true
    },
    activated: {
      type: Boolean,
      required: true
    },
    disabled: {
      type: Boolean,
      require: true
    },
    latency: {
      type: Number,
      default: 0
    },
    name: {
      type: String,
      required: true
    },
    maxNameCount: {
      type: Number,
      default: 23
    }
  },
  computed: {
    latencyText () {
      if (this.latency > 0) {
        return this.latency
      } else if (this.latency === 0) {
        return ''
      }
      return 'n/a'
    },
    latencyClass () {
      return {
        high: this.latency >= 700 || this.latency < 0,
        med: this.latency < 700 && this.latency >= 300,
        low: this.latency > 0 && this.latency < 300,
        'no-data': this.latency === 0
      }
    },
    trimmedTitle () {
      if (this.name.length <= this.maxNameCount) {
        return this.name
      }
      // eslint-disable-next-line no-useless-escape
      let letterRegex = /[a-zA-Z0-9\[\]\-\/. ]/
      let titleArr = []
      let maxCount = this.maxNameCount
      let rawIndex = 0
      while (maxCount > 0 && rawIndex < this.name.length) {
        titleArr.push(this.name[rawIndex])
        rawIndex++
        if (
          rawIndex + 1 < this.name.length &&
          this.name[rawIndex].match(letterRegex)
        ) {
          titleArr.push(this.name[rawIndex])
          rawIndex++
        }
        maxCount--
      }
      if (titleArr.length < this.name.length) {
        titleArr.push('...')
      } else {
        return this.name
      }
      return titleArr.join('')
    }
  },
  methods: {
    click () {
      this.$emit('nodeSelected', this.id)
    },
    dblclick () {
      this.$emit('nodeActivated', this.id)
    }
  }
}
</script>

<style scoped>
.node-root {
  height: 28px;
  position: relative;
  color: #606266;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
}
.node-name {
  line-height: 28px;
  pointer-events: none;
}
.node-root .node-selection-area:hover {
  background-color: rgba(205, 232, 240, 0.8);
}

.active-indicator {
  display: inline-block;
  margin-left: 10px;
  width: 6px;
  height: 6px;
  background-color: transparent;
  border-radius: 3px;
}
.node-root.activated .active-indicator {
  background-color: #34c3f0;
}
.node-root.activated.disabled .active-indicator {
  background-color: #929292;
}

.node-root.selected .node-selection-area {
  background-color: #cde8f0;
  border-color: #34c3f0;
}
.latency-block {
  line-height: 28px;
  margin-right: 8px;
  text-align: right;
}
.node-selection-area {
  display: flex;
  height: 28px;
  border: 1px solid transparent;
  box-sizing: border-box;
  margin-left: 8px;
  padding-left: 4px;
  width: 100%;
  justify-content: space-between;
  border-radius: 4px;
  transition: all 200ms linear;
}
.latency-value.low {
  color: #67c23a;
}
.latency-value.med {
  color: #e6a23c;
}
.latency-value.high {
  color: #f56c6c;
}
.latency-value.no-data {
  color: #909399;
}
</style>
