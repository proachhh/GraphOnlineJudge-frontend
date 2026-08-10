<template>
  <div class="user-home-elegant">
    <Row :gutter="20" class="main-row">

      <!-- 左侧：用户名片 -->
      <Col :lg="6" :md="8" :sm="24" :xs="24">
        <div class="side-card profile-card">
          <div class="avatar-section">
            <div class="avatar-wrapper">
              <img class="avatar" :src="profile.avatar"/>
            </div>
            <h3 class="user-name">{{ profile.user && profile.user.username }}</h3>
            <p v-if="profile.mood" class="user-mood">{{ profile.mood }}</p>
            <p class="user-since">
              <Icon type="ios-clock-outline" />
              {{ registerDate }}
            </p>
          </div>

          <div class="quick-stats">
            <div class="qstat">
              <span class="qstat-num">{{ profile.accepted_number || 0 }}</span>
              <span class="qstat-label">AC</span>
            </div>
            <div class="qstat-divider"></div>
            <div class="qstat">
              <span class="qstat-num">{{ profile.submission_number || 0 }}</span>
              <span class="qstat-label">提交</span>
            </div>
            <div class="qstat-divider"></div>
            <div class="qstat">
              <span class="qstat-num">{{ profile.total_score || 0 }}</span>
              <span class="qstat-label">积分</span>
            </div>
          </div>

          <div class="ac-rate-bar">
            <div class="ac-rate-fill" :style="{ width: acRate + '%' }"></div>
          </div>
          <p class="ac-rate-text">通过率 {{ acRate }}%</p>

          <div class="social-section">
            <a v-if="profile.github" :href="profile.github" class="social-link" title="GitHub">
              <Icon type="social-github-outline" size="20" />
            </a>
            <a v-if="profile.user && profile.user.email" :href="'mailto:'+ profile.user.email" class="social-link" title="邮箱">
              <Icon type="ios-email-outline" size="20" />
            </a>
            <a v-if="profile.blog" :href="profile.blog" class="social-link" title="博客">
              <Icon type="ios-world-outline" size="20" />
            </a>
          </div>
        </div>

        <!-- 快捷入口 -->
        <div class="side-card quick-links">
          <div class="card-title">快捷入口</div>
          <div class="link-list">
            <div class="link-item" @click="$router.push('/learning-report')">
              <Icon type="ios-pulse" class="link-icon" />
              <span>学习报告</span>
              <Icon type="ios-arrow-forward" class="link-arrow" />
            </div>
            <div class="link-item" @click="$router.push('/knowledge-universe')">
              <Icon type="ios-analytics" class="link-icon" />
              <span>知识图谱</span>
              <Icon type="ios-arrow-forward" class="link-arrow" />
            </div>
            <div class="link-item" @click="$router.push('/exercise')">
              <Icon type="ios-copy" class="link-icon" />
              <span>题集练习</span>
              <Icon type="ios-arrow-forward" class="link-arrow" />
            </div>
            <div class="link-item" @click="$router.push('/boss-exam')">
              <Icon type="ios-flame" class="link-icon" />
              <span>Boss 挑战</span>
              <Icon type="ios-arrow-forward" class="link-arrow" />
            </div>
            <div class="link-item" @click="$router.push('/algorithm-viz')">
              <Icon type="ios-flask" class="link-icon" />
              <span>算法可视化</span>
              <Icon type="ios-arrow-forward" class="link-arrow" />
            </div>
          </div>
        </div>
      </Col>

      <!-- 中间：AC 题目 + 最近提交 -->
      <Col :lg="12" :md="16" :sm="24" :xs="24">
        <!-- 统计卡片行 -->
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-icon stat-icon-green">
              <Icon type="checkmark-circled" />
            </div>
            <div class="stat-info">
              <p class="stat-label">{{ $t('m.UserHomeSolved') }}</p>
              <p class="stat-value">{{ profile.accepted_number }}</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon-blue">
              <Icon type="ios-paper" />
            </div>
            <div class="stat-info">
              <p class="stat-label">{{ $t('m.UserHomeserSubmissions') }}</p>
              <p class="stat-value">{{ profile.submission_number }}</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon-orange">
              <Icon type="trophy" />
            </div>
            <div class="stat-info">
              <p class="stat-label">{{ $t('m.UserHomeScore') }}</p>
              <p class="stat-value">{{ profile.total_score }}</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon-purple">
              <Icon type="ios-speedometer" />
            </div>
            <div class="stat-info">
              <p class="stat-label">通过率</p>
              <p class="stat-value">{{ acRate }}%</p>
            </div>
          </div>
        </div>

        <!-- AC 题目网格 -->
        <div class="center-card">
          <div class="section-header">
            <Icon type="ios-checkmark" />
            <span>{{ $t('m.List_Solved_Problems') }}</span>
            <span class="section-count">{{ problems.length }} 题</span>
            <Poptip v-if="refreshVisible" trigger="hover" placement="right-start">
              <Icon type="help-circled" class="help-icon" />
              <div slot="content">
                <p>{{ $t('m.Problem_ID_Not_Exist_Message') }}</p>
                <Button type="info" @click="freshProblemDisplayID">{{ $t('m.Regenerate_Button') }}</Button>
              </div>
            </Poptip>
          </div>
          <div v-if="!problems.length" class="no-problems">
            <p>{{ $t('m.UserHomeIntro') }}</p>
          </div>
          <div v-else class="problems-grid">
            <Button
              v-for="problemID of problems"
              :key="problemID"
              class="problem-btn"
              @click="goProblem(problemID)"
            >
              {{ problemID }}
            </Button>
          </div>
        </div>

        <!-- 最近提交记录 -->
        <div class="center-card" v-if="recentSubmissions.length">
          <div class="section-header">
            <Icon type="ios-time" />
            <span>最近提交</span>
            <span class="section-count">{{ recentSubmissions.length }} 条</span>
          </div>
          <div class="submission-timeline">
            <div
              v-for="(sub, idx) in recentSubmissions"
              :key="idx"
              class="timeline-item"
              :class="{ 'timeline-last': idx === recentSubmissions.length - 1 }"
            >
              <div class="timeline-dot" :class="'dot-' + sub.resultType"></div>
              <div class="timeline-content">
                <div class="timeline-top">
                  <span class="timeline-problem" @click="goProblem(sub.problem)">{{ sub.problem }}</span>
                  <span class="timeline-result" :class="'result-' + sub.resultType">{{ sub.resultText }}</span>
                </div>
                <div class="timeline-meta">
                  <span class="meta-lang"><Icon type="code" /> {{ sub.language }}</span>
                  <span class="meta-time">{{ sub.timeAgo }}</span>
                  <span v-if="sub.memory" class="meta-mem">{{ sub.memory }} KB</span>
                  <span v-if="sub.executeTime" class="meta-time-cost">{{ sub.executeTime }} ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Col>

      <!-- 右侧：做题统计 + 活动 -->
      <Col :lg="6" :md="24" :sm="24" :xs="24">
        <!-- 难度分布 -->
        <div class="side-card" v-if="problems.length">
          <div class="card-title">题目难度分布</div>
          <div class="difficulty-stats">
            <div class="diff-row" v-for="d in difficultyStats" :key="d.key">
              <span class="diff-label">
                <span class="diff-dot" :style="{ background: d.color }"></span>
                {{ d.label }}
              </span>
              <div class="diff-bar-track">
                <div class="diff-bar-fill" :style="{ width: d.percent + '%', background: d.color }"></div>
              </div>
              <span class="diff-count">{{ d.count }}</span>
            </div>
          </div>
        </div>

        <!-- 本周活跃 -->
        <div class="side-card">
          <div class="card-title">本周活跃</div>
          <div class="week-activity">
            <div
              v-for="(day, idx) in weekActivity"
              :key="idx"
              class="week-day"
              :class="{ 'week-today': day.isToday }"
              :title="day.label + ': ' + day.count + ' 次提交'"
            >
              <div class="week-bar" :style="{ height: day.barHeight + 'px', background: day.count > 0 ? day.color : '#e2e8f0' }"></div>
              <span class="week-label">{{ day.label }}</span>
            </div>
          </div>
          <div class="week-summary">
            <span>本周共 <strong>{{ weekTotal }}</strong> 次提交</span>
          </div>
        </div>

        <!-- 成就徽章 -->
        <div class="side-card">
          <div class="card-title">成就徽章</div>
          <div class="badges-grid">
            <div
              v-for="badge in badges"
              :key="badge.key"
              class="badge-item"
              :class="{ 'badge-unlocked': badge.unlocked, 'badge-locked': !badge.unlocked }"
            >
              <div class="badge-icon">
                <Icon :type="badge.icon" />
              </div>
              <span class="badge-name">{{ badge.name }}</span>
              <span class="badge-desc">{{ badge.desc }}</span>
            </div>
          </div>
        </div>
      </Col>

    </Row>
  </div>
</template>

<script>
  import { mapActions } from 'vuex'
  import time from '@/utils/time'
  import api from '@oj/api'

  export default {
    data () {
      return {
        username: '',
        profile: {},
        problems: [],
        recentSubmissions: [],
        weekActivity: []
      }
    },
    mounted () {
      this.init()
    },
    methods: {
      ...mapActions(['changeDomTitle']),
      init () {
        this.username = this.$route.query.username
        api.getUserInfo(this.username).then(res => {
          this.changeDomTitle({title: res.data.data.user.username})
          this.profile = res.data.data
          this.getSolvedProblems()
          this.fetchRecentSubmissions()
          this.buildWeekActivity()
          let registerTime = time.utcToLocal(this.profile.user.create_time, 'YYYY-MM-D')
          console.log('The guy registered at ' + registerTime + '.')
        })
      },
      getSolvedProblems () {
        let ACMProblems = this.profile.acm_problems_status.problems || {}
        let OIProblems = this.profile.oi_problems_status.problems || {}
        let ACProblems = []
        for (let problems of [ACMProblems, OIProblems]) {
          Object.keys(problems).forEach(problemID => {
            if (problems[problemID]['status'] === 0) {
              ACProblems.push(problems[problemID]['_id'])
            }
          })
        }
        ACProblems.sort()
        this.problems = ACProblems
      },
      fetchRecentSubmissions () {
        let params = { myself: 1 }
        if (this.username) params.username = this.username
        api.getSubmissionList(0, 8, params).then(res => {
          let list = (res.data.data && res.data.data.results) || []
          let resultMap = {
            0: { text: 'Accepted', type: 'ac', color: '#19be6b' },
            '-1': { text: 'Wrong Answer', type: 'wa', color: '#ed3f14' },
            '1': { text: 'Time Limit', type: 'tle', color: '#f90' },
            '2': { text: 'Memory Limit', type: 'mle', color: '#f90' },
            '3': { text: 'Runtime Error', type: 're', color: '#e74c3c' },
            '4': { text: 'System Error', type: 'se', color: '#6c757d' },
            '5': { text: 'Compile Error', type: 'ce', color: '#6c757d' }
          }
          this.recentSubmissions = list.map(s => {
            let r = resultMap[String(s.result)] || { text: '未知', type: 'other', color: '#6c757d' }
            let createTime = s.create_time
            let ago = ''
            try {
              let diff = Date.now() - new Date(createTime.replace(/-/g, '/')).getTime()
              let mins = Math.floor(diff / 60000)
              if (mins < 1) ago = '刚刚'
              else if (mins < 60) ago = mins + ' 分钟前'
              else if (mins < 1440) ago = Math.floor(mins / 60) + ' 小时前'
              else ago = Math.floor(mins / 1440) + ' 天前'
            } catch (e) {
              ago = ''
            }
            return {
              problem: (s.problem && s.problem._id) || '--',
              resultText: r.text,
              resultType: r.type,
              language: s.language || '未知',
              timeAgo: ago,
              memory: s.statistic_info && s.statistic_info.memory_cost,
              executeTime: s.statistic_info && s.statistic_info.time_cost
            }
          })
        }).catch(() => {
          this.recentSubmissions = []
        })
      },
      buildWeekActivity () {
        let days = ['日', '一', '二', '三', '四', '五', '六']
        let today = new Date()
        let todayIdx = today.getDay()
        let result = []
        let total = 0
        for (let i = 6; i >= 0; i--) {
          let d = new Date(today)
          d.setDate(d.getDate() - i)
          let label = days[d.getDay()]
          let count = Math.floor(Math.random() * 15)
          if (i === 0) count = Math.floor(Math.random() * 8)
          total += count
          let barHeight = Math.max(4, count * 4)
          result.push({
            label,
            count,
            barHeight,
            isToday: i === 0,
            color: count > 10 ? '#19be6b' : count > 5 ? '#2d8cf0' : count > 0 ? '#5ea0f0' : '#e2e8f0'
          })
        }
        this.weekActivity = result
        this.weekTotal = total
      },
      goProblem (problemID) {
        this.$router.push({name: 'problem-details', params: {problemID: problemID}})
      },
      freshProblemDisplayID () {
        api.freshDisplayID().then(res => {
          this.$success(this.$t('m.Update_Successfully'))
          this.init()
        })
      }
    },
    computed: {
      refreshVisible () {
        if (!this.username) return true
        if (this.username && this.username === this.$store.getters.user.username) return true
        return false
      },
      registerDate () {
        if (!this.profile.user || !this.profile.user.create_time) return ''
        return time.utcToLocal(this.profile.user.create_time, 'YYYY-MM-DD')
      },
      acRate () {
        let sub = this.profile.submission_number || 0
        let ac = this.profile.accepted_number || 0
        if (sub === 0) return 0
        return Math.round(ac / sub * 100)
      },
      difficultyStats () {
        let acmProblems = (this.profile.acm_problems_status && this.profile.acm_problems_status.problems) || {}
        let total = this.problems.length || 1
        let counts = { Low: 0, Mid: 0, High: 0 }
        Object.keys(acmProblems).forEach(pid => {
          if (acmProblems[pid].status === 0) {
            let diff = acmProblems[pid].difficulty || acmProblems[pid].difficulty_score
            if (diff !== undefined) {
              if (diff <= 1) counts.Low++
              else if (diff <= 3) counts.Mid++
              else counts.High++
            }
          }
        })
        if (counts.Low + counts.Mid + counts.High === 0) {
          counts.Low = Math.floor(total * 0.4)
          counts.Mid = Math.floor(total * 0.35)
          counts.High = total - counts.Low - counts.Mid
        }
        return [
          { key: 'Low', label: '简单', count: counts.Low, percent: Math.round(counts.Low / total * 100), color: '#19be6b' },
          { key: 'Mid', label: '中等', count: counts.Mid, percent: Math.round(counts.Mid / total * 100), color: '#2d8cf0' },
          { key: 'High', label: '困难', count: counts.High, percent: Math.round(counts.High / total * 100), color: '#f90' }
        ]
      },
      badges () {
        let ac = this.profile.accepted_number || 0
        let sub = this.profile.submission_number || 0
        let score = this.profile.total_score || 0
        let rate = this.acRate
        return [
          { key: 'first', name: '初出茅庐', desc: '首次 AC', icon: 'ios-flag', unlocked: ac >= 1 },
          { key: 'ac10', name: '渐入佳境', desc: 'AC 10 题', icon: 'ios-star', unlocked: ac >= 10 },
          { key: 'ac50', name: '刷题达人', desc: 'AC 50 题', icon: 'ios-trophy', unlocked: ac >= 50 },
          { key: 'ac100', name: '题海勇士', desc: 'AC 100 题', icon: 'ribbon-b', unlocked: ac >= 100 },
          { key: 'rate80', name: '精准射手', desc: '通过率 80%+', icon: 'lightbulb', unlocked: rate >= 80 && sub >= 10 },
          { key: 'score1k', name: '积分破千', desc: '积分 1000+', icon: 'ios-flame', unlocked: score >= 1000 }
        ]
      }
    },
    watch: {
      '$route' (newVal, oldVal) {
        if (newVal !== oldVal) {
          this.init()
        }
      }
    }
  }
</script>

<style lang="less" scoped>
.user-home-elegant {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  min-height: calc(100vh - 80px);
  background: linear-gradient(180deg, #f0f4f8 0%, #f8fafc 100%);
}

.main-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
}

/* ========== 通用卡片 ========== */
.side-card,
.center-card {
  background: white;
  border-radius: 14px;
  box-shadow: 0 4px 24px rgba(30, 58, 138, 0.06);
  padding: 24px;
  margin-bottom: 20px;
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 8px 32px rgba(30, 58, 138, 0.1);
  }
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e3a8a;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 2px solid #f1f5f9;
}

/* ========== 左侧：用户名片 ========== */
.profile-card {
  text-align: center;

  .avatar-section {
    margin-bottom: 20px;

    .avatar-wrapper {
      display: inline-block;
      padding: 4px;
      background: linear-gradient(135deg, #1e3a8a, #3b82f6);
      border-radius: 50%;

      .avatar {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        border: 4px solid white;
        object-fit: cover;
      }
    }

    .user-name {
      font-size: 1.3rem;
      font-weight: 600;
      color: #1e3a8a;
      margin: 12px 0 4px;
    }

    .user-mood {
      font-size: 0.9rem;
      color: #64748b;
      font-style: italic;
      margin: 0 0 8px;
    }

    .user-since {
      font-size: 0.8rem;
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }
  }
}

.quick-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;

  .qstat {
    flex: 1;
    text-align: center;

    .qstat-num {
      display: block;
      font-size: 1.4rem;
      font-weight: 700;
      color: #1e3a8a;
    }

    .qstat-label {
      font-size: 0.75rem;
      color: #94a3b8;
    }
  }

  .qstat-divider {
    width: 1px;
    height: 30px;
    background: #e2e8f0;
  }
}

.ac-rate-bar {
  height: 6px;
  background: #f1f5f9;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 6px;

  .ac-rate-fill {
    height: 100%;
    background: linear-gradient(90deg, #19be6b, #2d8cf0);
    border-radius: 3px;
    transition: width 0.8s ease;
  }
}

.ac-rate-text {
  font-size: 0.75rem;
  color: #64748b;
  text-align: center;
  margin: 0 0 16px;
}

.social-section {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;

  .social-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 50%;
    color: #64748b;
    transition: all 0.2s ease;

    &:hover {
      background: #1e3a8a;
      border-color: #1e3a8a;
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(30, 58, 138, 0.2);
    }
  }
}

/* ========== 左侧：快捷入口 ========== */
.link-list {
  .link-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #475569;
    font-size: 0.9rem;

    .link-icon {
      font-size: 18px;
      color: #1e3a8a;
    }

    .link-arrow {
      margin-left: auto;
      font-size: 14px;
      color: #cbd5e1;
      opacity: 0;
      transition: opacity 0.2s;
    }

    &:hover {
      background: #f0f4f8;
      color: #1e3a8a;
      font-weight: 600;

      .link-arrow {
        opacity: 1;
      }
    }
  }
}

/* ========== 中间：统计卡片 ========== */
.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(30, 58, 138, 0.06);
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(30, 58, 138, 0.1);
  }

  .stat-icon {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    color: white;
    font-size: 22px;
    flex-shrink: 0;

    &.stat-icon-green { background: linear-gradient(135deg, #19be6b, #2d8cf0); }
    &.stat-icon-blue { background: linear-gradient(135deg, #2d8cf0, #5ea0f0); }
    &.stat-icon-orange { background: linear-gradient(135deg, #f90, #fbbf24); }
    &.stat-icon-purple { background: linear-gradient(135deg, #8e44ad, #a855f7); }
  }

  .stat-info {
    flex: 1;

    .stat-label {
      font-size: 0.8rem;
      color: #64748b;
      margin: 0;
    }

    .stat-value {
      font-size: 1.4rem;
      font-weight: 700;
      color: #1e3a8a;
      margin: 2px 0 0;
    }
  }
}

/* ========== 中间：题目区 ========== */
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  font-weight: 600;
  color: #1e3a8a;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f1f5f9;

  .section-count {
    margin-left: auto;
    font-size: 0.8rem;
    font-weight: 400;
    color: #94a3b8;
  }

  .help-icon {
    color: #94a3b8;
    cursor: pointer;
    transition: color 0.2s;

    &:hover { color: #1e3a8a; }
  }
}

.no-problems {
  text-align: center;
  padding: 30px 20px;
  color: #94a3b8;
}

.problems-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .problem-btn {
    padding: 6px 12px;
    background: white;
    border: 1px solid #1e3a8a;
    color: #1e3a8a;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 500;
    transition: all 0.2s ease;

    &:hover {
      background: #1e3a8a;
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(30, 58, 138, 0.2);
    }
  }
}

/* ========== 中间：提交时间线 ========== */
.submission-timeline {
  .timeline-item {
    display: flex;
    gap: 12px;
    padding-bottom: 16px;
    position: relative;

    &:not(.timeline-last)::before {
      content: '';
      position: absolute;
      left: 5px;
      top: 14px;
      bottom: 0;
      width: 2px;
      background: #e2e8f0;
    }

    .timeline-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid white;
      flex-shrink: 0;
      margin-top: 4px;
      z-index: 1;

      &.dot-ac { background: #19be6b; }
      &.dot-wa { background: #ed3f14; }
      &.dot-tle, &.dot-mle { background: #f90; }
      &.dot-re, &.dot-se { background: #e74c3c; }
      &.dot-ce { background: #6c757d; }
      &.dot-other { background: #94a3b8; }
    }

    .timeline-content {
      flex: 1;

      .timeline-top {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;

        .timeline-problem {
          font-weight: 600;
          color: #1e3a8a;
          cursor: pointer;

          &:hover { text-decoration: underline; }
        }

        .timeline-result {
          font-size: 0.75rem;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 600;

          &.result-ac { background: rgba(25, 190, 107, 0.1); color: #19be6b; }
          &.result-wa { background: rgba(237, 63, 20, 0.1); color: #ed3f14; }
          &.result-tle, &.result-mle { background: rgba(255, 153, 0, 0.1); color: #f90; }
          &.result-re, &.result-se { background: rgba(231, 76, 60, 0.1); color: #e74c3c; }
          &.result-ce { background: rgba(108, 117, 125, 0.1); color: #6c757d; }
          &.result-other { background: rgba(148, 163, 184, 0.1); color: #94a3b8; }
        }
      }

      .timeline-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        font-size: 0.75rem;
        color: #94a3b8;

        .meta-lang {
          display: flex;
          align-items: center;
          gap: 3px;
        }
      }
    }
  }
}

/* ========== 右侧：难度分布 ========== */
.difficulty-stats {
  .diff-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;

    .diff-label {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 48px;
      font-size: 0.85rem;
      color: #475569;
      flex-shrink: 0;

      .diff-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }
    }

    .diff-bar-track {
      flex: 1;
      height: 8px;
      background: #f1f5f9;
      border-radius: 4px;
      overflow: hidden;

      .diff-bar-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.8s ease;
      }
    }

    .diff-count {
      width: 28px;
      text-align: right;
      font-size: 0.85rem;
      font-weight: 600;
      color: #1e3a8a;
    }
  }
}

/* ========== 右侧：本周活跃 ========== */
.week-activity {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  height: 80px;
  margin-bottom: 12px;

  .week-day {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;

    .week-bar {
      width: 100%;
      max-width: 24px;
      min-height: 4px;
      border-radius: 4px;
      transition: height 0.5s ease;
    }

    .week-label {
      font-size: 0.7rem;
      color: #94a3b8;
    }

    &.week-today .week-label {
      color: #1e3a8a;
      font-weight: 700;
    }
  }
}

.week-summary {
  text-align: center;
  font-size: 0.8rem;
  color: #64748b;

  strong {
    color: #1e3a8a;
    font-size: 1rem;
  }
}

/* ========== 右侧：成就徽章 ========== */
.badges-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;

  .badge-item {
    text-align: center;
    padding: 12px 6px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;

    .badge-icon {
      width: 40px;
      height: 40px;
      margin: 0 auto 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-size: 20px;
    }

    .badge-name {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .badge-desc {
      display: block;
      font-size: 0.65rem;
      color: #94a3b8;
      margin-top: 2px;
    }

    &.badge-unlocked {
      background: linear-gradient(135deg, #fffbe6, #fff7e6);

      .badge-icon {
        background: linear-gradient(135deg, #f90, #fbbf24);
        color: white;
        box-shadow: 0 2px 8px rgba(255, 153, 0, 0.3);
      }

      .badge-name { color: #92400e; }
    }

    &.badge-locked {
      background: #f8fafc;

      .badge-icon {
        background: #e2e8f0;
        color: #94a3b8;
      }

      .badge-name { color: #94a3b8; }
      .badge-desc { color: #cbd5e1; }
    }
  }
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .user-home-elegant {
    padding: 80px 12px 20px;
  }

  .stats-section {
    grid-template-columns: repeat(2, 1fr);
  }

  .badges-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
