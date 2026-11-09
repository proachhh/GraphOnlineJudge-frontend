<template>
  <div ref="chart" class="echarts-instance"></div>
</template>
<script>
import { markRaw } from 'vue'
// 自研 ECharts 封装（替代仅支持 Vue 2 的 vue-echarts@2）
// 兼容旧用法：<ECharts :options="options" ref="chart" auto-resize></ECharts>
import * as echarts from 'echarts'

export default {
  name: 'EChart',
  props: {
    options: {
      type: Object,
      required: true
    },
    autoResize: {
      type: Boolean,
      default: true
    }
  },
  data () {
    return {
      chart: null
    }
  },
  watch: {
    options: {
      deep: true,
      handler (val) {
        if (this.chart && val) {
          this.chart.setOption(val, {notMerge: true})
        }
      }
    }
  },
  mounted () {
    this.chart = markRaw(echarts.init(this.$refs.chart))
    this.chart.setOption(this.options, {notMerge: true})
    if (this.autoResize) {
      this._resizeHandler = () => {
        if (this.chart) {
          this.chart.resize()
        }
      }
      window.addEventListener('resize', this._resizeHandler)
    }
  },
  beforeUnmount () {
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler)
    }
    if (this.chart) {
      this.chart.dispose()
      this.chart = null
    }
  }
}
</script>
<style>
.echarts-instance {
  width: 100%;
}
</style>
