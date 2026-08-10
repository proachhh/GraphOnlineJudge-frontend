<template>
  <div class="profile-onboarding-page">
    <div class="onboarding-container">
      <transition name="card-fade" mode="out-in">
        <!-- 欢迎卡片 -->
        <div v-if="!started && !complete" key="welcome" class="welcome-card">
          <div class="welcome-hero">
            <div class="hero-icon-ring">
              <Icon type="ios-person" size="48" color="#fff" />
            </div>
            <h1>构建你的学习画像</h1>
            <p class="hero-desc">{{ $t('m.Smart_Profile_Onboarding_Desc') }}</p>
          </div>
          <div class="dimension-grid">
            <div v-for="(dim, i) in dimensions" :key="dim.key" class="dim-card">
              <div class="dim-num">{{ String(i + 1).padStart(2, '0') }}</div>
              <div class="dim-info">
                <Icon :type="dim.icon" size="16" :color="dim.color" />
                <span>{{ dim.label }}</span>
              </div>
            </div>
          </div>
          <Button type="primary" size="large" long @click="startOnboarding" :loading="loading" class="start-btn">
            <Icon type="ios-arrow-forward" /> 开始引导
          </Button>
        </div>

        <!-- 完成卡片 -->
        <div v-else-if="complete" key="complete" class="complete-card">
          <div class="complete-hero">
            <div class="complete-icon-ring">
              <Icon type="ios-checkmark" size="48" color="#fff" />
            </div>
            <h1>画像生成完成</h1>
            <p v-if="completeMessage">{{ completeMessage }}</p>
          </div>
          <div v-if="profile && hasAnyProfileData" class="profile-summary">
            <div class="summary-grid">
              <div class="summary-tile" v-if="profile.knowledge_mastery">
                <div class="tile-icon" style="background: rgba(45,140,240,0.1)">
                  <Icon type="ios-bookmarks" size="20" color="#2d8cf0" />
                </div>
                <div class="tile-body">
                  <span class="tile-label">总体评价</span>
                  <span class="tile-text">{{ profile.knowledge_mastery }}</span>
                </div>
              </div>
              <div class="summary-tile" v-if="strengthTopics.length">
                <div class="tile-icon" style="background: rgba(25,190,107,0.1)">
                  <Icon type="ios-star" size="20" color="#19be6b" />
                </div>
                <div class="tile-body">
                  <span class="tile-label">强项</span>
                  <div class="tile-tags">
                    <span class="profile-tag strength" v-for="t in strengthTopics" :key="t">{{ t }}</span>
                  </div>
                </div>
              </div>
              <div class="summary-tile" v-if="weakTopics.length">
                <div class="tile-icon" style="background: rgba(237,64,20,0.1)">
                  <Icon type="alert-circled" size="20" color="#ed4014" />
                </div>
                <div class="tile-body">
                  <span class="tile-label">弱项</span>
                  <div class="tile-tags">
                    <span class="profile-tag weakness" v-for="t in weakTopics" :key="t">{{ t }}</span>
                  </div>
                </div>
              </div>
              <div class="summary-tile" v-if="profile.coding_style">
                <div class="tile-icon" style="background: rgba(25,190,107,0.1)">
                  <Icon type="code-working" size="20" color="#19be6b" />
                </div>
                <div class="tile-body">
                  <span class="tile-label">编码风格</span>
                  <span class="tile-text">{{ profile.coding_style }}</span>
                </div>
              </div>
              <div class="summary-tile" v-if="profile.learning_pace">
                <div class="tile-icon" style="background: rgba(255,153,0,0.1)">
                  <Icon type="ios-speedometer" size="20" color="#f90" />
                </div>
                <div class="tile-body">
                  <span class="tile-label">学习节奏</span>
                  <span class="tile-text">{{ profile.learning_pace }}</span>
                </div>
              </div>
              <div class="summary-tile" v-if="profile.recommended_focus">
                <div class="tile-icon" style="background: rgba(156,39,176,0.1)">
                  <Icon type="compass" size="20" color="#9c27b0" />
                </div>
                <div class="tile-body">
                  <span class="tile-label">建议方向</span>
                  <span class="tile-text">{{ profile.recommended_focus }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-profile">
            <Icon type="ios-paper-outline" size="32" color="#c5c8ce" />
            <p>暂无画像数据，完成引导对话即可生成。</p>
          </div>
          <div class="complete-actions">
            <Button type="primary" @click="openChatFloat">
              <Icon type="ios-chatboxes" /> {{ $t('m.Smart_Chat_Nav') }}
            </Button>
            <Button @click="$router.push({name: 'LearningPath'})">
              <Icon type="ios-navigate" /> 规划学习路径
            </Button>
            <Button type="text" @click="resetAndStart" size="small">
              <Icon type="ios-refresh" /> 重新生成
            </Button>
          </div>
        </div>

        <!-- 问答卡片 -->
        <div v-else key="question" class="question-card">
          <!-- 进度区 -->
          <div class="progress-section">
            <div class="progress-info">
              <span class="step-badge">{{ step }} / {{ totalSteps }}</span>
              <span class="step-dim">{{ currentDisplay }}</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" :style="{width: (step / totalSteps * 100) + '%'}"></div>
            </div>
            <div class="progress-dots">
              <span v-for="n in totalSteps" :key="n"
                class="dot"
                :class="{ done: n < step, active: n === step }">
              </span>
            </div>
          </div>

          <!-- 问题区 -->
          <div class="question-body">
            <div class="question-label">
              <Icon type="ios-help-outline" size="18" color="#2d8cf0" />
              <span>问题</span>
            </div>
            <div class="question-text">{{ currentQuestion }}</div>
          </div>

          <!-- 输入区 -->
          <div class="input-area">
            <Input
              v-model="answer"
              type="textarea"
              :rows="4"
              :placeholder="'请输入你的' + currentDisplay + '...'"
              @keyup.enter.ctrl="submitAnswer"
              class="answer-input"
            />
            <div class="action-buttons">
              <span class="hint-text">Ctrl + Enter 提交</span>
              <Button type="text" @click="skipAnswer">跳过</Button>
              <Button type="primary" @click="submitAnswer" :loading="loading" :disabled="!answer.trim()">
                {{ step < totalSteps ? '下一步' : '完成' }}
                <Icon type="ios-arrow-forward" />
              </Button>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProfileOnboarding',
  data () {
    return {
      loading: false,
      started: false,
      complete: false,
      step: 1,
      totalSteps: 6,
      currentQuestion: '',
      currentDisplay: '',
      answer: '',
      completeMessage: '',
      profile: null,
      dimensions: [
        { key: 'background', label: '专业背景', icon: 'ios-briefcase', color: '#2d8cf0' },
        { key: 'current_courses', label: '当前课程', icon: 'ios-book', color: '#19be6b' },
        { key: 'weak_areas', label: '薄弱知识点', icon: 'alert-circled', color: '#ed4014' },
        { key: 'learning_goals', label: '学习目标', icon: 'ios-flag', color: '#f90' },
        { key: 'learning_style', label: '偏好学习方式', icon: 'ios-color-wand', color: '#9c27b0' },
        { key: 'weekly_hours', label: '每周学习时长', icon: 'ios-time', color: '#1e3a8a' }
      ]
    }
  },
  mounted () {
    this.checkStatus()
  },
  computed: {
    strengthTopics () {
      const v = this.profile && this.profile.strength_topics
      return Array.isArray(v) ? v : (typeof v === 'string' && v ? [v] : [])
    },
    weakTopics () {
      const v = this.profile && this.profile.weak_topics
      return Array.isArray(v) ? v : (typeof v === 'string' && v ? [v] : [])
    },
    hasAnyProfileData () {
      if (!this.profile) return false
      return !!(
        this.profile.knowledge_mastery ||
        this.strengthTopics.length ||
        this.weakTopics.length ||
        this.profile.coding_style ||
        this.profile.learning_pace ||
        this.profile.recommended_focus
      )
    }
  },
  methods: {
    async checkStatus () {
      try {
        const res = await this.$http.post('/agent/profile/init/', { action: 'status' })
        const data = res.data.data || res.data
        if (data.onboarding_complete) {
          this.complete = true
          this.completeMessage = '引导对话已完成！'
          this.profile = data.profile || {}
          return
        }
        if (data.answered_count > 0) {
          this.started = true
          this.step = data.answered_count + 1
          this.totalSteps = data.total || 6
          this.startOnboarding()
        }
      } catch (e) {
      }
    },
    async startOnboarding () {
      this.loading = true
      try {
        const res = await this.$http.post('/agent/profile/init/', { action: 'start' })
        const data = res.data.data || res.data
        if (data.onboarding_complete) {
          this.complete = true
          this.completeMessage = data.message || '引导对话已完成！'
          this.profile = data.profile || {}
        } else {
          this.complete = false
          this.started = true
          this.step = data.step || 1
          this.totalSteps = data.total_steps || 6
          this.currentQuestion = data.question || ''
          this.currentDisplay = data.dimension_display || ''
          this.answer = ''
        }
      } catch (e) {
        const errMsg = (e.response && e.response.data && e.response.data.error) || e.message || '未知错误'
        this.$Message.error('启动引导失败：' + errMsg)
      } finally {
        this.loading = false
      }
    },
    resetAndStart () {
      this.$http.post('/agent/profile/init/', { action: 'reset' }).finally(() => {
        this.started = false
        this.complete = false
        this.profile = null
        this.completeMessage = ''
        this.answer = ''
        this.step = 1
        this.$nextTick(() => {
          this.startOnboarding()
        })
      })
    },
    openChatFloat () {
      this.$root.$emit('open-ai-chat')
    },
    async submitAnswer () {
      if (!this.answer.trim()) return
      this.loading = true
      try {
        const res = await this.$http.post('/agent/profile/init/', {
          action: 'answer',
          answer: this.answer.trim()
        })
        const data = res.data.data || res.data
        if (data.onboarding_complete) {
          this.complete = true
          this.completeMessage = data.message || this.$t('m.Smart_Profile_Done')
          this.profile = data.profile || {}
        } else {
          this.step = data.step || this.step + 1
          this.currentQuestion = data.question || ''
          this.currentDisplay = data.dimension_display || ''
          this.answer = ''
        }
      } catch (e) {
        this.$Message.error('提交失败，请重试')
      } finally {
        this.loading = false
      }
    },
    async skipAnswer () {
      this.loading = true
      try {
        const res = await this.$http.post('/agent/profile/init/', { action: 'skip' })
        const data = res.data.data || res.data
        if (data.onboarding_complete) {
          this.complete = true
          this.completeMessage = data.message || '引导对话完成！'
          this.profile = data.profile || {}
        } else {
          this.step = data.step || this.step + 1
          this.currentQuestion = data.question || ''
          this.currentDisplay = data.dimension_display || ''
          this.answer = ''
        }
      } catch (e) {
        this.$Message.error('操作失败')
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style lang="less" scoped>
.profile-onboarding-page {
  min-height: calc(100vh - 60px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #f0f4f8 0%, #e8eef5 50%, #f5f0fa 100%);
  padding: 40px 20px;
}

.onboarding-container {
  width: 100%;
  max-width: 680px;
}

/* 过渡动画 */
.card-fade-enter-active, .card-fade-leave-active {
  transition: all 0.4s ease;
}
.card-fade-enter {
  opacity: 0;
  transform: translateY(20px);
}
.card-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* 通用卡片 */
.welcome-card, .complete-card, .question-card {
  background: #fff;
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 8px 40px rgba(30, 58, 138, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.8);
}

/* === 欢迎卡片 === */
.welcome-card {
  .welcome-hero {
    text-align: center;
    margin-bottom: 32px;
  }
  .hero-icon-ring {
    width: 88px;
    height: 88px;
    margin: 0 auto 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2d8cf0, #1e3a8a);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 24px rgba(45, 140, 240, 0.3);
  }
  h1 {
    font-size: 26px;
    font-weight: 700;
    color: #1e3a8a;
    margin: 0 0 10px;
  }
  .hero-desc {
    color: #64748b;
    font-size: 15px;
    line-height: 1.7;
    max-width: 480px;
    margin: 0 auto;
  }
  .dimension-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 28px;
  }
  .dim-card {
    background: #f8fafc;
    border: 1px solid #f1f5f9;
    border-radius: 12px;
    padding: 14px 12px;
    transition: all 0.2s;
    &:hover {
      background: #f0f5ff;
      border-color: #d6e4ff;
      transform: translateY(-2px);
    }
    .dim-num {
      font-size: 11px;
      font-weight: 700;
      color: #c5c8ce;
      margin-bottom: 6px;
    }
    .dim-info {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #515a6e;
      font-weight: 500;
    }
  }
  .start-btn {
    height: 48px;
    font-size: 16px;
    border-radius: 12px;
    font-weight: 600;
  }
}

/* === 完成卡片 === */
.complete-card {
  .complete-hero {
    text-align: center;
    margin-bottom: 28px;
  }
  .complete-icon-ring {
    width: 80px;
    height: 80px;
    margin: 0 auto 16px;
    border-radius: 50%;
    background: linear-gradient(135deg, #19be6b, #16a34a);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 24px rgba(25, 190, 107, 0.3);
  }
  h1 {
    font-size: 24px;
    font-weight: 700;
    color: #16a34a;
    margin: 0 0 8px;
  }
  p {
    color: #64748b;
    font-size: 14px;
    margin: 0;
  }
  .profile-summary {
    margin-bottom: 24px;
  }
  .summary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .summary-tile {
    background: #f8fafc;
    border: 1px solid #f1f5f9;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    gap: 12px;
    align-items: flex-start;
    transition: all 0.2s;
    &:hover {
      box-shadow: 0 4px 16px rgba(0,0,0,0.06);
    }
    .tile-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .tile-body {
      flex: 1;
      min-width: 0;
    }
    .tile-label {
      display: block;
      font-size: 12px;
      color: #808695;
      margin-bottom: 4px;
    }
    .tile-text {
      font-size: 14px;
      color: #17233d;
      line-height: 1.6;
    }
    .tile-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
  }
  .profile-tag {
    display: inline-block;
    font-size: 12px;
    font-weight: 600;
    padding: 2px 10px;
    border-radius: 6px;
    line-height: 20px;
    &.strength { background: #19be6b; color: #fff; }
    &.weakness { background: #ed4014; color: #fff; }
  }
  .empty-profile {
    text-align: center;
    padding: 32px 0;
    p {
      color: #808695;
      font-size: 14px;
      margin: 8px 0 0;
    }
  }
  .complete-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
    padding-top: 20px;
    border-top: 1px solid #f1f5f9;
  }
}

/* === 问答卡片 === */
.question-card {
  .progress-section {
    margin-bottom: 28px;
  }
  .progress-info {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }
  .step-badge {
    background: linear-gradient(135deg, #2d8cf0, #1e3a8a);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    padding: 3px 12px;
    border-radius: 8px;
  }
  .step-dim {
    font-size: 15px;
    font-weight: 600;
    color: #1e3a8a;
  }
  .progress-track {
    height: 8px;
    background: #f1f5f9;
    border-radius: 4px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #2d8cf0, #1e3a8a);
    border-radius: 4px;
    transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .progress-dots {
    display: flex;
    gap: 6px;
    margin-top: 10px;
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #e8eaec;
      transition: all 0.3s;
      &.done { background: #2d8cf0; }
      &.active {
        background: #2d8cf0;
        transform: scale(1.4);
        box-shadow: 0 0 0 4px rgba(45, 140, 240, 0.2);
      }
    }
  }
  .question-body {
    background: #f8fafc;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 20px;
    border: 1px solid #f1f5f9;
  }
  .question-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #808695;
    margin-bottom: 10px;
  }
  .question-text {
    font-size: 18px;
    font-weight: 600;
    color: #17233d;
    line-height: 1.7;
  }
  .input-area {
    .answer-input {
      /deep/ .ivu-input {
        border-radius: 12px;
        font-size: 15px;
        padding: 12px 16px;
        &:focus { border-color: #2d8cf0; box-shadow: 0 0 0 3px rgba(45, 140, 240, 0.1); }
      }
    }
    .action-buttons {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 16px;
    }
    .hint-text {
      margin-right: auto;
      font-size: 12px;
      color: #c5c8ce;
    }
  }
}

/* 响应式 */
@media (max-width: 640px) {
  .welcome-card, .complete-card, .question-card {
    padding: 24px;
  }
  .welcome-card .dimension-grid {
    grid-template-columns: 1fr 1fr;
  }
  .complete-card .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
