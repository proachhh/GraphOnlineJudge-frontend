<template>
  <div class="algo-viz-page">
    <!-- 顶部标题栏 -->
    <div class="viz-header">
      <div class="header-left">
        <Icon type="ios-flask" size="22" class="header-icon" />
        <span class="header-title">算法可视化实验室</span>
        <span class="header-sub">Algorithm Visualizer</span>
      </div>
      <div class="header-right">
        <span class="algo-badge" v-if="currentAlgo">
          {{ currentAlgo.name }}
          <span class="complexity">{{ currentAlgo.complexity.time }}</span>
        </span>
      </div>
      <div class="progress-bar" v-if="steps.length > 0">
        <div class="progress-fill" :style="{ width: ((currentStep + 1) / steps.length * 100) + '%' }"></div>
      </div>
    </div>

    <!-- 主体三栏 -->
    <div class="viz-body">
      <!-- 左：算法选择 -->
      <div class="algo-sidebar">
        <div class="sidebar-section" v-for="cat in categories" :key="cat.key">
          <div class="cat-title">{{ cat.name }}</div>
          <div
            v-for="algo in algorithmsByCategory(cat.key)"
            :key="algo.key"
            class="algo-item"
            :class="{ active: currentKey === algo.key }"
            :style="currentKey === algo.key ? { borderLeftColor: algo.color } : {}"
            @click="selectAlgo(algo.key)"
          >
            <span class="algo-icon">{{ algo.name.charAt(0) }}</span>
            <div class="algo-meta">
              <div class="algo-name">{{ algo.name }}</div>
              <div class="algo-complexity">{{ algo.complexity.time }}</div>
            </div>
          </div>
        </div>

        <!-- 数据设置 -->
        <div class="sidebar-section data-section" v-if="currentAlgo">
          <div class="cat-title">数据设置</div>
          <template v-if="currentAlgo.type === 'array'">
            <Input v-model="customArray" type="textarea" :rows="2" placeholder="逗号分隔，如 5,2,8,1,9" />
            <Button long size="small" @click="applyArray" style="margin-top: 6px;">应用数组</Button>
            <Button long size="small" @click="randomArray" style="margin-top: 4px;">随机生成</Button>
            <div v-if="needsTarget" style="margin-top: 8px;">
              <label class="input-label">查找目标</label>
              <InputNumber v-model="targetValue" size="small" style="width:100%" />
            </div>
          </template>
          <template v-else-if="currentAlgo.type === 'graph' && currentKey !== 'topologicalSort' && currentKey !== 'kruskal'">
            <label class="input-label">起始节点</label>
            <Select v-model="startNode" size="small" style="width:100%">
              <Option v-for="n in graphNodes" :key="n" :value="n">{{ n }}</Option>
            </Select>
            <Button long size="small" @click="applyGraph" style="margin-top: 6px;">应用</Button>
          </template>
          <template v-else>
            <div class="preset-hint">使用预设数据演示</div>
          </template>
        </div>
      </div>

      <!-- 中：可视化区 -->
      <div class="viz-main">
        <div class="viz-canvas" ref="chartContainer" v-show="!isTableType"></div>
        <div class="viz-table-container" v-show="isTableType">
          <div class="table-scroll" v-if="currentTable">
            <table class="dp-table">
              <thead>
                <tr>
                  <th class="corner"></th>
                  <th v-for="(col, ci) in currentTable.colLabels" :key="'c'+ci" class="col-header">{{ col }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, ri) in currentTable.cells" :key="'r'+ri">
                  <td class="row-header">{{ currentTable.rowLabels[ri] }}</td>
                  <td v-for="(cell, ci) in row" :key="'cell'+ri+'-'+ci" class="dp-cell" :class="tableCellClass(ri, ci)">{{ cell }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="step-desc-bar" v-if="currentStepData" :key="'step-' + currentStep">
          <Icon type="information-circled" class="desc-icon" />
          <span class="desc-text">{{ currentStepData.desc }}</span>
        </div>
      </div>

      <!-- 右：代码区 -->
      <div class="code-panel">
        <div class="code-header">
          <span class="code-title">{{ currentAlgo ? currentAlgo.name + ' · 伪代码' : '代码' }}</span>
        </div>
        <div class="code-body" v-if="currentAlgo">
          <div
            v-for="(line, idx) in currentAlgo.code"
            :key="idx"
            class="code-line"
            :class="{ active: currentStepData && idx + 1 === currentStepData.codeLine }"
          >
            <span class="line-num">{{ idx + 1 }}</span>
            <span class="line-content">{{ line }}</span>
          </div>
        </div>
        <div class="code-desc" v-if="currentAlgo">
          <p>{{ currentAlgo.desc }}</p>
          <div class="complexity-row">
            <span>时间复杂度</span><b>{{ currentAlgo.complexity.time }}</b>
          </div>
          <div class="complexity-row">
            <span>空间复杂度</span><b>{{ currentAlgo.complexity.space }}</b>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部控制栏 -->
    <div class="control-bar" v-if="currentAlgo">
      <div class="ctrl-left">
        <Button @click="prevStep" :disabled="currentStep === 0" icon="ios-skipbackward" size="small"></Button>
        <Button @click="togglePlay" :type="playing ? 'warning' : 'primary'" size="small">
          <Icon :type="playing ? 'ios-pause' : 'ios-play'" />
          {{ playing ? '暂停' : '播放' }}
        </Button>
        <Button @click="nextStep" :disabled="currentStep >= steps.length - 1" icon="ios-skipforward" size="small"></Button>
        <Button @click="reset" icon="ios-refresh" size="small"></Button>
      </div>
      <div class="ctrl-center">
        <span class="ctrl-label">速度</span>
        <Slider v-model="speed" :min="1" :max="10" :step="1" style="width: 120px;"></Slider>
        <span class="step-counter">{{ currentStep + 1 }} / {{ steps.length }}</span>
      </div>
      <div class="ctrl-right">
        <div class="stat-chip" v-for="(val, key) in currentStats" :key="key">
          <span class="stat-label">{{ statLabel(key) }}</span>
          <span class="stat-value">{{ val }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { ALGORITHMS, CATEGORIES, DEFAULT_GRAPH, DAG_GRAPH } from './algorithms'

const COLORS = {
  default: '#5b8def',
  compare: '#f90',
  swap: '#ed3f14',
  sorted: '#19be6b',
  pivot: '#9b59b6',
  set: '#1abc9c',
  found: '#19be6b',
  eliminate: '#cbd5e1',
  mid: '#f90',
  current: '#f90',
  visited: '#19be6b',
  visiting: '#ed3f14',
  edge: '#f90',
  edgeDefault: '#cbd5e1',
  mstEdge: '#9b59b6',
  heapDefault: '#7c3aed'
}

const STAT_LABELS = {
  comparisons: '比较',
  swaps: '交换',
  accesses: '访问',
  shifts: '移动',
  visited: '已访问',
  queueSize: '队列',
  distance: '当前距离',
  totalWeight: 'MST权重',
  filled: '已填',
  total: '总计',
  maxValue: '最大价值',
  lcsLength: 'LCS长度',
  stack: '栈深',
  k: '中间k'
}

export default {
  name: 'AlgorithmVisualizer',
  data () {
    return {
      categories: CATEGORIES,
      currentKey: 'bubbleSort',
      steps: [],
      currentStep: 0,
      playing: false,
      speed: 5,
      playTimer: null,
      chart: null,
      customArray: '5,2,8,1,9,3,7,4,6',
      targetValue: 6,
      startNode: 'A',
      graphData: DEFAULT_GRAPH
    }
  },
  computed: {
    currentAlgo () { return ALGORITHMS[this.currentKey] },
    currentStepData () { return this.steps[this.currentStep] },
    currentStats () {
      if (!this.currentStepData || !this.currentStepData.stats) return {}
      return this.currentStepData.stats
    },
    isTableType () { return this.currentAlgo && this.currentAlgo.type === 'table' },
    needsTarget () { return this.currentKey === 'binarySearch' || this.currentKey === 'linearSearch' || this.currentKey === 'interpolationSearch' },
    currentTable () {
      if (!this.currentStepData || !this.currentStepData.table) return null
      return this.currentStepData.table
    },
    graphNodes () {
      const g = this.currentKey === 'topologicalSort' ? DAG_GRAPH : this.graphData
      return g.nodes.map(n => n.id)
    }
  },
  watch: {
    speed () {
      if (this.playing) { this.stopPlay(); this.startPlay() }
    },
    currentStep () { this.renderStep(false) }
  },
  mounted () {
    this.$nextTick(() => {
      this.initChart()
      this.selectAlgo(this.currentKey)
    })
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy () {
    this.stopPlay()
    window.removeEventListener('resize', this.handleResize)
    if (this.chart) { this.chart.dispose(); this.chart = null }
  },
  methods: {
    algorithmsByCategory (cat) { return Object.values(ALGORITHMS).filter(a => a.category === cat) },
    statLabel (key) { return STAT_LABELS[key] || key },
    initChart () {
      if (this.chart) return
      const el = this.$refs.chartContainer
      if (!el || el.offsetWidth === 0) return
      this.chart = echarts.init(el)
    },
    handleResize () {
      if (this.chart && this.isTableType === false) this.chart.resize()
    },
    selectAlgo (key) {
      this.stopPlay()
      this.currentKey = key
      const algo = ALGORITHMS[key]
      const input = this.buildInput(algo)
      this.steps = algo.run(input)
      this.currentStep = 0
      if (!this.isTableType) {
        this.$nextTick(() => {
          if (!this.chart) this.initChart()
          if (this.chart) this.chart.resize()
          this.renderStep(true)
        })
      }
    },
    buildInput (algo) {
      if (algo.type === 'array') {
        const arr = this.parseArray(this.customArray)
        if (this.needsTarget) return { array: arr, target: this.targetValue }
        return { array: arr }
      } else if (algo.type === 'graph') {
        if (algo.key === 'topologicalSort') return { graph: DAG_GRAPH }
        return { graph: this.graphData, start: this.startNode }
      }
      return {}
    },
    parseArray (str) {
      const arr = str.split(/[,，\s]+/).filter(s => s).map(Number).filter(n => !isNaN(n))
      return arr.length > 0 ? arr.slice(0, 15) : [5, 2, 8, 1, 9]
    },
    applyArray () { if (this.currentAlgo.type === 'array') this.selectAlgo(this.currentKey) },
    randomArray () {
      const n = 8 + Math.floor(Math.random() * 5)
      const arr = []
      for (let i = 0; i < n; i++) arr.push(Math.floor(Math.random() * 50) + 1)
      this.customArray = arr.join(',')
      this.applyArray()
    },
    applyGraph () { if (this.currentAlgo.type === 'graph') this.selectAlgo(this.currentKey) },
    tableCellClass (ri, ci) {
      const h = this.currentStepData && this.currentStepData.highlight
      if (!h) return ''
      const classes = []
      if (h.row === ri && h.col === ci) classes.push('current')
      if (h.deps && h.deps.some(([r, c]) => r === ri && c === ci)) classes.push('dep')
      if (h.match && h.row === ri && h.col === ci) classes.push('match')
      return classes.join(' ')
    },
    renderStep (fullReset) {
      if (this.isTableType) return
      if (!this.chart || !this.currentStepData) return
      const algo = this.currentAlgo
      if (algo.type === 'array') this.renderArrayChart(fullReset)
      else this.renderGraphChart(fullReset)
    },
    renderArrayChart (fullReset) {
      const step = this.currentStepData
      const h = step.highlight || {}
      const data = step.array.map((val, idx) => {
        let color = COLORS.default
        if (h.sorted && h.sorted.includes(idx)) color = COLORS.sorted
        if (h.compare && h.compare.includes(idx)) color = COLORS.compare
        if (h.swap && h.swap.includes(idx)) color = COLORS.swap
        if (h.pivot === idx) color = COLORS.pivot
        if (h.set && h.set.includes(idx)) color = COLORS.set
        if (h.found === idx) color = COLORS.found
        if (h.mid === idx) color = COLORS.mid
        if (h.current === idx) color = COLORS.compare
        if (h.eliminate && idx >= h.eliminate[0] && idx <= h.eliminate[1]) color = COLORS.eliminate
        if (h.heapSize !== undefined && idx >= h.heapSize && !(h.sorted && h.sorted.includes(idx))) color = COLORS.sorted
        return {
          value: val,
          itemStyle: { color, borderRadius: [6, 6, 0, 0] },
          label: { show: true, position: 'top', color: '#475569', fontSize: 13, fontWeight: 'bold' }
        }
      })
      const indices = step.array.map((_, i) => i)
      const option = {
        grid: { top: 36, bottom: 30, left: 40, right: 24 },
        xAxis: {
          type: 'category', data: indices,
          axisLine: { lineStyle: { color: '#cbd5e1' } },
          axisLabel: { color: '#94a3b8', fontSize: 12 },
          axisTick: { show: false }
        },
        yAxis: {
          show: true, axisLine: { show: false }, axisTick: { show: false },
          axisLabel: { color: '#cbd5e1' },
          splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
          min: 0
        },
        series: [{
          type: 'bar', data, barWidth: '60%',
          animation: true,
          animationDuration: 500,
          animationDurationUpdate: 350,
          animationEasing: 'cubicOut',
          animationEasingUpdate: 'cubicOut',
          animationDelay: idx => idx * 40,
          animationDelayUpdate: idx => idx * 20
        }],
        graphic: this.targetGraphic(step)
      }
      this.chart.setOption(option, { notMerge: fullReset })
    },
    targetGraphic (step) {
      const g = []
      const h = step.highlight || {}
      if (h.target !== undefined) {
        g.push({ type: 'text', right: 16, top: 8, style: { text: `目标: ${h.target}`, fill: '#1e3a8a', fontSize: 14, fontWeight: 'bold' } })
      }
      if (h.gap !== undefined) {
        g.push({ type: 'text', right: 16, top: 8, style: { text: `gap = ${h.gap}`, fill: '#9b59b6', fontSize: 14, fontWeight: 'bold' } })
      }
      if (h.found !== undefined) {
        g.push({ type: 'text', left: 'center', top: 8, style: { text: '✓ 命中', fill: '#19be6b', fontSize: 16, fontWeight: 'bold' } })
      }
      return g
    },
    renderGraphChart (fullReset) {
      const step = this.currentStepData
      const h = step.highlight || {}
      const nodes = step.graph.nodes.map(n => {
        let color = COLORS.default
        let size = 42
        if (h.current === n.id) { color = COLORS.current; size = 52 }
        if (h.visited && h.visited.includes(n.id)) color = COLORS.visited
        if (h.visiting === n.id) { color = COLORS.visiting; size = 48 }
        let label = n.id
        if (h.dist) {
          const d = h.dist[n.id]
          label = `${n.id}\n${d === Infinity ? '∞' : d}`
        }
        if (h.key) {
          const k = h.key[n.id]
          label = `${n.id}\n${k === Infinity ? '∞' : k}`
        }
        if (h.inDegree) {
          label = `${n.id}\n入度:${h.inDegree[n.id]}`
        }
        return {
          id: n.id, name: n.id, x: n.x, y: n.y, symbolSize: size,
          label: { show: true, formatter: label, color: '#fff', fontSize: 12, fontWeight: 'bold', lineHeight: 16 },
          itemStyle: { color, borderColor: '#fff', borderWidth: 2, shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.15)' }
        }
      })
      const mstEdgeSet = new Set()
      if (h.mstEdges) {
        for (const e of h.mstEdges) {
          mstEdgeSet.add(`${e.from}-${e.to}`)
          mstEdgeSet.add(`${e.to}-${e.from}`)
        }
      }
      const links = step.graph.edges.map(e => {
        let color = COLORS.edgeDefault
        let width = 2
        const key = `${e.from}-${e.to}`
        if (mstEdgeSet.has(key)) { color = COLORS.mstEdge; width = 4 }
        if (h.edge) {
          const [f, t] = h.edge
          if ((f === e.from && t === e.to) || (t === e.from && f === e.to)) { color = COLORS.edge; width = 4 }
        }
        return {
          source: e.from, target: e.to,
          lineStyle: { color, width, curveness: 0 },
          label: { show: e.weight > 0, formatter: String(e.weight), fontSize: 11, color: '#64748b' }
        }
      })
      const option = {
        animation: true,
        animationDuration: 600,
        animationDurationUpdate: 400,
        animationEasing: 'cubicOut',
        animationEasingUpdate: 'cubicInOut',
        series: [{
          type: 'graph', layout: 'none', data: nodes, links,
          roam: false, edgeSymbol: ['none', 'none'],
          emphasis: { focus: 'adjacency' },
          animationDuration: 600,
          animationDurationUpdate: 400
        }]
      }
      this.chart.setOption(option, { notMerge: fullReset })
    },
    togglePlay () {
      if (this.playing) { this.stopPlay() } else {
        if (this.currentStep >= this.steps.length - 1) this.currentStep = 0
        this.startPlay()
      }
    },
    startPlay () {
      this.playing = true
      const interval = 1200 - this.speed * 100
      this.playTimer = setInterval(() => {
        if (this.currentStep < this.steps.length - 1) this.currentStep++
        else this.stopPlay()
      }, interval)
    },
    stopPlay () {
      this.playing = false
      if (this.playTimer) { clearInterval(this.playTimer); this.playTimer = null }
    },
    prevStep () { this.stopPlay(); if (this.currentStep > 0) this.currentStep-- },
    nextStep () { this.stopPlay(); if (this.currentStep < this.steps.length - 1) this.currentStep++ },
    reset () { this.stopPlay(); this.currentStep = 0 }
  }
}
</script>

<style lang="less" scoped>
.algo-viz-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding-top: 80px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
  overflow: hidden;
  z-index: 10;
}

.viz-header {
  height: 52px;
  background: linear-gradient(90deg, #1e3a8a, #2d8cf0);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  color: #fff;
  box-shadow: 0 2px 8px rgba(30, 58, 138, 0.2);
  flex-shrink: 0;
  position: relative;

  .progress-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: rgba(255, 255, 255, 0.15);
    overflow: hidden;

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #ffd54f, #fff);
      transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 0 8px rgba(255, 213, 79, 0.6);
    }
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    .header-icon { color: #ffd54f; }
    .header-title { font-size: 18px; font-weight: 700; }
    .header-sub { font-size: 12px; opacity: 0.7; margin-left: 6px; }
  }
  .header-right {
    .algo-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.15);
      padding: 5px 14px;
      border-radius: 16px;
      font-size: 13px;
      .complexity {
        background: rgba(255, 255, 255, 0.25);
        padding: 1px 8px;
        border-radius: 10px;
        font-size: 11px;
        margin-left: 4px;
      }
    }
  }
}

.viz-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.algo-sidebar {
  width: 230px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #e2e8f0;
  overflow-y: auto;
  padding: 8px 0;

  .sidebar-section {
    padding: 8px 12px;
    &.data-section {
      border-top: 1px dashed #e2e8f0;
      margin-top: 8px;
      padding-top: 12px;
    }
  }
  .cat-title {
    font-size: 12px;
    color: #94a3b8;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
    padding-left: 4px;
  }
  .algo-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 8px;
    cursor: pointer;
    margin-bottom: 4px;
    border-left: 3px solid transparent;
    transition: background 0.15s, border-color 0.15s;

    &:hover { background: #f1f5f9; }
    &.active { background: #eff6ff; }

    .algo-icon {
      width: 32px; height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1e3a8a;
      color: #fff;
      font-size: 15px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .algo-meta {
      flex: 1;
      min-width: 0;
      .algo-name { font-size: 14px; font-weight: 600; color: #1e293b; }
      .algo-complexity { font-size: 11px; color: #94a3b8; }
    }
  }
  .input-label {
    display: block;
    font-size: 12px;
    color: #64748b;
    margin-bottom: 4px;
    margin-top: 6px;
  }
  .preset-hint {
    font-size: 12px;
    color: #94a3b8;
    padding: 8px;
    background: #f8fafc;
    border-radius: 6px;
    text-align: center;
  }
}

.viz-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  position: relative;
  min-width: 0;

  .viz-canvas {
    flex: 1;
    width: 100%;
    min-height: 0;
  }
  .viz-table-container {
    flex: 1;
    overflow: auto;
    padding: 20px;
    .table-scroll {
      display: inline-block;
      min-width: 100%;
    }
    .dp-table {
      border-collapse: separate;
      border-spacing: 3px;
      font-size: 13px;
      th, td {
        padding: 6px 10px;
        text-align: center;
        border-radius: 4px;
        transition: all 0.3s ease;
      }
      .corner { background: transparent; }
      .col-header, .row-header {
        background: #f1f5f9;
        color: #475569;
        font-weight: 600;
      }
      .col-header { min-width: 40px; }
      .row-header { text-align: right; white-space: nowrap; }
      .dp-cell {
        background: #f8fafc;
        color: #64748b;
        font-family: 'Consolas', monospace;
        min-width: 36px;
        &.current {
          background: #fef3c7;
          color: #92400e;
          font-weight: 700;
          box-shadow: 0 0 0 2px #f59e0b;
          transform: scale(1.08);
        }
        &.dep {
          background: #dbeafe;
          color: #1e3a8a;
          font-weight: 600;
        }
        &.match {
          background: #d1fae5;
          color: #065f46;
          font-weight: 700;
          box-shadow: 0 0 0 2px #10b981;
        }
      }
    }
  }
  .step-desc-bar {
    height: 44px;
    flex-shrink: 0;
    background: #1e293b;
    display: flex;
    align-items: center;
    padding: 0 20px;
    gap: 10px;
    border-top: 1px solid #334155;
    animation: slideInDesc 0.35s cubic-bezier(0.4, 0, 0.2, 1);

    .desc-icon { color: #fbbf24; font-size: 18px; animation: pulse 0.8s ease; }
    .desc-text { color: #f1f5f9; font-size: 14px; font-weight: 500; }
  }
}

.code-panel {
  width: 380px;
  flex-shrink: 0;
  background: #1e293b;
  display: flex;
  flex-direction: column;
  color: #e2e8f0;

  .code-header {
    padding: 12px 16px;
    border-bottom: 1px solid #334155;
    .code-title { font-size: 14px; font-weight: 600; color: #f1f5f9; }
  }
  .code-body {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
    font-family: 'Consolas', 'Monaco', 'Menlo', monospace;
    font-size: 13px;
    line-height: 1.7;

    .code-line {
      display: flex;
      padding: 1px 16px;
      border-left: 3px solid transparent;
      transition: background 0.3s, border-color 0.3s;

      .line-num {
        width: 28px;
        text-align: right;
        margin-right: 12px;
        color: #475569;
        user-select: none;
        flex-shrink: 0;
        transition: color 0.3s;
      }
      .line-content {
        color: #94a3b8;
        white-space: pre;
        transition: color 0.3s;
      }
      &.active {
        background: rgba(251, 191, 36, 0.12);
        border-left-color: #fbbf24;
        animation: codeHighlight 0.3s ease;
        .line-num { color: #fbbf24; font-weight: bold; }
        .line-content { color: #fef3c7; font-weight: 500; }
      }
    }
  }
  .code-desc {
    padding: 14px 16px;
    border-top: 1px solid #334155;
    background: #0f172a;
    p { font-size: 12px; color: #94a3b8; line-height: 1.6; margin: 0 0 10px; }
    .complexity-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      padding: 3px 0;
      span { color: #64748b; }
      b { color: #2d8cf0; font-family: monospace; }
    }
  }
}

.control-bar {
  height: 56px;
  flex-shrink: 0;
  background: #fff;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.04);

  .ctrl-left { display: flex; gap: 6px; align-items: center; }
  .ctrl-center {
    display: flex;
    align-items: center;
    gap: 12px;
    .ctrl-label { font-size: 13px; color: #64748b; }
    .step-counter {
      font-size: 13px;
      font-weight: 600;
      color: #1e3a8a;
      background: #eff6ff;
      padding: 3px 12px;
      border-radius: 12px;
    }
  }
  .ctrl-right {
    display: flex;
    gap: 8px;
    .stat-chip {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 3px 12px;
      min-width: 60px;
      .stat-label { font-size: 10px; color: #94a3b8; }
      .stat-value { font-size: 15px; font-weight: 700; color: #1e3a8a; }
    }
  }
}

@keyframes slideInDesc {
  from { transform: translateY(8px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}
@keyframes codeHighlight {
  from { background: rgba(251, 191, 36, 0.3); }
  to { background: rgba(251, 191, 36, 0.12); }
}

@media (max-width: 1100px) {
  .code-panel { width: 300px; }
  .algo-sidebar { width: 180px; }
  .control-bar .ctrl-right .stat-chip { min-width: 50px; padding: 3px 8px; }
}
@media (max-width: 768px) {
  .code-panel { display: none; }
  .algo-sidebar { width: 150px; }
  .control-bar .ctrl-right { display: none; }
}
</style>
