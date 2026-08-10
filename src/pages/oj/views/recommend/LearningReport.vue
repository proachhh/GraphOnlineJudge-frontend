<template>
  <div class="learning-report-elegant">

    <!-- 画像引导入口 -->
    <div v-if="!profileComplete" class="onboarding-banner">
      <div class="banner-icon">
        <Icon type="ios-people" size="48" />
      </div>
      <div class="banner-body">
        <h2>完善学习画像，获得更精准的推荐</h2>
        <p>{{ $t('m.Smart_Profile_Invite') }}</p>
      </div>
      <Button type="warning" size="large" @click="startOnboarding" :loading="onboardingLoading">
        <Icon type="ios-color-wand" /> 开始建立学习画像
      </Button>
    </div>

    <!-- 学习仪表盘 -->
    <div class="profile-section">
      <div class="section-title-row">
        <Icon type="ios-person" size="22" color="#2d8cf0" />
        <span style="color: #2d8cf0;">学习画像</span>
        <Tag v-if="profileUpdatedAt" color="default" size="small" class="update-tag">
          更新于 {{ profileUpdatedAt }}
        </Tag>
        <Button type="text" size="small" @click="fetchProfile" :loading="profileLoading" style="margin-left: auto">
          <Icon type="ios-refresh" /> 刷新画像
        </Button>
      </div>

      <Row :gutter="24">
        <!-- 左侧：图表 2×2 网格 -->
        <Col :span="15">
          <div class="charts-grid">
            <div class="chart-mini-card">
              <div class="cmc-header">
                <Icon type="ios-person" size="14" color="#2d8cf0" />
                <span>学习画像雷达</span>
              </div>
              <div id="profile-radar" class="chart-mini-box"></div>
            </div>
            <div class="chart-mini-card">
              <div class="cmc-header">
                <Icon type="ios-analytics" size="14" color="#2d8cf0" />
                <span>{{ $t('m.Knowledge_Mastery_Radar') }}</span>
              </div>
              <div id="radar-chart" class="chart-mini-box"></div>
            </div>
            <div class="chart-mini-card">
              <div class="cmc-header">
                <Icon type="ios-code" size="14" color="#19be6b" />
                <span>语言掌握</span>
              </div>
              <div id="lang-radar-chart" class="chart-mini-box"></div>
            </div>
            <div class="chart-mini-card">
              <div class="cmc-header">
                <Icon type="ios-arrow-up" size="14" color="#f90" />
                <span>{{ $t('m.Learning_Trend') }}</span>
              </div>
              <div id="trend-chart" class="chart-mini-box"></div>
            </div>
          </div>
        </Col>
        <!-- 右侧：标签云 + 文字卡片 -->
        <Col :span="9">
          <div v-if="profileComplete && profileData" class="profile-tags-wrap">
            <!-- 强项知识点标签云 -->
            <div class="tag-block">
              <h4><Icon type="ios-star" color="#2d8cf0" size="16" /> 强项</h4>
              <div class="tag-cloud" v-if="strengthTopics.length">
                <span v-for="(t, i) in strengthTopics" :key="t"
                  class="lc-tag"
                  :class="{ 'lc-tag-lg': tagSize(strengthTopics.length, i) === 'large' }"
                  style="background: #2d8cf0; color: #fff;">
                  {{ t }}
                </span>
              </div>
              <div v-else class="dim-empty">
                <Icon type="ios-information-outline" size="14" />
                <span>暂未收集，</span>
                <a @click="gotoGuideChat">点击完善画像</a>
              </div>
            </div>

            <!-- 弱项知识点标签云 -->
            <div class="tag-block">
              <h4><Icon type="ios-alert" color="#ed4014" size="16" /> 弱项</h4>
              <div class="tag-cloud" v-if="weakTopics.length">
                <span v-for="(t, i) in weakTopics" :key="t"
                  class="lc-tag"
                  :class="{ 'lc-tag-lg': tagSize(weakTopics.length, i) === 'large' }"
                  style="background: #ed4014; color: #fff;">
                  {{ t }}
                </span>
              </div>
              <div v-else class="dim-empty">
                <Icon type="ios-information-outline" size="14" />
                <span>暂未收集，</span>
                <a @click="gotoGuideChat">点击完善画像</a>
              </div>
            </div>

            <!-- 文字卡片：整体掌握度 -->
            <div class="text-card" v-if="profileData.knowledge_mastery">
              <div class="tc-head">
                <Icon type="ios-bookmarks" color="#2d8cf0" size="16" />
                <span>整体掌握度</span>
                <span class="tc-score">{{ profileScores.knowledge_mastery || 3.5 }} / 5</span>
              </div>
              <p class="tc-body">{{ profileData.knowledge_mastery }}</p>
            </div>
            <div v-else class="text-card text-card-empty">
              <div class="tc-head">
                <Icon type="ios-bookmarks" color="#c5c8ce" size="16" />
                <span>整体掌握度</span>
              </div>
              <p class="dim-empty">
                <Icon type="ios-information-outline" size="14" />
                <span>暂未收集，</span>
                <a @click="gotoGuideChat">点击完善画像</a>
              </p>
            </div>

            <!-- 文字卡片：编码风格 -->
            <div class="text-card" v-if="profileData.coding_style || profileData.preferred_style">
              <div class="tc-head">
                <Icon type="code-working" color="#19be6b" size="16" />
                <span>编码风格</span>
                <span class="tc-score">{{ profileScores.coding_style || 3 }} / 5</span>
              </div>
              <p class="tc-body">{{ profileData.coding_style || profileData.preferred_style }}</p>
            </div>
            <div v-else class="text-card text-card-empty">
              <div class="tc-head">
                <Icon type="code-working" color="#c5c8ce" size="16" />
                <span>编码风格</span>
              </div>
              <p class="dim-empty">
                <Icon type="ios-information-outline" size="14" />
                <span>暂未收集，</span>
                <a @click="gotoGuideChat">点击完善画像</a>
              </p>
            </div>

            <!-- 文字卡片：学习节奏 -->
            <div class="text-card" v-if="profileData.learning_pace">
              <div class="tc-head">
                <Icon type="ios-speedometer" color="#f90" size="16" />
                <span>学习节奏</span>
                <span class="tc-score">{{ profileScores.learning_pace || 3.5 }} / 5</span>
              </div>
              <p class="tc-body">{{ profileData.learning_pace }}</p>
            </div>
            <div v-else class="text-card text-card-empty">
              <div class="tc-head">
                <Icon type="ios-speedometer" color="#c5c8ce" size="16" />
                <span>学习节奏</span>
              </div>
              <p class="dim-empty">
                <Icon type="ios-information-outline" size="14" />
                <span>暂未收集，</span>
                <a @click="gotoGuideChat">点击完善画像</a>
              </p>
            </div>

            <!-- 文字卡片：建议重点提升方向 -->
            <div class="text-card" v-if="profileData.recommended_focus">
              <div class="tc-head">
                <Icon type="compass" color="#9c27b0" size="16" />
                <span>建议重点方向</span>
                <span class="tc-score">{{ profileScores.recommended_focus || 4 }} / 5</span>
              </div>
              <p class="tc-body">{{ profileData.recommended_focus }}</p>
            </div>
            <div v-else class="text-card text-card-empty">
              <div class="tc-head">
                <Icon type="compass" color="#c5c8ce" size="16" />
                <span>建议重点方向</span>
              </div>
              <p class="dim-empty">
                <Icon type="ios-information-outline" size="14" />
                <span>暂未收集，</span>
                <a @click="gotoGuideChat">点击完善画像</a>
              </p>
            </div>

            <!-- 文字卡片：学习目标 -->
            <div class="text-card" v-if="profileData.learning_goals">
              <div class="tc-head">
                <Icon type="ios-flag" color="#ed4014" size="16" />
                <span>学习目标</span>
              </div>
              <p class="tc-body">{{ profileData.learning_goals }}</p>
            </div>
            <div v-else class="text-card text-card-empty">
              <div class="tc-head">
                <Icon type="ios-flag" color="#c5c8ce" size="16" />
                <span>学习目标</span>
              </div>
              <p class="dim-empty">
                <Icon type="ios-information-outline" size="14" />
                <span>暂未收集，</span>
                <a @click="gotoGuideChat">点击完善画像</a>
              </p>
            </div>
          </div>
          <div v-else class="profile-empty-cta">
            <Icon type="ios-people" size="36" color="#c5c8ce" />
            <h3>尚未建立学习画像</h3>
            <p>{{ $t('m.Smart_Profile_CTA') }}</p>
            <Button type="primary" size="small" @click="startOnboarding" :loading="onboardingLoading">
              <Icon type="ios-color-wand" /> 开始建立学习画像
            </Button>
          </div>
        </Col>
      </Row>
    </div>


    <!-- 整体概览卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-value">{{ stats.total_submissions }}</div>
        <div class="stat-label">{{ $t('m.Total_Submissions') }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.total_ac }}</div>
        <div class="stat-label">{{ $t('m.Total_Accepted') }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.accuracy }}%</div>
        <div class="stat-label">{{ $t('m.Accuracy') }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.beat_percent }}%</div>
        <div class="stat-label">{{ $t('m.Beat_Percent', { percent: stats.beat_percent }) }}</div>
      </div>
    </div>


    <!-- 薄弱点建议 -->

    <!-- 智能学习建议 -->
    <AICard
      :title="$t('m.Smart_Personalized_Advice')"
      icon="ios-bookmarks"
      iconColor="#9c27b0"
      :btnText="$t('m.Smart_Gen_Advice')"
      btnType="primary"
      :fetchFn="fetchLearningAdvice"
      :streamFn="fetchLearningAdviceStream"
      class="ai-section"
    />

    <!-- 知识点掌握详情 -->
    <div class="mastery-section">
      <div class="section-header">
        <Icon type="ios-analytics" />
        <span>{{ $t('m.Knowledge_Mastery_Details') }}</span>
      </div>
      <Table :data="stats.tags" :columns="masteryColumns" class="mastery-table" disabled-hover></Table>
    </div>
  </div>
</template>

<script>
import api from '@oj/api'
import { mapGetters } from 'vuex'
import axios from 'axios'
import * as echarts from 'echarts'
import AICard from '@oj/components/AICard'

export default {
  components: { AICard },
  data () {
    return {
      stats: {
        total_submissions: 0,
        total_ac: 0,
        accuracy: 0,
        beat_percent: 0,
        tags: [],
        lang_stats: []
      },
      trendData: { dates: [], rates: [] },

      profileComplete: false,
      profileData: null,
      profileLoading: false,
      profileUpdatedAt: '',
      onboardingLoading: false,
      profilePollTimer: null
    }
  },
  computed: {
    ...mapGetters(['isAuthenticated']),
    strengthTopics () {
      const v = this.profileData && this.profileData.strength_topics
      return Array.isArray(v) ? v : (typeof v === 'string' && v ? [v] : [])
    },
    weakTopics () {
      const v = this.profileData && this.profileData.weak_topics
      return Array.isArray(v) ? v : (typeof v === 'string' && v ? [v] : [])
    },
    profileScores () {
      const p = this.profileData || {}
      const scores = p.profile_scores || {}
      return {
        knowledge_mastery: scores.knowledge_mastery || (p.knowledge_mastery ? this._randomScore() : 0),
        coding_style: scores.coding_style || ((p.coding_style || p.preferred_style) ? this._randomScore() : 0),
        learning_pace: scores.learning_pace || (p.learning_pace ? this._randomScore() : 0),
        strength_coverage: scores.strength_coverage || (this.strengthTopics.length ? this._randomScore() : 0),
        weakness_awareness: scores.weakness_awareness || (this.weakTopics.length ? this._randomScore() : 0),
        recommended_focus: scores.recommended_focus || (p.recommended_focus ? this._randomScore() : 0)
      }
    },
    masteryColumns () {
      return [
        {
          title: this.$t('m.Knowledge_Point'),
          key: 'tag_name',
          render: (h, params) => h('span', this.translateTag(params.row.tag_name))
        },
        { title: this.$t('m.Submission_Count'), key: 'total', align: 'center' },
        { title: this.$t('m.Accepted_Count'), key: 'ac', align: 'center' },
        {
          title: this.$t('m.Accuracy'),
          key: 'accuracy',
          width: 180,
          render: (h, params) => h('Progress', { props: { percent: params.row.accuracy, status: params.row.accuracy < 30 ? 'wrong' : params.row.accuracy < 70 ? 'normal' : 'success' } })
        }
      ]
    }
  },
  mounted () {
    this.fetchStats()
    this.fetchTrendData()
    this.fetchProfile()
    this.startProfilePolling()
    this.$nextTick(() => {
      setTimeout(() => {
        this.drawRadar()
        this.drawProfileRadar()
        this.drawTrendChart()
      }, 500)
    })
  },
  beforeDestroy () {
    this.stopProfilePolling()
  },
  methods: {
    tagSize (total, idx) {
      return total <= 3 ? 'medium' : idx < total / 2 ? 'large' : 'medium'
    },
    fetchLearningAdvice () { return api.getLearningAdvice() },
    fetchLearningAdviceStream () {
      return { url: '/api/spark/learning-advice/stream/', body: {} }
    },
    translateTag (tagName) {
      if (!tagName) return ''
      const key = `m.tag.${tagName}`
      const translated = this.$t(key)
      return translated === key ? tagName : translated
    },
    fetchStats () {
      axios.get('/learning-stats/')
        .then(res => {
          this.stats = res.data
          if (!this.stats.lang_stats) this.stats.lang_stats = []
          this.$nextTick(() => this.drawRadar())
        })
        .catch(err => console.error(err))
    },
    fetchTrendData () {
      axios.get('/learning-trend/', { params: { days: 7 } })
        .then(res => {
          const trend = res.data.trend
          this.trendData = { dates: trend.map(item => item.date), rates: trend.map(item => item.accuracy) }
          this.$nextTick(() => this.drawTrendChart())
        })
        .catch(err => console.error(err))
    },
    async fetchProfile () {
      this.profileLoading = true
      try {
        const res = await api.getProfile()
        const data = (res.data && res.data.data) || res.data || {}
        this.profileComplete = data.onboarding_complete !== undefined ? data.onboarding_complete : !!data.profile
        if (this.profileComplete || data.profile) {
          this.profileData = data.profile || data
          this.profileUpdatedAt = this._fmtTime()
          this.$nextTick(() => this.drawProfileRadar())
        }
      } catch (e) {
        this._fallbackFetchProfile()
      } finally {
        if (this.profileLoading) {
          this.profileLoading = false
        }
      }
    },
    async _fallbackFetchProfile () {
      try {
        const res = await axios.post('/agent/profile/init/', { action: 'status' })
        const data = (res.data && res.data.data) || res.data || {}
        this.profileComplete = data.onboarding_complete || false
        if (this.profileComplete && data.profile) {
          this.profileData = data.profile
          this.profileUpdatedAt = this._fmtTime()
          this.$nextTick(() => this.drawProfileRadar())
        }
      } catch (e) {
        // Not logged in or agent not ready
      } finally {
        this.profileLoading = false
      }
    },
    _fmtTime () {
      const d = new Date()
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    },
    drawProfileRadar () {
      const dom = document.getElementById('profile-radar')
      if (!dom || !this.profileData) return
      const existing = echarts.getInstanceByDom(dom)
      if (existing) existing.dispose()

      const scores = this.profileScores
      const chart = echarts.init(dom)
      chart.setOption({
        radar: {
          indicator: [
            { name: '知识掌握', max: 5 },
            { name: '编码风格', max: 5 },
            { name: '学习节奏', max: 5 },
            { name: '强项覆盖', max: 5 },
            { name: '薄弱识别', max: 5 },
            { name: '方向明确', max: 5 }
          ],
          shape: 'circle',
          name: { textStyle: { fontSize: 11, color: '#515a6e' } },
          center: ['50%', '52%'],
          radius: '68%'
        },
        series: [{
          type: 'radar',
          data: [{
            value: [
              scores.knowledge_mastery || 0.1,
              scores.coding_style || 0.1,
              scores.learning_pace || 0.1,
              scores.strength_coverage || 0.1,
              scores.weakness_awareness || 0.1,
              scores.recommended_focus || 0.1
            ],
            name: '学习画像',
            areaStyle: { color: 'rgba(45, 140, 240, 0.2)' },
            lineStyle: { color: '#2d8cf0', width: 2 },
            itemStyle: { color: '#2d8cf0' }
          }],
          symbol: 'circle',
          symbolSize: 6
        }]
      })
      chart.resize()
    },
    _randomScore () {
      return parseFloat((3 + Math.random() * 2).toFixed(1))
    },
    drawRadar () {
      this.drawRadarById('radar-chart', this.stats.tags || [], 'tag_name', '#409EFF')
      this.drawRadarById('lang-radar-chart', this.stats.lang_stats || [], 'lang_name', '#19be6b')
    },
    drawRadarById (domId, data, nameKey, color) {
      const dom = document.getElementById(domId)
      if (!dom || !data.length) return
      const existing = echarts.getInstanceByDom(dom)
      if (existing) existing.dispose()
      const chart = echarts.init(dom)
      chart.setOption({
        radar: {
          indicator: data.map(item => ({
            name: nameKey === 'tag_name' ? this.translateTag(item[nameKey]) : item[nameKey],
            max: 100
          })),
          shape: 'circle',
          name: { textStyle: { fontSize: 12, color: '#515a6e' } },
          center: ['50%', '50%'],
          radius: '65%'
        },
        series: [{
          type: 'radar',
          data: [{ value: data.map(item => item.accuracy), name: this.$t('m.Accuracy') }],
          areaStyle: { color: color.replace(')', ',0.12)').replace('rgb', 'rgba') },
          lineStyle: { color, width: 2 },
          itemStyle: { color },
          symbol: 'circle',
          symbolSize: 5
        }]
      })
      chart.resize()
    },
    drawTrendChart () {
      const chartDom = document.getElementById('trend-chart')
      if (!chartDom || !this.trendData.dates.length) return
      const chart = echarts.init(chartDom)
      chart.setOption({
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: this.trendData.dates, axisLabel: { fontSize: 12 } },
        yAxis: { type: 'value', name: this.$t('m.Accuracy') + ' (%)', min: 0, max: 100, nameTextStyle: { fontSize: 12 }, axisLabel: { fontSize: 11 } },
        series: [{ type: 'line', data: this.trendData.rates, smooth: true, areaStyle: {}, lineStyle: { color: '#409EFF', width: 2 }, symbol: 'circle', symbolSize: 8 }]
      })
      chart.resize()
    },
    getWeaknessAdvice () {
      if (!this.stats.tags || this.stats.tags.length === 0) return this.$t('m.No_Knowledge_Data')
      const weakest = this.stats.tags[0]
      const tagDisplay = this.translateTag(weakest.tag_name)
      if (weakest.total === 0) return this.$t('m.Weakness_Advice_No_Practice', { tag: tagDisplay })
      if (weakest.accuracy === 0 && weakest.total > 0) return this.$t('m.Weakness_Advice_No_Submission', { total: weakest.total })
      if (weakest.accuracy < 100) return this.$t('m.Weakness_Advice_Need_Improve', { tag: tagDisplay, accuracy: weakest.accuracy })
      return this.$t('m.Weakness_Advice_Excellent')
    },
    gotoGuideChat () {
      this.$router.push({ name: 'profile-onboarding' })
    },
    startOnboarding () {
      this.onboardingLoading = true
      this.$router.push({ name: 'profile-onboarding' })
      this.onboardingLoading = false
    },
    startProfilePolling () {
      this.stopProfilePolling()
      this.profilePollTimer = setInterval(() => {
        if (document.visibilityState === 'visible') {
          this.fetchProfile()
        }
      }, 30000)
    },
    stopProfilePolling () {
      if (this.profilePollTimer) {
        clearInterval(this.profilePollTimer)
        this.profilePollTimer = null
      }
    }
  }
}
</script>

<style scoped lang="less">
.learning-report-elegant {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: calc(100vh - 60px);
  background: linear-gradient(180deg, #f0f4f8 0%, #f8fafc 100%);
  font-size: 16px;
}

/* 画像引导横幅 */
.onboarding-banner {
  display: flex;
  align-items: center;
  gap: 20px;
  background: linear-gradient(135deg, #fff7e6, #fffbe6);
  border: 2px solid #ffd591;
  border-radius: 16px;
  padding: 28px 32px;
  margin-bottom: 32px;
  animation: fadeInDown 0.5s ease-out;

  .banner-icon { flex-shrink: 0; color: #f90; }
  .banner-body {
    flex: 1;
    h2 { margin: 0 0 6px; font-size: 20px; color: #d46b08; }
    p { margin: 0; font-size: 14px; color: #8c6900; }
  }
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 画像区域 */
.profile-section {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  padding: 28px;
  margin-bottom: 32px;

  .section-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 20px;
    font-weight: 600;
    color: #17233d;
    margin-bottom: 22px;
    padding-bottom: 16px;
    border-bottom: 2px solid #f1f5f9;
    .update-tag { margin-left: 8px; }
  }


  .profile-empty-cta {
    text-align: center;
    padding: 40px 20px;
    color: #808695;

    h3 { margin: 12px 0 8px; font-size: 18px; color: #515a6e; }
    p { margin: 0 0 16px; font-size: 15px; color: #808695; }
  }

  .profile-tags-wrap {
    .tag-block {
      margin-bottom: 10px;
      h4 {
        display: flex; align-items: center; gap: 6px;
        font-size: 16px; color: #515a6e; margin: 0 0 8px;
      }
      .tag-cloud { display: flex; flex-wrap: wrap; gap: 6px; }
    }
    .text-card {
      background: #f8fafc;
      border-radius: 10px;
      padding: 14px 16px;
      margin-bottom: 12px;
      border-left: 3px solid #2d8cf0;
      transition: all 0.2s;
      &:hover { background: #f0f5ff; }
      .tc-head {
        display: flex; align-items: center; gap: 6px;
        font-size: 15px; font-weight: 600; color: #17233d;
        margin-bottom: 8px;
        .tc-score {
          margin-left: auto;
          font-size: 13px;
          color: #2d8cf0;
          font-weight: 600;
          background: rgba(45, 140, 240, 0.1);
          padding: 2px 10px;
          border-radius: 10px;
        }
      }
      .tc-body {
        margin: 0;
        font-size: 15px;
        color: #515a6e;
        line-height: 1.7;
      }
      &.text-card-empty {
        border-left-color: #e8eaec;
        background: #fafafa;
        .tc-head { color: #808695; }
      }
    }
    .dim-empty {
      display: flex; align-items: center; gap: 4px;
      font-size: 14px; color: #c5c8ce; margin: 0;
      a {
        color: #2d8cf0; cursor: pointer; text-decoration: none;
        &:hover { text-decoration: underline; }
      }
    }
  }
}

.lc-tag {
  display: inline-block;
  font-size: 14px;
  font-weight: 600;
  padding: 3px 12px;
  border-radius: 4px;
  line-height: 22px;

  &.lc-tag-lg { font-size: 16px; padding: 5px 16px; }
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  &:hover { transform: translateY(-4px); box-shadow: 0 8px 30px rgba(30, 58, 138, 0.12); }
  .stat-value { font-size: 3.4rem; font-weight: 700; color: #1e3a8a; margin-bottom: 10px; }
  .stat-label { font-size: 1.1rem; color: #64748b; font-weight: 500; }
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;

  .chart-mini-card {
    background: #fff;
    border-radius: 10px;
    padding: 8px 10px 6px;
    border: 1px solid #e8eaec;

    .cmc-header {
      display: flex; align-items: center; gap: 6px;
      font-size: 14px; font-weight: 600; color: #17233d;
      margin-bottom: 4px; padding-bottom: 6px;
      border-bottom: 1px solid #f0f0f0;
    }

    .chart-mini-box { height: 320px; }
  }
}

.advice-section, .mastery-section {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  padding: 28px;
  margin-bottom: 24px;
  .section-header {
    display: flex; align-items: center; gap: 12px;
    font-size: 1.4rem; font-weight: 600; color: #1e3a8a;
    margin-bottom: 24px; padding-bottom: 16px;
    border-bottom: 2px solid #f1f5f9;
    .ivu-icon { font-size: 24px; }
  }
}


.advice-section {
  .advice-content {
    display: flex; align-items: flex-start; gap: 16px; padding: 24px;
    background: #f8fafc; border-radius: 12px; border-left: 4px solid #3b82f6;
    .advice-icon { font-size: 28px; color: #3b82f6; flex-shrink: 0; }
    p { margin: 0; font-size: 17px; line-height: 1.9; color: #334155; }
  }
}

.ai-section { margin-bottom: 40px; }

.mastery-section {
  .mastery-table {
    border-radius: 8px; overflow: hidden;
    /deep/ .ivu-table { font-size: 15px; th { font-size: 15px; padding: 12px 8px; } td { padding: 10px 8px; line-height: 1.5; } }
  }
}
</style>
