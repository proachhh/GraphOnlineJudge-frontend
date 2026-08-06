<template>
  <div class="knowledge-universe">
    <!-- 顶部工具栏 -->
    <div class="ku-toolbar">
      <div class="ku-title">
        <i class="el-icon-fa-globe"></i>
        <span>知识宇宙</span>
        <span class="ku-meta" v-if="meta">
          {{ meta.totalTopics }} 个知识点 · {{ meta.totalEdges }} 条关联
        </span>
      </div>
    </div>

    <!-- 路径规划卡片 -->
    <div class="ku-path-card">
      <div class="card-title"><i class="el-icon-share"></i> 路径规划</div>
      <div class="path-field">
        <span class="field-label" @click="selectMode='start'">
          <i class="el-icon-aim" :class="{active: selectMode==='start'}"></i> 起点
        </span>
        <el-autocomplete v-model="startTopic" size="mini" placeholder="搜索或点击节点"
          :fetch-suggestions="querySearchTopics" popper-class="dark-popper"
          @select="selectMode='target'" @focus="selectMode='start'"
          :class="{active: selectMode==='start'}" style="width: 100%"></el-autocomplete>
      </div>
      <div class="path-field">
        <span class="field-label" @click="selectMode='target'">
          <i class="el-icon-aim" :class="{active: selectMode==='target'}"></i> 终点
        </span>
        <el-autocomplete v-model="targetTopic" size="mini" placeholder="搜索或点击节点"
          :fetch-suggestions="querySearchTopics" popper-class="dark-popper"
          @select="selectMode=''" @focus="selectMode='target'"
          :class="{active: selectMode==='target'}" style="width: 100%"></el-autocomplete>
      </div>
      <el-button type="primary" size="mini" icon="el-icon-share" @click="fetchPath"
                 :loading="pathLoading" :disabled="!targetTopic" style="width:100%;margin-top:6px">
        生成学习路径
      </el-button>
      <div v-if="pathData" class="path-result">
        <div v-for="(item, i) in (pathData.path_plan||[])" :key="i" class="path-step"
             @click="jumpToNode(item.name)">
          <span class="step-num">{{ i+1 }}</span>
          <span class="step-name">{{ item.name }}</span>
        </div>
      </div>
      <div v-if="pathError" class="path-error">{{ pathError }}</div>
      <div class="path-hint">提示：可搜索或点击图谱节点选择知识点</div>
    </div>

    <!-- 节点详情卡片 -->
    <transition name="slide-fade">
      <div class="ku-detail-card" v-if="detailData">
        <div class="card-title">
          <i class="el-icon-fa-bookmark"></i> {{ detailData.name }}
          <i class="el-icon-close detail-close" @click="detailData=null"></i>
        </div>
        <div class="detail-row">
          <span class="detail-label">关联题目</span>
          <span class="detail-value">{{ detailData.problemCount }} 道</span>
        </div>
        <div class="detail-row" v-if="meta && meta.isLoggedIn">
          <span class="detail-label">掌握度</span>
          <div class="mastery-bar-wrap">
            <div class="mastery-bar" :style="{width: (detailData.mastery*100)+'%', background: masteryColor(detailData.mastery)}"></div>
            <span class="mastery-text">{{ Math.round(detailData.mastery*100) }}%</span>
          </div>
        </div>
        <div class="detail-row" v-if="detailData.ac!==undefined">
          <span class="detail-label">AC / 尝试</span>
          <span class="detail-value">{{ detailData.ac }} / {{ detailData.attempted }}</span>
        </div>
        <el-button type="primary" size="small" icon="el-icon-arrow-right" @click="enterPod" style="width:100%;margin-top:10px">
          进入学习空间
        </el-button>
      </div>
    </transition>

    <!-- 图谱容器 -->
    <div class="ku-chart" ref="chart"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import api from '@oj/api'

export default {
  name: 'KnowledgeUniverse',
  data () {
    return {
      chart: null,
      rawNodes: [],
      rawEdges: [],
      meta: null,
      searchKeyword: '',
      detailData: null,
      selectMode: '',
      startTopic: '',
      targetTopic: '',
      pathData: null,
      pathError: '',
      pathLoading: false,
    }
  },
  mounted () {
    this.fetchData()
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy () {
    clearTimeout(this._freezeTimer)
    window.removeEventListener('resize', this.handleResize)
    if (this.chart) this.chart.dispose()
  },
  methods: {
    fetchData () {
      api.getKnowledgeUniverse().then(res => {
        const d = res.data
        this.rawNodes = d.nodes
        this.rawEdges = d.edges
        this.meta = d.meta
        this.$nextTick(() => this.render())
      }).catch(() => {
        this.$message.error('加载知识图谱失败')
      })
    },
    masteryColor (m) {
      if (m >= 0.7) return '#67C23A'
      if (m >= 0.4) return '#E6A23C'
      if (m > 0) return '#F56C6C'
      return '#2E6A99'
    },
    translateName (rawName) {
      const key = `m.tag.${rawName}`
      const t = this.$t(key)
      if (t && t !== key) return t
      const d = this.$t(`m.${rawName}`)
      if (d && d !== `m.${rawName}`) return d
      return rawName
    },
    render () {
      if (!this.$refs.chart) return
      if (!this.chart) {
        this.chart = echarts.init(this.$refs.chart)
        this.chart.on('click', (params) => {
          if (params.dataType === 'node') this.onNodeClick(params.data.name)
        })
      }
      const loggedIn = this.meta && this.meta.isLoggedIn
      const nodeData = this.rawNodes.map(n => {
        const displayName = this.translateName(n.name)
        const len = displayName.length
        let symbolSize = 45, fontSize = 12
        if (len > 8) { symbolSize = 55; fontSize = 11 }
        if (len > 12) { symbolSize = 65; fontSize = 10 }
        const color = loggedIn ? this.masteryColor(n.mastery || 0) : '#2E6A99'
        return {
          id: n.name,
          name: displayName,
          rawName: n.name,
          symbolSize,
          itemStyle: { color, borderColor: '#8BB8D0', borderWidth: 2, shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.4)' },
          label: {
            show: true, position: 'inside', color: '#fff', fontSize, fontWeight: 'bold',
            textShadow: '0 1px 4px #000',
            formatter: (p) => {
              const s = p.name
              if (s.length <= 6) return s
              if (s.length <= 12) { const m = Math.ceil(s.length/2); return s.slice(0,m)+'\n'+s.slice(m) }
              return s.slice(0,6)+'\n'+s.slice(6,12)+'…'
            }
          }
        }
      })
      const edgeData = this.rawEdges.map(e => ({
        source: e.source,
        target: e.target,
        lineStyle: e.type === 'related'
          ? { color: '#aaa', type: 'dashed', width: 1, opacity: 0.4, curveness: 0.2 }
          : { color: '#4A7A9E', width: 2, curveness: 0.2, opacity: 0.5 },
      }))
      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          backgroundColor: 'rgba(8,20,30,0.95)', borderColor: '#2E6A99',
          textStyle: { color: '#E8F1F8' },
          formatter: (p) => {
            if (p.dataType === 'node') {
              const n = this.rawNodes.find(x => x.name === p.data.rawName) || {}
              let s = `<b>${p.name}</b><br/>题目: ${n.problemCount || 0} 道`
              if (this.meta && this.meta.isLoggedIn) {
                s += `<br/>掌握度: ${Math.round((n.mastery||0)*100)}%`
              }
              return s
            }
            return `${p.data.source} → ${p.data.target}`
          }
        },
        series: [{
          type: 'graph', layout: 'force', roam: true, draggable: true,
          focusNodeAdjacency: true,
          emphasis: { focus: 'adjacency', lineStyle: { width: 3, opacity: 0.9 }, label: { fontWeight: 'bold' } },
          blur: { itemStyle: { opacity: 0.2 }, label: { opacity: 0.2 }, lineStyle: { opacity: 0.1 } },
          force: { repulsion: 800, edgeLength: 200, gravity: 0.08, friction: 0.6, layoutAnimation: false },
          data: nodeData, edges: edgeData,
          lineStyle: { color: '#4A7A9E', width: 2, curveness: 0.2, opacity: 0.5 },
          itemStyle: { color: '#2E6A99', borderColor: '#8BB8D0', borderWidth: 2 },
          label: { show: true, position: 'inside', color: '#fff', fontSize: 12, fontWeight: 'bold' },
          edgeSymbol: ['none', 'arrow'], edgeSymbolSize: [0, 10],
        }],
      }
      this.chart.setOption(option, true)
    },
    onNodeClick (rawName) {
      if (this.selectMode === 'start') {
        this.startTopic = rawName
        this.selectMode = 'target'
      } else if (this.selectMode === 'target') {
        this.targetTopic = rawName
        this.selectMode = ''
      } else {
        this.showDetail(rawName)
      }
    },
    showDetail (rawName) {
      const n = this.rawNodes.find(x => x.name === rawName)
      if (n) this.detailData = { ...n }
    },
    enterPod () {
      this.$router.push({ name: 'learning-pod', params: { topic: encodeURIComponent(this.detailData.name) } })
    },
    jumpToNode (name) {
      this.showDetail(name)
      this.chart && this.chart.dispatchAction({ type: 'highlight', seriesIndex: 0, name: this.translateName(name) })
    },
    fetchPath () {
      if (!this.targetTopic) return
      this.pathLoading = true
      this.pathError = ''
      this.pathData = null
      const params = { target_topic: this.targetTopic }
      if (this.startTopic) params.start_topic = this.startTopic
      api.getLearningPath(params).then(res => {
        this.pathData = res.data
      }).catch(err => {
        if (err.response && err.response.status === 404) {
          this.pathError = err.response.data.error || '未找到路径'
        } else {
          this.pathError = '网络错误'
        }
      }).finally(() => { this.pathLoading = false })
    },
    querySearchTopics (queryString, cb) {
      const names = this.rawNodes.map(n => ({ value: n.name }))
      const results = queryString
        ? names.filter(n => n.value.toLowerCase().includes(queryString.toLowerCase()))
        : names.slice(0, 20)
      cb(results)
    },
    onSearchInput () {
      if (!this.chart || !this.searchKeyword.trim()) { this.render(); return }
      const kw = this.searchKeyword.trim().toLowerCase()
      const opt = this.chart.getOption()
      const nodes = opt.series[0].data.map(n => ({
        ...n,
        itemStyle: n.rawName.toLowerCase().includes(kw)
          ? { color: '#FFEB3B', borderColor: '#fff', borderWidth: 3 }
          : { color: '#2E6A99', opacity: 0.3 },
        label: { show: n.rawName.toLowerCase().includes(kw), position: 'right', color: '#fff' },
      }))
      this.chart.setOption({ series: [{ data: nodes }] })
    },
    handleResize () { this.chart && this.chart.resize() },
  },
}
</script>

<style scoped>
.knowledge-universe {
  position: relative;
  width: 100%;
  height: 100vh;
  background: #0d1b2e;
  overflow: hidden;
}

.ku-toolbar {
  position: absolute; top: 0; left: 0; right: 0; z-index: 10;
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 20px;
  background: linear-gradient(180deg, rgba(13,27,46,0.9), transparent);
}
.ku-title { color: #fff; font-size: 20px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.ku-title i { font-size: 24px; color: #60a5fa; }
.ku-meta { font-size: 14px; font-weight: 400; color: rgba(255,255,255,0.85); }

/* 路径规划卡片 */
.ku-path-card {
  position: absolute; top: 64px; left: 20px; z-index: 10;
  width: 290px; padding: 18px;
  background: rgba(20,35,60,0.95);
  border: 1px solid rgba(74,122,158,0.3);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.5);
}
.card-title { font-size: 16px; font-weight: 600; color: #fff; margin-bottom: 12px; display: flex; align-items: center; gap: 4px; }
.path-field { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
.field-label { font-size: 14px; color: rgba(255,255,255,0.85); min-width: 42px; cursor: pointer; display: flex; align-items: center; gap: 2px; }
.field-label i.active { color: #4A9EE6; }
.path-result { margin-top: 10px; max-height: 220px; overflow-y: auto; }
.path-step { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 6px; cursor: pointer; font-size: 14px; }
.path-step:hover { background: rgba(74,122,158,0.2); }
.step-num { background: #4A7A9E; color: #fff; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 13px; }
.step-name { color: #fff; font-size: 15px; }
.path-error { color: #ff6b6b; font-size: 14px; margin-top: 8px; }
.path-hint { color: rgba(255,255,255,0.85); font-size: 13px; margin-top: 8px; }

/* 详情卡片 */
.ku-detail-card {
  position: absolute; top: 64px; right: 20px; z-index: 10;
  width: 300px; padding: 18px;
  background: rgba(20,35,60,0.95);
  border: 1px solid rgba(74,122,158,0.3);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.5);
}
.detail-close { margin-left: auto; cursor: pointer; color: rgba(255,255,255,0.85); }
.detail-close:hover { color: #ff6b6b; }
.detail-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(74,122,158,0.2); }
.detail-label { color: rgba(255,255,255,0.85); font-size: 15px; }
.detail-value { color: #fff; font-weight: 600; font-size: 15px; }
.mastery-bar-wrap { position: relative; flex: 1; height: 16px; margin-left: 12px; background: rgba(255,255,255,0.1); border-radius: 8px; overflow: hidden; }
.mastery-bar { height: 100%; border-radius: 8px; transition: width 0.3s; }
.mastery-text { position: absolute; right: 6px; top: 0; line-height: 16px; font-size: 11px; color: #fff; text-shadow: 0 0 2px rgba(0,0,0,0.5); }

.slide-fade-enter-active { transition: all 0.3s ease; }
.slide-fade-enter { transform: translateX(20px); opacity: 0; }

.ku-chart { width: 100%; height: 100%; }

/* el-input 深色风格 */
.ku-path-card /deep/ .el-input__inner {
  background: rgba(10,10,26,0.6);
  border-color: rgba(74,122,158,0.3);
  color: #fff;
}
.ku-path-card /deep/ .el-input.active .el-input__inner {
  border-color: #4A9EE6;
  box-shadow: 0 0 0 2px rgba(74,158,230,0.2);
}

/* autocomplete 下拉建议深色样式（popper 挂在 body 上，需要非 scoped） */
.dark-popper {
  background: rgba(20,35,60,0.95) !important;
  border: 1px solid rgba(74,122,158,0.3) !important;
}
.dark-popper .el-autocomplete-suggestion__wrap li {
  color: #E8F1F8 !important;
}
.dark-popper .el-autocomplete-suggestion__wrap li.hover,
.dark-popper .el-autocomplete-suggestion__wrap li:hover {
  background: rgba(74,122,158,0.2) !important;
}
</style>
