<template>
  <div class="exercise-sets-page">
    <el-row :gutter="20">
      <!-- 左侧主内容 -->
      <el-col :xs="24" :lg="18">
        <!-- 页面标题 -->
        <div class="page-header">
          <div class="header-left">
            <h2 class="page-title"><i class="el-icon-reading"></i> 题集练习</h2>
          </div>
          <div class="header-stats">
            <div class="hs-item">
              <span class="hs-num">{{ sets.length }}</span>
              <span class="hs-label">题集总数</span>
            </div>
            <div class="hs-divider"></div>
            <div class="hs-item">
              <span class="hs-num">{{ totalQuestions }}</span>
              <span class="hs-label">题目总数</span>
            </div>
            <div class="hs-divider"></div>
            <div class="hs-item">
              <span class="hs-num">{{ submittedCount }}</span>
              <span class="hs-label">已练习</span>
            </div>
          </div>
        </div>

        <!-- 筛选栏 -->
        <div class="filter-bar">
          <div class="filter-item">
            <span class="filter-label">知识点</span>
            <el-select v-model="filterTopic" placeholder="全部知识点" clearable size="small" style="width: 180px">
              <el-option v-for="t in topics" :key="t" :label="t" :value="t"></el-option>
            </el-select>
          </div>
          <div class="filter-item">
            <span class="filter-label">难度</span>
            <el-select v-model="filterDifficulty" placeholder="全部难度" clearable size="small" style="width: 140px">
              <el-option label="简单" value="Low"></el-option>
              <el-option label="中等" value="Mid"></el-option>
              <el-option label="困难" value="High"></el-option>
            </el-select>
          </div>
          <el-input v-model="searchKeyword" placeholder="搜索题集标题..." size="small" style="width: 200px" prefix-icon="el-icon-search" @input="filterBySearch" clearable></el-input>
          <el-button type="primary" size="small" icon="el-icon-search" @click="loadSets">筛选</el-button>
          <el-button size="small" icon="el-icon-refresh" @click="resetFilter">重置</el-button>
        </div>

        <!-- 题集卡片 -->
        <div v-loading="loading" class="cards-wrap">
          <el-row :gutter="16" v-if="filteredSets.length">
            <el-col :xs="24" :sm="12" :md="8" v-for="s in filteredSets" :key="s.id">
              <div class="set-card" :class="diffClass(s.difficulty)" @click="goDetail(s.id)">
                <div class="card-accent"></div>
                <div class="card-body">
                  <div class="card-top">
                    <span class="card-title">{{ s.title }}</span>
                    <span class="card-diff">{{ diffText(s.difficulty) }}</span>
                  </div>
                  <div class="card-tags">
                    <span class="card-topic" v-if="s.topic"><i class="el-icon-collection-tag"></i> {{ s.topic }}</span>
                    <span class="card-submitted" v-if="s.has_submitted"><i class="el-icon-circle-check"></i> 已提交</span>
                  </div>
                  <div class="card-meta">
                    <div class="meta-line">
                      <span class="meta-item"><i class="el-icon-document-copy"></i><b>{{ s.question_count || 0 }}</b> 题</span>
                      <span class="meta-item"><i class="el-icon-user"></i><b>{{ s.submission_count || 0 }}</b> 人</span>
                    </div>
                    <div class="meta-line">
                      <span class="meta-item" v-if="s.time_limit"><i class="el-icon-time"></i>{{ s.time_limit }} 分钟</span>
                      <span class="meta-item" v-else><i class="el-icon-time"></i>不限时</span>
                      <span class="meta-item" v-if="s.max_attempts"><i class="el-icon-edit-outline"></i>限 {{ s.max_attempts }} 次</span>
                      <span class="meta-item" v-else><i class="el-icon-edit-outline"></i>不限次</span>
                    </div>
                  </div>
                  <div class="card-action">
                    <span class="action-btn">开始练习 <i class="el-icon-arrow-right"></i></span>
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
          <div v-else-if="!loading" class="empty-hint">
            <i class="el-icon-folder-opened"></i>
            <p>暂无可用的题集</p>
          </div>
        </div>
      </el-col>

      <!-- 右侧边栏 -->
      <el-col :xs="24" :lg="6">
        <!-- 我的练习进度 -->
        <div class="side-card">
          <div class="side-title"><i class="el-icon-data-line"></i> 我的练习</div>
          <div class="progress-ring-wrap">
            <el-progress type="circle" :percentage="practiceProgress" :width="100" :stroke-width="8" :color="'#1e3a8a'"></el-progress>
            <div class="progress-text">
              <span class="progress-num">{{ submittedCount }} / {{ sets.length }}</span>
              <span class="progress-label">已完成题集</span>
            </div>
          </div>
          <div class="progress-stats">
            <div class="ps-row">
              <span class="ps-label"><i class="el-icon-circle-check" style="color:#19be6b"></i> 已完成</span>
              <span class="ps-val">{{ submittedCount }}</span>
            </div>
            <div class="ps-row">
              <span class="ps-label"><i class="el-icon-time" style="color:#f90"></i> 进行中</span>
              <span class="ps-val">0</span>
            </div>
            <div class="ps-row">
              <span class="ps-label"><i class="el-icon-document" style="color:#94a3b8"></i> 未开始</span>
              <span class="ps-val">{{ sets.length - submittedCount }}</span>
            </div>
          </div>
        </div>

        <!-- 难度分布 -->
        <div class="side-card" v-if="sets.length">
          <div class="side-title"><i class="el-icon-pie-chart"></i> 难度分布</div>
          <div class="diff-stat" v-for="d in difficultyDist" :key="d.key">
            <span class="diff-dot" :style="{ background: d.color }"></span>
            <span class="diff-name">{{ d.label }}</span>
            <div class="diff-bar-bg">
              <div class="diff-bar-fg" :style="{ width: d.percent + '%', background: d.color }"></div>
            </div>
            <span class="diff-count">{{ d.count }}</span>
          </div>
        </div>

        <!-- 热门题集 -->
        <div class="side-card">
          <div class="side-title"><i class="el-icon-star-on"></i> 热门题集</div>
          <div class="hot-list">
            <div
              v-for="(s, idx) in hotSets"
              :key="s.id"
              class="hot-item"
              @click="goDetail(s.id)"
            >
              <span class="hot-rank" :class="'rank-' + (idx + 1)">{{ idx + 1 }}</span>
              <div class="hot-info">
                <span class="hot-name">{{ s.title }}</span>
                <span class="hot-meta">{{ s.submission_count || 0 }} 人参与 · {{ diffText(s.difficulty) }}</span>
              </div>
              <i class="el-icon-arrow-right hot-arrow"></i>
            </div>
          </div>
        </div>

        <!-- 快捷入口 -->
        <div class="side-card">
          <div class="side-title"><i class="el-icon-s-grid"></i> 快捷入口</div>
          <div class="quick-links">
            <div class="ql-item" @click="$router.push('/problem')">
              <i class="el-icon-document-copy"></i>
              <span>题目列表</span>
            </div>
            <div class="ql-item" @click="$router.push('/immersion')">
              <i class="el-icon-magic-stick"></i>
              <span>沉浸式练习</span>
            </div>
            <div class="ql-item" @click="$router.push('/boss-exam')">
              <i class="el-icon-trophy"></i>
              <span>Boss 挑战</span>
            </div>
            <div class="ql-item" @click="$router.push('/algorithm-viz')">
              <i class="el-icon-discover"></i>
              <span>算法可视化</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import api from '@oj/api'

export default {
  name: 'ExerciseSets',
  data () {
    return {
      loading: false,
      sets: [],
      topics: [],
      filterTopic: '',
      filterDifficulty: '',
      searchKeyword: ''
    }
  },
  mounted () {
    this.loadTopics()
    this.loadSets()
  },
  methods: {
    loadTopics () {
      api.getExerciseTopics().then(res => {
        this.topics = (res.data && res.data.topics) || []
      }).catch(() => {})
    },
    loadSets () {
      this.loading = true
      const params = {}
      if (this.filterTopic) params.topic = this.filterTopic
      if (this.filterDifficulty) params.difficulty = this.filterDifficulty
      api.getExerciseSets(params).then(res => {
        this.sets = res.data.data || res.data || []
      }).catch(() => {
        this.$message.error('加载题集失败')
      }).finally(() => { this.loading = false })
    },
    resetFilter () {
      this.filterTopic = ''
      this.filterDifficulty = ''
      this.searchKeyword = ''
      this.loadSets()
    },
    filterBySearch () {
      // 即时过滤，无需重新请求
    },
    goDetail (id) {
      this.$router.push({ name: 'exercise-detail', params: { id } })
    },
    diffClass (d) {
      return 'diff-' + (d || 'Mid').toLowerCase()
    },
    diffText (d) {
      return { Low: '简单', Mid: '中等', High: '困难' }[d] || d || '未知'
    }
  },
  computed: {
    filteredSets () {
      if (!this.searchKeyword) return this.sets
      let kw = this.searchKeyword.toLowerCase()
      return this.sets.filter(s => (s.title || '').toLowerCase().includes(kw))
    },
    totalQuestions () {
      return this.sets.reduce((sum, s) => sum + (s.question_count || 0), 0)
    },
    submittedCount () {
      return this.sets.filter(s => s.has_submitted).length
    },
    practiceProgress () {
      if (!this.sets.length) return 0
      return Math.round(this.submittedCount / this.sets.length * 100)
    },
    difficultyDist () {
      let counts = { Low: 0, Mid: 0, High: 0 }
      this.sets.forEach(s => {
        let d = s.difficulty || 'Mid'
        if (counts[d] !== undefined) counts[d]++
      })
      let total = this.sets.length || 1
      return [
        { key: 'Low', label: '简单', count: counts.Low, percent: Math.round(counts.Low / total * 100), color: '#19be6b' },
        { key: 'Mid', label: '中等', count: counts.Mid, percent: Math.round(counts.Mid / total * 100), color: '#f90' },
        { key: 'High', label: '困难', count: counts.High, percent: Math.round(counts.High / total * 100), color: '#ed3f14' }
      ]
    },
    hotSets () {
      return [...this.sets].sort((a, b) => (b.submission_count || 0) - (a.submission_count || 0)).slice(0, 5)
    }
  }
}
</script>

<style scoped>
.exercise-sets-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

/* 页面标题 */
.page-header {
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  border-radius: 12px;
  padding: 24px 28px;
  color: #fff;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 16px rgba(30, 58, 138, 0.25);
}
.header-left .page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.header-left .page-title i { font-size: 26px; }
.header-left .page-sub {
  font-size: 14px;
  opacity: 0.85;
  margin: 0;
}
.header-stats {
  display: flex;
  align-items: center;
  gap: 20px;
}
.hs-item {
  text-align: center;
}
.hs-num {
  display: block;
  font-size: 26px;
  font-weight: 700;
}
.hs-label {
  font-size: 13px;
  opacity: 0.8;
}
.hs-divider {
  width: 1px;
  height: 36px;
  background: rgba(255, 255, 255, 0.2);
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fff;
  padding: 16px 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  flex-wrap: wrap;
}
.filter-item { display: flex; align-items: center; gap: 8px; }
.filter-label { font-size: 15px; color: #606266; }
.filter-bar /deep/ .el-button--primary {
  background: #1e3a8a;
  border-color: #1e3a8a;
}
.filter-bar /deep/ .el-button--primary:hover {
  background: #2950b3;
  border-color: #2950b3;
}

.cards-wrap { min-height: 300px; }

/* ============ 题集卡片 ============ */
.set-card {
  position: relative;
  height: 220px;
  margin-bottom: 20px;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  background: #fff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s;
  display: flex;
  flex-direction: column;
}
.set-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(30, 58, 138, 0.18);
  border-color: #c7d2fe;
}

.card-accent {
  height: 6px;
  width: 100%;
  background: linear-gradient(90deg, #1e3a8a, #3b82f6);
}
.set-card.diff-low .card-accent {
  background: linear-gradient(90deg, #059669, #34d399);
}
.set-card.diff-mid .card-accent {
  background: linear-gradient(90deg, #d97706, #fbbf24);
}
.set-card.diff-high .card-accent {
  background: linear-gradient(90deg, #dc2626, #f87171);
}

.card-body {
  flex: 1;
  padding: 16px 18px 14px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 10px;
}
.card-title {
  font-size: 17px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.4;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.card-diff {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  padding: 2px 8px;
  border-radius: 10px;
  background: #f3f4f6;
  white-space: nowrap;
  flex-shrink: 0;
}
.set-card.diff-low .card-diff { color: #059669; background: #d1fae5; }
.set-card.diff-mid .card-diff { color: #d97706; background: #fef3c7; }
.set-card.diff-high .card-diff { color: #dc2626; background: #fee2e2; }

.card-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 12px;
  min-height: 22px;
}
.card-topic {
  font-size: 13px;
  color: #1e3a8a;
  background: #eff6ff;
  padding: 2px 10px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid #dbeafe;
}
.card-topic i { font-size: 11px; }
.card-submitted {
  font-size: 13px;
  color: #059669;
  background: #d1fae5;
  padding: 2px 10px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid #a7f3d0;
}
.card-submitted i { font-size: 11px; }

.card-meta {
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px dashed #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.meta-line {
  display: flex;
  gap: 14px;
  font-size: 13px;
  color: #6b7280;
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
.meta-item i { color: #9ca3af; font-size: 15px; }
.meta-item b { color: #1f2937; font-weight: 600; }

.card-action {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
.action-btn {
  font-size: 14px;
  font-weight: 600;
  color: #1e3a8a;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 14px;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  transition: all 0.2s;
}
.set-card:hover .action-btn {
  background: #1e3a8a;
  color: #fff;
  border-color: #1e3a8a;
}

.empty-hint {
  text-align: center;
  padding: 80px 20px;
  color: #c0c4cc;
}
.empty-hint i { font-size: 56px; }
.empty-hint p { font-size: 18px; margin-top: 16px; }

/* ============ 右侧边栏 ============ */
.side-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
.side-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e3a8a;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 2px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 练习进度环 */
.progress-ring-wrap {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}
.progress-text {
  flex: 1;
}
.progress-num {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #1e3a8a;
}
.progress-label {
  font-size: 13px;
  color: #94a3b8;
}

.progress-stats {
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}
.ps-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 14px;
}
.ps-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
}
.ps-val {
  font-weight: 600;
  color: #1e3a8a;
}

/* 难度分布 */
.diff-stat {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 14px;
}
.diff-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.diff-name {
  width: 36px;
  color: #475569;
  flex-shrink: 0;
  font-size: 14px;
}
.diff-bar-bg {
  flex: 1;
  height: 6px;
  background: #f1f5f9;
  border-radius: 3px;
  overflow: hidden;
}
.diff-bar-fg {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s ease;
}
.diff-count {
  width: 24px;
  text-align: right;
  font-weight: 600;
  color: #1e3a8a;
  font-size: 14px;
}

/* 热门题集 */
.hot-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.hot-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}
.hot-item:hover {
  background: #f0f4f8;
}
.hot-rank {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  background: #e2e8f0;
  color: #64748b;
  flex-shrink: 0;
}
.hot-rank.rank-1 { background: #fbbf24; color: #fff; }
.hot-rank.rank-2 { background: #94a3b8; color: #fff; }
.hot-rank.rank-3 { background: #cd7f32; color: #fff; }
.hot-info {
  flex: 1;
  min-width: 0;
}
.hot-name {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hot-meta {
  font-size: 12px;
  color: #94a3b8;
}
.hot-arrow {
  color: #cbd5e1;
  font-size: 12px;
}

/* 快捷入口 */
.quick-links {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ql-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  color: #475569;
  transition: all 0.2s;
}
.ql-item i {
  font-size: 18px;
  color: #1e3a8a;
}

@media (max-width: 992px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  .header-stats {
    width: 100%;
    justify-content: center;
  }
}
</style>
