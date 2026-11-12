<template>
  <div class="class-list-page">
    <el-button v-if="!embedded" icon="el-icon-arrow-left" size="small" plain @click="$router.back()">返回</el-button>
    <div class="page-header">
      <h2><Icon type="ios-school" /> 我的班级</h2>
      <p class="sub">教师可以创建班级并邀请学生加入，学生通过邀请码进班后参加班级考试与作业</p>
    </div>

    <!-- 教师端：创建班级 -->
    <Card v-if="isTeacherView" class="create-card" dis-hover>
      <p slot="title"><Icon type="ios-add-circle-outline" /> 创建新班级</p>
      <Form ref="createForm" :model="createForm" :rules="createRules" inline>
        <FormItem prop="name">
          <Input v-model="createForm.name" placeholder="班级名称，如：2026级软件工程2班" style="width: 260px" />
        </FormItem>
        <FormItem>
          <el-select v-model="createForm.semester" clearable placeholder="学期（选填）" size="small" style="width: 180px">
            <el-option v-for="s in semesterOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </FormItem>
        <FormItem>
          <el-select v-model="createForm.join_method" size="small" style="width: 150px">
            <el-option label="邀请码直接进班" value="code" />
            <el-option label="申请后需审批" value="approval" />
          </el-select>
        </FormItem>
        <FormItem>
          <Button type="primary" :loading="creating" @click="handleCreate">创建班级</Button>
        </FormItem>
      </Form>
    </Card>

    <!-- 学生端：加入班级 -->
    <Card v-else class="create-card" dis-hover>
      <p slot="title"><Icon type="ios-log-in" /> 加入班级</p>
      <Form inline>
        <FormItem>
          <Input v-model="joinCode" placeholder="输入教师提供的邀请码" style="width: 260px" />
        </FormItem>
        <FormItem>
          <Input v-model="joinStudentId" placeholder="学号（选填）" style="width: 150px" />
        </FormItem>
        <FormItem>
          <Input v-model="joinRealName" placeholder="真实姓名（选填）" style="width: 150px" />
        </FormItem>
        <FormItem>
          <Button type="primary" :loading="joining" @click="handleJoin">加入</Button>
        </FormItem>
      </Form>
    </Card>

    <Row :gutter="16" class="class-grid">
      <Col v-for="cls in classes" :key="cls.id" span="8">
        <Card class="class-card" dis-hover>
          <div class="class-card-body" @click="goClass(cls)">
            <h3>{{ cls.name }}</h3>
            <p class="meta">
              <Icon type="ios-calendar-outline" /> {{ cls.semester || '未设置学期' }}
              <span v-if="isTeacherView" class="member-badge"><Icon type="ios-people" /> {{ cls.member_count }} 人</span>
              <span v-else class="member-badge teacher">教师：{{ cls.teacher }}</span>
            </p>
            <div class="desc" v-html="cls.description || '暂无介绍'"></div>
            <p class="invite" v-if="isTeacherView">邀请码：<b>{{ cls.invite_code }}</b></p>
          </div>
        </Card>
      </Col>
    </Row>
    <div v-if="!classes.length" class="empty">
      <Icon type="ios-folder-open-outline" size="48" />
      <p>{{ isTeacherView ? '还没有创建班级，先创建一个吧' : '还没有加入任何班级，向老师索要邀请码' }}</p>
    </div>
  </div>
</template>

<script>
import api from '@oj/api'
import { mapGetters } from 'vuex'

export default {
  name: 'ClassList',
  props: {
    // 嵌入教师工作台时为 true（隐藏返回按钮）
    embedded: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      classes: [],
      creating: false,
      joining: false,
      joinCode: '',
      joinStudentId: '',
      joinRealName: '',
      createForm: {
        name: '',
        semester: '',
        join_method: 'code'
      },
      createRules: {
        name: [{ required: true, message: '请输入班级名称', trigger: 'blur' }]
      }
    }
  },
  computed: {
    ...mapGetters(['isTeacher', 'isAdminRole']),
    // 教师/管理员（含超管）都显示教师端视图
    isTeacherView () {
      return this.isTeacher || this.isAdminRole
    },
    // 学期下拉选项：当前年份前后各 2 年，每学年两学期
    semesterOptions () {
      const y = new Date().getFullYear()
      const list = []
      for (let base = y - 2; base <= y + 1; base++) {
        list.push(`${base}-${base + 1}-1`)
        list.push(`${base}-${base + 1}-2`)
      }
      return list.reverse()
    }
  },
  mounted () {
    this.load()
  },
  methods: {
    load () {
      api.getMyClasses().then(res => {
        this.classes = res.data.data
      })
    },
    handleCreate () {
      this.$refs.createForm.validate(valid => {
        if (!valid) return
        this.creating = true
        api.createClass(this.createForm).then(res => {
          this.$Message.success('班级创建成功')
          this.createForm.name = ''
          this.load()
        }).finally(() => {
          this.creating = false
        })
      })
    },
    handleJoin () {
      if (!this.joinCode.trim()) {
        this.$Message.warning('请输入邀请码')
        return
      }
      this.joining = true
      api.joinClass({
        invite_code: this.joinCode.trim(),
        student_id: this.joinStudentId,
        real_name: this.joinRealName
      }).then(res => {
        const status = res.data.data.status
        this.$Message.success(status === 'active' ? '加入成功' : '申请已提交，等待教师审批')
        this.joinCode = ''
        this.load()
      }).finally(() => {
        this.joining = false
      })
    },
    goClass (cls) {
      // 记住学生最后浏览的班级，导航栏"班级"默认进入
      localStorage.setItem('last_class_id', String(cls.id))
      // 嵌入教师工作台时通知父组件切换，独立页面时走路由
      if (this.embedded) {
        this.$emit('open-class', cls.id)
      } else {
        this.$router.push({ name: 'class-home', params: { classId: String(cls.id) } })
      }
    }
  }
}
</script>

<style lang="less" scoped>
.class-list-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 15px 20px 40px;
  font-size: 16px;
  // 卡片统一圆角
  :deep(.ivu-card) { border-radius: 12px; }
}
.page-header {
  margin: 14px 0;
  h2 { margin-bottom: 6px; font-size: 24px; }
  .sub { color: #808695; font-size: 15px; }
}
.create-card { margin-bottom: 16px; }
.class-grid { margin-top: 4px; }
.class-card {
  cursor: pointer;
  transition: box-shadow .2s;
  &:hover { box-shadow: 0 4px 16px rgba(0, 0, 0, .12); }
  h3 { font-size: 20px; margin-bottom: 8px; }
  .meta { color: #808695; font-size: 14px;
    .member-badge { margin-left: 10px; &.teacher { margin-left: 10px; } } }
  .desc { font-size: 15px; color: #515a6e; max-height: 44px; overflow: hidden; margin: 10px 0; }
  .invite { font-size: 14px; color: #2d8cf0; b { letter-spacing: 1px; } }
}
.empty { text-align: center; padding: 60px 0; color: #808695; p { margin-top: 10px; font-size: 16px; } }
</style>
