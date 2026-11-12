<template>
  <div class="exam-create-page">
    <div class="topbar">
      <el-button icon="el-icon-arrow-left" size="small" plain @click="goBack">返回</el-button>
    </div>
    <Card dis-hover>
      <p slot="title"><Icon type="ios-create-outline" /> 创建考试 / 作业</p>
      <Form ref="form" :model="form" :rules="rules" :label-width="120">
        <Row :gutter="20">
          <Col span="12">
            <FormItem label="标题" prop="title">
              <Input v-model="form.title" placeholder="如：2026 秋季期中考试" />
            </FormItem>
          </Col>
          <Col span="12">
            <FormItem label="类型">
              <RadioGroup v-model="form.exam_type">
                <Radio label="exam">考试（时间窗内作答）</Radio>
                <Radio label="homework">作业（可设迟交）</Radio>
              </RadioGroup>
            </FormItem>
          </Col>
        </Row>
        <Row :gutter="20">
          <Col span="12">
            <FormItem label="开始时间" prop="start_time">
              <DatePicker type="datetime" v-model="form.start_time" format="yyyy-MM-dd HH:mm" placeholder="考试开始" style="width: 100%"></DatePicker>
            </FormItem>
          </Col>
          <Col span="12">
            <FormItem label="结束时间" prop="end_time">
              <DatePicker type="datetime" v-model="form.end_time" format="yyyy-MM-dd HH:mm" placeholder="考试结束" style="width: 100%"></DatePicker>
            </FormItem>
          </Col>
        </Row>
        <Row :gutter="20">
          <Col span="12">
            <FormItem label="迟交截止（作业）">
              <DatePicker type="datetime" v-model="form.late_deadline" format="yyyy-MM-dd HH:mm" placeholder="作业模式：结束后可迟交到此时间" style="width: 100%"></DatePicker>
            </FormItem>
          </Col>
          <Col span="12">
            <FormItem label="计分规则">
              <RadioGroup v-model="form.rule_type">
                <Radio label="ACM">ACM（AC 满分+罚时）</Radio>
                <Radio label="OI">OI（按测试点得分）</Radio>
              </RadioGroup>
            </FormItem>
          </Col>
        </Row>
        <Row :gutter="20">
          <Col span="8">
            <FormItem label="限时（分钟）">
              <InputNumber v-model="form.duration_minutes" :min="0" placeholder="0 表示不限时" style="width: 100%"></InputNumber>
            </FormItem>
          </Col>
          <Col span="8">
            <FormItem label="最大提交次数">
              <InputNumber v-model="form.max_submissions" :min="0" placeholder="0 表示不限" style="width: 100%"></InputNumber>
            </FormItem>
          </Col>
          <Col span="8">
            <FormItem label="成绩公布">
              <DatePicker type="datetime" v-model="form.score_public_time" format="yyyy-MM-dd HH:mm" placeholder="留空则结束后即公布" style="width: 100%"></DatePicker>
            </FormItem>
          </Col>
        </Row>
        <FormItem label="监考选项">
          <Checkbox v-model="form.anti_switch_screen">开启切屏检测（学生切换页面将上报）</Checkbox>
          <Checkbox v-model="form.real_time_rank" style="margin-left: 16px">考试中允许学生查看实时排名</Checkbox>
        </FormItem>

        <FormItem label="参考班级">
          <el-select v-model="form.class_ids" multiple collapse-tags placeholder="选择参加考试/作业的班级（支持多班联考）" style="width: 100%">
            <el-option v-for="c in myClasses" :key="c.id" :label="`${c.name}（${c.member_count}人）`" :value="c.id" />
          </el-select>
        </FormItem>

        <Divider>组卷</Divider>
        <FormItem label="组卷方式">
          <RadioGroup v-model="paperMode">
            <Radio label="manual">从题库手动选题</Radio>
            <Radio label="random">按条件随机抽题</Radio>
          </RadioGroup>
        </FormItem>

        <!-- 随机组卷 -->
        <div v-if="paperMode === 'random'">
          <Row :gutter="20">
            <Col span="6">
              <FormItem label="题目难度">
                <el-select v-model="randomRule.difficulty" clearable placeholder="不限难度" size="small" style="width: 100%">
                  <el-option label="简单" value="Low" />
                  <el-option label="中等" value="Mid" />
                  <el-option label="困难" value="High" />
                </el-select>
              </FormItem>
            </Col>
            <Col span="8">
              <FormItem label="标签过滤">
                <el-select v-model="randomRule.tags" multiple clearable collapse-tags placeholder="不限标签" size="small" style="width: 100%">
                  <el-option v-for="t in tags" :key="t" :label="t" :value="t" />
                </el-select>
              </FormItem>
            </Col>
            <Col span="5">
              <FormItem label="抽题数量">
                <InputNumber v-model="randomRule.count" :min="1" style="width: 100%"></InputNumber>
              </FormItem>
            </Col>
            <Col span="5">
              <FormItem label="套卷数量">
                <InputNumber v-model="randomRule.paper_count" :min="1" :max="10" style="width: 100%"></InputNumber>
              </FormItem>
            </Col>
          </Row>
          <Alert type="info" show-icon>
            随机组卷：每名学生首次进入考试时随机分配一套试卷，各套卷题目独立随机抽取（防作弊）。
          </Alert>
        </div>

        <!-- 手动组卷 -->
        <div v-else>
          <FormItem label="搜索题目">
            <Row :gutter="8">
              <Col span="16">
                <Input v-model="searchKeyword" icon="ios-search" placeholder="按题号 / 标题搜索，回车搜索" @on-enter="searchProblems" />
              </Col>
              <Col span="4">
                <Button long @click="searchProblems">搜索</Button>
              </Col>
            </Row>
          </FormItem>
          <Card dis-hover class="problem-picker">
            <div class="pick-header">
              <b>题库（点击右侧"加卷"加入试卷）</b>
              <span class="picked-count">已选 {{ form.problems.length }} 题</span>
            </div>
            <div class="problem-scroll">
              <div v-for="p in problemList" :key="p.id" class="problem-item">
                <span class="pid">{{ p._id }}</span>
                <span class="title">{{ p.title }}</span>
                <Tag size="small">{{ p.difficulty === 'Low' ? '简单' : p.difficulty === 'Mid' ? '中等' : '困难' }}</Tag>
                <span class="actions">
                  <Button size="small" type="primary" ghost @click="addProblem(p)">加卷</Button>
                </span>
              </div>
              <div v-if="!problemList.length" class="empty-tip">暂无匹配题目</div>
            </div>
          </Card>
          <Card dis-hover class="paper-card" v-if="form.problems.length">
            <p slot="title">试卷题目（可调分值与顺序）</p>
            <div v-for="(item, idx) in form.problems" :key="item.problem_id" class="paper-item">
              <span class="order">{{ idx + 1 }}.</span>
              <span class="title">{{ item._id }} {{ item.title }}</span>
              <span class="score-wrap">
                分值 <InputNumber v-model="item.score" :min="1" size="small" style="width: 90px"></InputNumber>
              </span>
              <Button size="small" type="error" ghost @click="removeProblem(idx)">移除</Button>
            </div>
          </Card>
        </div>

        <FormItem style="margin-top: 18px">
          <Button type="primary" :loading="submitting" @click="submit">创建</Button>
        </FormItem>
      </Form>
    </Card>
  </div>
</template>

<script>
import api from '@oj/api'

export default {
  name: 'ExamCreate',
  props: {
    embedded: { type: Boolean, default: false },
    // 嵌入模式下由父组件传入默认班级
    classId: { type: [String, Number], default: '' }
  },
  data () {
    return {
      form: {
        title: '',
        exam_type: 'exam',
        rule_type: 'ACM',
        start_time: '',
        end_time: '',
        late_deadline: '',
        duration_minutes: 0,
        max_submissions: 0,
        score_public_time: '',
        anti_switch_screen: false,
        real_time_rank: false,
        class_ids: [],
        problems: []
      },
      rules: {
        title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
        start_time: [{ required: true, message: '请选择开始时间' }],
        end_time: [{ required: true, message: '请选择结束时间' }]
      },
      paperMode: 'manual',
      randomRule: { difficulty: '', tags: [], count: 3, paper_count: 1 },
      myClasses: [],
      searchKeyword: '',
      problemList: [],
      tags: [],
      submitting: false
    }
  },
  mounted () {
    this.loadClasses()
    this.loadTags()
    this.searchProblems()
  },
  methods: {
    goBack () {
      if (this.embedded) {
        this.$emit('back')
      } else {
        this.$router.back()
      }
    },
    loadClasses () {
      api.getMyClasses().then(res => {
        this.myClasses = res.data.data
        const def = Number(this.classId || this.$route.params.classId)
        if (def && this.myClasses.find(c => c.id === def)) {
          this.form.class_ids = [def]
        }
      })
    },
    loadTags () {
      api.getProblemTagList().then(res => {
        this.tags = res.data.data
      })
    },
    searchProblems () {
      const data = { keyword: this.searchKeyword }
      api.getProblemList(0, 50, data).then(res => {
        this.problemList = res.data.data.results
      })
    },
    addProblem (p) {
      if (this.form.problems.find(x => x.problem_id === p.id)) {
        this.$Message.info('已在试卷中')
        return
      }
      this.form.problems.push({ problem_id: p.id, _id: p._id, title: p.title, score: 100 })
    },
    removeProblem (idx) {
      this.form.problems.splice(idx, 1)
    },
    submit () {
      this.$refs.form.validate(valid => {
        if (!valid) return
        if (!this.form.class_ids.length) {
          this.$Message.warning('请选择至少一个参考班级')
          return
        }
        const fmtTime = t => {
          const d = new Date(t)
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
        }
        const data = {
          title: this.form.title,
          exam_type: this.form.exam_type,
          rule_type: this.form.rule_type,
          start_time: fmtTime(this.form.start_time),
          end_time: fmtTime(this.form.end_time),
          late_deadline: this.form.late_deadline ? fmtTime(this.form.late_deadline) : null,
          score_public_time: this.form.score_public_time ? fmtTime(this.form.score_public_time) : null,
          duration_minutes: this.form.duration_minutes || 0,
          max_submissions: this.form.max_submissions || 0,
          anti_switch_screen: this.form.anti_switch_screen,
          real_time_rank: this.form.real_time_rank,
          class_ids: this.form.class_ids
        }
        if (this.paperMode === 'random') {
          data.random_rule = {
            difficulty: this.randomRule.difficulty || '',
            tags: this.randomRule.tags || [],
            count: this.randomRule.count,
            paper_count: this.randomRule.paper_count || 1
          }
        } else {
          if (!this.form.problems.length) {
            this.$Message.warning('请至少选择一道题目')
            return
          }
          data.problems = this.form.problems.map(x => ({ problem_id: x.problem_id, score: x.score }))
        }
        this.submitting = true
        api.createExam(data).then(() => {
          this.$Message.success('创建成功')
          if (this.embedded) {
            this.$emit('done')
          } else {
            this.$router.push({ name: 'class-home', params: { classId: String(this.form.class_ids[0]) } })
          }
        }).finally(() => { this.submitting = false })
      })
    }
  }
}
</script>

<style lang="less" scoped>
.exam-create-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 15px 20px 40px;
  font-size: 16px;
  // 卡片统一圆角
  :deep(.ivu-card) { border-radius: 12px; }
  :deep(.ivu-table) { font-size: 15px; }
}
.topbar { margin-bottom: 10px; }
.problem-picker {
  margin-bottom: 12px;
  .pick-header { display: flex; justify-content: space-between; margin-bottom: 8px;
    .picked-count { color: #2d8cf0; } }
  .problem-scroll { max-height: 260px; overflow-y: auto; }
  .problem-item { display: flex; align-items: center; gap: 10px; padding: 7px 4px; border-bottom: 1px dashed #e8eaec;
    .pid { width: 90px; color: #2d8cf0; font-weight: 600; }
    .title { flex: 1; }
    .actions { } }
  .empty-tip { text-align: center; color: #808695; padding: 20px 0; }
}
.paper-card {
  .paper-item { display: flex; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px dashed #e8eaec;
    .order { width: 26px; font-weight: 600; }
    .title { flex: 1; }
    .score-wrap { display: flex; align-items: center; gap: 6px; margin-right: 8px; } }
}
</style>
