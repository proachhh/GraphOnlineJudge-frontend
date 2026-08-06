<template>
  <div class="boss-exams-page">
    <!-- 顶部标题 -->
    <div class="page-header">
      <div class="header-title">
        <i class="el-icon-trophy"></i>
        <span>Boss 试卷</span>
        <span class="boss-badge">BOSS</span>
      </div>
      <div class="header-sub">挑战 Boss 试卷，检验综合知识掌握，通过即解锁下一阶段</div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-item">
        <span class="filter-label">领域</span>
        <el-select v-model="filterArea" placeholder="全部领域" clearable size="small" style="width: 180px">
          <el-option v-for="t in topicAreas" :key="t" :label="t" :value="t"></el-option>
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
      <el-button type="primary" size="small" icon="el-icon-search" @click="loadExams">筛选</el-button>
      <el-button size="small" icon="el-icon-refresh" @click="resetFilter">重置</el-button>
    </div>

    <!-- Boss 试卷卡片 -->
    <div v-loading="loading" class="cards-wrap">
      <el-row :gutter="20" v-if="exams.length">
        <el-col :xs="24" :sm="12" :md="8" v-for="e in exams" :key="e.id">
          <el-card class="boss-card" shadow="hover" @click.native="goDetail(e.id)">
            <div class="card-top">
              <span class="card-title">{{ e.title }}</span>
              <el-tag size="mini" :type="diffTag(e.difficulty)" effect="dark">{{ diffText(e.difficulty) }}</el-tag>
            </div>
            <div class="card-desc">{{ e.description || '暂无描述' }}</div>
            <div class="boss-topic-box" v-if="e.boss_topic">
              <i class="el-icon-aim"></i>
              <span class="boss-topic-label">Boss 知识点：</span>
              <span class="boss-topic-name">{{ e.boss_topic }}</span>
            </div>
            <div class="card-tags">
              <el-tag size="small" type="info" v-if="e.topic_area">{{ e.topic_area }}</el-tag>
              <el-tag size="small" type="danger" effect="plain" v-if="e.passing_score != null">及格 {{ e.passing_score }} 分</el-tag>
              <el-tag size="small" v-if="e.has_submitted" type="success">已挑战</el-tag>
            </div>
            <div class="card-meta">
              <span class="meta-item"><i class="el-icon-document-copy"></i> {{ e.question_count || 0 }} 题</span>
              <span class="meta-item"><i class="el-icon-user"></i> {{ e.submission_count || 0 }} 人挑战</span>
              <span class="meta-item" v-if="e.time_limit"><i class="el-icon-time"></i> {{ e.time_limit }} 分钟</span>
            </div>
            <div class="card-action">
              <el-button type="danger" size="mini" plain>接受挑战 <i class="el-icon-arrow-right"></i></el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <div v-else-if="!loading" class="empty-hint">
        <i class="el-icon-trophy"></i>
        <p>暂无可挑战的 Boss 试卷</p>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@oj/api'

export default {
  name: 'BossExams',
  data () {
    return {
      loading: false,
      exams: [],
      topicAreas: [],
      filterArea: '',
      filterDifficulty: ''
    }
  },
  mounted () {
    this.loadTopics()
    this.loadExams()
  },
  methods: {
    loadTopics () {
      api.getTeacherTopics().then(res => {
        this.topicAreas = (res.data && res.data.topics) || []
      }).catch(() => {})
    },
    loadExams () {
      this.loading = true
      const params = {}
      if (this.filterArea) params.topic_area = this.filterArea
      if (this.filterDifficulty) params.difficulty = this.filterDifficulty
      api.getBossExams(params).then(res => {
        this.exams = res.data.data || res.data || []
      }).catch(() => {
        this.$message.error('加载 Boss 试卷失败')
      }).finally(() => { this.loading = false })
    },
    resetFilter () {
      this.filterArea = ''
      this.filterDifficulty = ''
      this.loadExams()
    },
    goDetail (id) {
      this.$router.push({ name: 'boss-exam-detail', params: { id } })
    },
    diffTag (d) {
      return { Low: 'success', Mid: 'warning', High: 'danger' }[d] || 'info'
    },
    diffText (d) {
      return { Low: '简单', Mid: '中等', High: '困难' }[d] || d || '未知'
    }
  }
}
</script>

<style scoped>
.boss-exams-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  background: linear-gradient(135deg, #0d1b2e 0%, #4a1010 100%);
  border-radius: 10px;
  padding: 24px 28px;
  color: #fff;
  margin-bottom: 20px;
  box-shadow: 0 4px 14px rgba(74, 16, 16, 0.3);
  position: relative;
  overflow: hidden;
}
.page-header::after {
  content: '';
  position: absolute;
  right: -30px;
  top: -30px;
  width: 160px;
  height: 160px;
  background: radial-gradient(circle, rgba(245, 108, 108, 0.2), transparent 70%);
  border-radius: 50%;
}
.header-title {
  font-size: 24px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}
.header-title i { font-size: 28px; color: #f56c6c; }
.boss-badge {
  background: #f56c6c;
  color: #fff;
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 4px;
  font-weight: 700;
  letter-spacing: 1px;
}
.header-sub {
  font-size: 14px;
  opacity: 0.85;
  margin-top: 6px;
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
  background: #c0392b;
  border-color: #c0392b;
}
.filter-bar /deep/ .el-button--primary:hover {
  background: #d04438;
  border-color: #d04438;
}

.cards-wrap { min-height: 300px; }

.boss-card {
  border-radius: 10px;
  margin-bottom: 20px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid #ebeef5;
  border-top: 3px solid #c0392b;
}
.boss-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(192, 57, 43, 0.18);
}
.boss-card /deep/ .el-card__body { padding: 18px; }

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
  color: #c0392b;
  line-height: 1.4;
  flex: 1;
}
.card-desc {
  font-size: 13px;
  color: #909399;
  line-height: 1.6;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 42px;
}
.boss-topic-box {
  background: rgba(192, 57, 43, 0.08);
  border-radius: 6px;
  padding: 8px 12px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}
.boss-topic-box i { color: #c0392b; }
.boss-topic-label { color: #909399; }
.boss-topic-name { color: #c0392b; font-weight: 600; }

.card-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.card-meta {
  display: flex;
  gap: 14px;
  font-size: 13px;
  color: #606266;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
  flex-wrap: wrap;
}
.meta-item { display: flex; align-items: center; gap: 4px; }
.meta-item i { color: #c0392b; }
.card-action { margin-top: 12px; }
.card-action /deep/ .el-button--danger {
  color: #c0392b;
  background: rgba(192, 57, 43, 0.08);
  border-color: rgba(192, 57, 43, 0.3);
}
.card-action /deep/ .el-button--danger:hover {
  background: #c0392b;
  color: #fff;
}

.empty-hint {
  text-align: center;
  padding: 80px 20px;
  color: #c0c4cc;
}
.empty-hint i { font-size: 56px; }
.empty-hint p { font-size: 16px; margin-top: 16px; }
</style>
