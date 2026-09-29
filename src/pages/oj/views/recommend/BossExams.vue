<template>
  <div class="boss-exams-page">
    <el-row :gutter="20">
      <!-- 左侧主内容 -->
      <el-col :xs="24" :lg="18">
        <!-- 顶部标题 -->
        <div class="page-header">
          <div class="header-left">
            <div class="header-title">
              <i class="el-icon-trophy"></i>
              <span>{{ $t('m.BE_Title') }}</span>
              <span class="boss-badge">BOSS</span>
            </div>
            <div class="header-sub">{{ $t('m.BE_Sub') }}</div>
          </div>
          <div class="header-stats">
            <div class="hs-item">
              <span class="hs-num">{{ exams.length }}</span>
              <span class="hs-label">{{ $t('m.BE_Total_Boss') }}</span>
            </div>
            <div class="hs-divider"></div>
            <div class="hs-item">
              <span class="hs-num">{{ challengedCount }}</span>
              <span class="hs-label">{{ $t('m.BE_Challenged') }}</span>
            </div>
            <div class="hs-divider"></div>
            <div class="hs-item">
              <span class="hs-num">{{ totalChallengers }}</span>
              <span class="hs-label">{{ $t('m.BE_Total_Challengers') }}</span>
            </div>
          </div>
        </div>

        <!-- 筛选栏 -->
        <div class="filter-bar">
          <div class="filter-item">
            <span class="filter-label">{{ $t('m.BE_Filter_Area') }}</span>
            <el-select v-model="filterArea" :placeholder="$t('m.BE_All_Areas')" clearable size="small" style="width: 180px">
              <el-option v-for="t in topicAreas" :key="t" :label="t" :value="t"></el-option>
            </el-select>
          </div>
          <div class="filter-item">
            <span class="filter-label">{{ $t('m.ES_Filter_Difficulty') }}</span>
            <el-select v-model="filterDifficulty" :placeholder="$t('m.ES_All_Difficulty')" clearable size="small" style="width: 140px">
              <el-option :label="$t('m.ES_Diff_Low')" value="Low"></el-option>
              <el-option :label="$t('m.ES_Diff_Mid')" value="Mid"></el-option>
              <el-option :label="$t('m.ES_Diff_High')" value="High"></el-option>
            </el-select>
          </div>
          <el-input v-model="searchKeyword" :placeholder="$t('m.BE_Search_Placeholder')" size="small" style="width: 180px" prefix-icon="el-icon-search" clearable></el-input>
          <el-button type="primary" size="small" icon="el-icon-search" @click="loadExams">{{ $t('m.ES_Filter') }}</el-button>
          <el-button size="small" icon="el-icon-refresh" @click="resetFilter">{{ $t('m.ES_Reset') }}</el-button>
        </div>

        <!-- Boss 试卷卡片 -->
        <div v-loading="loading" class="cards-wrap">
          <el-row :gutter="16" v-if="filteredExams.length">
            <el-col :xs="24" :sm="12" :md="8" v-for="e in filteredExams" :key="e.id">
              <el-card class="boss-card" shadow="hover" @click.native="goDetail(e.id)">
                <div class="card-top">
                  <span class="card-title">{{ e.title }}</span>
                  <el-tag size="mini" :type="diffTag(e.difficulty)" effect="dark">{{ diffText(e.difficulty) }}</el-tag>
                </div>
                <div class="card-desc">{{ e.description || $t('m.BE_No_Desc') }}</div>
                <div class="boss-topic-box" v-if="e.boss_topic">
                  <i class="el-icon-aim"></i>
                  <span class="boss-topic-label">{{ $t('m.BE_Topic_Label') }}</span>
                  <span class="boss-topic-name">{{ e.boss_topic }}</span>
                </div>
                <div class="card-tags">
                  <el-tag size="small" type="info" v-if="e.topic_area">{{ e.topic_area }}</el-tag>
                  <el-tag size="small" type="danger" effect="plain" v-if="e.passing_score != null">{{ $t('m.BE_Pass_Score', {n: e.passing_score}) }}</el-tag>
                  <el-tag size="small" v-if="e.has_submitted" type="success">{{ $t('m.BE_Challenged') }}</el-tag>
                </div>
                <div class="card-meta">
                  <span class="meta-item"><i class="el-icon-document-copy"></i> {{ e.question_count || 0 }} {{ $t('m.ES_Question_Unit') }}</span>
                  <span class="meta-item"><i class="el-icon-user"></i> {{ $t('m.BE_People_Challenged', {n: e.submission_count || 0}) }}</span>
                  <span class="meta-item" v-if="e.time_limit"><i class="el-icon-time"></i> {{ e.time_limit }} {{ $t('m.ES_Minutes') }}</span>
                </div>
                <div class="card-action">
                  <el-button type="danger" size="mini" plain>{{ $t('m.BE_Accept') }} <i class="el-icon-arrow-right"></i></el-button>
                </div>
              </el-card>
            </el-col>
          </el-row>
          <div v-else-if="!loading" class="empty-hint">
            <i class="el-icon-trophy"></i>
            <p>{{ $t('m.BE_Empty') }}</p>
          </div>
        </div>
      </el-col>

      <!-- 右侧边栏 -->
      <el-col :xs="24" :lg="6">
        <!-- 我的挑战记录 -->
        <div class="side-card">
          <div class="side-title"><i class="el-icon-medal"></i> {{ $t('m.BE_My_Challenge') }}</div>
          <div class="challenge-summary">
            <div class="cs-ring-wrap">
              <el-progress type="circle" :percentage="passRate" :width="90" :stroke-width="7" :color="'#c0392b'"></el-progress>
              <div class="cs-ring-text">
                <span class="cs-passed">{{ challengedCount }}</span>
                <span class="cs-total">/ {{ exams.length }}</span>
              </div>
            </div>
            <div class="cs-stats">
              <div class="cs-row">
                <span class="cs-label"><i class="el-icon-circle-check" style="color:#19be6b"></i> {{ $t('m.BE_Challenged') }}</span>
                <span class="cs-val">{{ challengedCount }}</span>
              </div>
              <div class="cs-row">
                <span class="cs-label"><i class="el-icon-close" style="color:#94a3b8"></i> {{ $t('m.BE_Not_Challenged') }}</span>
                <span class="cs-val">{{ exams.length - challengedCount }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Boss 排行榜 -->
        <div class="side-card">
          <div class="side-title"><i class="el-icon-data-analysis"></i> {{ $t('m.BE_Hot_Boss') }}</div>
          <div class="rank-list">
            <div
              v-for="(e, idx) in hotExams"
              :key="e.id"
              class="rank-item"
              @click="goDetail(e.id)"
            >
              <span class="rank-num" :class="'rank-' + (idx + 1)">{{ idx + 1 }}</span>
              <div class="rank-info">
                <span class="rank-name">{{ e.title }}</span>
                <span class="rank-meta">{{ $t('m.BE_People_Challenged', {n: e.submission_count || 0}) }} · {{ diffText(e.difficulty) }}</span>
              </div>
              <i class="el-icon-arrow-right rank-arrow"></i>
            </div>
          </div>
        </div>

        <!-- 难度说明 -->
        <div class="side-card">
          <div class="side-title"><i class="el-icon-warning-outline"></i> {{ $t('m.BE_Diff_Guide') }}</div>
          <div class="diff-guide">
            <div class="dg-item">
              <div class="dg-header">
                <span class="dg-dot" style="background:#19be6b"></span>
                <span class="dg-name">{{ $t('m.ES_Diff_Low') }}</span>
                <span class="dg-count">{{ $t('m.BE_Diff_Count', {n: diffCounts.Low}) }}</span>
              </div>
              <p class="dg-desc">{{ $t('m.BE_Diff_Low_Desc') }}</p>
            </div>
            <div class="dg-item">
              <div class="dg-header">
                <span class="dg-dot" style="background:#f90"></span>
                <span class="dg-name">{{ $t('m.ES_Diff_Mid') }}</span>
                <span class="dg-count">{{ $t('m.BE_Diff_Count', {n: diffCounts.Mid}) }}</span>
              </div>
              <p class="dg-desc">{{ $t('m.BE_Diff_Mid_Desc') }}</p>
            </div>
            <div class="dg-item">
              <div class="dg-header">
                <span class="dg-dot" style="background:#ed3f14"></span>
                <span class="dg-name">{{ $t('m.ES_Diff_High') }}</span>
                <span class="dg-count">{{ $t('m.BE_Diff_Count', {n: diffCounts.High}) }}</span>
              </div>
              <p class="dg-desc">{{ $t('m.BE_Diff_High_Desc') }}</p>
            </div>
          </div>
        </div>

        <!-- 快捷入口 -->
        <div class="side-card">
          <div class="side-title"><i class="el-icon-s-grid"></i> {{ $t('m.ES_Quick_Links') }}</div>
          <div class="quick-links">
            <div class="ql-item" @click="$router.push('/exercise')">
              <i class="el-icon-reading"></i>
              <span>{{ $t('m.ES_Title') }}</span>
            </div>
            <div class="ql-item" @click="$router.push('/problem')">
              <i class="el-icon-document-copy"></i>
              <span>{{ $t('m.ES_Ql_Problems') }}</span>
            </div>
            <div class="ql-item" @click="$router.push('/immersion')">
              <i class="el-icon-magic-stick"></i>
              <span>{{ $t('m.ES_Ql_Immersion') }}</span>
            </div>
            <div class="ql-item" @click="$router.push('/learning-report')">
              <i class="el-icon-data-line"></i>
              <span>{{ $t('m.BE_Ql_Report') }}</span>
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
  name: 'BossExams',
  data () {
    return {
      loading: false,
      exams: [],
      topicAreas: [],
      filterArea: '',
      filterDifficulty: '',
      searchKeyword: ''
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
        this.$message.error(this.$t('m.BE_Load_Failed'))
      }).finally(() => { this.loading = false })
    },
    resetFilter () {
      this.filterArea = ''
      this.filterDifficulty = ''
      this.searchKeyword = ''
      this.loadExams()
    },
    goDetail (id) {
      this.$router.push({ name: 'boss-exam-detail', params: { id } })
    },
    diffTag (d) {
      return { Low: 'success', Mid: 'warning', High: 'danger' }[d] || 'info'
    },
    diffText (d) {
      const map = { Low: this.$t('m.ES_Diff_Low'), Mid: this.$t('m.ES_Diff_Mid'), High: this.$t('m.ES_Diff_High') }
      return map[d] || d || this.$t('m.ES_Diff_Unknown')
    }
  },
  computed: {
    filteredExams () {
      if (!this.searchKeyword) return this.exams
      let kw = this.searchKeyword.toLowerCase()
      return this.exams.filter(e => (e.title || '').toLowerCase().includes(kw))
    },
    challengedCount () {
      return this.exams.filter(e => e.has_submitted).length
    },
    totalChallengers () {
      return this.exams.reduce((sum, e) => sum + (e.submission_count || 0), 0)
    },
    passRate () {
      if (!this.exams.length) return 0
      return Math.round(this.challengedCount / this.exams.length * 100)
    },
    diffCounts () {
      let counts = { Low: 0, Mid: 0, High: 0 }
      this.exams.forEach(e => {
        let d = e.difficulty || 'Mid'
        if (counts[d] !== undefined) counts[d]++
      })
      return counts
    },
    hotExams () {
      return [...this.exams].sort((a, b) => (b.submission_count || 0) - (a.submission_count || 0)).slice(0, 5)
    }
  }
}
</script>

<style scoped>
.boss-exams-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

/* 页面标题 */
.page-header {
  background: linear-gradient(135deg, #0d1b2e 0%, #4a1010 100%);
  border-radius: 12px;
  padding: 24px 28px;
  color: #fff;
  margin-bottom: 20px;
  box-shadow: 0 4px 14px rgba(74, 16, 16, 0.3);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  font-size: 22px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}
.header-title i { font-size: 26px; color: #f56c6c; }
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
  font-size: 13px;
  opacity: 0.85;
  margin-top: 6px;
}
.header-stats {
  display: flex;
  align-items: center;
  gap: 20px;
  z-index: 1;
}
.hs-item { text-align: center; }
.hs-num { display: block; font-size: 24px; font-weight: 700; }
.hs-label { font-size: 12px; opacity: 0.8; }
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

/* ============ 右侧边栏 ============ */
.side-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
.side-title {
  font-size: 15px;
  font-weight: 600;
  color: #c0392b;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 2px solid #fef0f0;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 挑战记录 */
.challenge-summary {
  display: flex;
  align-items: center;
  gap: 16px;
}
.cs-ring-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cs-ring-text {
  position: absolute;
  text-align: center;
}
.cs-passed {
  font-size: 18px;
  font-weight: 700;
  color: #c0392b;
}
.cs-total {
  font-size: 12px;
  color: #94a3b8;
}
.cs-stats {
  flex: 1;
}
.cs-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 13px;
}
.cs-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
}
.cs-val {
  font-weight: 600;
  color: #c0392b;
}

/* 排行榜 */
.rank-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.rank-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}
.rank-item:hover {
  background: #fef0f0;
}
.rank-num {
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
.rank-num.rank-1 { background: #fbbf24; color: #fff; }
.rank-num.rank-2 { background: #94a3b8; color: #fff; }
.rank-num.rank-3 { background: #cd7f32; color: #fff; }
.rank-info {
  flex: 1;
  min-width: 0;
}
.rank-name {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rank-meta {
  font-size: 11px;
  color: #94a3b8;
}
.rank-arrow {
  color: #cbd5e1;
  font-size: 12px;
}

/* 难度说明 */
.diff-guide {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.dg-item {
  padding: 10px;
  border-radius: 8px;
  background: #f8fafc;
}
.dg-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.dg-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.dg-name {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}
.dg-count {
  margin-left: auto;
  font-size: 12px;
  color: #94a3b8;
}
.dg-desc {
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
  margin: 0;
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
  font-size: 14px;
  color: #475569;
  transition: all 0.2s;
}
.ql-item:hover {
  background: #fef0f0;
  color: #c0392b;
}
.ql-item i {
  font-size: 16px;
  color: #c0392b;
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
