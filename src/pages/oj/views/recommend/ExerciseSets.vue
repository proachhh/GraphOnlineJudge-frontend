<template>
  <div class="exercise-sets-page">
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
      <el-button type="primary" size="small" icon="el-icon-search" @click="loadSets">筛选</el-button>
      <el-button size="small" icon="el-icon-refresh" @click="resetFilter">重置</el-button>
    </div>

    <!-- 题集卡片 -->
    <div v-loading="loading" class="cards-wrap">
      <el-row :gutter="20" v-if="sets.length">
        <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="s in sets" :key="s.id">
          <div class="set-card" :class="diffClass(s.difficulty)" @click="goDetail(s.id)">
            <!-- 顶部色带（按难度区分颜色） -->
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
              <!-- 固定占位的元信息区，避免高度跳动 -->
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
      filterDifficulty: ''
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
      this.loadSets()
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
  }
}
</script>

<style scoped>
.exercise-sets-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

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
.filter-label { font-size: 14px; color: #606266; }
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

/* 顶部色带：按难度区分 */
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
  font-size: 16px;
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
  font-size: 12px;
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
  font-size: 12px;
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
  font-size: 12px;
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

/* 元信息区：两行固定结构，无论是否有限次/限时都填满 */
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
  font-size: 12px;
  color: #6b7280;
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
.meta-item i { color: #9ca3af; font-size: 13px; }
.meta-item b { color: #1f2937; font-weight: 600; }

.card-action {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
.action-btn {
  font-size: 13px;
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
.empty-hint p { font-size: 16px; margin-top: 16px; }
</style>
