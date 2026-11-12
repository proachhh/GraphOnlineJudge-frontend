<template>
  <div class="exam-page-root">
    <!-- 左侧：考试题目列表侧栏 -->
    <div class="exam-sidebar">
      <div class="exam-title">{{ exam.title }}</div>
      <div class="exam-timer" :class="{ danger: remainSeconds !== null && remainSeconds < 300 }">
        <template v-if="exam.status === '0'">
          <Icon type="ios-timer-outline" />
          <span v-if="remainSeconds !== null">{{ fmtRemain(remainSeconds) }}</span>
          <span v-else>不限时</span>
        </template>
        <span v-else-if="exam.status === '1'">未开始</span>
        <span v-else>已结束</span>
      </div>
      <ul class="exam-problem-list">
        <li v-for="p in exam.problems" :key="p.problem_id"
            :class="{ active: currentProblem && p.problem_id === currentProblem.id, ac: p.ac }"
            @click="switchProblem(p)">
          <span class="badge">{{ p.order }}</span>
          <span class="p-title">{{ p.title }}</span>
          <span class="p-score">{{ p.score }}分</span>
        </li>
      </ul>
      <div class="exam-info">
        <p v-if="exam.max_submissions">已提交 {{ exam.my_submissions_used || 0 }} / {{ exam.max_submissions }} 次</p>
        <p v-else>已提交 {{ exam.my_submissions_used || 0 }} 次</p>
        <p v-if="exam.anti_switch_screen" class="anti-cheat"><Icon type="ios-eye" /> 切屏检测已开启（{{ switchCount }} 次切换）</p>
      </div>
    </div>

    <!-- 右侧：2×2 卡片布局 -->
    <div class="exam-main">
      <div class="exam-top-bar">
        <Button size="small" type="primary" :disabled="!currentProblem" :loading="submitting" @click="submitCode">
          <Icon type="ios-paper-plane" /> 提交
        </Button>
        <Button size="small" @click="refreshSubmissions" style="margin-left: 8px">
          <Icon type="ios-refresh" /> 刷新状态
        </Button>
        <Button size="small" ghost type="error" style="margin-left: 8px" @click="exitExam">退出考试</Button>
      </div>
      <div class="quad-grid">
        <!-- 左列 -->
        <div class="exam-col">
          <div class="exam-card exam-card-top-row">
            <div class="exam-card-head">题目描述</div>
            <div class="exam-card-body">
              <div v-if="problemLoading" class="loading-tip"><Spin size="large"></Spin></div>
              <div v-else-if="problem">
                <h2 class="p-title-lg">{{ problem._id }}. {{ problem.title }}</h2>
                <p class="p-meta">
                  <Tag color="green">时间限制 {{ problem.time_limit }}ms</Tag>
                  <Tag color="cyan">内存限制 {{ problem.memory_limit }}MB</Tag>
                  <Tag color="orange">本题 {{ problem.exam_score }} 分</Tag>
                </p>
                <Card dis-hover class="sec-card">
                  <b>题目描述</b>
                  <div class="md-content" v-html="problem.description"></div>
                </Card>
                <Card dis-hover class="sec-card">
                  <b>输入描述</b>
                  <div class="md-content" v-html="problem.input_description"></div>
                </Card>
                <Card dis-hover class="sec-card">
                  <b>输出描述</b>
                  <div class="md-content" v-html="problem.output_description"></div>
                </Card>
                <Card dis-hover class="sec-card" v-for="(sample, idx) in problem.samples" :key="idx">
                  <b>样例 {{ idx + 1 }}</b>
                  <div class="sample-block">
                    <div>
                      <p class="sample-label">输入</p>
                      <pre>{{ sample.input }}</pre>
                    </div>
                    <div>
                      <p class="sample-label">输出</p>
                      <pre>{{ sample.output }}</pre>
                    </div>
                  </div>
                </Card>
                <Card dis-hover class="sec-card" v-if="problem.hint">
                  <b>提示</b>
                  <div class="md-content" v-html="problem.hint"></div>
                </Card>
              </div>
              <div v-else class="loading-tip">点击左侧题目开始作答</div>
            </div>
          </div>
          <div class="exam-row-splitter"></div>
          <div class="exam-card exam-card-bottom">
            <div class="exam-card-head">我的提交记录</div>
            <div class="exam-card-body">
              <Table :columns="subCols" :data="mySubmissions" size="small" :loading="subLoading"
                     no-data-text="暂无提交"></Table>
            </div>
          </div>
        </div>
        <!-- 右列 -->
        <div class="exam-col-splitter"></div>
        <div class="exam-col">
          <div class="exam-card editor-card">
            <div class="exam-card-head editor-head">
              <span>代码编辑器</span>
              <span class="lang-select">
                语言
                <el-select v-model="language" size="small" style="width: 110px" @change="onLangChange">
                  <el-option v-for="l in problemLanguages" :key="l.name" :label="l.name" :value="l.name" />
                </el-select>
              </span>
            </div>
            <div class="exam-card-body editor-body">
              <CodeMirror ref="cm" :value.sync="code" :languages="problemLanguages"
                          :language="language" theme="idea" font-size="14"
                          @change="onCodeChange" @save="submitCode"></CodeMirror>
            </div>
          </div>
          <div class="exam-row-splitter"></div>
          <div class="exam-card exam-card-bottom">
            <div class="exam-card-head">考试说明</div>
            <div class="exam-card-body">
              <ul class="exam-notes">
                <li><Icon type="ios-information-circle" /> 计分规则：{{ exam.rule_type === 'ACM' ? 'AC 满分 + 每次错误提交罚时 20 分钟' : 'OI 制，按测试点得分折算' }}</li>
                <li v-if="exam.exam_type === 'homework'"><Icon type="ios-clock" /> 作业模式：截止后{{ exam.late_deadline ? '在迟交期限内仍可提交（标记迟交）' : '不可提交' }}</li>
                <li v-if="exam.anti_switch_screen"><Icon type="ios-eye" /> 切屏检测已开启，请勿切换页面，切屏行为将上报监考端</li>
                <li><Icon type="ios-checkmark-circle" /> 提交后可点击"刷新状态"查看判题结果，AC 后该题得满分{{ exam.rule_type === 'ACM' ? '（ACM）' : '（按得分比例）' }}</li>
                <li><Icon type="ios-ribbon" /> 考试结束后成绩将自动汇总至班级，可在考试列表查看成绩单</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@oj/api'
import { Tag } from 'view-ui-plus'

export default {
  name: 'ExamPage',
  components: {
    CodeMirror: () => import('@oj/components/CodeMirror.vue')
  },
  data () {
    return {
      exam: { problems: [] },
      problem: null,
      problemLoading: false,
      language: '',
      problemLanguages: [],
      code: '',
      submitting: false,
      mySubmissions: [],
      subLoading: false,
      remainSeconds: null,
      remainTimer: null,
      switchCount: 0,
      currentProblem: null,
      subCols: [
        { title: '#', key: 'idx', width: 50, render: (h, p) => h('span', this.mySubmissions.length - p.index) },
        { title: '题目', key: 'problem__id', width: 90 },
        { title: '结果', key: 'result', width: 150,
          render: (h, p) => this.renderResult(h, p.row.result) },
        { title: '语言', key: 'language', width: 80 },
        { title: '时间', key: 'create_time', width: 160,
          render: (h, p) => h('span', this.fmt(p.row.create_time)) }
      ]
    }
  },
  computed: {
    examId () { return this.$route.params.examId }
  },
  mounted () {
    this.loadExam()
    document.addEventListener('visibilitychange', this.onVisibilityChange)
  },
  beforeDestroy () {
    clearInterval(this.remainTimer)
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
  },
  methods: {
    fmt (t) { return t ? String(t).replace('T', ' ').slice(0, 19) : '' },
    fmtRemain (s) {
      const h = Math.floor(s / 3600)
      const m = Math.floor((s % 3600) / 60)
      const sec = s % 60
      const pad = n => String(n).padStart(2, '0')
      return `${pad(h)}:${pad(m)}:${pad(sec)}`
    },
    renderResult (h, result) {
      if (result === 0) {
        return h(Tag, { color: 'green' }, { default: () => 'Accepted' })
      } else if (result === -1) {
        return h(Tag, { color: 'blue' }, { default: () => '判题中' })
      } else {
        const map = { 1: '编译错误', 2: '运行超时', 3: '超内存', 4: '运行时错误', 5: '系统错误', 6: '答案错误' }
        return h(Tag, { color: 'red' }, { default: () => (map[result] || `状态 ${result}`) })
      }
    },
    loadExam () {
      api.enterExam(this.examId).then(res => {
        this.exam = res.data.data
        this.remainSeconds = this.exam.remain_seconds
        if (this.remainSeconds !== null && !this.remainTimer) {
          this.remainTimer = setInterval(() => {
            if (this.remainSeconds > 0) this.remainSeconds -= 1
            if (this.remainSeconds === 0) {
              this.$Message.error('考试时间已到，无法继续提交')
              this.exam.status = '-1'
            }
          }, 1000)
        }
        // 恢复代码草稿
        const draftKey = `exam_${this.examId}_draft`
        const savedLang = localStorage.getItem(draftKey + '_lang')
        if (this.exam.problems.length) {
          const first = savedLang
            ? this.exam.problems.find(p => p.problem_id === Number(savedLang)) || this.exam.problems[0]
            : this.exam.problems[0]
          this.switchProblem(first)
        }
      }).catch(() => {
        this.$Message.error('无法进入考试，可能不在考试时间内或你不属于该考试的班级')
        setTimeout(() => this.$router.back(), 1500)
      })
    },
    switchProblem (p) {
      this.currentProblem = p
      this.problemLoading = true
      const draftKey = `exam_${this.examId}_draft`
      this.code = localStorage.getItem(`${draftKey}_${p.problem_id}`) || ''
      localStorage.setItem(draftKey + '_lang', p.problem_id)
      api.getExamProblem(this.examId, p.problem_id).then(res => {
        this.problem = res.data.data
        const langs = this.$store.state.languages.filter(l => this.problem.languages.includes(l.name))
        this.problemLanguages = langs
        const saved = localStorage.getItem(`${draftKey}_${p.problem_id}_lang`)
        this.language = saved && this.problemLanguages.find(l => l.name === saved)
          ? saved : (this.problemLanguages[0] && this.problemLanguages[0].name) || ''
        this.loadSubmissions()
      }).catch(err => {
        this.problem = null
        this.$Message.error(err.response.data.error || '加载题目失败')
      }).finally(() => { this.problemLoading = false })
    },
    onLangChange (lang) {
      if (this.currentProblem) {
        localStorage.setItem(`exam_${this.examId}_draft_${this.currentProblem.problem_id}_lang`, lang)
      }
    },
    onCodeChange (value) {
      this.code = value
      if (this.currentProblem) {
        localStorage.setItem(`exam_${this.examId}_draft_${this.currentProblem.problem_id}`, value)
      }
    },
    loadSubmissions () {
      this.subLoading = true
      api.getExamMySubmissions(this.examId, this.currentProblem ? this.currentProblem.problem_id : undefined)
        .then(res => { this.mySubmissions = res.data.data })
        .finally(() => { this.subLoading = false })
    },
    refreshSubmissions () {
      this.loadSubmissions()
      // 轮询未完成的提交
      const pending = this.mySubmissions.filter(s => s.result === -1)
      if (pending.length) {
        setTimeout(() => this.loadSubmissions(), 2500)
      }
    },
    submitCode () {
      if (!this.problem || !this.language) {
        this.$Message.warning('请选择题目与语言')
        return
      }
      if (this.exam.status !== '0') {
        this.$Message.error('考试不在进行中，无法提交')
        return
      }
      if (this.remainSeconds !== null && this.remainSeconds <= 0) {
        this.$Message.error('考试时间已用完')
        return
      }
      if (!this.code.trim()) {
        this.$Message.warning('代码不能为空')
        return
      }
      this.submitting = true
      api.submitExamCode({
        exam_id: Number(this.examId),
        problem_id: this.problem.id,
        code: this.code,
        language: this.language
      }).then(res => {
        const d = res.data.data
        this.exam.my_submissions_used = d.submissions_used
        if (d.is_late) this.$Message.warning('已提交（迟交）')
        else this.$Message.success('提交成功，等待判题')
        this.loadSubmissions()
        setTimeout(() => this.loadSubmissions(), 2000)
      }).catch(err => {
        this.$Message.error(err.response.data.error || '提交失败')
      }).finally(() => { this.submitting = false })
    },
    exitExam () {
      this.$Modal.confirm({
        title: '退出考试',
        content: '退出后可再次进入继续作答（时间窗内），代码草稿已自动保存。确定退出？',
        onOk: () => this.$router.back()
      })
    },
    onVisibilityChange () {
      if (document.hidden && this.exam.anti_switch_screen && this.exam.status === '0') {
        this.switchCount += 1
        api.reportExamEvent({ exam_id: Number(this.examId), event_type: 'switch_screen' }).then(() => {})
      }
    }
  }
}
</script>

<style>
/* 考试作答页全局样式（fixed 全屏布局，与题目详情页风格一致） */
.exam-page-root {
  position: fixed;
  top: 56px;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: #eeeeee;
  z-index: 10;
}
.exam-sidebar {
  width: 240px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #e8eaec;
  display: flex;
  flex-direction: column;
  padding: 12px;
}
.exam-title { font-weight: 700; font-size: 15px; line-height: 1.4; margin-bottom: 8px; }
.exam-timer {
  color: #2d8cf0; font-weight: 600; font-size: 18px; margin-bottom: 10px;
  &.danger { color: #ed4014; }
}
.exam-problem-list {
  flex: 1; overflow-y: auto; list-style: none; padding: 0; margin: 0;
  li {
    display: flex; align-items: center; gap: 8px; padding: 9px 8px;
    border-radius: 6px; cursor: pointer; font-size: 13px;
    &.active { background: #f0faff; color: #2d8cf0; }
    &.ac .badge { background: #19be6b !important; }
    .badge {
      width: 20px; height: 20px; border-radius: 50%; background: #c5c8ce;
      color: #fff; font-size: 11px; display: inline-flex; align-items: center;
      justify-content: center; flex-shrink: 0;
    }
    .p-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .p-score { color: #808695; font-size: 12px; }
  }
}
.exam-info {
  padding-top: 10px; border-top: 1px solid #e8eaec; font-size: 12px; color: #515a6e;
  p { margin: 4px 0; }
  .anti-cheat { color: #ff9900; }
}
.exam-main { flex: 1; display: flex; flex-direction: column; padding: 10px; min-width: 0; }
.exam-top-bar { flex-shrink: 0; margin-bottom: 10px; }
.quad-grid {
  flex: 1 1 0%; min-height: 0;
  display: grid;
  grid-template-columns: 50% 10px 1fr;
}
.exam-col { display: flex; flex-direction: column; min-width: 0; min-height: 0; }
.exam-col-splitter { width: 10px; }
.exam-row-splitter { height: 10px; flex-shrink: 0; }
.exam-card {
  background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,.06);
  display: flex; flex-direction: column; min-height: 0; min-width: 0;
  overflow: hidden;
}
.exam-card-top-row { height: 62%; flex-shrink: 0; }
.exam-card-bottom { flex: 1; }
.exam-card-head {
  flex-shrink: 0; font-weight: 600; font-size: 13px; color: #515a6e;
  padding: 9px 14px; border-bottom: 1px solid #f0f0f0; background: #fafafa;
  display: flex; align-items: center; justify-content: space-between;
}
.exam-card-body { flex: 1; overflow-y: auto; padding: 14px; min-height: 0; }
.editor-card.exam-card-top-row { height: 62%; }
.editor-head .lang-select { display: flex; align-items: center; gap: 6px; font-weight: 400; }
.editor-body { padding: 0; }
.editor-body .cm-wrapper { height: 100%; }
.p-title-lg { font-size: 17px; margin-bottom: 8px; }
.p-meta { margin-bottom: 10px; }
.sec-card { margin-bottom: 10px; font-size: 13px;
  .md-content { margin-top: 6px; line-height: 1.7; }
}
.sample-block { display: flex; gap: 10px; margin-top: 6px;
  > div { flex: 1; min-width: 0; }
  .sample-label { font-weight: 600; margin-bottom: 4px; font-size: 12px; }
  pre {
    background: #f8f8f9; padding: 8px; border-radius: 4px; overflow: auto;
    font-size: 12px; white-space: pre-wrap;
  }
}
.loading-tip { text-align: center; padding: 40px 0; color: #808695; }
.exam-notes { list-style: none; padding: 0; font-size: 13px; line-height: 2; color: #515a6e; }
/* 细滚动条 */
.exam-page-root ::-webkit-scrollbar { width: 8px; height: 8px; }
.exam-page-root ::-webkit-scrollbar-thumb { background: #d4d7dc; border-radius: 4px; }
.exam-page-root ::-webkit-scrollbar-track { background: transparent; }
</style>
