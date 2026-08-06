<template>
  <div class="learning-pod">
    <!-- 顶部知识点信息条 -->
    <div class="pod-header">
      <div class="pod-title">
        <el-button icon="el-icon-arrow-left" size="mini" circle @click="$router.back()"></el-button>
        <i class="el-icon-fa-bookmark"></i>
        <span class="pod-topic">{{ topic }}</span>
        <span class="pod-badge">学习空间</span>
      </div>
      <div class="pod-stats" v-if="neighbors">
        <span class="stat">前置 {{ neighbors.prerequisites.length }}</span>
        <span class="stat">后继 {{ neighbors.successors.length }}</span>
        <span class="stat">题目 {{ problemCount }}</span>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="pod-tabs">
      <!-- 1. 入口诊断（选择题） -->
      <el-tab-pane name="diagnosis">
        <span slot="label"><i class="el-icon-fa-stethoscope"></i> 入口诊断</span>
        <div class="tab-content">
          <div class="diag-intro" v-if="diagStage === 'idle'">
            <h3>入口诊断</h3>
            <p>通过 4 道选择题快速评估你对「{{ topic }}」的掌握情况。</p>
            <el-button type="primary" icon="el-icon-magic-stick" @click="startDiagnosis" :loading="diagLoading">
              开始诊断
            </el-button>
          </div>
          <div class="diag-quiz" v-if="diagStage === 'quiz' && currentQuiz" :key="'quiz-' + diagIndex">
            <div class="quiz-counter">第 {{ diagIndex + 1 }} / {{ diagQuestions.length }} 题</div>
            <div class="quiz-question">{{ currentQuiz.question }}</div>
            <el-radio-group v-model="diagSelection" class="quiz-options" @change="onQuizSelect">
              <el-radio v-for="(opt, i) in currentQuiz.options" :key="i" :label="i" class="quiz-option">
                {{ String.fromCharCode(65 + i) }}. {{ opt }}
              </el-radio>
            </el-radio-group>
          </div>
          <div class="diag-result" v-if="diagStage === 'answered' && currentQuiz" :key="'result-' + diagIndex">
            <div class="quiz-counter">第 {{ diagIndex + 1 }} / {{ diagQuestions.length }} 题</div>
            <div class="quiz-question">{{ currentQuiz.question }}</div>
            <div class="quiz-feedback" :class="quizIsCorrect ? 'correct' : 'wrong'">
              <i :class="quizIsCorrect ? 'el-icon-success' : 'el-icon-error'"></i>
              {{ quizIsCorrect ? '回答正确' : '回答错误' }}
              <span v-if="!quizIsCorrect">正确答案：{{ String.fromCharCode(65 + currentQuiz.answer) }}</span>
            </div>
            <div class="quiz-explanation" v-if="currentQuiz.explanation">
              <span class="exp-label">解析</span>
              <div class="exp-text" v-html="renderMarkdown(currentQuiz.explanation)"></div>
            </div>
            <el-button type="primary" size="small" @click="nextQuiz" style="margin-top:12px"
                       v-if="diagIndex < diagQuestions.length - 1">下一题</el-button>
            <el-button type="success" size="small" @click="finishDiagnosis" style="margin-top:12px"
                       v-else>查看诊断报告</el-button>
          </div>
          <div class="diag-report" v-if="diagStage === 'done'">
            <h3>诊断报告</h3>
            <div class="report-summary">
              <div class="report-score">{{ diagCorrectCount }} / {{ diagQuestions.length }}</div>
              <div class="report-label">{{ diagMasteryLevel }}</div>
            </div>
            <div class="report-questions">
              <div v-for="(q, i) in diagQuestions" :key="i" class="report-q-item">
                <i :class="q.userCorrect ? 'el-icon-success' : 'el-icon-error'" :style="{color: q.userCorrect ? '#67C23A' : '#F56C6C'}"></i>
                <span>第 {{ i + 1 }} 题</span>
                <span class="rq-status" :class="q.userCorrect ? 'ok' : 'fail'">{{ q.userCorrect ? '正确' : '错误' }}</span>
              </div>
            </div>
            <div class="report-advice">{{ diagAdvice }}</div>
            <el-button type="primary" size="small" @click="restartDiagnosis" style="margin-top:16px">重新诊断</el-button>
          </div>
        </div>
      </el-tab-pane>

      <!-- 2. 讲义（系统自带） -->
      <el-tab-pane name="lecture">
        <span slot="label"><i class="el-icon-document"></i> 讲义</span>
        <div class="tab-content">
          <div v-loading="lectureLoading">
            <div class="lecture-content" v-if="lectureHtml" v-html="lectureHtml"></div>
            <div v-else-if="!lectureLoading && lectureNotFound">
              <el-alert type="info" :closable="false" title="未找到该知识点的系统讲义" description="可尝试 AI 生成" show-icon />
              <el-button type="primary" size="small" icon="el-icon-magic-stick" @click="genLecture" :loading="aiLectureLoading"
                         style="margin-top:12px">AI 生成讲义</el-button>
              <div class="ai-content markdown-body" v-if="aiLecture" style="margin-top:12px" v-html="renderMarkdown(aiLecture)"></div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 3. 代码练习 -->
      <el-tab-pane name="practice">
        <span slot="label"><i class="el-icon-fa-code"></i> 代码练习</span>
        <div class="tab-content" v-loading="problemsLoading">
          <div v-if="problems && problems.length" class="problem-list">
            <div class="problem-item" v-for="p in problems" :key="p.id" @click="goProblem(p)">
              <span class="p-id">#{{ p._id }}</span>
              <span class="p-title">{{ p.title }}</span>
              <el-tag size="small" :type="diffTag(p.difficulty)">{{ p.difficulty }}</el-tag>
            </div>
          </div>
          <div class="empty-hint" v-else-if="!problemsLoading">本知识点暂无关联题目</div>
        </div>
      </el-tab-pane>

      <!-- 4. 思维导图 -->
      <el-tab-pane name="mindmap">
        <span slot="label"><i class="el-icon-fa-sitemap"></i> 思维导图</span>
        <div class="tab-content">
          <el-button type="primary" size="small" icon="el-icon-magic-stick" @click="genMindmap"
                     :loading="mindmapLoading" :disabled="mindmapLoaded">
            {{ mindmapLoaded ? '已生成' : 'AI 生成思维导图' }}
          </el-button>
          <div class="mindmap-tree" v-if="mindmapTree">
            <div v-for="(node, i) in flattenTree(mindmapTree)" :key="i"
                 class="tree-node" :class="{ 'is-root': node.depth === 0 }"
                 :style="{ marginLeft: node.depth * 24 + 'px' }">
              <span class="node-bullet" :class="'depth-' + (node.depth % 3)"></span>
              <span class="node-label">{{ node.name }}</span>
            </div>
          </div>
          <div class="empty-hint" v-else-if="!mindmapLoading">点击上方按钮生成本知识点的思维导图</div>
        </div>
      </el-tab-pane>

      <!-- 5. 协作讨论（费曼学习法） -->
      <el-tab-pane name="discuss">
        <span slot="label"><i class="el-icon-chat-dot-round"></i> 协作讨论</span>
        <div class="tab-content discuss-tab">
          <div class="discuss-msgs" ref="discussMsgs">
            <div class="msg ai markdown-body" v-html="renderMarkdown('你好！我是你的学习考官。请尝试用你自己的话解释「' + topic + '」这个知识点，我会追问以检验你的理解深度。')"></div>
            <div v-for="(m, i) in discussMsgs" :key="i" :class="['msg', m.role]">
              <span v-if="m.role==='user'">{{ m.text }}</span>
              <span v-else class="markdown-body" v-html="renderMarkdown(m.text)"></span>
            </div>
          </div>
          <div class="discuss-input">
            <el-input v-model="discussInput" type="textarea" :rows="2" placeholder="输入你的解释... (Ctrl+Enter 发送)"
                      @keydown.enter.ctrl.native="sendDiscuss"></el-input>
            <el-button type="primary" @click="sendDiscuss" :loading="discussLoading">发送</el-button>
          </div>
        </div>
      </el-tab-pane>

      <!-- 6. 学习报告 -->
      <el-tab-pane name="report">
        <span slot="label"><i class="el-icon-fa-bar-chart"></i> 学习报告</span>
        <div class="tab-content report-tab">
          <div class="report-card">
            <h3>本次学习概览</h3>
            <div class="report-grid">
              <div class="report-item"><span class="r-num">{{ problemCount }}</span><span class="r-label">关联题目</span></div>
              <div class="report-item"><span class="r-num">{{ diagCorrectCount }}</span><span class="r-label">诊断正确</span></div>
              <div class="report-item"><span class="r-num">{{ neighbors ? neighbors.successors.length : 0 }}</span><span class="r-label">后继知识</span></div>
              <div class="report-item"><span class="r-num">{{ discussMsgs.length }}</span><span class="r-label">讨论轮数</span></div>
            </div>
          </div>
          <div class="report-card">
            <h3>学习建议</h3>
            <ul class="advice-list">
              <li v-if="problemCount > 0">完成 {{ problemCount }} 道关联题目中至少 3 道，巩固本知识点</li>
              <li>尝试在「协作讨论」中用自己的话解释本知识点，检验理解深度</li>
              <li v-if="neighbors && neighbors.successors.length">掌握后，可继续学习：{{ neighbors.successors.join('、') }}</li>
            </ul>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import api from '@oj/api'
import * as echarts from 'echarts'

export default {
  name: 'LearningPod',
  data () {
    return {
      topic: '',
      activeTab: 'diagnosis',
      neighbors: null,
      problems: [],
      problemsLoading: false,
      // 诊断
      diagStage: 'idle',
      diagQuestions: [],
      diagIndex: 0,
      diagSelection: null,
      diagCorrectCount: 0,
      diagLoading: false,
      // 讲义
      lectureHtml: '',
      lectureLoading: false,
      lectureNotFound: false,
      aiLecture: '',
      aiLectureLoading: false,
      // 思维导图
      mindmapTree: null,
      mindmapLoading: false,
      mindmapLoaded: false,
      // 讨论
      discussMsgs: [],
      discussInput: '',
      discussLoading: false,
    }
  },
  computed: {
    problemCount () { return this.problems.length },
    currentQuiz () { return this.diagQuestions[this.diagIndex] },
    quizIsCorrect () { return this.diagSelection === this.currentQuiz.answer },
    diagMasteryLevel () {
      const r = this.diagCorrectCount / this.diagQuestions.length
      if (r >= 0.75) return '掌握良好'
      if (r >= 0.5) return '基础尚可'
      return '需要加强'
    },
    diagAdvice () {
      const total = this.diagQuestions.length
      const wrong = this.diagQuestions.map((q, i) => ({ idx: i + 1, q })).filter(x => !x.q.userCorrect)
      const wrongNums = wrong.map(x => x.idx).join('、')
      if (wrong.length === 0) {
        return `全部 ${total} 道题回答正确！你对本知识点掌握非常扎实，建议直接挑战进阶题目和后续知识点。`
      }
      const r = this.diagCorrectCount / total
      if (r >= 0.75) {
        return `你对本知识点掌握良好（${this.diagCorrectCount}/${total}），仅第 ${wrongNums} 题需要巩固。建议针对性复习相关讲义内容后再次挑战。`
      }
      if (r >= 0.5) {
        return `基础已建立（${this.diagCorrectCount}/${total}），但第 ${wrongNums} 题答错，建议仔细阅读讲义中对应部分并练习关联题目后再来诊断。`
      }
      return `掌握度较低（${this.diagCorrectCount}/${total}），第 ${wrongNums} 题答错。建议先巩固前置知识，认真阅读讲义并完成基础题目后再来诊断。`
    },
  },
  mounted () {
    this.topic = decodeURIComponent(this.$route.params.topic || '')
    if (!this.topic) { this.$message.error('未指定知识点'); return }
    this.loadNeighbors()
    this.loadProblems()
    this.loadLecture()
  },
  methods: {
    loadNeighbors () {
      api.getTopicNeighbors({ topic: this.topic }).then(res => { this.neighbors = res.data })
    },
    loadProblems () {
      this.problemsLoading = true
      api.getTopicProblems({ topic: this.topic }).then(res => {
        this.problems = res.data.problems
      }).finally(() => { this.problemsLoading = false })
    },
    loadLecture () {
      this.lectureLoading = true
      api.getLessonPlanList({ keyword: this.topic }).then(res => {
        const d = res.data.data
        const results = d.results || d || []
        const match = results.find(r => r.title === this.topic) || results[0]
        if (match) {
          return api.getLessonPlanDetail(match.id).then(res2 => {
            let content = res2.data.data.content
            if (content && content.startsWith('[MD]')) {
              content = content.substring(4).trim()
              content = this.renderMarkdown(content)
            } else if (content && !/<(?:[a-zA-Z!][^>]*)>/.test(content.substring(0, 500))) {
              content = this.renderMarkdown(content)
            }
            this.lectureHtml = content
          })
        } else {
          this.lectureNotFound = true
        }
      }).catch(() => {
        this.lectureNotFound = true
      }).finally(() => { this.lectureLoading = false })
    },
    genLecture () {
      this.aiLectureLoading = true
      const msg = `请为知识点「${this.topic}」生成一份结构化讲义，包含：定义、核心概念、典型例题分析、常见误区。用 Markdown 格式。`
      api.askAI({ message: msg }).then(res => {
        this.aiLecture = res.data.answer || '生成失败'
      }).catch(() => { this.$message.error('生成失败') }).finally(() => { this.aiLectureLoading = false })
    },
    // 诊断选择题
    startDiagnosis () {
      this.diagLoading = true
      this.diagQuestions = []
      this.diagIndex = 0
      this.diagCorrectCount = 0
      const msg = `请为知识点「${this.topic}」生成4道选择题，用于入门诊断。每题4个选项。严格用以下JSON格式返回（不要任何其他文字）：
[{"question":"题干","options":["选项A","选项B","选项C","选项D"],"answer":0,"explanation":"解析"}]
answer是正确选项的索引(0-3)。`
      api.askAI({ message: msg }).then(res => {
        const text = res.data.answer || ''
        try {
          const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
          const match = jsonStr.match(/\[[\s\S]*\]/)
          this.diagQuestions = JSON.parse(match ? match[0] : jsonStr)
          this.diagStage = 'quiz'
        } catch (e) {
          this.$message.error('AI 返回格式异常，请重试')
        }
      }).catch(() => { this.$message.error('生成诊断题失败') }).finally(() => { this.diagLoading = false })
    },
    onQuizSelect () {
      const correct = this.quizIsCorrect
      if (correct) this.diagCorrectCount++
      this.currentQuiz.userCorrect = correct
      this.diagStage = 'answered'
    },
    nextQuiz () {
      this.diagIndex++
      this.diagSelection = null
      this.diagStage = 'quiz'
    },
    finishDiagnosis () {
      this.diagStage = 'done'
    },
    restartDiagnosis () {
      this.diagStage = 'idle'
      this.diagQuestions = []
      this.diagIndex = 0
      this.diagCorrectCount = 0
    },
    // 思维导图（echarts tree）
    genMindmap () {
      this.mindmapLoading = true
      this.mindmapTree = null
      const msg = `请为知识点「${this.topic}」生成思维导图，用以下JSON树格式返回（不要任何其他文字）：
{"name":"知识点名称","children":[{"name":"核心概念1","children":[{"name":"细节1"},{"name":"细节2"}]},{"name":"核心概念2","children":[{"name":"子概念"}]}]}`
      api.askAI({ message: msg }).then(res => {
        const text = res.data.answer || ''
        try {
          const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
          const match = jsonStr.match(/\{[\s\S]*\}/)
          this.mindmapTree = JSON.parse(match ? match[0] : jsonStr)
          this.mindmapLoaded = true
        } catch (e) {
          this.$message.error('AI 返回格式异常，请重试')
        }
      }).catch(() => { this.$message.error('生成失败') }).finally(() => { this.mindmapLoading = false })
    },
    flattenTree (node, depth = 0, result = []) {
      if (!node) return result
      result.push({ name: String(node.name || node.title || '未知'), depth })
      if (Array.isArray(node.children)) {
        node.children.forEach(child => this.flattenTree(child, depth + 1, result))
      }
      return result
    },
    // 讨论
    sendDiscuss () {
      const text = this.discussInput.trim()
      if (!text) return
      this.discussMsgs.push({ role: 'user', text })
      this.discussInput = ''
      this.discussLoading = true
      const msg = `我们在进行费曼学习法练习。知识点是「${this.topic}」。我的解释是：${text}。请你作为考官，追问或纠正我的理解（控制在150字内）。`
      api.askAI({ message: msg }).then(res => {
        this.discussMsgs.push({ role: 'ai', text: res.data.answer || '...' })
        this.$nextTick(() => {
          if (this.$refs.discussMsgs) this.$refs.discussMsgs.scrollTop = this.$refs.discussMsgs.scrollHeight
        })
      }).catch(() => {
        this.discussMsgs.push({ role: 'ai', text: '回复失败，请重试' })
      }).finally(() => { this.discussLoading = false })
    },
    // Markdown 渲染
    renderMarkdown (text) {
      if (!text) return ''
      let html = text
      // 提取代码块到占位符（避免内部换行被处理）
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
      html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
      html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
      html = html.replace(/^\- (.+)$/gm, '<li>$1</li>')
      html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      // 段落分隔：连续2+换行 → </p><p>（不产生额外 <br> 空行）
      html = html.replace(/\n{2,}/g, '</p><p>')
      // 行内换行 → 空格（不产生 <br>，大幅减少空行）
      html = html.replace(/\n/g, ' ')
      html = '<p>' + html + '</p>'
      // 放回代码块
      html = html.replace(/%%CODE(\d+)%%/g, (m, i) => codeBlocks[parseInt(i)])
      return html
    },
    goProblem (p) {
      this.$router.push({ name: 'problem-details', params: { problemID: p._id } })
    },
    jumpTopic (t) {
      this.$router.push({ name: 'learning-pod', params: { topic: encodeURIComponent(t) } })
      this.$nextTick(() => window.location.reload())
    },
    diffTag (d) {
      return { Low: 'success', Mid: 'warning', High: 'danger' }[d] || 'info'
    },
  },
}
</script>

<style scoped>
.learning-pod {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.pod-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  background: #1e3a8a;
  border-radius: 8px;
  color: #fff;
  margin-bottom: 16px;
}

.pod-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 22px;
  font-weight: 600;
}

.pod-title .el-button {
  background: rgba(255,255,255,0.2);
  border: none;
  color: #fff;
}

.pod-badge {
  background: rgba(255,255,255,0.2);
  color: #fff;
  padding: 2px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 400;
}

.pod-stats {
  display: flex;
  gap: 20px;
  font-size: 15px;
  opacity: 0.95;
}

.pod-tabs {
  background: #fff;
  border-radius: 8px;
  padding: 0 24px 24px;
  min-height: 500px;
}

.pod-tabs /deep/ .el-tabs__item {
  font-size: 16px;
  height: 48px;
  line-height: 48px;
}

/* 深蓝按钮覆盖 Element 默认浅蓝 */
.pod-tabs /deep/ .el-button--primary {
  background: #1e3a8a;
  border-color: #1e3a8a;
  border-radius: 4px;
}
.pod-tabs /deep/ .el-button--primary:hover {
  background: #5cadff;
  border-color: #5cadff;
}
/* tab 切换深蓝色 */
.pod-tabs /deep/ .el-tabs__active-bar {
  background-color: #1e3a8a;
}
.pod-tabs /deep/ .el-tabs__item.is-active {
  color: #1e3a8a;
}
.pod-tabs /deep/ .el-tabs__item:hover {
  color: #1e3a8a;
}

.tab-content {
  padding: 24px 0;
  min-height: 400px;
  font-size: 15px;
}

/* 诊断 */
.diag-intro h3 { font-size: 20px; margin-bottom: 12px; }
.diag-intro p { color: #606266; line-height: 1.8; margin-bottom: 16px; }
.quiz-counter { color: #2d8cf0; font-weight: 600; font-size: 16px; margin-bottom: 16px; }
.quiz-question { font-size: 17px; line-height: 1.8; color: #303133; margin-bottom: 16px; }
.quiz-options { display: flex; flex-direction: column; gap: 10px; }
.quiz-option { display: flex; align-items: flex-start; padding: 10px 14px; border: 1px solid #ebeef5; border-radius: 6px; font-size: 15px; margin: 0 !important; }
.quiz-option:hover { background: #f5f7fa; }
.quiz-option /deep/ .el-radio { margin-right: 0; white-space: normal; }
.quiz-option /deep/ .el-radio__label { white-space: normal; word-break: break-word; }
.quiz-feedback { padding: 12px 16px; border-radius: 6px; font-size: 16px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
.quiz-feedback.correct { background: #f0f9eb; color: #67C23A; }
.quiz-feedback.wrong { background: #fef0f0; color: #F56C6C; }
.quiz-explanation { background: #f5f7fa; border-radius: 8px; padding: 16px; }
.exp-label { color: #909399; font-size: 14px; }
.exp-text { font-size: 15px; line-height: 1.8; margin-top: 6px; }
.diag-report { text-align: center; padding: 40px 0; }
.report-summary { margin: 20px 0; }
.report-score { font-size: 48px; font-weight: 700; color: #2d8cf0; }
.report-label { font-size: 18px; color: #606266; margin-top: 8px; }
.report-advice { color: #606266; font-size: 16px; line-height: 1.8; max-width: 500px; margin: 0 auto; }
.report-questions { margin: 16px 0; max-width: 400px; margin-left: auto; margin-right: auto; }
.report-q-item { display: flex; align-items: center; gap: 8px; padding: 6px 0; font-size: 15px; justify-content: center; }
.rq-status.ok { color: #67C23A; font-weight: 600; margin-left: auto; }
.rq-status.fail { color: #F56C6C; font-weight: 600; margin-left: auto; }

/* 思维导图 */
.mindmap-tree { margin-top: 16px; padding: 8px 0; }
.tree-node { display: flex; align-items: center; padding: 6px 0; border-bottom: 1px solid #f5f5f5; }
.tree-node.is-root .node-label { font-size: 16px; font-weight: bold; color: #2d8cf0; }
.node-bullet { width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; flex-shrink: 0; }
.node-bullet.depth-0 { background: #2d8cf0; }
.node-bullet.depth-1 { background: #5cadff; }
.node-bullet.depth-2 { background: #a3d3ff; }
.node-label { font-size: 14px; color: #303133; }

/* 讲义 */
.lecture-content { line-height: 1.9; font-size: 15px; }
.lecture-content /deep/ h1, .lecture-content /deep/ h2, .lecture-content /deep/ h3 { margin-top: 20px; border-bottom: 1px solid #ebeef5; padding-bottom: 8px; }
.lecture-content /deep/ pre { background: #2d2d2d; color: #f8f8f2; padding: 14px; border-radius: 6px; overflow-x: auto; }
.lecture-content /deep/ img { max-width: 100%; border-radius: 6px; }

/* markdown 通用 */
.ai-content { margin-top: 16px; padding: 20px; background: #f5f7fa; border-radius: 8px; line-height: 1.9; font-size: 15px; }
.ai-content /deep/ h1, .ai-content /deep/ h2, .ai-content /deep/ h3 { margin-top: 16px; border-bottom: 1px solid #ebeef5; padding-bottom: 8px; }
.ai-content /deep/ pre { background: #2d2d2d; color: #f8f8f2; padding: 14px; border-radius: 6px; overflow-x: auto; }
.ai-content /deep/ code { background: #eef1f6; padding: 2px 6px; border-radius: 3px; font-family: Consolas, monospace; }
.ai-content /deep/ pre code { background: none; padding: 0; }
.ai-content /deep/ li { margin-left: 20px; }
.ai-content /deep/ blockquote { border-left: 4px solid #2d8cf0; padding-left: 12px; color: #606266; margin: 8px 0; }

.discuss-msgs /deep/ h1, .discuss-msgs /deep/ h2, .discuss-msgs /deep/ h3 { font-size: 16px; margin: 8px 0 4px; }
.discuss-msgs /deep/ pre { background: #2d2d2d; color: #f8f8f2; padding: 10px; border-radius: 6px; overflow-x: auto; font-size: 14px; }
.discuss-msgs /deep/ code { background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 3px; }
.discuss-msgs /deep/ pre code { background: none; padding: 0; }

.empty-hint { padding: 40px; text-align: center; color: #c0c4cc; font-size: 15px; }

/* 题目列表 */
.problem-item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-bottom: 1px solid #ebeef5; cursor: pointer; transition: background 0.2s; font-size: 15px; }
.problem-item:hover { background: #f5f7fa; }
.p-id { color: #909399; font-size: 14px; min-width: 60px; }
.p-title { flex: 1; color: #303133; }

/* 讨论 */
.discuss-tab { display: flex; flex-direction: column; height: 500px; }
.discuss-hint { background: #ecf5ff; padding: 10px 14px; border-radius: 6px; font-size: 14px; color: #2d8cf0; margin-bottom: 12px; }
.discuss-msgs { flex: 1; overflow-y: auto; border: 1px solid #ebeef5; border-radius: 6px; padding: 14px; margin-bottom: 12px; }
.msg { margin-bottom: 12px; padding: 10px 14px; border-radius: 8px; max-width: 70%; line-height: 1.7; font-size: 15px; }
.msg.ai { background: #f4f4f5; margin-right: auto; max-width: 85%; }
.msg.user { background: #2d8cf0; color: #fff; margin-left: auto; max-width: 50%; }
.discuss-input { display: flex; gap: 8px; align-items: flex-end; }

/* 报告 */
.report-card { background: #f5f7fa; border-radius: 8px; padding: 24px; margin-bottom: 16px; }
.report-card h3 { font-size: 18px; margin: 0 0 16px; }
.report-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; text-align: center; }
.report-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.r-num { font-size: 32px; font-weight: 700; color: #2d8cf0; }
.r-label { font-size: 14px; color: #909399; }
.advice-list { margin: 0; padding-left: 20px; line-height: 2; color: #606266; font-size: 15px; }
</style>
