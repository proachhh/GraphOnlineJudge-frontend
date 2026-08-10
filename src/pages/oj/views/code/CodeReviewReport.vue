<template>
  <div class="code-review-page">
    <!-- 页头 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="header-title">AI 代码审查报告</h2>
      </div>
    </div>

    <!-- 提交ID输入 -->
    <Card class="input-card" v-if="!reviewData && !loading">
      <div class="input-area">
        <Input v-model="submissionId" placeholder="输入提交记录 ID（如 12345）" style="width: 300px" @on-enter="fetchReview" />
        <Button type="primary" @click="fetchReview" :loading="loading">
          <Icon type="ios-search"></Icon>
          开始审查
        </Button>
      </div>
      <p class="hint">输入你的提交记录 ID，AI 将分析代码的时间/空间复杂度、代码质量、安全性并给出优化建议</p>
    </Card>

    <!-- 加载中 -->
    <Card class="loading-card" v-if="loading">
      <div class="loading-area">
        <Spin size="large"></Spin>
        <p>AI 正在分析你的代码...</p>
        <p class="sub-text">分析维度：复杂度推断、代码风格、安全检测、优化建议</p>
      </div>
    </Card>

    <!-- 审查报告 -->
    <div class="report-body" v-if="reviewData && !loading">
      <!-- 总分卡片 -->
      <Card class="score-card">
        <div class="score-display">
          <div class="score-ring" :style="ringStyle">
            <span class="score-num">{{ reviewData.overall_score }}</span>
            <span class="score-label">总分</span>
          </div>
          <div class="score-info">
            <h3 class="info-title">{{ scoreLevel.text }}</h3>
            <p class="info-sub">{{ reviewData.summary }}</p>
          </div>
        </div>
      </Card>

      <!-- 四维雷达图 + 复杂度 -->
      <Row :gutter="16" class="report-row">
        <Col :span="14">
          <Card class="radar-card">
            <div class="card-title">
              <Icon type="ios-analytics" color="#1e3a8a"></Icon>
              <span>代码质量维度</span>
            </div>
            <div ref="radarChart" class="radar-chart"></div>
          </Card>
        </Col>
        <Col :span="10">
          <Card class="complexity-card">
            <div class="card-title">
              <Icon type="ios-pulse" color="#1e3a8a"></Icon>
              <span>复杂度分析</span>
            </div>
            <div class="complexity-body">
              <div class="cx-item">
                <span class="cx-label">时间复杂度</span>
                <span class="cx-value time-cx">{{ reviewData.time_complexity || 'N/A' }}</span>
              </div>
              <div class="cx-item">
                <span class="cx-label">空间复杂度</span>
                <span class="cx-value space-cx">{{ reviewData.space_complexity || 'N/A' }}</span>
              </div>
              <div class="cx-desc">{{ reviewData.complexity_analysis }}</div>
            </div>
          </Card>
        </Col>
      </Row>

      <!-- 问题列表 -->
      <Card class="issues-card" v-if="reviewData.issues && reviewData.issues.length > 0">
        <div class="card-title">
          <Icon type="ios-warning" color="#ef4444"></Icon>
          <span>发现的问题（{{ reviewData.issues.length }}）</span>
        </div>
        <div class="issues-list">
          <div class="issue-item" v-for="(issue, i) in reviewData.issues" :key="i">
            <div class="issue-header">
              <span class="issue-severity" :class="'sev-' + issue.severity">{{ severityText(issue.severity) }}</span>
              <span class="issue-type">{{ issue.type }}</span>
            </div>
            <p class="issue-desc">{{ issue.description }}</p>
            <p class="issue-fix"><Icon type="ios-bulb" color="#f59e0b"></Icon> {{ issue.suggestion }}</p>
          </div>
        </div>
      </Card>

      <!-- 优化建议 -->
      <Card class="optim-card" v-if="reviewData.optimizations && reviewData.optimizations.length > 0">
        <div class="card-title">
          <Icon type="ios-trending-up" color="#19be6b"></Icon>
          <span>优化建议</span>
        </div>
        <div class="optim-list">
          <div class="optim-item" v-for="(opt, i) in reviewData.optimizations" :key="i">
            <span class="optim-num">{{ i + 1 }}</span>
            <span class="optim-text">{{ opt }}</span>
          </div>
        </div>
      </Card>

      <!-- 最优解法 -->
      <Card class="optimal-card" v-if="reviewData.optimal_approach">
        <div class="card-title">
          <Icon type="ios-star" color="#f59e0b"></Icon>
          <span>最优解法参考</span>
        </div>
        <p class="optimal-text">{{ reviewData.optimal_approach }}</p>
      </Card>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import api from '@oj/api'

export default {
  data () {
    return {
      submissionId: this.$route.query.submission_id || '',
      loading: false,
      reviewData: null,
      radarChartInstance: null
    }
  },
  computed: {
    ringStyle () {
      const score = (this.reviewData && this.reviewData.overall_score) || 0
      const color = score >= 80 ? '#19be6b' : score >= 60 ? '#f59e0b' : '#ef4444'
      const deg = (score / 100) * 360
      return {
        background: `conic-gradient(${color} ${deg}deg, #e2e8f0 ${deg}deg)`
      }
    },
    scoreLevel () {
      const s = (this.reviewData && this.reviewData.overall_score) || 0
      if (s >= 90) return { text: '优秀', color: '#19be6b' }
      if (s >= 80) return { text: '良好', color: '#3b82f6' }
      if (s >= 60) return { text: '及格', color: '#f59e0b' }
      return { text: '需改进', color: '#ef4444' }
    }
  },
  mounted () {
    if (this.submissionId) {
      this.fetchReview()
    }
  },
  methods: {
    async fetchReview () {
      if (!this.submissionId) {
        this.$Message.warning('请输入提交记录 ID')
        return
      }
      this.loading = true
      this.reviewData = null
      try {
        const res = await api.codeReviewStructured({ submission_id: this.submissionId })
        const data = res.data.data
        if (data.structured === false) {
          this.$Message.warning('AI 返回了非结构化数据，请查看文本')
          this.reviewData = {
            overall_score: 0,
            dimensions: { efficiency: 0, readability: 0, security: 0, style: 0 },
            time_complexity: 'N/A',
            space_complexity: 'N/A',
            complexity_analysis: data.review || '分析失败',
            issues: [],
            optimizations: [],
            optimal_approach: '',
            summary: data.review || ''
          }
        } else {
          this.reviewData = data
          this.$nextTick(() => {
            this.renderRadar()
          })
        }
      } catch (err) {
        this.$Message.error((err && err.data && err.data.error) || '审查失败')
      } finally {
        this.loading = false
      }
    },
    renderRadar () {
      if (this.$refs.radarChart) {
        if (this.radarChartInstance) {
          this.radarChartInstance.dispose()
        }
        this.radarChartInstance = echarts.init(this.$refs.radarChart)
        const dims = this.reviewData.dimensions || {}
        this.radarChartInstance.setOption({
          tooltip: {},
          radar: {
            indicator: [
              { name: '效率', max: 100 },
              { name: '可读性', max: 100 },
              { name: '安全性', max: 100 },
              { name: '风格', max: 100 }
            ],
            shape: 'polygon',
            splitNumber: 5,
            axisName: { color: '#64748b', fontSize: 13 },
            splitLine: { lineStyle: { color: '#e2e8f0' } },
            splitArea: { areaStyle: { color: ['#f8fafc', '#fff'] } },
            axisLine: { lineStyle: { color: '#e2e8f0' } }
          },
          series: [{
            type: 'radar',
            data: [{
              value: [
                dims.efficiency || 0,
                dims.readability || 0,
                dims.security || 0,
                dims.style || 0
              ],
              name: '代码评分',
              areaStyle: { color: 'rgba(30, 58, 138, 0.2)' },
              lineStyle: { color: '#1e3a8a', width: 2 },
              itemStyle: { color: '#1e3a8a' },
              label: { show: true, fontSize: 13, fontWeight: 600 }
            }]
          }]
        })
      }
    },
    severityText (sev) {
      const map = { high: '严重', medium: '中等', low: '轻微' }
      return map[sev] || sev
    }
  },
  beforeDestroy () {
    if (this.radarChartInstance) {
      this.radarChartInstance.dispose()
    }
  }
}
</script>

<style lang="less" scoped>
.code-review-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 16px;

  .header-title {
    font-size: 24px;
    font-weight: 700;
    color: #1e3a8a;
    margin: 0;
  }
}

.input-card, .loading-card {
  margin-bottom: 16px;
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

  .input-area {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-bottom: 8px;
  }

  .hint {
    color: #94a3b8;
    font-size: 13px;
    margin: 0;
  }
}

.loading-area {
  text-align: center;
  padding: 40px;

  p {
    margin: 12px 0 0;
    color: #64748b;
    font-size: 15px;
  }

  .sub-text {
    font-size: 13px;
    color: #94a3b8;
  }
}

.report-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.score-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

  .score-display {
    display: flex;
    align-items: center;
    gap: 32px;
    padding: 8px 0;
  }

  .score-ring {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    flex-shrink: 0;

    &::before {
      content: '';
      position: absolute;
      width: 96px;
      height: 96px;
      border-radius: 50%;
      background: #fff;
    }

    .score-num {
      position: relative;
      font-size: 36px;
      font-weight: 700;
      color: #1e3a8a;
      line-height: 1;
    }

    .score-label {
      position: relative;
      font-size: 13px;
      color: #64748b;
      margin-top: 2px;
    }
  }

  .score-info {
    flex: 1;

    .info-title {
      font-size: 22px;
      font-weight: 700;
      color: #1e3a8a;
      margin: 0 0 8px;
    }

    .info-sub {
      font-size: 14px;
      color: #64748b;
      line-height: 1.6;
      margin: 0;
    }
  }
}

.report-row {
  margin-bottom: 0 !important;
}

.radar-card, .complexity-card, .issues-card, .optim-card, .optimal-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 700;
  color: #1e3a8a;
  margin-bottom: 12px;
}

.radar-chart {
  width: 100%;
  height: 300px;
}

.complexity-card {
  .complexity-body {
    padding: 4px 0;
  }

  .cx-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #f8fafc;
    border-radius: 8px;
    margin-bottom: 8px;

    .cx-label {
      font-size: 14px;
      color: #64748b;
      min-width: 80px;
    }

    .cx-value {
      font-family: 'Fira Code', monospace;
      font-size: 18px;
      font-weight: 700;
      padding: 2px 12px;
      border-radius: 6px;

      &.time-cx {
        color: #1e3a8a;
        background: #dbeafe;
      }

      &.space-cx {
        color: #7c3aed;
        background: #ede9fe;
      }
    }
  }

  .cx-desc {
    font-size: 13px;
    color: #64748b;
    line-height: 1.6;
    padding: 8px 0 0;
  }
}

.issues-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.issue-item {
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 4px solid #e2e8f0;

  .issue-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }

  .issue-severity {
    font-size: 12px;
    font-weight: 600;
    padding: 2px 10px;
    border-radius: 10px;

    &.sev-high {
      color: #fff;
      background: #ef4444;
    }

    &.sev-medium {
      color: #fff;
      background: #f59e0b;
    }

    &.sev-low {
      color: #fff;
      background: #3b82f6;
    }
  }

  .issue-type {
    font-size: 12px;
    color: #64748b;
    background: #f1f5f9;
    padding: 2px 8px;
    border-radius: 4px;
  }

  .issue-desc {
    font-size: 14px;
    color: #1e293b;
    line-height: 1.6;
    margin: 0 0 4px;
  }

  .issue-fix {
    font-size: 13px;
    color: #19be6b;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.optim-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.optim-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  background: #f0fdf4;
  border-radius: 8px;

  .optim-num {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #19be6b;
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .optim-text {
    font-size: 14px;
    color: #1e293b;
    line-height: 1.5;
  }
}

.optimal-text {
  font-size: 14px;
  color: #1e293b;
  line-height: 1.7;
  margin: 0;
  padding: 12px 16px;
  background: #fffbeb;
  border-radius: 8px;
  border-left: 4px solid #f59e0b;
}
</style>
