<template>
  <div class="class-home-page">
    <div class="topbar">
      <el-button icon="el-icon-arrow-left" size="small" plain @click="goBack">返回班级列表</el-button>
    </div>
    <Card class="head-card" dis-hover>
      <div class="head">
        <div>
          <h2>{{ cls.name || '班级' }}</h2>
          <p class="meta">
            <Tag color="blue">{{ cls.semester || '未设置学期' }}</Tag>
            <span><Icon type="ios-people" /> {{ cls.member_count }} 名成员</span>
            <span v-if="cls.join_method === 'approval'" class="warn"><Icon type="ios-lock" /> 需审批入班</span>
          </p>
        </div>
        <div class="actions">
          <template v-if="isManager">
            <Button size="small" @click="copyInvite">
              <Icon type="ios-copy" /> 邀请码：{{ cls.invite_code }}
            </Button>
            <Button size="small" type="primary" @click="goCreateExam">
              <Icon type="ios-paper-plane-outline" /> 创建考试/作业
            </Button>
          </template>
          <Button v-if="!isManager" size="small" type="error" ghost @click="handleQuit">退出班级</Button>
        </div>
      </div>
    </Card>

    <Tabs v-model="tab" class="home-tabs">
      <!-- 考试列表 -->
      <TabPane label="考试与作业" icon="ios-paper-outline" name="exams">
        <Card dis-hover>
          <Table :columns="examCols" :data="examRows" :loading="examLoading" no-data-text="暂无考试或作业"></Table>
        </Card>
      </TabPane>

      <!-- 教师看板 -->
      <TabPane v-if="isManager" label="班级看板" icon="ios-stats-outline" name="dashboard">
        <Row :gutter="12" class="stat-row">
          <Col span="6"><Card dis-hover><div class="stat"><p class="num">{{ dashboard.member_count || 0 }}</p><p class="label">学生人数</p></div></Card></Col>
          <Col span="6"><Card dis-hover><div class="stat"><p class="num">{{ dashboard.avg_accepted || 0 }}</p><p class="label">人均通过题数</p></div></Card></Col>
          <Col span="6"><Card dis-hover><div class="stat"><p class="num">{{ dashboard.avg_submission || 0 }}</p><p class="label">人均提交次数</p></div></Card></Col>
          <Col span="6"><Card dis-hover><div class="stat"><p class="num">{{ dashboard.exam_count || 0 }}</p><p class="label">考试/作业数</p></div></Card></Col>
        </Row>
        <Card dis-hover class="member-stat-card">
          <p slot="title">成员学情（按通过题数排序）</p>
          <Table :columns="memberStatCols" :data="dashboard.members || []" max-height="420" size="small"></Table>
        </Card>
      </TabPane>

      <!-- 成员管理 -->
      <TabPane v-if="isManager" label="成员管理" icon="ios-people-outline" name="members">
        <Card dis-hover>
          <div class="member-toolbar" slot="title">
            <span class="member-toolbar-title">{{ memberStatus === 'pending' ? '待审批成员' : '成员列表' }}</span>
            <span class="member-toolbar-btns">
              <template v-if="memberStatus !== 'pending'">
                <Badge :count="pendingCount" :offset="[6, -4]">
                  <Button size="small" icon="ios-eye" @click="loadMembers('pending')">查看待审批</Button>
                </Badge>
              </template>
              <template v-else>
                <Button size="small" icon="ios-undo" @click="loadMembers()">返回正常列表</Button>
              </template>
            </span>
          </div>
          <Table :columns="memberCols" :data="members" :loading="memberLoading" size="small"
                 :no-data-text="memberStatus === 'pending' ? '没有待审批的申请' : '暂无成员'"></Table>
        </Card>
      </TabPane>
    </Tabs>
  </div>
</template>

<script>
import api from '@oj/api'
import { Tag, Button, Input } from 'view-ui-plus'

export default {
  name: 'ClassHome',
  props: {
    // 嵌入教师工作台时为 true
    embedded: {
      type: Boolean,
      default: false
    },
    // 嵌入模式下由父组件传入班级 id
    classId: {
      type: [String, Number],
      default: ''
    }
  },
  data () {
    return {
      cls: {},
      tab: 'exams',
      dashboard: {},
      members: [],
      memberLoading: false,
      memberStatus: 'active',
      pendingCount: 0,
      examRows: [],
      examLoading: false,
      isManager: false,
      examCols: [
        { title: '#', type: 'index', width: 50 },
        { title: '标题', key: 'title', render: (h, p) => h('b', p.row.title) },
        { title: '类型', key: 'exam_type', width: 80,
          render: (h, p) => h(Tag, { color: p.row.exam_type === 'exam' ? 'red' : 'green' },
            { default: () => (p.row.exam_type === 'exam' ? '考试' : '作业') }) },
        { title: '状态', key: 'status', width: 100,
          render: (h, p) => h(Tag, { color: p.row.status === '0' ? 'green' : p.row.status === '1' ? 'geekblue' : 'default' },
            { default: () => (p.row.status === '0' ? '进行中' : p.row.status === '1' ? '未开始' : '已结束') }) },
        { title: '开始时间', key: 'start_time', width: 195,
          render: (h, p) => h('span', this.fmt(p.row.start_time)) },
        { title: '结束时间', key: 'end_time', width: 195,
          render: (h, p) => h('span', this.fmt(p.row.end_time)) },
        { title: '成员列', key: 'extra', width: 110,
          render: (h, p) => h('span', this.isManager ? (p.row.participant_count || 0) + ' 人' : (p.row.my_score == null ? '—' : p.row.my_score)) },
        { title: '操作', key: 'op', width: 175, render: (h, p) => {
          const btn = (label, opts, onClick) => h(Button, { size: 'small', style: { marginRight: '6px' }, onClick, ...opts }, { default: () => label })
          if (!this.isManager) {
            if (p.row.status === '1') {
              return h('div', [btn('未开始', { disabled: true }, () => {})])
            }
            const list = []
            if (p.row.status === '0' || (p.row.exam_type === 'homework' && p.row.status === '-1' && !p.row.entered)) {
              list.push(btn('进入', { type: 'primary' }, () => this.enterExam(p.row)))
            }
            if (p.row.status === '-1') {
              list.push(btn('查成绩', {}, () => this.goScore(p.row)))
            }
            return h('div', list)
          }
          const list = [btn('成绩单', {}, () => this.goScore(p.row))]
          if (p.row.status === '1') {
            list.push(btn('删除', { type: 'error', ghost: true }, () => this.delExam(p.row)))
          }
          return h('div', list)
        } }
      ],
      memberStatCols: [
        { title: '用户名', key: 'username', width: 140 },
        { title: '学号', key: 'student_id', width: 130 },
        { title: '姓名', key: 'real_name', width: 100 },
        { title: '通过题数', key: 'accepted_number', sortable: true, width: 100 },
        { title: '提交次数', key: 'submission_number', sortable: true, width: 100 },
        { title: 'OI 总分', key: 'total_score', width: 90 }
      ],
      memberCols: [
        { title: '用户名', key: 'username', width: 140 },
        { title: '学号', key: 'student_id', width: 140,
          render: (h, p) => this.renderMemberField(h, p, 'student_id') },
        { title: '姓名', key: 'real_name', width: 110,
          render: (h, p) => this.renderMemberField(h, p, 'real_name') },
        { title: '角色', key: 'role', width: 90,
          render: (h, p) => h(Tag, { color: p.row.role === 'assistant' ? 'purple' : 'blue' },
            { default: () => (p.row.role === 'assistant' ? '助教' : '学生') }) },
        { title: '状态', key: 'status', width: 90,
          render: (h, p) => h(Tag, { color: p.row.status === 'active' ? 'green' : 'orange' },
            { default: () => (p.row.status === 'active' ? '正常' : '待审批') }) },
        { title: '操作', key: 'op', width: 250, render: (h, p) => {
          const btn = (label, opts, onClick) => h(Button, {
            size: 'small',
            style: { marginRight: '8px', marginBottom: '4px' },
            onClick, ...opts
          }, { default: () => label })
          if (p.row.status === 'pending') {
            return h('div', [
              btn('通过', { type: 'success' }, () => this.memberAction(p.row, 'approve')),
              btn('拒绝', { type: 'error', ghost: true }, () => this.memberAction(p.row, 'reject'))
            ])
          }
          return h('div', [
            btn('保存', { type: 'primary' }, () => this.saveMemberInfo(p.row)),
            btn(p.row.role === 'assistant' ? '撤销助教' : '设为助教', {}, () =>
              this.memberAction(p.row, p.row.role === 'assistant' ? 'set_student' : 'set_assistant')),
            btn('移除', { type: 'error', ghost: true }, () => this.memberAction(p.row, 'remove'))
          ])
        } }
      ],
      memberEdit: {}
    }
  },
  computed: {
    // 嵌入模式用 prop，独立页面用路由参数
    cid () {
      return this.classId || this.$route.params.classId
    }
  },
  created () {
    // 学生从导航栏进班级时默认回到上次浏览的班级
    if (!this.embedded) {
      localStorage.setItem('last_class_id', String(this.cid))
    }
    this.load()
  },
  methods: {
    fmt (t) { return t ? String(t).replace('T', ' ').slice(0, 19) : '—' },
    // 学号/姓名列：教师对"正常"成员可行内编辑，其余显示纯文本
    renderMemberField (h, p, field) {
      if (this.isManager && p.row.status === 'active') {
        const edit = this.memberEdit[p.row.id] || {}
        const val = edit[field] != null ? edit[field] : p.row[field]
        return h(Input, {
          size: 'small',
          modelValue: val,
          placeholder: field === 'student_id' ? '填写学号' : '填写姓名',
          style: { width: '100%' },
          'onUpdate:modelValue': v => {
            this.memberEdit[p.row.id] = this.memberEdit[p.row.id] || {}
            this.memberEdit[p.row.id][field] = v
          }
        })
      }
      return h('span', p.row[field] || '—')
    },
    goBack () {
      if (this.embedded) {
        this.$emit('back')
      } else {
        this.$router.push({ name: 'class-list' })
      }
    },
    load () {
      api.getClassDetail(this.cid).then(res => {
        this.cls = res.data.data
        this.isManager = res.data.data.is_manager
        // 动态更新列标题（data() 阶段角色未知）
        const extraCol = this.examCols.find(c => c.key === 'extra')
        if (extraCol) extraCol.title = this.isManager ? '参与人数' : '我的得分'
        this.loadExams()
        if (this.isManager) {
          this.loadDashboard()
          this.loadMembers()
          this.loadPendingCount()
        }
      }).catch(() => {
        // 班级不存在/无权限时清掉记忆，导航栏回到班级列表
        localStorage.removeItem('last_class_id')
      })
    },
    loadExams () {
      this.examLoading = true
      api.getExams(this.cid).then(res => {
        this.examRows = res.data.data
      }).finally(() => { this.examLoading = false })
    },
    loadDashboard () {
      api.getClassDashboard(this.cid).then(res => {
        this.dashboard = res.data.data
      })
    },
    loadMembers (status) {
      this.memberStatus = status || 'active'
      this.memberLoading = true
      api.getClassMembers(this.cid, status || undefined).then(res => {
        this.members = res.data.data
      }).finally(() => { this.memberLoading = false })
    },
    // 待审批人数角标
    loadPendingCount () {
      api.getClassMembers(this.cid, 'pending').then(res => {
        this.pendingCount = res.data.data.length
      }).catch(() => {})
    },
    memberAction (row, action) {
      if (action === 'remove') {
        this.$Modal.confirm({
          title: '移除成员',
          content: `确定将「${row.username}」移出班级吗？`,
          onOk: () => this.doMemberAction(row, 'remove')
        })
        return
      }
      this.doMemberAction(row, action)
    },
    doMemberAction (row, action) {
      api.classMemberAction({
        class_id: Number(this.cid), member_id: row.id, action
      }).then(() => {
        this.$Message.success('操作成功')
        this.loadMembers(this.memberStatus === 'pending' ? 'pending' : undefined)
        this.loadPendingCount()
      })
    },
    saveMemberInfo (row) {
      const edit = this.memberEdit[row.id] || {}
      api.classMemberAction({
        class_id: Number(this.cid), member_id: row.id, action: 'update_info',
        student_id: edit.student_id != null ? edit.student_id : row.student_id,
        real_name: edit.real_name != null ? edit.real_name : row.real_name
      }).then(() => {
        this.$Message.success('已保存')
        this.loadMembers()
      })
    },
    copyInvite () {
      const code = this.cls.invite_code
      if (navigator.clipboard) {
        navigator.clipboard.writeText(code)
        this.$Message.success(`邀请码 ${code} 已复制`)
      } else {
        this.$Message.info(`邀请码：${code}`)
      }
    },
    goCreateExam () {
      if (this.embedded) {
        this.$emit('create-exam')
      } else {
        this.$router.push({ name: 'exam-create', params: { classId: this.cid } })
      }
    },
    enterExam (row) {
      this.$router.push({ name: 'exam-page', params: { examId: String(row.id) } })
    },
    goScore (row) {
      if (this.embedded) {
        this.$emit('open-score', row.id)
      } else {
        this.$router.push({ name: 'exam-score', params: { examId: String(row.id) } })
      }
    },
    delExam (row) {
      this.$Modal.confirm({
        title: '确认删除',
        content: `确定删除「${row.title}」吗？已有学生参与的考试只能隐藏。`,
        onOk: () => {
          api.deleteExam(row.id).then(() => {
            this.$Message.success('已删除/隐藏')
            this.loadExams()
          })
        }
      })
    },
    handleQuit () {
      this.$Modal.confirm({
        title: '退出班级',
        content: '退出后需要重新申请/使用邀请码才能加入，确定退出？',
        onOk: () => {
          api.quitClass(this.cid).then(() => {
            this.$Message.success('已退出班级')
            this.$router.push({ name: 'class-list' })
          })
        }
      })
    }
  }
}
</script>

<style lang="less" scoped>
.class-home-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 15px 20px 40px;
  font-size: 16px;
  // 卡片统一圆角 + 表格字号
  :deep(.ivu-card) { border-radius: 12px; }
  :deep(.ivu-table) { font-size: 15px; }
  :deep(.ivu-table th) { font-size: 15px; }
  :deep(.ivu-tabs-tab) { font-size: 16px; }
}
.topbar { margin-bottom: 10px; }
.head-card { margin-bottom: 12px;
  .head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
  h2 { font-size: 24px; }
  .meta { color: #808695; font-size: 15px; margin-top: 8px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
    .warn { color: #ff9900; } }
}
.stat-row { margin-bottom: 12px; }
.stat { text-align: center; padding: 8px 0;
  .num { font-size: 32px; font-weight: 600; color: #2d8cf0; }
  .label { color: #808695; font-size: 14px; margin-top: 4px; } }
.member-stat-card { margin-top: 12px; }
// 成员管理工具栏
.member-toolbar {
  display: flex; justify-content: space-between; align-items: center; width: 100%;
  .member-toolbar-title { font-size: 16px; font-weight: 600; }
  .member-toolbar-btns { display: inline-flex; align-items: center; }
  :deep(.ivu-badge-count) { transform: translate(100%, -50%); }
}
:deep(.member-toolbar .ivu-btn-small) { font-size: 14px; }
</style>
