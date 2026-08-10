<template>
  <div class="teacher-dashboard">
    <div v-if="!canAccess" class="no-access">
      <i class="el-icon-warning"></i>
      <p>仅教师可访问此页面</p>
    </div>

    <div v-else class="td-layout">
      <!-- ============ 左侧侧边栏 ============ -->
      <aside class="td-sidebar">
        <div class="sidebar-title">
          <i class="el-icon-setting"></i>
          <span>教师管理</span>
        </div>
        <nav class="sidebar-nav">
          <div class="nav-item" :class="{ active: activeSection === 'stats' }" @click="switchSection('stats')">
            <i class="el-icon-menu"></i>
            <span>学情统计</span>
          </div>
          <div class="nav-item" :class="{ active: activeSection === 'sets' }" @click="switchSection('sets')">
            <i class="el-icon-document"></i>
            <span>题集管理</span>
          </div>
          <div class="nav-item" :class="{ active: activeSection === 'students' }" @click="switchSection('students')">
            <i class="el-icon-news"></i>
            <span>学生报告</span>
          </div>
          <div class="nav-item" :class="{ active: activeSection === 'check' }" @click="switchSection('check')">
            <i class="el-icon-search"></i>
            <span>代码查重</span>
          </div>
        </nav>
      </aside>

      <!-- ============ 右侧内容区 ============ -->
      <main class="td-content">
        <!-- ===== 学情统计 ===== -->
        <template v-if="section === 'stats'">
          <div class="content-toolbar">
            <h2 class="content-title">学情统计</h2>
            <el-button size="small" icon="el-icon-refresh" @click="loadStats" :loading="statsLoading">刷新</el-button>
          </div>

          <div v-loading="statsLoading" class="stats-wrap">
            <!-- 汇总卡片 -->
            <div class="stat-cards" v-if="stats">
              <div class="stat-card sc-blue">
                <i class="el-icon-news"></i>
                <div class="sc-body">
                  <span class="sc-num">{{ stats.summary.total_students }}</span>
                  <span class="sc-label">学生总数</span>
                </div>
              </div>
              <div class="stat-card sc-cyan">
                <i class="el-icon-document"></i>
                <div class="sc-body">
                  <span class="sc-num">{{ stats.summary.total_sets }}</span>
                  <span class="sc-label">题集数 / 已发布 {{ stats.summary.published_sets }}</span>
                </div>
              </div>
              <div class="stat-card sc-orange">
                <i class="el-icon-star-on"></i>
                <div class="sc-body">
                  <span class="sc-num">{{ stats.summary.total_boss }}</span>
                  <span class="sc-label">Boss 挑战数</span>
                </div>
              </div>
              <div class="stat-card sc-green">
                <i class="el-icon-edit-outline"></i>
                <div class="sc-body">
                  <span class="sc-num">{{ stats.summary.total_submissions }}</span>
                  <span class="sc-label">总提交数 / 已评 {{ stats.summary.graded_submissions }}</span>
                </div>
              </div>
              <div class="stat-card sc-purple">
                <i class="el-icon-rank"></i>
                <div class="sc-body">
                  <span class="sc-num">{{ stats.summary.avg_score }}</span>
                  <span class="sc-label">平均分</span>
                </div>
              </div>
              <div class="stat-card sc-red">
                <i class="el-icon-circle-check"></i>
                <div class="sc-body">
                  <span class="sc-num">{{ stats.summary.pass_rate }}%</span>
                  <span class="sc-label">及格率</span>
                </div>
              </div>
            </div>

            <!-- 图表区 -->
            <div class="charts-row" v-if="stats">
              <div class="chart-card">
                <h3 class="chart-title">提交趋势（近 14 天）</h3>
                <div class="chart-box" ref="trendChart"></div>
              </div>
              <div class="chart-card">
                <h3 class="chart-title">成绩分布</h3>
                <div class="chart-box" ref="scoreDistChart"></div>
              </div>
            </div>
            <div class="charts-row" v-if="stats">
              <div class="chart-card">
                <h3 class="chart-title">知识点题集分布</h3>
                <div class="chart-box" ref="topicChart"></div>
              </div>
              <div class="chart-card">
                <h3 class="chart-title">难度分布</h3>
                <div class="chart-box" ref="diffChart"></div>
              </div>
            </div>

            <!-- Top 学生 + 近期提交 -->
            <div class="charts-row" v-if="stats">
              <div class="chart-card chart-card-table">
                <h3 class="chart-title">Top 学生（按平均分）</h3>
                <el-table :data="stats.top_students" size="small" empty-text="暂无数据">
                  <el-table-column type="index" label="#" width="50"></el-table-column>
                  <el-table-column prop="username" label="学生" min-width="120"></el-table-column>
                  <el-table-column prop="sub_count" label="提交数" width="90"></el-table-column>
                  <el-table-column label="平均分" width="100">
                    <template slot-scope="{row}">
                      <el-tag size="mini" :type="row.avg_score >= 80 ? 'success' : (row.avg_score >= 60 ? 'warning' : 'danger')">{{ row.avg_score }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="100">
                    <template slot-scope="{row}">
                      <el-button size="mini" type="primary" plain @click="jumpStudentReport(row)">查看</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <div class="chart-card chart-card-table">
                <h3 class="chart-title">近期提交</h3>
                <el-table :data="stats.recent_submissions" size="small" empty-text="暂无数据">
                  <el-table-column prop="username" label="学生" width="110"></el-table-column>
                  <el-table-column label="题目" min-width="140">
                    <template slot-scope="{row}">
                      <el-tag size="mini" :type="row.type === 'boss' ? 'danger' : 'info'" effect="plain">{{ row.type === 'boss' ? 'Boss' : '题集' }}</el-tag>
                      <span class="recent-title">{{ row.title }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="得分" width="80">
                    <template slot-scope="{row}">{{ row.score != null ? row.score : '-' }}</template>
                  </el-table-column>
                  <el-table-column label="状态" width="90">
                    <template slot-scope="{row}">
                      <el-tag size="mini" :type="row.status === 'graded' ? 'success' : 'warning'">{{ statusText(row.status) }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="时间" min-width="140">
                    <template slot-scope="{row}">{{ row.created | localtime }}</template>
                  </el-table-column>
                </el-table>
              </div>
            </div>

            <div v-if="stats && !stats.summary.total_submissions" class="stats-empty">
              <i class="el-icon-tickets"></i>
              <p>暂无提交数据，待学生开始作答后将自动统计</p>
            </div>
          </div>
        </template>

        <!-- ===== 题集管理 ===== -->
        <template v-else-if="section === 'sets'">
          <!-- 列表视图 -->
          <div v-if="!editingSet" class="set-list-view">
            <div class="content-toolbar">
              <h2 class="content-title">题集管理</h2>
              <el-button type="primary" size="small" icon="el-icon-plus" @click="openSetDialog(null)">新建题集</el-button>
            </div>
            <el-table :data="sets" v-loading="setsLoading" stripe style="width: 100%">
              <el-table-column prop="title" label="标题" min-width="160"></el-table-column>
              <el-table-column prop="topic" label="知识点" width="120">
                <template slot-scope="{row}"><el-tag size="mini" type="info" v-if="row.topic">{{ row.topic }}</el-tag></template>
              </el-table-column>
              <el-table-column label="难度" width="80">
                <template slot-scope="{row}"><el-tag size="mini" :type="diffTag(row.difficulty)">{{ diffText(row.difficulty) }}</el-tag></template>
              </el-table-column>
              <el-table-column prop="question_count" label="题目数" width="80"></el-table-column>
              <el-table-column prop="submission_count" label="提交数" width="80">
                <template slot-scope="{row}">
                  <el-link type="primary" :underline="false" @click="viewSetSubmissions(row)">{{ row.submission_count || 0 }}</el-link>
                </template>
              </el-table-column>
              <el-table-column label="已发布" width="90">
                <template slot-scope="{row}">
                  <el-switch :value="!!row.is_published" @change="toggleSetPublish(row)"></el-switch>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="200" fixed="right">
                <template slot-scope="{row}">
                  <el-button size="mini" type="primary" plain @click="openSetDialog(row)">编辑</el-button>
                  <el-button size="mini" type="danger" plain @click="deleteSet(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 编辑视图 -->
          <div v-else class="set-edit-view">
            <div class="content-toolbar">
              <el-button size="small" icon="el-icon-back" @click="cancelEdit">返回列表</el-button>
              <h2 class="content-title">{{ setForm.id ? '编辑题集' : '新建题集' }}</h2>
              <el-button type="primary" size="small" @click="saveSet" :loading="setSaving">保存</el-button>
            </div>
            <div class="edit-form-wrap">
              <el-form :model="setForm" label-width="90px" size="small">
                <el-form-item label="标题">
                  <el-input v-model="setForm.title" placeholder="请输入题集标题"></el-input>
                </el-form-item>
                <el-form-item label="描述">
                  <el-input v-model="setForm.description" type="textarea" :rows="2" placeholder="题集描述"></el-input>
                </el-form-item>
                <el-row :gutter="16">
                  <el-col :span="8">
                    <el-form-item label="知识点">
                      <el-select v-model="setForm.topic" placeholder="选择知识点" filterable allow-create style="width:100%">
                        <el-option v-for="t in topics" :key="t" :label="t" :value="t"></el-option>
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="难度">
                      <el-select v-model="setForm.difficulty" style="width:100%">
                        <el-option label="简单" value="Low"></el-option>
                        <el-option label="中等" value="Mid"></el-option>
                        <el-option label="困难" value="High"></el-option>
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="限时(分)">
                      <el-input-number v-model="setForm.time_limit" :min="0" :max="300" style="width:100%"></el-input-number>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-form-item label="答题次数">
                  <el-input-number v-model="setForm.max_attempts" :min="0" :max="99" placeholder="0 表示不限" style="width:160px"></el-input-number>
                  <span class="form-hint">0 或空表示不限制答题次数</span>
                </el-form-item>
                <el-form-item label="可见性">
                  <el-checkbox v-model="setForm.show_score">允许学生查看得分</el-checkbox>
                  <el-checkbox v-model="setForm.show_ranking">允许学生查看排名</el-checkbox>
                </el-form-item>

                <el-form-item label="题目">
                  <div class="questions-editor">
                    <div class="qe-toolbar">
                      <el-button type="primary" plain size="small" icon="el-icon-plus" @click="addQuestion(setForm.questions)">添加题目</el-button>
                      <el-button type="warning" plain size="small" icon="el-icon-edit" @click="openAiDialog">AI 一键生成</el-button>
                    </div>
                    <div class="qe-item" v-for="(q, qi) in setForm.questions" :key="qi">
                      <div class="qe-head">
                        <span class="qe-num">第 {{ qi + 1 }} 题</span>
                        <el-select v-model="q.question_type" size="mini" style="width:110px" @change="onQTypeChange(q)">
                          <el-option label="选择题" value="choice"></el-option>
                          <el-option label="简答题" value="short_answer"></el-option>
                        </el-select>
                        <el-input-number v-model="q.score" :min="1" :max="100" size="mini" style="width:110px"></el-input-number>
                        <span class="qe-score-label">分值</span>
                        <el-button size="mini" type="danger" plain icon="el-icon-delete" circle @click="removeQuestion(setForm.questions, qi)" class="qe-del"></el-button>
                      </div>
                      <el-input v-model="q.content" type="textarea" :rows="2" placeholder="题干内容" size="small" class="qe-input"></el-input>
                      <!-- 选择题选项 -->
                      <div v-if="q.question_type === 'choice'" class="qe-choices">
                        <div class="qe-choice" v-for="(c, ci) in q.choices" :key="ci">
                          <el-radio v-model="q.correct_answer" :label="c.key">{{ c.key }}</el-radio>
                          <el-input v-model="c.text" placeholder="选项内容" size="mini" style="flex:1"></el-input>
                          <el-button size="mini" type="danger" plain icon="el-icon-close" circle @click="q.choices.splice(ci, 1); refreshChoiceKeys(q)"></el-button>
                        </div>
                        <el-button size="mini" type="primary" plain icon="el-icon-plus" @click="addChoice(q)">添加选项</el-button>
                      </div>
                      <!-- 正确答案 (非选择题) -->
                      <el-input v-if="q.question_type !== 'choice'" v-model="q.correct_answer" type="textarea" :rows="2" placeholder="参考答案" size="small" class="qe-input"></el-input>
                      <el-input v-model="q.explanation" type="textarea" :rows="2" placeholder="解析 (可选)" size="small" class="qe-input"></el-input>
                    </div>
                  </div>
                </el-form-item>
              </el-form>
            </div>
          </div>
        </template>

        <!-- ===== 学生报告 ===== -->
        <template v-else-if="section === 'students'">
          <div class="content-toolbar">
            <h2 class="content-title">学生报告</h2>
          </div>
          <el-table :data="students" v-loading="studentsLoading" stripe style="width: 100%">
            <el-table-column prop="username" label="用户名" min-width="140"></el-table-column>
            <el-table-column prop="exercise_count" label="题集提交" width="130"></el-table-column>
            <el-table-column prop="avg_score" label="平均分" width="100">
              <template slot-scope="{row}">{{ row.avg_score != null ? row.avg_score : '-' }}</template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template slot-scope="{row}">
                <el-button size="mini" type="primary" plain @click="viewStudentReport(row)">查看报告</el-button>
              </template>
            </el-table-column>
          </el-table>
        </template>

        <!-- ===== 代码查重 ===== -->
        <template v-else-if="section === 'check'">
          <div class="content-toolbar">
            <h2 class="content-title">代码查重</h2>
          </div>
          <div class="check-toolbar">
            <el-input v-model="checkProblemId" placeholder="输入题目 ID" style="width: 200px" clearable></el-input>
            <el-button type="primary" size="small" icon="el-icon-search" @click="runCodeCheck" :loading="checkLoading">开始查重</el-button>
            <span class="check-hint">对比该题目所有 AC 提交的代码相似度（阈值 60%）</span>
          </div>
          <div v-loading="checkLoading">
            <div v-if="checkResults !== null" class="check-summary">
              <span>共检测 {{ checkChecked }} 份提交，发现 <b style="color:#ef4444">{{ checkResults.length }}</b> 组相似代码</span>
            </div>
            <el-table :data="checkResults" stripe style="width: 100%" empty-text="暂无相似代码或未检测">
              <el-table-column type="index" label="#" width="50"></el-table-column>
              <el-table-column label="用户 A" width="120">
                <template slot-scope="{row}">{{ row.user_a }}</template>
              </el-table-column>
              <el-table-column label="用户 B" width="120">
                <template slot-scope="{row}">{{ row.user_b }}</template>
              </el-table-column>
              <el-table-column label="相似度" width="120">
                <template slot-scope="{row}">
                  <el-tag size="mini" :type="row.similarity >= 85 ? 'danger' : (row.similarity >= 70 ? 'warning' : 'info')">{{ row.similarity }}%</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="language" label="语言" width="100"></el-table-column>
              <el-table-column label="提交时间 A" width="150">
                <template slot-scope="{row}">{{ row.create_time_a }}</template>
              </el-table-column>
              <el-table-column label="提交时间 B" width="150">
                <template slot-scope="{row}">{{ row.create_time_b }}</template>
              </el-table-column>
              <el-table-column label="操作" width="100">
                <template slot-scope="{row}">
                  <el-button size="mini" type="primary" plain @click="viewCodePair(row)">对比代码</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </template>
      </main>
    </div>

    <!-- ============ AI 生成题目弹窗 ============ -->
    <el-dialog title="AI 一键生成题目" :visible.sync="aiDialogVisible" width="560px" :close-on-click-modal="false" custom-class="dash-dialog">
      <el-form :model="aiForm" label-width="90px" size="small">
        <el-form-item label="知识点">
          <el-select v-model="aiForm.topic" placeholder="选择或输入知识点" filterable allow-create style="width:100%">
            <el-option v-for="t in topics" :key="t" :label="t" :value="t"></el-option>
          </el-select>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="题型">
              <el-select v-model="aiForm.question_type" style="width:100%">
                <el-option label="选择题" value="choice"></el-option>
                <el-option label="简答题" value="short_answer"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="难度">
              <el-select v-model="aiForm.difficulty" style="width:100%">
                <el-option label="简单" value="Low"></el-option>
                <el-option label="中等" value="Mid"></el-option>
                <el-option label="困难" value="High"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="题目数量">
          <el-input-number v-model="aiForm.count" :min="1" :max="10" style="width:160px"></el-input-number>
          <span class="form-hint">最多 10 题</span>
        </el-form-item>
        <div v-if="aiGenerating" class="ai-loading">
          <i class="el-icon-loading"></i> AI 正在生成题目，请稍候...
        </div>
      </el-form>
      <div slot="footer">
        <el-button @click="aiDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="runAiGenerate" :loading="aiGenerating">生成并填入</el-button>
      </div>
    </el-dialog>

    <!-- ============ 提交记录弹窗 ============ -->
    <el-dialog title="学生提交记录" :visible.sync="subDialogVisible" width="720px" custom-class="dash-dialog">
      <el-table :data="submissions" v-loading="subsLoading" stripe size="small">
        <el-table-column prop="username" label="学生" width="120"></el-table-column>
        <el-table-column prop="total_score" label="得分" width="80"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template slot-scope="{row}"><el-tag size="mini" :type="row.status === 'graded' ? 'success' : 'warning'">{{ row.status || '-' }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="created" label="提交时间" min-width="160"></el-table-column>
      </el-table>
      <div slot="footer"><el-button @click="subDialogVisible = false">关闭</el-button></div>
    </el-dialog>

    <!-- ============ 学生报告弹窗 ============ -->
    <el-dialog :title="studentReportTitle" :visible.sync="studentDialogVisible" width="760px" custom-class="dash-dialog">
      <div v-loading="studentReportLoading">
        <div v-if="studentReport">
          <div class="sr-summary">
            <div class="sr-item"><span class="sr-num">{{ studentReport.exercise_count || 0 }}</span><span class="sr-label">题集提交</span></div>
            <div class="sr-item"><span class="sr-num">{{ studentReport.avg_score != null ? studentReport.avg_score : '-' }}</span><span class="sr-label">平均分</span></div>
          </div>
          <div class="sr-ai-section">
            <el-button type="primary" plain size="small" icon="el-icon-edit" :loading="aiAnalysisLoading" @click="loadAiAnalysis(currentStudentId)">AI 学习分析</el-button>
            <div v-if="aiAnalysisLoading" class="ai-analysis-loading">
              <i class="el-icon-loading"></i> AI 正在分析...
            </div>
            <div v-else-if="aiAnalysis" class="markdown-body ai-analysis-content" v-html="renderMarkdown(aiAnalysis)"></div>
          </div>
          <h4 class="sr-section">题集提交记录</h4>
          <el-table :data="studentReport.exercise_submissions || []" stripe size="small" empty-text="暂无记录">
            <el-table-column prop="title" label="题集" min-width="140"></el-table-column>
            <el-table-column prop="score" label="得分" width="80"></el-table-column>
            <el-table-column prop="status" label="状态" width="90"></el-table-column>
            <el-table-column prop="created" label="时间" min-width="140"></el-table-column>
          </el-table>
        </div>
      </div>
      <div slot="footer"><el-button @click="studentDialogVisible = false">关闭</el-button></div>
    </el-dialog>

    <!-- ============ 代码对比弹窗 ============ -->
    <el-dialog :title="codePairTitle" :visible.sync="codePairVisible" width="90%" top="20px" custom-class="dash-dialog code-compare-dialog">
      <div class="code-compare">
        <div class="code-side">
          <div class="code-side-header">
            <span>{{ currentPair.user_a }}</span>
            <span class="code-side-time">{{ currentPair.create_time_a }}</span>
          </div>
          <pre class="code-block">{{ currentPair.code_a }}</pre>
        </div>
        <div class="code-side">
          <div class="code-side-header">
            <span>{{ currentPair.user_b }}</span>
            <span class="code-side-time">{{ currentPair.create_time_b }}</span>
          </div>
          <pre class="code-block">{{ currentPair.code_b }}</pre>
        </div>
      </div>
      <div slot="footer">
        <el-tag :type="currentPair.similarity >= 85 ? 'danger' : (currentPair.similarity >= 70 ? 'warning' : 'info')" size="medium">相似度: {{ currentPair.similarity }}%</el-tag>
        <el-button @click="codePairVisible = false" style="margin-left: 12px">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import api from '@oj/api'
import * as echarts from 'echarts'

export default {
  name: 'TeacherDashboard',
  data () {
    return {
      activeSection: 'stats',
      section: 'stats',
      editingSet: false,
      topics: [],
      // 学情统计
      stats: null,
      statsLoading: false,
      chartInstances: {},
      // 题集
      sets: [],
      setsLoading: false,
      setSaving: false,
      setForm: this.emptySetForm(),
      // 学生
      students: [],
      studentsLoading: false,
      studentDialogVisible: false,
      studentReportLoading: false,
      studentReport: null,
      studentReportTitle: '学生报告',
      currentStudentId: null,
      // AI 分析
      aiAnalysis: '',
      aiAnalysisLoading: false,
      // 提交记录
      subDialogVisible: false,
      submissions: [],
      subsLoading: false,
      // AI 生成
      aiDialogVisible: false,
      aiGenerating: false,
      aiForm: this.emptyAiForm(),
      // 代码查重
      checkProblemId: '',
      checkLoading: false,
      checkResults: null,
      checkChecked: 0,
      codePairVisible: false,
      currentPair: {},
      codePairTitle: '代码对比'
    }
  },
  mounted () {
    this.loadTopics()
    this.loadSets()
    this.loadStats()
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.handleResize)
    this.disposeCharts()
  },
  computed: {
    canAccess () {
      return !!(this.$store.getters.isTeacher || this.$store.getters.isAdminRole)
    },
    trendChartOption () {
      const s = this.stats || {}
      const trend = s.submission_trend || []
      return {
        tooltip: { trigger: 'axis' },
        grid: { left: 40, right: 20, top: 30, bottom: 30 },
        xAxis: {
          type: 'category',
          data: trend.map(t => t.date.slice(5)),
          axisLabel: { fontSize: 11, color: '#64748b' },
          axisLine: { lineStyle: { color: '#cbd5e1' } }
        },
        yAxis: {
          type: 'value',
          minInterval: 1,
          axisLabel: { fontSize: 11, color: '#64748b' },
          splitLine: { lineStyle: { color: '#f1f5f9' } }
        },
        series: [{
          name: '提交数',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 7,
          data: trend.map(t => t.count),
          itemStyle: { color: '#1e3a8a' },
          lineStyle: { width: 3, color: '#1e3a8a' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(30,58,138,0.35)' },
                { offset: 1, color: 'rgba(30,58,138,0.02)' }
              ]
            }
          }
        }]
      }
    },
    scoreDistChartOption () {
      const s = this.stats || {}
      const dist = s.score_distribution || []
      const colors = ['#ef4444', '#f59e0b', '#facc15', '#22c55e', '#1e3a8a']
      return {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: 40, right: 20, top: 20, bottom: 30 },
        xAxis: {
          type: 'category',
          data: dist.map(d => d.label),
          axisLabel: { fontSize: 11, color: '#64748b' },
          axisLine: { lineStyle: { color: '#cbd5e1' } }
        },
        yAxis: {
          type: 'value',
          minInterval: 1,
          axisLabel: { fontSize: 11, color: '#64748b' },
          splitLine: { lineStyle: { color: '#f1f5f9' } }
        },
        series: [{
          type: 'bar',
          barWidth: '55%',
          data: dist.map((d, i) => ({ value: d.value, itemStyle: { color: colors[i % colors.length], borderRadius: [4, 4, 0, 0] } }))
        }]
      }
    },
    topicChartOption () {
      const s = this.stats || {}
      const dist = s.topic_distribution || []
      const top = dist.slice(0, 8)
      return {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: 80, right: 20, top: 20, bottom: 30 },
        xAxis: {
          type: 'value',
          minInterval: 1,
          axisLabel: { fontSize: 11, color: '#64748b' },
          splitLine: { lineStyle: { color: '#f1f5f9' } }
        },
        yAxis: {
          type: 'category',
          data: top.map(t => t.topic).reverse(),
          axisLabel: { fontSize: 11, color: '#475569' },
          axisLine: { lineStyle: { color: '#cbd5e1' } }
        },
        series: [{
          type: 'bar',
          barWidth: '55%',
          data: top.map(t => t.set_count).reverse().map(v => ({ value: v, itemStyle: { color: '#2d8cf0', borderRadius: [0, 4, 4, 0] } }))
        }]
      }
    },
    difficultyChartOption () {
      const s = this.stats || {}
      const dist = s.difficulty_distribution || []
      const colors = { Low: '#22c55e', Mid: '#f59e0b', High: '#ef4444' }
      return {
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { bottom: 0, textStyle: { fontSize: 12, color: '#64748b' } },
        series: [{
          type: 'pie',
          radius: ['40%', '68%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: true,
          label: { show: true, formatter: '{b}\n{c}', fontSize: 12 },
          labelLine: { length: 8, length2: 6 },
          data: dist.map(d => ({ value: d.value, name: d.label, itemStyle: { color: colors[d.key] || '#2d8cf0' } }))
        }]
      }
    }
  },
  watch: {
    stats () {
      if (this.section === 'stats' && this.stats) {
        this.renderCharts()
      }
    }
  },
  methods: {
    // ---------- 通用 ----------
    switchSection (s) {
      this.section = s
      this.activeSection = s
      if (s === 'students' && !this.students.length) this.loadStudents()
      if (s === 'sets' && !this.sets.length) this.loadSets()
      if (s === 'stats') {
        if (this.stats) this.renderCharts()
        else this.loadStats()
      }
    },
    loadTopics () {
      api.getTeacherTopics().then(res => {
        this.topics = (res.data && res.data.topics) || []
      }).catch(() => {})
    },
    diffTag (d) { return { Low: 'success', Mid: 'warning', High: 'danger' }[d] || 'info' },
    diffText (d) { return { Low: '简单', Mid: '中等', High: '困难' }[d] || d || '-' },
    statusText (st) { return { in_progress: '作答中', submitted: '待评分', graded: '已评分' }[st] || st || '-' },
    renderMarkdown (text) {
      if (!text) return ''
      let html = String(text)
      html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>')
      html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
      html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
      html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
      html = html.replace(/\n{2,}/g, '</p><p>')
      html = html.replace(/\n/g, '<br>')
      html = '<p>' + html + '</p>'
      return html
    },

    // ---------- 题集 ----------
    loadSets () {
      this.setsLoading = true
      api.getTeacherExerciseSets().then(res => {
        this.sets = res.data.data || res.data || []
      }).catch(() => { this.$message.error('加载题集失败') })
        .finally(() => { this.setsLoading = false })
    },
    emptySetForm () {
      return { id: null, title: '', description: '', topic: '', difficulty: 'Mid', time_limit: 0, max_attempts: 0, show_score: true, show_ranking: true, questions: [] }
    },
    emptyAiForm () {
      return { topic: '', difficulty: 'Mid', count: 5, question_type: 'choice' }
    },
    openSetDialog (row) {
      if (row) {
        this.setForm = {
          id: row.id,
          title: row.title || '',
          description: row.description || '',
          topic: row.topic || '',
          difficulty: row.difficulty || 'Mid',
          time_limit: row.time_limit || 0,
          max_attempts: row.max_attempts || 0,
          show_score: row.show_score !== false,
          show_ranking: row.show_ranking !== false,
          questions: (row.questions || []).map(q => this.normalizeQuestion(q))
        }
      } else {
        this.setForm = this.emptySetForm()
      }
      this.editingSet = true
    },
    cancelEdit () {
      this.editingSet = false
      this.setForm = this.emptySetForm()
    },
    saveSet () {
      if (!this.setForm.title.trim()) { this.$message.warning('请输入标题'); return }
      if (!this.setForm.questions.length) { this.$message.warning('请至少添加一道题目'); return }
      this.setSaving = true
      const maxAtt = Number(this.setForm.max_attempts) || 0
      const payload = {
        title: this.setForm.title,
        description: this.setForm.description,
        topic: this.setForm.topic,
        difficulty: this.setForm.difficulty,
        time_limit: this.setForm.time_limit,
        max_attempts: maxAtt > 0 ? maxAtt : null,
        show_score: !!this.setForm.show_score,
        show_ranking: !!this.setForm.show_ranking,
        questions: this.setForm.questions.map(this.serializeQuestion)
      }
      const req = this.setForm.id
        ? api.updateExerciseSet(this.setForm.id, payload)
        : api.createExerciseSet(payload)
      req.then(() => {
        this.$message.success(this.setForm.id ? '更新成功' : '创建成功')
        this.editingSet = false
        this.setForm = this.emptySetForm()
        this.loadSets()
      }).catch(() => { this.$message.error('保存失败') })
        .finally(() => { this.setSaving = false })
    },
    deleteSet (row) {
      this.$confirm(`确定删除题集「${row.title}」吗？`, '提示', { type: 'warning' }).then(() => {
        api.deleteExerciseSet(row.id).then(() => {
          this.$message.success('删除成功')
          this.loadSets()
        }).catch(() => { this.$message.error('删除失败') })
      }).catch(() => {})
    },
    toggleSetPublish (row) {
      api.publishExerciseSet(row.id).then(() => {
        this.$message.success(row.is_published ? '已取消发布' : '已发布')
        this.$set(row, 'is_published', !row.is_published)
      }).catch(() => { this.$message.error('操作失败') })
    },
    viewSetSubmissions (row) {
      this.subDialogVisible = true
      this.subsLoading = true
      this.submissions = []
      api.getExerciseSubmissions(row.id).then(res => {
        this.submissions = res.data.data || res.data || []
      }).catch(() => { this.$message.error('加载提交记录失败') })
        .finally(() => { this.subsLoading = false })
    },

    // ---------- AI 生成 ----------
    openAiDialog () {
      // 预填当前题集的知识点/难度
      this.aiForm = {
        topic: this.setForm.topic || '',
        difficulty: this.setForm.difficulty || 'Mid',
        count: 5,
        question_type: 'choice'
      }
      this.aiDialogVisible = true
    },
    runAiGenerate () {
      if (!this.aiForm.topic || !this.aiForm.topic.trim()) {
        this.$message.warning('请选择或输入知识点')
        return
      }
      this.aiGenerating = true
      api.aiGenerateQuestions({
        topic: this.aiForm.topic,
        difficulty: this.aiForm.difficulty,
        count: this.aiForm.count,
        question_type: this.aiForm.question_type
      }).then(res => {
        const d = res.data.data || res.data
        const questions = (d && d.questions) || []
        if (!questions.length) {
          this.$message.warning('AI 未生成有效题目，请重试')
          return
        }
        // 同步知识点到题集（便于后续保存）
        if (this.aiForm.topic && !this.setForm.topic) {
          this.setForm.topic = this.aiForm.topic
        }
        questions.forEach(q => {
          this.setForm.questions.push(this.normalizeQuestion(q))
        })
        this.$message.success(`已生成 ${questions.length} 道题目`)
        this.aiDialogVisible = false
      }).catch(() => {
        this.$message.error('AI 生成失败，请稍后重试')
      }).finally(() => { this.aiGenerating = false })
    },

    // ---------- 学生 ----------
    loadStudents () {
      this.studentsLoading = true
      api.getTeacherStudents().then(res => {
        this.students = res.data.data || res.data || []
      }).catch(() => { this.$message.error('加载学生列表失败') })
        .finally(() => { this.studentsLoading = false })
    },
    // ---------- 学情统计 ----------
    loadStats () {
      this.statsLoading = true
      api.getTeacherStats().then(res => {
        this.stats = res.data.data || res.data || null
      }).catch(() => { this.$message.error('加载学情统计失败') })
        .finally(() => { this.statsLoading = false })
    },
    renderCharts () {
      this.$nextTick(() => {
        this._renderChart('trendChart', this.trendChartOption)
        this._renderChart('scoreDistChart', this.scoreDistChartOption)
        this._renderChart('topicChart', this.topicChartOption)
        this._renderChart('diffChart', this.difficultyChartOption)
      })
    },
    _renderChart (refName, option) {
      const el = this.$refs[refName]
      if (!el) return
      if (this.chartInstances[refName]) {
        this.chartInstances[refName].dispose()
      }
      const inst = echarts.init(el)
      inst.setOption(option || {})
      this.chartInstances[refName] = inst
    },
    disposeCharts () {
      Object.values(this.chartInstances).forEach(c => { try { c.dispose() } catch (e) {} })
      this.chartInstances = {}
    },
    handleResize () {
      Object.values(this.chartInstances).forEach(c => { try { c.resize() } catch (e) {} })
    },
    jumpStudentReport (row) {
      this.switchSection('students')
      this.$nextTick(() => {
        if (row && (row.id || row.user_id)) this.viewStudentReport(row)
      })
    },
    viewStudentReport (row) {
      this.studentDialogVisible = true
      this.studentReportLoading = true
      this.studentReport = null
      this.aiAnalysis = ''
      this.aiAnalysisLoading = false
      this.studentReportTitle = `学生报告 - ${row.username}`
      this.currentStudentId = row.id || row.user_id
      api.getTeacherStudentReport(row.id || row.user_id).then(res => {
        this.studentReport = res.data.data || res.data || {}
      }).catch(() => { this.$message.error('加载报告失败') })
        .finally(() => { this.studentReportLoading = false })
      this.loadAiAnalysis(row.id || row.user_id)
    },
    loadAiAnalysis (userId) {
      if (!userId) return
      this.aiAnalysisLoading = true
      this.aiAnalysis = ''
      api.getTeacherStudentAiAnalysis(userId).then(res => {
        const d = res.data.data || res.data
        this.aiAnalysis = d.analysis || ''
      }).catch(() => { this.$message.error('AI分析失败') })
        .finally(() => { this.aiAnalysisLoading = false })
    },

    // ---------- 代码查重 ----------
    runCodeCheck () {
      if (!this.checkProblemId || !this.checkProblemId.trim()) {
        this.$message.warning('请输入题目 ID')
        return
      }
      this.checkLoading = true
      this.checkResults = null
      api.teacherCodeCheck({ problem_id: this.checkProblemId.trim() }).then(res => {
        const d = res.data || {}
        this.checkResults = d.data || []
        this.checkChecked = d.checked || 0
        if (this.checkResults.length === 0) {
          this.$message.success('未发现相似代码')
        } else {
          this.$message.warning(`发现 ${this.checkResults.length} 组相似代码`)
        }
      }).catch(err => {
        const resp = (err && err.response) || err
        const msg = (resp && resp.data && resp.data.error) || '查重失败'
        this.$message.error(msg)
      }).finally(() => { this.checkLoading = false })
    },
    viewCodePair (row) {
      this.currentPair = row
      this.codePairTitle = `代码对比: ${row.user_a} vs ${row.user_b} (${row.similarity}%)`
      this.codePairVisible = true
    },

    // ---------- 题目编辑器 ----------
    addQuestion (arr) {
      arr.push({
        question_type: 'choice',
        content: '',
        choices: [
          { key: 'A', text: '' },
          { key: 'B', text: '' }
        ],
        correct_answer: '',
        score: 5,
        explanation: '',
        problem_id: null
      })
    },
    removeQuestion (arr, idx) {
      arr.splice(idx, 1)
    },
    onQTypeChange (q) {
      if (q.question_type === 'choice' && (!q.choices || !q.choices.length)) {
        q.choices = [{ key: 'A', text: '' }, { key: 'B', text: '' }]
        q.correct_answer = ''
      }
      if (q.question_type !== 'choice') {
        q.problem_id = q.question_type === 'code' ? (q.problem_id || null) : null
      }
    },
    addChoice (q) {
      if (!q.choices) q.choices = []
      const keys = 'ABCDEFGHIJ'
      q.choices.push({ key: keys[q.choices.length] || String(q.choices.length), text: '' })
    },
    refreshChoiceKeys (q) {
      const keys = 'ABCDEFGHIJ'
      q.choices.forEach((c, i) => { c.key = keys[i] || String(i) })
    },
    normalizeQuestion (q) {
      return {
        question_type: q.question_type || 'choice',
        content: q.content || '',
        choices: (q.choices || []).map(c => ({ key: c.key, text: c.text })),
        correct_answer: q.correct_answer || '',
        score: q.score || 5,
        explanation: q.explanation || '',
        problem_id: q.problem_id || q.problem || null
      }
    },
    serializeQuestion (q) {
      const out = {
        question_type: q.question_type,
        content: q.content,
        correct_answer: q.correct_answer,
        score: q.score,
        explanation: q.explanation
      }
      if (q.question_type === 'choice') {
        out.choices = (q.choices || []).filter(c => c.text && c.text.trim()).map(c => ({ key: c.key, text: c.text }))
      }
      if (q.question_type === 'code' && q.problem_id) {
        out.problem_id = q.problem_id
      }
      return out
    }
  }
}
</script>

<style scoped>
.teacher-dashboard {
  height: 100vh;
  width: 100%;
  background: #f0f2f5;
  overflow: hidden;
}

.no-access {
  text-align: center;
  padding: 100px 20px;
  color: #c0c4cc;
  height: 100vh;
  background: #f5f7fa;
}
.no-access i { font-size: 64px; }
.no-access p { font-size: 18px; margin-top: 16px; }

/* ============ 左右布局 ============ */
.td-layout {
  display: flex;
  height: 100vh;
  width: 100%;
}

.td-sidebar {
  width: 220px;
  flex-shrink: 0;
  background: #1e3a8a;
  color: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}
.sidebar-title {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 22px 20px;
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}
.sidebar-title i {
  font-size: 24px;
}
.sidebar-nav {
  padding: 12px 0;
  display: flex;
  flex-direction: column;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 22px;
  color: #fff;
  font-size: 15px;
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
  opacity: 0.9;
}
.nav-item i { font-size: 18px; }
.nav-item:hover {
  background: rgba(255, 255, 255, 0.08);
}
.nav-item.active {
  background: rgba(255, 255, 255, 0.18);
  opacity: 1;
  font-weight: 600;
}
.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #fff;
}

.td-content {
  flex: 1;
  background: #fff;
  padding: 24px 28px;
  overflow-y: auto;
  min-width: 0;
}

/* ============ 内容区 ============ */
.content-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;
}
.content-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e3a8a;
  margin: 0;
  flex: 1;
}
.content-toolbar /deep/ .el-button--primary {
  background: #1e3a8a;
  border-color: #1e3a8a;
}
.content-toolbar /deep/ .el-button--primary:hover {
  background: #2950b3;
  border-color: #2950b3;
}

.set-list-view,
.set-edit-view {
  width: 100%;
}
.edit-form-wrap {
  max-width: 900px;
}

/* ============ 题目编辑器 ============ */
.questions-editor { width: 100%; }
.qe-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.qe-toolbar /deep/ .el-button--warning {
  background: #e6a23c;
  border-color: #e6a23c;
  color: #fff;
}
.qe-toolbar /deep/ .el-button--warning:hover {
  background: #ebb563;
  border-color: #ebb563;
}
.qe-item {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 14px;
  margin-bottom: 12px;
  border: 1px solid #ebeef5;
}
.qe-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.qe-num { font-size: 14px; font-weight: 600; color: #1e3a8a; min-width: 60px; }
.qe-score-label { font-size: 12px; color: #909399; }
.qe-del { margin-left: auto; }
.qe-input { margin-bottom: 8px; }
.qe-choices { margin-bottom: 8px; }
.qe-choice {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.qe-choice /deep/ .el-radio { margin-right: 0; }
.qe-row { margin-bottom: 8px; }

.form-hint { font-size: 12px; color: #909399; margin-left: 8px; }
.ai-loading {
  margin-top: 10px;
  padding: 12px;
  background: #fdf6ec;
  border-radius: 6px;
  color: #e6a23c;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ============ 学生报告 ============ */
.sr-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  text-align: center;
  margin-bottom: 20px;
}
.sr-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px 8px;
}
.sr-num { font-size: 28px; font-weight: 700; color: #1e3a8a; }
.sr-label { font-size: 13px; color: #909399; margin-top: 4px; }
.sr-section {
  margin: 18px 0 10px;
  font-size: 15px;
  color: #1e3a8a;
  border-left: 3px solid #1e3a8a;
  padding-left: 8px;
}

/* ============ AI 分析 ============ */
.sr-ai-section {
  margin-bottom: 20px;
}
.sr-ai-section /deep/ .el-button--primary {
  background: #1e3a8a;
  border-color: #1e3a8a;
}
.sr-ai-section /deep/ .el-button--primary:hover {
  background: #2950b3;
  border-color: #2950b3;
}
.ai-analysis-loading {
  margin-top: 12px;
  padding: 14px;
  background: #f0f5ff;
  border-radius: 8px;
  color: #1e3a8a;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.ai-analysis-content {
  margin-top: 12px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  border-left: 4px solid #1e3a8a;
  color: #333;
  font-size: 14px;
  line-height: 1.7;
}
.ai-analysis-content /deep/ h2,
.ai-analysis-content /deep/ h3,
.ai-analysis-content /deep/ h4 {
  color: #1e3a8a;
  margin: 10px 0 6px;
}
.ai-analysis-content /deep/ h2 { font-size: 18px; }
.ai-analysis-content /deep/ h3 { font-size: 16px; }
.ai-analysis-content /deep/ h4 { font-size: 15px; }
.ai-analysis-content /deep/ strong { color: #1e3a8a; }
.ai-analysis-content /deep/ li {
  margin-left: 18px;
  list-style: disc;
}
.ai-analysis-content /deep/ p { margin: 6px 0; }

/* ============ Element UI 主题色覆盖 ============ */
.teacher-dashboard /deep/ .el-button--primary {
  background: #1e3a8a;
  border-color: #1e3a8a;
}
.teacher-dashboard /deep/ .el-button--primary:hover {
  background: #2950b3;
  border-color: #2950b3;
}
.teacher-dashboard /deep/ .el-button--primary.is-plain {
  color: #1e3a8a;
  background: #ecf0fb;
  border-color: #1e3a8a;
}
.teacher-dashboard /deep/ .el-button--primary.is-plain:hover {
  background: #1e3a8a;
  border-color: #1e3a8a;
  color: #fff;
}
.teacher-dashboard /deep/ .el-link--primary {
  color: #1e3a8a;
}
.teacher-dashboard /deep/ .el-switch.is-checked .el-switch__core {
  background-color: #1e3a8a;
  border-color: #1e3a8a;
}

/* ============ 学情统计 ============ */
.stats-wrap {
  min-height: 200px;
}
.stat-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  border-radius: 12px;
  color: #fff;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}
.stat-card::after {
  content: '';
  position: absolute;
  right: -18px;
  top: -18px;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
}
.stat-card > i {
  font-size: 36px;
  opacity: 0.95;
  z-index: 1;
}
.stat-card .sc-body {
  display: flex;
  flex-direction: column;
  z-index: 1;
}
.stat-card .sc-num {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.2;
}
.stat-card .sc-label {
  font-size: 13px;
  opacity: 0.92;
  margin-top: 2px;
}
.sc-blue { background: linear-gradient(135deg, #1e3a8a, #2950b3); }
.sc-cyan { background: linear-gradient(135deg, #0ea5e9, #06b6d4); }
.sc-orange { background: linear-gradient(135deg, #f97316, #fb923c); }
.sc-green { background: linear-gradient(135deg, #16a34a, #22c55e); }
.sc-purple { background: linear-gradient(135deg, #7c3aed, #a855f7); }
.sc-red { background: linear-gradient(135deg, #dc2626, #ef4444); }

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
.chart-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #f0f2f5;
}
.chart-card-table {
  overflow-x: auto;
}
.chart-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e3a8a;
  margin: 0 0 12px;
  padding-left: 8px;
  border-left: 3px solid #1e3a8a;
}
.chart-box {
  width: 100%;
  height: 280px;
}
.chart-box /deep/ .echarts {
  width: 100% !important;
  height: 100% !important;
}
.recent-title {
  margin-left: 6px;
  color: #475569;
}
.stats-empty {
  text-align: center;
  padding: 60px 20px;
  color: #c0c4cc;
}
.stats-empty i {
  font-size: 56px;
}
.stats-empty p {
  font-size: 15px;
  margin-top: 14px;
}

/* ============ 代码查重 ============ */
.check-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.check-hint {
  font-size: 13px;
  color: #909399;
}
.check-summary {
  margin-bottom: 14px;
  font-size: 14px;
  color: #606266;
}
.code-compare {
  display: flex;
  gap: 16px;
}
.code-side {
  flex: 1;
  min-width: 0;
}
.code-side-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #1e3a8a;
  color: #fff;
  border-radius: 6px 6px 0 0;
  font-weight: 600;
  font-size: 14px;
}
.code-side-time {
  font-weight: 400;
  font-size: 12px;
  opacity: 0.8;
}
.code-block {
  margin: 0;
  padding: 12px;
  background: #1e293b;
  color: #e2e8f0;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.5;
  border-radius: 0 0 6px 6px;
  overflow: auto;
  max-height: 70vh;
  white-space: pre-wrap;
  word-break: break-all;
}
.code-compare-dialog /deep/ .el-dialog__body {
  padding: 16px;
}

@media (max-width: 1024px) {
  .charts-row {
    grid-template-columns: 1fr;
  }
}
</style>
