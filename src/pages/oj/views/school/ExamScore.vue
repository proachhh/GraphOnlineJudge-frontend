<template>
  <div class="exam-score-page">
    <div class="topbar">
      <el-button icon="el-icon-arrow-left" size="small" plain @click="goBack">返回</el-button>
    </div>
    <Card dis-hover>
      <p slot="title"><Icon type="ios-podium-outline" /> 成绩单：{{ examTitle }}</p>
      <div slot="extra" v-if="isTeacherView">
        <Button size="small" @click="exportCsv"><Icon type="ios-download-outline" /> 导出 CSV</Button>
        <Button v-if="hasMonitor" size="small" style="margin-left: 8px" @click="showMonitor = true">
          <Icon type="ios-eye" /> 监考记录
        </Button>
      </div>

      <!-- 教师视角：全班成绩 -->
      <template v-if="isTeacherView">
        <Table :columns="teacherCols" :data="rows" :loading="loading" border size="small"
               no-data-text="暂无成绩（学生还未参加）"></Table>
      </template>

      <!-- 学生视角 -->
      <template v-else>
        <div v-if="!scorePublic" class="student-wait">
          <Icon type="ios-time-outline" size="42" />
          <p>成绩尚未公布，请耐心等待教师公布</p>
        </div>
        <template v-else>
          <Row :gutter="12" class="my-score-row">
            <Col span="8"><Card dis-hover><div class="stat"><p class="num">{{ myTotal }}</p><p class="label">我的总分</p></div></Card></Col>
            <Col span="8"><Card dis-hover><div class="stat"><p class="num">{{ myRank != null ? '第 ' + myRank + ' 名' : '—' }}</p><p class="label">班级排名</p></div></Card></Col>
            <Col span="8"><Card dis-hover><div class="stat"><p class="num">{{ mySubCount }}</p><p class="label">提交次数</p></div></Card></Col>
          </Row>
          <Table :columns="studentCols" :data="studentRows" :loading="loading" size="small"></Table>
        </template>
      </template>
    </Card>

    <Modal v-model="showMonitor" title="监考记录（切屏行为）" width="600" footer-hide>
      <Table :columns="monitorCols" :data="monitorLogs" size="small" no-data-text="暂无监考记录"></Table>
    </Modal>
  </div>
</template>

<script>
import api from '@oj/api'
import { Tag } from 'view-ui-plus'

export default {
  name: 'ExamScore',
  props: {
    embedded: { type: Boolean, default: false },
    // 嵌入模式下由父组件传入考试 id
    examId: { type: [String, Number], default: '' }
  },
  data () {
    return {
      examTitle: '',
      isTeacherView: false,
      hasMonitor: false,
      showMonitor: false,
      monitorLogs: [],
      monitorCols: [
        { title: '用户名', key: 'username', width: 140 },
        { title: '事件', key: 'event_type', width: 120,
          render: (h, p) => h(Tag, { color: 'red' }, { default: () => (p.row.event_type === 'switch_screen' ? '切屏' : p.row.event_type) }) },
        { title: '时间', key: 'create_time', render: (h, p) => h('span', this.fmt(p.row.create_time)) }
      ],
      problems: [],
      rows: [],
      loading: false,
      scorePublic: false,
      myTotal: 0,
      myRank: null,
      mySubCount: 0,
      studentRows: []
    }
  },
  computed: {
    // 嵌入模式用 prop，独立页面用路由参数
    eid () { return this.examId || this.$route.params.examId },
    teacherCols () {
      const cols = [
        { title: '排名', key: 'rank', width: 70, fixed: 'left' },
        { title: '姓名', key: 'real_name', width: 90 },
        { title: '学号', key: 'student_id', width: 120 },
        { title: '用户名', key: 'username', width: 130 }
      ]
      this.problems.forEach(p => {
        cols.push({
          title: `${p._id}（${p.score}分）`,
          key: `p_${p.problem_id}`,
          width: 110,
          render: (h, row) => {
            const info = row.row.problems[p.problem_id] || {}
            const text = info.score || 0
            const color = info.ac ? 'green' : (text > 0 ? 'orange' : 'default')
            return h(Tag, { color }, { default: () => String(text) + (info.is_late ? ' 迟' : '') })
          }
        })
      })
      cols.push({ title: '总分', key: 'total_score', width: 80,
        render: (h, p) => h('b', { style: { color: '#2d8cf0' } }, String(p.row.total_score)) })
      cols.push({ title: '提交数', key: 'submission_count', width: 80 })
      cols.push({ title: '参与', key: 'has_participation', width: 70,
        render: (h, p) => h(Tag, { color: p.row.has_participation ? 'green' : 'warning' },
          { default: () => (p.row.has_participation ? '已参加' : '未参加') }) })
      return cols
    },
    studentCols () {
      const cols = [
        { title: '题目', key: '_id', width: 120 },
        { title: '满分', key: 'score', width: 80 }
      ]
      cols.push({ title: '我的得分', key: 'my_score', width: 100,
        render: (h, p) => h('b', { style: { color: '#2d8cf0' } }, String(p.row.my_score)) })
      cols.push({ title: '状态', key: 'ac', width: 90,
        render: (h, p) => h(Tag, { color: p.row.ac ? 'green' : 'red' }, { default: () => (p.row.ac ? 'AC' : '未通过') }) })
      cols.push({ title: '备注', key: 'is_late',
        render: (h, p) => h('span', p.row.is_late ? '迟交' : '') })
      return cols
    }
  },
  mounted () {
    this.load()
  },
  methods: {
    goBack () {
      if (this.embedded) {
        this.$emit('back')
      } else {
        this.$router.back()
      }
    },
    fmt (t) { return t ? String(t).replace('T', ' ').slice(0, 19) : '' },
    load () {
      this.loading = true
      api.getExamScore(this.eid).then(res => {
        const d = res.data.data
        this.isTeacherView = d.is_teacher
        this.problems = d.problems || []
        this.scorePublic = d.score_public
        if (d.is_teacher) {
          this.rows = d.rows || []
        } else {
          this.myTotal = d.total_score || 0
          this.myRank = d.rank
          this.mySubCount = d.submission_count || 0
          const detail = d.problems_detail || {}
          this.studentRows = (d.problems || []).map(p => ({
            _id: p._id,
            score: p.score,
            my_score: (detail[p.problem_id] || {}).score || 0,
            ac: (detail[p.problem_id] || {}).ac,
            is_late: (detail[p.problem_id] || {}).is_late
          }))
          if (!d.score_public) {
            this.scorePublic = false
          }
        }
      }).finally(() => { this.loading = false })
      api.getExamMonitor(this.eid).then(res => {
        this.monitorLogs = res.data.data
        this.hasMonitor = this.monitorLogs.length > 0
      }).catch(() => {})
    },
    exportCsv () {
      window.open(`/api/school/exam/score/export/?exam_id=${this.eid}`, '_blank')
    }
  }
}
</script>

<style lang="less" scoped>
.exam-score-page {
  font-size: 16px;
  // 卡片统一圆角
  :deep(.ivu-card) { border-radius: 12px; }
  :deep(.ivu-table) { font-size: 15px; }
  :deep(.ivu-tabs-tab) { font-size: 16px; }
  max-width: 1200px;
  margin: 0 auto;
  padding: 15px 20px 40px;
}
.topbar { margin-bottom: 10px; }
.my-score-row { margin-bottom: 14px; }
.stat { text-align: center; padding: 6px 0;
  .num { font-size: 28px; font-weight: 600; color: #2d8cf0; }
  .label { color: #808695; font-size: 14px; margin-top: 4px; } }
.student-wait { text-align: center; padding: 60px 0; color: #808695; p { margin-top: 10px; } }
</style>
