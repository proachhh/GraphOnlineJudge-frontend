<template>
  <div class="kg-section">
    <div ref="chart" class="chart-container"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import api from '@oj/api'

export default {
  name: 'KnowledgeGraphSection',
  data() {
    return {
      chart: null,
      graphData: { nodes: [], edges: [] },
      autoPanEnabled: false,
      mouseX: 0,
      mouseY: 0,
      panSpeed: 4,
      edgeThreshold: 60,
      panAnimationFrame: null
    }
  },
  mounted() {
    this.fetchGraphData()
    this.enableEdgePan()
  },
  beforeDestroy() {
    if (this.chart) {
      this.chart.dispose()
    }
    window.removeEventListener('resize', this.handleResize)
    this.disableEdgePan()
  },
  methods: {
    enableEdgePan() {
      this.autoPanEnabled = true
      window.addEventListener('mousemove', this.onGlobalMouseMove)
    },
    disableEdgePan() {
      this.autoPanEnabled = false
      window.removeEventListener('mousemove', this.onGlobalMouseMove)
      if (this.panAnimationFrame) {
        cancelAnimationFrame(this.panAnimationFrame)
        this.panAnimationFrame = null
      }
    },
    onGlobalMouseMove(e) {
      this.mouseX = e.clientX
      this.mouseY = e.clientY
      if (!this.autoPanEnabled) return
      if (!this.panAnimationFrame) {
        this.panAnimationFrame = requestAnimationFrame(this.performEdgePan)
      }
    },
    performEdgePan() {
      this.panAnimationFrame = null
      if (!this.chart || !this.autoPanEnabled) return

      const winWidth = window.innerWidth
      const winHeight = window.innerHeight
      const threshold = this.edgeThreshold

      let dx = 0, dy = 0

      // 鼠标靠近边缘时，图谱向相反方向移动，以便查看更多内容
      if (this.mouseX < threshold) {
        dx = this.panSpeed * (1 - this.mouseX / threshold)
      } else if (this.mouseX > winWidth - threshold) {
        dx = -this.panSpeed * ((this.mouseX - (winWidth - threshold)) / threshold)
      }

      if (this.mouseY < threshold) {
        dy = this.panSpeed * (1 - this.mouseY / threshold)
      } else if (this.mouseY > winHeight - threshold) {
        dy = -this.panSpeed * ((this.mouseY - (winHeight - threshold)) / threshold)
      }

      if (dx !== 0 || dy !== 0) {
        this.chart.dispatchAction({
          type: 'graphRoam',
          dx: dx,
          dy: dy
        })
        this.panAnimationFrame = requestAnimationFrame(this.performEdgePan)
      }
    },

    translateTopic(rawName) {
      if (!rawName) return ''
      const key = `m.tag.${rawName}`
      const translated = this.$t(key)
      if (translated && translated !== key) {
        return translated
      }
      const direct = this.$t(`m.${rawName}`)
      if (direct && direct !== `m.${rawName}`) {
        return direct
      }
      return rawName
    },

    async fetchGraphData() {
      try {
        const res = await api.getKnowledgeGraph()
        this.graphData = res.data 
        this.$nextTick(() => {
          this.initChart()
        })
      } catch (e) {
        console.error('获取知识图谱失败', e)
      }
    },

    initChart() {
      const chartDom = this.$refs.chart
      if (!chartDom || chartDom.clientWidth === 0) return

      this.chart = echarts.init(chartDom)

      const nodes = this.graphData.nodes || []
      const edges = this.graphData.edges || []

      const nodeData = nodes.map((n) => {
        const rawName = n.name || ''
        const displayName = this.translateTopic(rawName)
        const len = displayName.length
        let symbolSize = 60
        let fontSize = 13
        if (len > 8) { symbolSize = 70; fontSize = 11 }
        if (len > 12) { symbolSize = 85; fontSize = 10 }

        return {
          id: rawName,
          name: displayName,
          symbolSize,
          itemStyle: {
            color: '#2E6A99',
            borderColor: '#8BB8D0',
            borderWidth: 2,
            shadowBlur: 8,
            shadowColor: 'rgba(0,0,0,0.4)'
          },
          label: {
            show: true,
            position: 'inside',
            color: '#fff',
            fontSize,
            fontWeight: 'bold',
            textShadow: '0 1px 4px #000',
            formatter: (params) => {
              const str = params.name
              if (str.length <= 6) return str
              if (str.length <= 12) {
                const mid = Math.ceil(str.length / 2)
                return str.slice(0, mid) + '\n' + str.slice(mid)
              }
              return str.slice(0, 6) + '\n' + str.slice(6, 12) + '…'
            }
          }
        }
      })

      const edgeData = edges.map(e => ({
        source: e.source,
        target: e.target,
        lineStyle: {
          color: '#4A7A9E',
          width: 2,
          curveness: 0.2,
          opacity: 0.5
        }
      }))

      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          backgroundColor: 'rgba(8,20,30,0.95)',
          borderColor: '#2E6A99',
          textStyle: { color: '#E8F1F8' },
          formatter: (params) => {
            if (params.dataType === 'node') return params.name
            return `${params.data.source} → ${params.data.target}`
          }
        },
        series: [{
          type: 'graph',
          layout: 'force',
          data: nodeData,
          edges: edgeData,
          roam: false,
          draggable: true,
          focusNodeAdjacency: true,
          emphasis: {
            focus: 'adjacency',
            lineStyle: { width: 3, opacity: 0.9 },
            label: { fontWeight: 'bold' }
          },
          blur: {
            itemStyle: { opacity: 0.2 },
            label: { opacity: 0.2 },
            lineStyle: { opacity: 0.1 }
          },
          force: { 
            repulsion: 800,
            edgeLength: 200,
            gravity: 0.08,
            friction: 0.1,
            layoutAnimation: true
          },
          lineStyle: { color: '#4A7A9E', width: 2, curveness: 0.2, opacity: 0.5 },
          itemStyle: { color: '#2E6A99', borderColor: '#8BB8D0', borderWidth: 2 },
          label: { show: true, position: 'inside', color: '#fff', fontSize: 13, fontWeight: 'bold' },
          edgeSymbol: ['none', 'arrow'],
          edgeSymbolSize: [0, 10]
        }]
      }

      this.chart.setOption(option, true)
      window.addEventListener('resize', this.handleResize)
    },

    handleResize() {
      if (this.chart) this.chart.resize()
    }
  }
}
</script>

<style scoped lang="less">
.kg-section {
  position: relative;
  width: 100%;
  height: 100vh;
  z-index: 2;
  background: transparent;
  
  .chart-container {
    width: 100%;
    height: 100%;
  }
}
</style>
