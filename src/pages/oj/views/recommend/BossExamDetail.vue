<template>
  <div class="boss-detail-page">
    <!-- 顶部信息 -->
    <div class="detail-header" v-loading="loading">
      <div class="header-left">
        <el-button icon="el-icon-arrow-left" size="mini" circle @click="$router.back()" class="back-btn"></el-button>
        <div class="header-info">
          <div class="header-title">
            <i class="el-icon-trophy"></i>
            <span>{{ exam.title || 'Boss 挑战' }}</span>
            <span class="boss-tag">BOSS</span>
          </div>
          <div class="header-meta">
            <el-tag size="mini" :type="diffTag(exam.difficulty)" effect="dark" v-if="exam.difficulty">{{ diffText(exam.difficulty) }}</el-tag>
            <el-tag size="mini" type="danger" effect="plain" v-if="exam.passing_score != null">及格 {{ exam.passing_score }} 分</el-tag>
            <span class="meta-text" v-if="exam.time_limit"><i class="el-icon-time"></i> {{ exam.time_limit }} 分钟</span>
            <span class="meta-text" v-if="timerActive" :class="{ 'timer-warn': remainSeconds < 60 }">
              <i class="el-icon-alarm-clock"></i> 剩余 {{ formattedTime }}
            </span>
          </div>
        </div>
      </div>
      <div class="header-right" v-if="phase === 'answering'">
        <el-progress :percentage="answeredPercent" :stroke-width="8" :format="() => answeredCount + '/' + totalCount" class="ans-progress"></el-progress>
      </div>
    </div>

    <!-- Boss 战斗 HP 条 -->
    <div class="boss-hp-section" v-if="totalCount > 0">
      <div class="boss-avatar" :class="{ hit: bossHitAnim, defeated: bossDefeated }">
        <span class="boss-emoji">{{ bossEmoji }}</span>
        <div class="boss-aura"></div>
      </div>
      <div class="boss-hp-wrap">
        <div class="boss-hp-info">
          <span class="boss-hp-name">{{ exam.boss_topic || exam.title || 'Boss' }}</span>
          <span class="boss-hp-text">HP {{ bossHpDisplay }} / {{ bossMaxHp }}</span>
        </div>
        <div class="boss-hp-bar">
          <div class="boss-hp-fill" :class="{ low: bossHpPercent < 30, crit: bossHpPercent < 15 }" :style="{ width: bossHpPercent + '%' }">
            <span class="boss-hp-shine"></span>
          </div>
          <span v-for="d in floatDamages" :key="d.id" class="float-damage" :class="{ crit: d.crit }" :style="{ left: d.x + '%' }">-{{ d.val }}</span>
        </div>
        <div class="boss-hp-hint" v-if="phase === 'answering'">每答一题对 Boss 造成伤害，击败 Boss 即通关</div>
      </div>
    </div>

    <!-- Boss 知识点 + 描述 -->
    <div class="boss-info-box" v-if="exam.boss_topic || exam.description || exam.topic_area">
      <div class="boss-topic-row" v-if="exam.boss_topic">
        <i class="el-icon-aim"></i>
        <span class="bt-label">Boss 汇聚知识点：</span>
        <span class="bt-name">{{ exam.boss_topic }}</span>
      </div>
      <div class="topic-area-tags" v-if="exam.topic_area">
        <el-tag size="small" v-for="(t, i) in topicAreaList" :key="i" type="info" effect="plain">{{ t }}</el-tag>
      </div>
      <div class="boss-desc" v-if="exam.description">{{ exam.description }}</div>
    </div>

    <!-- 答题区 -->
    <div class="questions-wrap" v-if="phase !== 'done' && questions.length">
      <div class="question-card" v-for="(q, idx) in questions" :key="q.id">
        <div class="q-header">
          <span class="q-num">第 {{ idx + 1 }} 题</span>
          <el-tag size="mini" :type="qTypeTag(q.question_type)">{{ qTypeText(q.question_type) }}</el-tag>
          <span class="q-score">{{ q.score }} 分</span>
        </div>
        <div class="q-content">{{ q.content }}</div>

        <!-- 选择题 -->
        <div v-if="q.question_type === 'choice'" class="q-body">
          <el-radio-group v-model="answers[q.id]" :disabled="phase !== 'answering'">
            <el-radio v-for="c in q.choices" :key="c.key" :label="c.key" class="q-option">
              {{ c.key }}. {{ c.text }}
            </el-radio>
          </el-radio-group>
        </div>

        <!-- 代码题 -->
        <div v-else-if="q.question_type === 'code'" class="q-body">
          <div class="problem-link" v-if="q.problem" @click="goProblem(q.problem)">
            <i class="el-icon-link"></i> 关联题目：{{ q.problem.title || '#' + q.problem._id }}
          </div>
          <el-input type="textarea" v-model="answers[q.id]" :rows="8" placeholder="在此输入代码..."
            :disabled="phase !== 'answering'"></el-input>
        </div>

        <!-- 简答题 -->
        <div v-else class="q-body">
          <el-input type="textarea" v-model="answers[q.id]" :rows="5" placeholder="在此输入答案..."
            :disabled="phase !== 'answering'"></el-input>
        </div>
      </div>

      <div class="submit-bar" v-if="phase === 'answering'">
        <el-button type="danger" size="medium" @click="onSubmit" :loading="submitting" :disabled="!totalCount">
          提交 Boss 挑战
        </el-button>
        <span class="submit-hint">已答 {{ answeredCount }} / {{ totalCount }} 题</span>
      </div>

      <!-- 提交后、AI批改前 -->
      <div class="result-bar" v-if="phase === 'submitted' || phase === 'grading'">
        <div class="result-score">
          <span class="score-label">当前得分</span>
          <span class="score-num">{{ currentScore }}</span>
          <span class="pass-status pass" v-if="phase !== 'grading' && passed != null && passed">通过</span>
          <span class="pass-status fail" v-if="phase !== 'grading' && passed != null && !passed">未通过</span>
          <span class="score-status" v-if="phase === 'submitted' && pendingAiGrading">部分题目等待 AI 批改</span>
          <span class="score-status grading" v-if="phase === 'grading'">AI 综合评估中...</span>
        </div>
        <el-button type="warning" size="medium" v-if="phase === 'submitted' && pendingAiGrading"
                   @click="startGradingStream" :loading="grading">
          <i class="el-icon-magic-stick"></i> 开始 AI 评估
        </el-button>
        <el-button type="success" size="medium" v-if="phase === 'submitted' && !pendingAiGrading"
                   @click="loadReport">查看报告</el-button>
      </div>

      <!-- AI 流式反馈 -->
      <div class="ai-stream" v-if="phase === 'grading' && streamingText">
        <div class="stream-title"><i class="el-icon-loading"></i> AI 综合评估</div>
        <div class="stream-text markdown-body" v-html="renderMarkdown(streamingText)"></div>
      </div>
    </div>

    <!-- 报告区 -->
    <div class="report-wrap" v-if="phase === 'done' && report">
      <div class="report-summary" :class="passed ? 'pass' : 'fail'">
        <div class="summary-score">
          <span class="big-score">{{ report.total_score != null ? report.total_score : currentScore }}</span>
          <span class="max-score" v-if="report.max_score != null">/ {{ report.max_score }}</span>
        </div>
        <div class="summary-status">
          <div class="pass-text" :class="passed ? 'pass' : 'fail'">
            <i :class="passed ? 'el-icon-success' : 'el-icon-error'"></i>
            {{ passed ? '挑战通过！' : '挑战未通过' }}
          </div>
          <div class="pass-detail" v-if="exam.passing_score != null">及格线：{{ exam.passing_score }} 分</div>
        </div>
        <el-button :type="passed ? 'success' : 'danger'" size="small" @click="backToList">返回列表</el-button>
      </div>

      <!-- 总体 AI 评估 -->
      <div class="overall-ai" v-if="report.ai_feedback || report.overall_feedback">
        <div class="overall-title"><i class="el-icon-magic-stick"></i> AI 综合评价</div>
        <div class="overall-text markdown-body" v-html="renderMarkdown(report.ai_feedback || report.overall_feedback)"></div>
      </div>

      <div class="report-q-card" v-for="(q, idx) in reportQuestions" :key="q.id || idx">
        <div class="q-header">
          <span class="q-num">第 {{ idx + 1 }} 题</span>
          <el-tag size="mini" :type="qTypeTag(q.question_type)">{{ qTypeText(q.question_type) }}</el-tag>
          <span class="q-score">{{ q.score != null ? q.score : '-' }} / {{ q.max_score || q.score || '-' }} 分</span>
          <el-tag size="mini" :type="isCorrect(q) ? 'success' : 'danger'" v-if="q.is_correct != null">
            {{ isCorrect(q) ? '正确' : '错误' }}
          </el-tag>
        </div>
        <div class="q-content">{{ q.content }}</div>
        <div class="report-answers">
          <div class="ra-row">
            <span class="ra-label">你的答案：</span>
            <span class="ra-value" :class="{ wrong: !isCorrect(q) }">{{ formatAnswer(q.user_answer, q) || '未作答' }}</span>
          </div>
          <div class="ra-row" v-if="q.correct_answer != null">
            <span class="ra-label">正确答案：</span>
            <span class="ra-value correct">{{ formatAnswer(q.correct_answer, q) }}</span>
          </div>
        </div>
        <div class="report-explain" v-if="q.explanation">
          <span class="exp-label">解析</span>
          <div class="exp-text" v-html="renderMarkdown(q.explanation)"></div>
        </div>
        <div class="report-ai" v-if="q.ai_feedback">
          <span class="exp-label ai"><i class="el-icon-magic-stick"></i> AI 反馈</span>
          <div class="exp-text" v-html="renderMarkdown(q.ai_feedback)"></div>
        </div>
      </div>

      <div class="report-actions">
        <el-button :type="passed ? 'success' : 'danger'" @click="backToList">返回试卷列表</el-button>
      </div>
    </div>

    <div v-if="!loading && !questions.length && phase !== 'done'" class="empty-hint">
      <i class="el-icon-warning-outline"></i>
      <p>未找到试卷内容</p>
    </div>

    <!-- 通关庆祝全屏动画 -->
    <div class="victory-overlay" v-if="showVictory" @click="onVictoryClick">
      <canvas ref="victoryCanvas" class="victory-canvas"></canvas>
      <div class="victory-flash"></div>
      <div class="victory-text">
        <div class="vt-main">
          <span>V</span><span>I</span><span>C</span><span>T</span><span>O</span><span>R</span><span>Y</span>
        </div>
        <div class="vt-sub">Boss 已被击败</div>
        <div class="vt-score">最终得分 {{ currentScore }} / {{ bossMaxHp }}</div>
        <div class="vt-hint">点击任意处继续</div>
      </div>
    </div>

    <!-- 通关失败动画 -->
    <div class="defeat-overlay" v-if="showDefeat" @click="showDefeat = false">
      <div class="defeat-text">
        <div class="dt-main">DEFEATED</div>
        <div class="dt-sub">Boss 仍剩 {{ bossMaxHp - currentScore }} HP</div>
        <div class="dt-hint">点击任意处继续</div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@oj/api'

export default {
  name: 'BossExamDetail',
  data () {
    return {
      loading: false,
      submitting: false,
      grading: false,
      phase: 'loading',
      exam: {},
      questions: [],
      answers: {},
      submissionId: null,
      currentScore: 0,
      passed: null,
      pendingAiGrading: false,
      streamingText: '',
      report: null,
      timerActive: false,
      remainSeconds: 0,
      _timer: null,
      // gamification
      bossHitAnim: false,
      bossDefeated: false,
      showVictory: false,
      showDefeat: false,
      floatDamages: [],
      _dmgId: 0,
      _victoryAnim: null,
      _lastAnsweredCount: 0
    }
  },
  computed: {
    totalCount () { return this.questions.length },
    answeredCount () {
      return this.questions.filter(q => {
        const a = this.answers[q.id]
        return a !== undefined && a !== null && a !== ''
      }).length
    },
    answeredPercent () {
      if (!this.totalCount) return 0
      return Math.round(this.answeredCount / this.totalCount * 100)
    },
    reportQuestions () {
      return (this.report && this.report.questions) || []
    },
    topicAreaList () {
      if (!this.exam.topic_area) return []
      if (Array.isArray(this.exam.topic_area)) return this.exam.topic_area
      return String(this.exam.topic_area).split(/[,，、\s]+/).filter(Boolean)
    },
    formattedTime () {
      const m = Math.floor(this.remainSeconds / 60)
      const s = this.remainSeconds % 60
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    },
    bossMaxHp () {
      if (this.exam && this.exam.max_score) return this.exam.max_score
      return this.questions.reduce((sum, q) => sum + (q.score || 0), 0) || 100
    },
    bossHpPercent () {
      if (!this.bossMaxHp) return 100
      // 报告阶段：按得分扣血（得分越高血越少）
      if (this.phase === 'done' || this.phase === 'submitted' || this.phase === 'grading') {
        const lost = Math.min(this.currentScore, this.bossMaxHp)
        return Math.max(0, Math.round((1 - lost / this.bossMaxHp) * 100))
      }
      // 答题阶段：按答题进度蓄力（Boss 慢慢受伤，给玩家进度反馈）
      if (!this.totalCount) return 100
      const progress = this.answeredCount / this.totalCount
      return Math.max(20, Math.round((1 - progress * 0.6) * 100))
    },
    bossHpDisplay () {
      return Math.round(this.bossMaxHp * this.bossHpPercent / 100)
    },
    bossEmoji () {
      const d = this.exam && this.exam.difficulty
      if (d === 'High') return '🐉'
      if (d === 'Mid') return '👹'
      return '👺'
    }
  },
  mounted () {
    this.loadDetail()
  },
  beforeDestroy () {
    this.clearTimer()
    this.clearVictory()
  },
  watch: {
    answeredCount (n, old) {
      // 答题阶段每多答一题，Boss 受击一次
      if (this.phase === 'answering' && n > (old || 0)) {
        this.triggerBossHit()
      }
    }
  },
  methods: {
    // ===== Boss gamification =====
    triggerBossHit () {
      this.bossHitAnim = true
      setTimeout(() => { this.bossHitAnim = false }, 400)
      // 飘字伤害
      const val = Math.max(1, Math.round(this.bossMaxHp * 0.08))
      this.spawnFloatDamage(val, false)
    },
    spawnFloatDamage (val, crit) {
      const id = ++this._dmgId
      const x = 40 + Math.random() * 40
      this.floatDamages.push({ id, val, x, crit })
      setTimeout(() => {
        this.floatDamages = this.floatDamages.filter(d => d.id !== id)
      }, 1100)
    },
    judgeBossResult () {
      if (this.passed === true) {
        this.bossDefeated = true
        this.startVictory()
      } else if (this.passed === false) {
        this.showDefeat = true
      }
    },
    startVictory () {
      this.showVictory = true
      this.$nextTick(() => this.runVictoryParticles())
    },
    runVictoryParticles () {
      const canvas = this.$refs.victoryCanvas
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      const W = canvas.width, H = canvas.height
      const colors = ['#ff4757', '#ffa502', '#ffdd59', '#2ed573', '#1e90ff', '#a55eea', '#ff6b81']
      const particles = []
      // 中心爆炸
      for (let i = 0; i < 180; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = 3 + Math.random() * 9
        particles.push({
          x: W / 2, y: H / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          size: 2 + Math.random() * 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 1,
          decay: 0.008 + Math.random() * 0.012,
          gravity: 0.12 + Math.random() * 0.08
        })
      }
      // 两侧礼花
      const burst = (ox, oy) => {
        for (let i = 0; i < 60; i++) {
          const angle = Math.random() * Math.PI * 2
          const speed = 2 + Math.random() * 6
          particles.push({
            x: ox, y: oy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 2 + Math.random() * 3,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 1,
            decay: 0.01 + Math.random() * 0.01,
            gravity: 0.1
          })
        }
      }
      let frame = 0
      const animate = () => {
        if (!this.showVictory) return
        ctx.clearRect(0, 0, W, H)
        particles.forEach(p => {
          p.x += p.vx
          p.y += p.vy
          p.vy += p.gravity
          p.life -= p.decay
          if (p.life > 0) {
            ctx.globalAlpha = Math.max(0, p.life)
            ctx.fillStyle = p.color
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
            ctx.fill()
          }
        })
        ctx.globalAlpha = 1
        // 两侧补礼花
        if (frame === 30) burst(W * 0.2, H * 0.4)
        if (frame === 60) burst(W * 0.8, H * 0.4)
        if (frame === 100) burst(W * 0.5, H * 0.3)
        // 清理死亡粒子
        for (let i = particles.length - 1; i >= 0; i--) {
          if (particles[i].life <= 0) particles.splice(i, 1)
        }
        frame++
        if (particles.length > 0 && frame < 400) {
          this._victoryAnim = requestAnimationFrame(animate)
        }
      }
      animate()
    },
    clearVictory () {
      this.showVictory = false
      this.showDefeat = false
      if (this._victoryAnim) {
        cancelAnimationFrame(this._victoryAnim)
        this._victoryAnim = null
      }
    },
    onVictoryClick () {
      this.clearVictory()
    },

    loadDetail () {
      this.loading = true
      const id = this.$route.params.id
      api.getBossExamDetail(id).then(res => {
        const d = res.data.data || res.data
        this.exam = d
        this.questions = (d.questions || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0))
        this.phase = 'answering'
        if (d.time_limit) this.startTimer(d.time_limit * 60)
      }).catch(() => {
        this.$message.error('加载试卷失败')
      }).finally(() => { this.loading = false })
    },
    onSubmit () {
      if (this.answeredCount === 0) {
        this.$message.warning('请至少作答一题再提交')
        return
      }
      this.$confirm('确定要提交 Boss 挑战吗？提交后将无法修改答案。', '挑战提示', {
        confirmButtonText: '确定挑战',
        cancelButtonText: '再想想',
        type: 'warning'
      }).then(() => {
        this.doSubmit()
      }).catch(() => {})
    },
    doSubmit () {
      this.submitting = true
      this.clearTimer()
      const id = this.$route.params.id
      const answers = this.questions.map(q => ({
        question_id: q.id,
        answer: this.answers[q.id] != null ? this.answers[q.id] : ''
      }))
      api.submitBossExam(id, { answers }).then(res => {
        const d = res.data.data || res.data
        this.submissionId = d.submission_id
        this.currentScore = d.total_score || 0
        this.passed = d.passed != null ? d.passed : null
        this.pendingAiGrading = !!d.pending_ai_grading
        this.phase = 'submitted'
        this.$message.success(this.passed ? '挑战通过！' : '提交成功')
        if (this.pendingAiGrading) {
          this.$nextTick(() => this.startGradingStream())
        } else {
          this.loadReport()
        }
      }).catch(() => {
        this.$message.error('提交失败')
      }).finally(() => { this.submitting = false })
    },
    async startGradingStream () {
      if (!this.submissionId) return
      this.grading = true
      this.phase = 'grading'
      this.streamingText = ''
      const subId = this.submissionId
      try {
        const resp = await fetch(`/api/exercise/boss/submissions/${subId}/grade-stream/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        })
        if (!resp.body) {
          this.finishGrading()
          return
        }
        const reader = resp.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n\n')
          buffer = lines.pop()
          for (const line of lines) {
            this.handleSSEBlock(line)
          }
        }
        if (buffer) this.handleSSEBlock(buffer)
        this.finishGrading()
      } catch (e) {
        this.$message.error('AI 评估连接失败，请稍后查看报告')
        this.finishGrading()
      }
    },
    handleSSEBlock (block) {
      const lines = block.split('\n')
      let dataStr = ''
      for (const ln of lines) {
        if (ln.startsWith('data: ')) {
          dataStr += ln.slice(6)
        } else if (ln.startsWith('data:')) {
          dataStr += ln.slice(5)
        }
      }
      if (!dataStr) return
      let evt
      try {
        evt = JSON.parse(dataStr)
      } catch (e) {
        return
      }
      if (!evt || !evt.event) return
      switch (evt.event) {
        case 'start':
          this.streamingText = 'AI 正在进行综合评估...\n\n'
          break
        case 'chunk':
          if (evt.data) {
            this.streamingText += evt.data
          } else if (typeof evt.text === 'string') {
            this.streamingText += evt.text
          }
          break
        case 'graded':
          break
        case 'score_update':
          if (evt.score != null) this.currentScore = evt.score
          else if (evt.total_score != null) this.currentScore = evt.total_score
          if (evt.passed != null) this.passed = evt.passed
          break
        case 'done':
          if (evt.score != null) this.currentScore = evt.score
          if (evt.passed != null) this.passed = evt.passed
          break
      }
    },
    finishGrading () {
      this.grading = false
      this.pendingAiGrading = false
      this.loadReport()
    },
    loadReport () {
      if (!this.submissionId) return
      api.getBossExamReport(this.submissionId).then(res => {
        const d = res.data.data || res.data
        this.report = d
        if (d.total_score != null) this.currentScore = d.total_score
        if (d.passed != null) this.passed = d.passed
        this.phase = 'done'
        // 提交瞬间的大伤害飘字
        if (this.currentScore > 0) {
          this.spawnFloatDamage(this.currentScore, this.passed)
        }
        // 延迟一点触发胜利/失败动画，让飘字先显示
        setTimeout(() => this.judgeBossResult(), 600)
      }).catch(() => {
        this.$message.error('加载报告失败')
        this.phase = 'done'
      })
    },
    startTimer (seconds) {
      this.remainSeconds = seconds
      this.timerActive = true
      this.clearTimer()
      this._timer = setInterval(() => {
        this.remainSeconds--
        if (this.remainSeconds <= 0) {
          this.clearTimer()
          this.$message.warning('时间到，自动提交')
          this.doSubmit()
        }
      }, 1000)
    },
    clearTimer () {
      if (this._timer) {
        clearInterval(this._timer)
        this._timer = null
      }
      this.timerActive = false
    },
    goProblem (problem) {
      if (problem && problem._id != null) {
        this.$router.push({ name: 'problem-details', params: { problemID: problem._id } })
      }
    },
    backToList () {
      this.$router.push({ name: 'boss-exam-list' })
    },
    isCorrect (q) {
      return q.is_correct === true
    },
    formatAnswer (ans, q) {
      if (ans == null || ans === '') return ''
      if (q && q.question_type === 'choice' && q.choices) {
        const c = q.choices.find(x => x.key === ans)
        if (c) return `${c.key}. ${c.text}`
      }
      return String(ans)
    },
    qTypeText (t) {
      return { choice: '选择题', code: '代码题', short_answer: '简答题' }[t] || t || '题目'
    },
    qTypeTag (t) {
      return { choice: '', code: 'warning', short_answer: 'info' }[t] || 'info'
    },
    diffTag (d) {
      return { Low: 'success', Mid: 'warning', High: 'danger' }[d] || 'info'
    },
    diffText (d) {
      return { Low: '简单', Mid: '中等', High: '困难' }[d] || d || '未知'
    },
    renderMarkdown (text) {
      if (!text) return ''
      let html = String(text)
      const codeBlocks = []
      html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (m, lang, code) => {
        codeBlocks.push('<pre><code>' + code.replace(/</g, '&lt;') + '</code></pre>')
        return '%%CODE' + (codeBlocks.length - 1) + '%%'
      })
      html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>')
      html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
      html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
      html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')
      html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
      html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
      html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      html = html.replace(/\n{2,}/g, '</p><p>')
      html = html.replace(/\n/g, ' ')
      html = '<p>' + html + '</p>'
      html = html.replace(/%%CODE(\d+)%%/g, (m, i) => codeBlocks[parseInt(i)])
      return html
    }
  }
}
</script>

<style scoped>
.boss-detail-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.detail-header {
  background: linear-gradient(135deg, #0d1b2e 0%, #4a1010 100%);
  border-radius: 10px;
  padding: 18px 24px;
  color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  box-shadow: 0 4px 14px rgba(74, 16, 16, 0.3);
}
.header-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 250px; }
.back-btn {
  background: rgba(255, 255, 255, 0.2) !important;
  border: none !important;
  color: #fff !important;
}
.header-title {
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}
.header-title i { color: #f56c6c; }
.boss-tag {
  background: #f56c6c;
  color: #fff;
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 4px;
  font-weight: 700;
  letter-spacing: 1px;
}
.header-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.meta-text { font-size: 13px; opacity: 0.9; display: flex; align-items: center; gap: 4px; }
.timer-warn { color: #ffd966; font-weight: 600; }
.ans-progress { width: 200px; }

.boss-info-box {
  background: #fff;
  border-left: 4px solid #c0392b;
  border-radius: 8px;
  padding: 16px 20px;
  margin: 16px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.boss-topic-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  margin-bottom: 10px;
}
.boss-topic-row i { color: #c0392b; font-size: 18px; }
.bt-label { color: #606266; }
.bt-name { color: #c0392b; font-weight: 700; font-size: 17px; }
.topic-area-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
.boss-desc { color: #606266; font-size: 14px; line-height: 1.7; }

.questions-wrap { display: flex; flex-direction: column; gap: 16px; }

.question-card, .report-q-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #ebeef5;
}
.q-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.q-num { font-size: 15px; font-weight: 600; color: #c0392b; }
.q-score { margin-left: auto; font-size: 13px; color: #909399; }
.q-content { font-size: 16px; line-height: 1.8; color: #303133; margin-bottom: 16px; }
.q-body { margin-top: 4px; }

.q-option {
  display: flex;
  align-items: flex-start;
  padding: 10px 14px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  margin: 0 0 8px 0 !important;
  font-size: 15px;
  width: 100%;
}
.q-option:hover { background: #f5f7fa; }
.q-option /deep/ .el-radio { margin-right: 0; white-space: normal; }
.q-option /deep/ .el-radio__label { white-space: normal; word-break: break-word; }

.problem-link {
  color: #c0392b;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 10px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.problem-link:hover { text-decoration: underline; }

.submit-bar, .result-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 24px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.submit-bar /deep/ .el-button--danger {
  background: #c0392b;
  border-color: #c0392b;
}
.submit-bar /deep/ .el-button--danger:hover {
  background: #d04438;
  border-color: #d04438;
}
.result-bar /deep/ .el-button--warning {
  background: #e6a23c;
  border-color: #e6a23c;
}
.result-bar /deep/ .el-button--warning:hover {
  background: #ebb563;
  border-color: #ebb563;
}
.result-bar /deep/ .el-button--success {
  background: #67c23a;
  border-color: #67c23a;
}
.result-bar /deep/ .el-button--success:hover {
  background: #85ce61;
  border-color: #85ce61;
}
.submit-hint { font-size: 14px; color: #909399; }

.result-score { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.score-label { font-size: 14px; color: #606266; }
.score-num { font-size: 28px; font-weight: 700; color: #c0392b; }
.score-status { font-size: 13px; color: #e6a23c; }
.score-status.grading { color: #c0392b; }
.pass-status { font-size: 14px; font-weight: 600; padding: 2px 10px; border-radius: 4px; }
.pass-status.pass { background: rgba(103, 194, 58, 0.15); color: #67c23a; }
.pass-status.fail { background: rgba(245, 108, 108, 0.15); color: #f56c6c; }

.ai-stream {
  background: #fff;
  border-radius: 10px;
  padding: 18px 24px;
  border-left: 4px solid #c0392b;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.stream-title { font-size: 15px; font-weight: 600; color: #c0392b; margin-bottom: 10px; }
.stream-text { font-size: 14px; line-height: 1.8; color: #303133; white-space: pre-wrap; }
.stream-text /deep/ pre { background: #2d2d2d; color: #f8f8f2; padding: 12px; border-radius: 6px; overflow-x: auto; }
.stream-text /deep/ code { background: #eef1f6; padding: 2px 6px; border-radius: 3px; }

.report-wrap { display: flex; flex-direction: column; gap: 16px; }
.report-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-radius: 10px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-top: 4px solid;
}
.report-summary.pass { border-top-color: #67c23a; }
.report-summary.fail { border-top-color: #f56c6c; }
.summary-score { display: flex; align-items: baseline; gap: 6px; }
.big-score { font-size: 42px; font-weight: 700; color: #c0392b; }
.max-score { font-size: 20px; color: #909399; }
.summary-status { text-align: center; }
.pass-text { font-size: 22px; font-weight: 700; display: flex; align-items: center; gap: 6px; justify-content: center; }
.pass-text.pass { color: #67c23a; }
.pass-text.fail { color: #f56c6c; }
.pass-detail { font-size: 13px; color: #909399; margin-top: 4px; }

.overall-ai {
  background: #fff;
  border-radius: 10px;
  padding: 20px 24px;
  border-left: 4px solid #c0392b;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.overall-title { font-size: 16px; font-weight: 600; color: #c0392b; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
.overall-text { font-size: 15px; line-height: 1.9; color: #303133; }
.overall-text /deep/ pre { background: #2d2d2d; color: #f8f8f2; padding: 12px; border-radius: 6px; overflow-x: auto; }
.overall-text /deep/ code { background: #eef1f6; padding: 2px 6px; border-radius: 3px; }

.report-answers { background: #f5f7fa; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; }
.ra-row { display: flex; gap: 6px; padding: 4px 0; font-size: 14px; }
.ra-label { color: #909399; min-width: 70px; }
.ra-value { color: #303133; word-break: break-word; }
.ra-value.correct { color: #67c23a; }
.ra-value.wrong { color: #f56c6c; }

.report-explain, .report-ai {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 14px 16px;
  margin-top: 10px;
}
.report-ai { border-left: 3px solid #c0392b; }
.exp-label { color: #909399; font-size: 13px; font-weight: 600; }
.exp-label.ai { color: #c0392b; }
.exp-text { font-size: 14px; line-height: 1.8; margin-top: 6px; color: #303133; }
.exp-text /deep/ pre { background: #2d2d2d; color: #f8f8f2; padding: 10px; border-radius: 6px; overflow-x: auto; }
.exp-text /deep/ code { background: #eef1f6; padding: 2px 4px; border-radius: 3px; }

.report-actions { text-align: center; padding: 10px 0; }
.report-actions /deep/ .el-button--danger {
  background: #c0392b;
  border-color: #c0392b;
}
.report-actions /deep/ .el-button--success {
  background: #67c23a;
  border-color: #67c23a;
}

.empty-hint {
  text-align: center;
  padding: 80px 20px;
  color: #c0c4cc;
}
.empty-hint i { font-size: 56px; }
.empty-hint p { font-size: 16px; margin-top: 16px; }

/* ============ Boss 战 gamification ============ */
.boss-hp-section {
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, #2a0a0a 0%, #4a1010 50%, #1a0505 100%);
  border-radius: 12px;
  padding: 18px 24px;
  margin: 16px 0 0;
  box-shadow: 0 4px 18px rgba(74, 16, 16, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(192, 57, 43, 0.4);
  position: relative;
  overflow: hidden;
}
.boss-hp-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 80px 50%, rgba(255, 80, 80, 0.12), transparent 60%);
  pointer-events: none;
}

.boss-avatar {
  position: relative;
  width: 72px;
  height: 72px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: bossBreath 2.4s ease-in-out infinite;
  transition: filter 0.4s;
}
.boss-avatar.defeated {
  filter: grayscale(1) brightness(0.5);
  animation: none;
}
.boss-avatar.hit {
  animation: bossHitShake 0.4s ease;
}
.boss-emoji {
  font-size: 44px;
  line-height: 1;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.5));
  z-index: 2;
}
.boss-aura {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 71, 87, 0.35), transparent 70%);
  animation: auraPulse 2s ease-in-out infinite;
  z-index: 1;
}

.boss-hp-wrap {
  flex: 1;
  min-width: 0;
}
.boss-hp-info {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 6px;
}
.boss-hp-name {
  color: #ffdd59;
  font-size: 17px;
  font-weight: 700;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 60%;
}
.boss-hp-text {
  color: #ff6b81;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.05em;
}

.boss-hp-bar {
  position: relative;
  height: 22px;
  background: linear-gradient(180deg, #1a0303 0%, #2d0808 100%);
  border-radius: 11px;
  border: 1px solid rgba(255, 100, 100, 0.3);
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.6);
  overflow: hidden;
}
.boss-hp-fill {
  height: 100%;
  border-radius: 11px;
  background: linear-gradient(180deg, #ff4757 0%, #c0392b 50%, #8b1a1a 100%);
  box-shadow: 0 0 12px rgba(255, 71, 87, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3);
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}
.boss-hp-fill.low {
  background: linear-gradient(180deg, #ff6348 0%, #e74c3c 50%, #c0392b 100%);
  animation: hpLowPulse 0.8s ease-in-out infinite;
}
.boss-hp-fill.crit {
  background: linear-gradient(180deg, #ffa502 0%, #ff6348 50%, #ff4757 100%);
  animation: hpCritPulse 0.4s ease-in-out infinite;
}
.boss-hp-shine {
  position: absolute;
  top: 0;
  left: -40%;
  width: 40%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: hpShine 2.5s ease-in-out infinite;
}

.float-damage {
  position: absolute;
  top: 50%;
  font-size: 22px;
  font-weight: 800;
  color: #ffdd59;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.8), 0 0 12px rgba(255, 221, 89, 0.6);
  animation: floatUp 1.1s ease-out forwards;
  pointer-events: none;
  font-family: 'Impact', sans-serif;
  letter-spacing: 0.02em;
}
.float-damage.crit {
  font-size: 32px;
  color: #ff4757;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.9), 0 0 16px rgba(255, 71, 87, 0.8);
}

.boss-hp-hint {
  color: rgba(255, 200, 200, 0.5);
  font-size: 12px;
  margin-top: 8px;
  text-align: center;
}

@keyframes bossBreath {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
}
@keyframes bossHitShake {
  0% { transform: translateX(0) scale(1); }
  15% { transform: translateX(-8px) scale(1.05) rotate(-3deg); filter: brightness(1.8); }
  30% { transform: translateX(7px) scale(1.08) rotate(3deg); }
  45% { transform: translateX(-5px) scale(1.04) rotate(-2deg); }
  60% { transform: translateX(4px) scale(1.02); filter: brightness(1.4); }
  100% { transform: translateX(0) scale(1); filter: brightness(1); }
}
@keyframes auraPulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.12); }
}
@keyframes hpLowPulse {
  0%, 100% { box-shadow: 0 0 12px rgba(255, 99, 72, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3); }
  50% { box-shadow: 0 0 24px rgba(255, 99, 72, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.4); }
}
@keyframes hpCritPulse {
  0%, 100% { box-shadow: 0 0 16px rgba(255, 165, 2, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.3); }
  50% { box-shadow: 0 0 32px rgba(255, 71, 87, 1), inset 0 1px 0 rgba(255, 255, 255, 0.5); }
}
@keyframes hpShine {
  0% { left: -40%; }
  60%, 100% { left: 100%; }
}
@keyframes floatUp {
  0% { transform: translateY(0) scale(0.6); opacity: 0; }
  20% { transform: translateY(-10px) scale(1.3); opacity: 1; }
  100% { transform: translateY(-50px) scale(1); opacity: 0; }
}

/* ============ 胜利全屏动画 ============ */
.victory-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: radial-gradient(circle at center, rgba(20, 5, 5, 0.85), rgba(0, 0, 0, 0.95));
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  animation: overlayFade 0.3s ease;
}
.victory-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.victory-flash {
  position: absolute;
  inset: 0;
  background: #fff;
  animation: flashFade 0.6s ease-out forwards;
  pointer-events: none;
}
.victory-text {
  position: relative;
  z-index: 3;
  text-align: center;
  animation: victoryPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
}
.vt-main {
  font-size: 84px;
  font-weight: 900;
  letter-spacing: 0.1em;
  margin-bottom: 16px;
  font-family: 'Impact', 'Arial Black', sans-serif;
}
.vt-main span {
  display: inline-block;
  background: linear-gradient(180deg, #ffdd59 0%, #ffa502 50%, #ff4757 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 40px rgba(255, 165, 2, 0.6);
  animation: letterDrop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.vt-main span:nth-child(1) { animation-delay: 0.3s; }
.vt-main span:nth-child(2) { animation-delay: 0.4s; }
.vt-main span:nth-child(3) { animation-delay: 0.5s; }
.vt-main span:nth-child(4) { animation-delay: 0.6s; }
.vt-main span:nth-child(5) { animation-delay: 0.7s; }
.vt-main span:nth-child(6) { animation-delay: 0.8s; }
.vt-main span:nth-child(7) { animation-delay: 0.9s; }
.vt-sub {
  color: #ffdd59;
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 8px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
}
.vt-score {
  color: #fff;
  font-size: 18px;
  opacity: 0.85;
  margin-bottom: 32px;
}
.vt-hint {
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
  animation: hintBlink 1.5s ease-in-out infinite;
}

@keyframes overlayFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes flashFade { 0% { opacity: 0.9; } 100% { opacity: 0; } }
@keyframes victoryPop {
  from { opacity: 0; transform: scale(0.5); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes letterDrop {
  from { opacity: 0; transform: translateY(-40px) rotate(-15deg); }
  to { opacity: 1; transform: translateY(0) rotate(0); }
}
@keyframes hintBlink {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.7; }
}

/* ============ 失败动画 ============ */
.defeat-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: radial-gradient(circle at center, rgba(20, 5, 5, 0.8), rgba(0, 0, 0, 0.95));
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  animation: overlayFade 0.4s ease;
}
.defeat-text {
  text-align: center;
  animation: victoryPop 0.6s ease 0.2s both;
}
.dt-main {
  font-size: 72px;
  font-weight: 900;
  letter-spacing: 0.1em;
  color: #5a5a5a;
  text-shadow: 0 0 30px rgba(100, 100, 100, 0.4);
  margin-bottom: 16px;
  font-family: 'Impact', 'Arial Black', sans-serif;
}
.dt-sub {
  color: #ff6b81;
  font-size: 20px;
  margin-bottom: 32px;
}
.dt-hint {
  color: rgba(255, 255, 255, 0.35);
  font-size: 14px;
}
</style>
