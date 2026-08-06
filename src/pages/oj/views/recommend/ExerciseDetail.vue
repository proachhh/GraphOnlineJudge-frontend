<template>
  <div class="exercise-detail-page">
    <!-- 顶部信息 -->
    <div class="detail-header" v-loading="loading">
      <div class="header-left">
        <el-button icon="el-icon-arrow-left" size="mini" circle @click="$router.back()" class="back-btn"></el-button>
        <div class="header-info">
          <div class="header-title">
            <i class="el-icon-document"></i>
            <span>{{ set.title || '试题练习' }}</span>
          </div>
          <div class="header-meta">
            <el-tag size="mini" type="info" v-if="set.topic">{{ set.topic }}</el-tag>
            <el-tag size="mini" :type="diffTag(set.difficulty)" v-if="set.difficulty">{{ diffText(set.difficulty) }}</el-tag>
            <span class="meta-text" v-if="set.time_limit"><i class="el-icon-time"></i> {{ set.time_limit }} 分钟</span>
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

    <div v-if="set.description" class="set-desc">{{ set.description }}</div>

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
        <el-button type="primary" size="medium" @click="onSubmit" :loading="submitting" :disabled="!totalCount">
          提交试题
        </el-button>
        <span class="submit-hint">已答 {{ answeredCount }} / {{ totalCount }} 题</span>
      </div>

      <!-- 提交后、AI批改前 -->
      <div class="result-bar" v-if="phase === 'submitted' || phase === 'grading'">
        <div class="result-score" v-if="showScore">
          <span class="score-label">当前得分</span>
          <span class="score-num">{{ currentScore }}</span>
          <span class="score-status" v-if="phase === 'submitted' && pendingAiGrading">部分题目等待 AI 批改</span>
          <span class="score-status grading" v-if="phase === 'grading'">AI 批改中...</span>
        </div>
        <div class="result-score" v-else>
          <span class="score-label">已提交{{ pendingAiGrading ? '，部分题目等待 AI 批改' : '' }}</span>
          <span class="score-status grading" v-if="phase === 'grading'">AI 批改中...</span>
        </div>
        <el-button type="warning" size="medium" v-if="phase === 'submitted' && pendingAiGrading"
                   @click="startGradingStream" :loading="grading">
          <i class="el-icon-magic-stick"></i> 开始 AI 批改
        </el-button>
        <el-button type="success" size="medium" v-if="phase === 'submitted' && !pendingAiGrading"
                   @click="loadReport">查看报告</el-button>
      </div>

      <!-- AI 流式反馈 -->
      <div class="ai-stream" v-if="phase === 'grading' && streamingText">
        <div class="stream-title"><i class="el-icon-loading"></i> AI 反馈</div>
        <div class="stream-text markdown-body" v-html="renderMarkdown(streamingText)"></div>
      </div>
    </div>

    <!-- 报告区 -->
    <div class="report-wrap" v-if="phase === 'done' && report">
      <div class="report-summary">
        <div class="summary-score" v-if="report.show_score !== false">
          <span class="big-score">{{ report.total_score != null ? report.total_score : currentScore }}</span>
          <span class="max-score" v-if="report.max_score != null">/ {{ report.max_score }}</span>
          <span class="score-label">总分</span>
        </div>
        <div class="summary-score" v-else>
          <span class="score-label">已提交，教师未开放得分查看</span>
        </div>
        <div class="summary-actions">
          <el-button type="warning" size="small" plain icon="el-icon-trophy" v-if="showRanking" @click="openRanking">查看排名</el-button>
          <el-button type="primary" size="small" @click="backToList">返回列表</el-button>
        </div>
      </div>

      <div class="report-q-card" v-for="(q, idx) in reportQuestions" :key="q.id || idx">
        <div class="q-header">
          <span class="q-num">第 {{ idx + 1 }} 题</span>
          <el-tag size="mini" :type="qTypeTag(q.question_type)">{{ qTypeText(q.question_type) }}</el-tag>
          <span class="q-score" v-if="report.show_score !== false">{{ q.score != null ? q.score : '-' }} / {{ q.max_score || q.score || '-' }} 分</span>
          <el-tag size="mini" :type="isCorrect(q) ? 'success' : 'danger'" v-if="q.is_correct != null">
            {{ isCorrect(q) ? '正确' : '错误' }}
          </el-tag>
        </div>
        <div class="q-content">{{ q.content }}</div>
        <div class="report-answers">
          <div class="ra-row">
            <span class="ra-label">你的答案：</span>
            <span class="ra-value" :class="{ wrong: !isCorrect(q) }">{{ formatAnswer(q.answer, q) || '未作答' }}</span>
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
        <el-button type="primary" @click="backToList">返回试题列表</el-button>
      </div>
    </div>

    <!-- ============ 排名弹窗 ============ -->
    <el-dialog title="本次题集排名" :visible.sync="rankingDialogVisible" width="640px" custom-class="ranking-dialog">
      <div v-loading="rankingLoading">
        <div v-if="rankingData" class="ranking-summary">
          <div class="rank-item">
            <span class="rank-num">{{ rankingData.my_rank != null ? rankingData.my_rank : '-' }}</span>
            <span class="rank-label">我的名次</span>
          </div>
          <div class="rank-item">
            <span class="rank-num">{{ rankingData.total_participants || 0 }}</span>
            <span class="rank-label">参与人数</span>
          </div>
        </div>
        <el-table :data="rankingData ? rankingData.ranking : []" stripe size="small" max-height="380">
          <el-table-column prop="rank" label="名次" width="70">
            <template slot-scope="{row}">
              <span :class="{'rank-me': row.is_me}">{{ row.rank }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="username" label="用户" min-width="120">
            <template slot-scope="{row}">
              <span :class="{'rank-me': row.is_me}">{{ row.username }}{{ row.is_me ? ' (我)' : '' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="得分" width="90">
            <template slot-scope="{row}">{{ row.score != null ? row.score : '-' }}</template>
          </el-table-column>
          <el-table-column prop="create_time" label="提交时间" min-width="140">
            <template slot-scope="{row}">{{ formatTime(row.create_time) }}</template>
          </el-table-column>
        </el-table>
      </div>
      <div slot="footer"><el-button @click="rankingDialogVisible = false">关闭</el-button></div>
    </el-dialog>

    <div v-if="!loading && !questions.length && phase !== 'done'" class="empty-hint">
      <i class="el-icon-warning-outline"></i>
      <p>未找到试题内容</p>
    </div>
  </div>
</template>

<script>
import api from '@oj/api'

export default {
  name: 'ExerciseDetail',
  data () {
    return {
      loading: false,
      submitting: false,
      grading: false,
      phase: 'loading', // loading | answering | submitted | grading | done
      set: {},
      questions: [],
      answers: {},
      submissionId: null,
      currentScore: 0,
      pendingAiGrading: false,
      streamingText: '',
      report: null,
      // timer
      timerActive: false,
      remainSeconds: 0,
      _timer: null,
      // 排名
      rankingDialogVisible: false,
      rankingLoading: false,
      rankingData: null
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
    showScore () {
      return this.set && this.set.show_score !== false
    },
    showRanking () {
      return !!(this.report && this.report.exercise_set && this.report.exercise_set.show_ranking)
    },
    formattedTime () {
      const m = Math.floor(this.remainSeconds / 60)
      const s = this.remainSeconds % 60
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }
  },
  mounted () {
    this.loadDetail()
  },
  beforeDestroy () {
    this.clearTimer()
  },
  methods: {
    loadDetail () {
      this.loading = true
      const id = this.$route.params.id
      api.getExerciseSetDetail(id).then(res => {
        const d = res.data.data || res.data
        this.set = d
        this.questions = (d.questions || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0))
        this.phase = 'answering'
        // 调用 start 创建/获取作答记录，并校验 max_attempts 和限时
        return api.startExercise(id).then(sr => {
          const sd = sr.data.data || sr.data
          this.submissionId = sd.submission_id
          // 基于服务器开始时间计算剩余时间
          if (sd.time_limit) {
            const startTime = sd.create_time ? new Date(sd.create_time).getTime() : Date.now()
            const elapsed = Math.floor((Date.now() - startTime) / 1000)
            const remain = sd.time_limit * 60 - elapsed
            if (remain <= 0) {
              this.$message.warning('作答时间已到，自动提交')
              this.doSubmit()
            } else {
              this.startTimer(remain)
            }
          }
        }).catch((err) => {
          // 已达最大次数等错误
          const msg = (err && err.response && err.response.data && err.response.data.error) || '开始作答失败'
          this.$message.error(msg)
          this.phase = 'done'
          this.report = null
        })
      }).catch(() => {
        this.$message.error('加载试题失败')
      }).finally(() => { this.loading = false })
    },
    onSubmit () {
      if (this.answeredCount === 0) {
        this.$message.warning('请至少作答一题再提交')
        return
      }
      this.$confirm('确定要提交吗？提交后将无法修改答案。', '提示', {
        confirmButtonText: '确定提交',
        cancelButtonText: '取消',
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
      api.submitExercise(id, { answers }).then(res => {
        const d = res.data.data || res.data
        this.submissionId = d.submission_id
        this.currentScore = d.total_score || 0
        this.pendingAiGrading = !!d.pending_ai_grading
        this.phase = 'submitted'
        this.$message.success('提交成功')
        if (this.pendingAiGrading) {
          // 自动开始 AI 批改
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
        const resp = await fetch(`/api/exercise/submissions/${subId}/grade-stream/`, {
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
        this.$message.error('AI 批改连接失败，请稍后查看报告')
        this.finishGrading()
      }
    },
    handleSSEBlock (block) {
      // 一个 SSE block 可能包含多行，取 data: 行
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
          this.streamingText = 'AI 正在批改...\n\n'
          break
        case 'chunk':
          if (evt.data) {
            this.streamingText += evt.data
          } else if (typeof evt.text === 'string') {
            this.streamingText += evt.text
          }
          break
        case 'graded':
          // 单题批改完成
          break
        case 'score_update':
          if (evt.score != null) this.currentScore = evt.score
          else if (evt.total_score != null) this.currentScore = evt.total_score
          break
        case 'done':
          if (evt.score != null) this.currentScore = evt.score
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
      api.getExerciseReport(this.submissionId).then(res => {
        const d = res.data.data || res.data
        this.report = d
        if (d.total_score != null) this.currentScore = d.total_score
        this.phase = 'done'
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
      this.$router.push({ name: 'exercise-list' })
    },
    openRanking () {
      const id = this.$route.params.id
      this.rankingDialogVisible = true
      this.rankingLoading = true
      this.rankingData = null
      api.getExerciseRanking(id).then(res => {
        this.rankingData = res.data.data || res.data || {}
      }).catch(() => {
        this.$message.error('加载排名失败')
        this.rankingDialogVisible = false
      }).finally(() => { this.rankingLoading = false })
    },
    formatTime (t) {
      if (!t) return '-'
      const d = new Date(t)
      if (isNaN(d.getTime())) return String(t)
      const pad = n => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
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
.exercise-detail-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.detail-header {
  background: #1e3a8a;
  border-radius: 10px;
  padding: 18px 24px;
  color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  box-shadow: 0 4px 14px rgba(30, 58, 138, 0.25);
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

.set-desc {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 14px 18px;
  margin: 16px 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.7;
}

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
.q-num { font-size: 15px; font-weight: 600; color: #1e3a8a; }
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
  color: #1e3a8a;
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
.submit-bar /deep/ .el-button--primary, .result-bar /deep/ .el-button--primary,
.result-bar /deep/ .el-button--warning, .result-bar /deep/ .el-button--success {
  background: #1e3a8a;
  border-color: #1e3a8a;
}
.submit-bar /deep/ .el-button--primary:hover, .result-bar /deep/ .el-button--primary:hover {
  background: #2950b3;
  border-color: #2950b3;
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

.result-score { display: flex; align-items: baseline; gap: 8px; }
.score-label { font-size: 14px; color: #606266; }
.score-num { font-size: 28px; font-weight: 700; color: #1e3a8a; }
.score-status { font-size: 13px; color: #e6a23c; }
.score-status.grading { color: #1e3a8a; }

.ai-stream {
  background: #fff;
  border-radius: 10px;
  padding: 18px 24px;
  border-left: 4px solid #1e3a8a;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.stream-title { font-size: 15px; font-weight: 600; color: #1e3a8a; margin-bottom: 10px; }
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
}
.summary-actions { display: flex; gap: 8px; }
.summary-actions /deep/ .el-button--warning {
  background: rgba(230, 162, 60, 0.1);
  border-color: rgba(230, 162, 60, 0.5);
  color: #e6a23c;
}
.summary-actions /deep/ .el-button--warning:hover {
  background: #e6a23c;
  color: #fff;
}
.summary-score { display: flex; align-items: baseline; gap: 6px; }
.big-score { font-size: 42px; font-weight: 700; color: #1e3a8a; }
.max-score { font-size: 20px; color: #909399; }
.summary-score .score-label { font-size: 16px; color: #606266; margin-left: 6px; }
.report-summary /deep/ .el-button--primary {
  background: #1e3a8a;
  border-color: #1e3a8a;
}

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
.report-ai { border-left: 3px solid #1e3a8a; }
.exp-label { color: #909399; font-size: 13px; font-weight: 600; }
.exp-label.ai { color: #1e3a8a; }
.exp-text { font-size: 14px; line-height: 1.8; margin-top: 6px; color: #303133; }
.exp-text /deep/ pre { background: #2d2d2d; color: #f8f8f2; padding: 10px; border-radius: 6px; overflow-x: auto; }
.exp-text /deep/ code { background: #eef1f6; padding: 2px 4px; border-radius: 3px; }

.report-actions { text-align: center; padding: 10px 0; }
.report-actions /deep/ .el-button--primary {
  background: #1e3a8a;
  border-color: #1e3a8a;
}

.empty-hint {
  text-align: center;
  padding: 80px 20px;
  color: #c0c4cc;
}
.empty-hint i { font-size: 56px; }
.empty-hint p { font-size: 16px; margin-top: 16px; }

/* 排名弹窗 */
.ranking-summary {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}
.rank-item {
  flex: 1;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 14px;
  text-align: center;
}
.rank-num { display: block; font-size: 28px; font-weight: 700; color: #1e3a8a; }
.rank-label { font-size: 13px; color: #909399; margin-top: 4px; display: block; }
.rank-me { color: #1e3a8a; font-weight: 700; }
</style>
