<template>
  <div class="immersion-container">
    <div v-if="loading" class="loading-state">
      <Spin size="large">
        <Icon type="ios-loading" size="48" class="spin-icon"></Icon>
        <div>{{ $t('m.Immersion_Loading') }}</div>
      </Spin>
    </div>

    <div v-else-if="!problemList.length" class="empty-state">
      <Icon type="ios-sad-outline" size="64" />
      <p>{{ $t('m.No_Recommendations_Immersion') }}</p>
      <Button type="primary" @click="goProblemList">去题目列表</Button>
      <Button @click="refetch" style="margin-left: 8px">重新加载</Button>
    </div>

    <div v-else class="flex-container">
      <div id="problem-main">
        <Panel :padding="40" shadow>
          <div slot="title" class="panel-title-row">
            <span class="problem-title-id">#{{ currentProblem._id }}.</span>
            <span class="problem-title-text">{{ currentProblem.title }}</span>
            <span class="diff-tag" :class="diffClass">{{ diffLabel }}</span>
          </div>

          <div v-if="currentProblem.reason" class="reason-note">
            <span class="rn-dot"></span>
            <span>{{ currentProblem.reason }}</span>
          </div>

          <div id="problem-content" class="markdown-body" v-katex>
            <p class="title">{{ $t('m.Description') }}</p>
            <p class="content" v-html="currentProblem.description"></p>

            <p class="title">{{ $t('m.Input') }}</p>
            <p class="content" v-html="currentProblem.input_description"></p>

            <p class="title">{{ $t('m.Output') }}</p>
            <p class="content" v-html="currentProblem.output_description"></p>

            <div v-for="(sample, index) in currentProblem.samples" :key="index">
              <div class="sample">
                <div class="sample-input">
                  <p class="title">{{ $t('m.Sample_Input') }} {{ index + 1 }}
                    <a class="copy"
                       v-clipboard:copy="sample.input"
                       v-clipboard:success="onCopy"
                       v-clipboard:error="onCopyError">
                      <Icon type="clipboard"></Icon>
                    </a>
                  </p>
                  <pre>{{ sample.input }}</pre>
                </div>
                <div class="sample-output">
                  <p class="title">{{ $t('m.Sample_Output') }} {{ index + 1 }}</p>
                  <pre>{{ sample.output }}</pre>
                </div>
              </div>
            </div>

            <div v-if="currentProblem.hint">
              <p class="title">{{ $t('m.Hint') }}</p>
              <Card dis-hover>
                <div class="content" v-html="currentProblem.hint"></div>
              </Card>
            </div>

            <div v-if="currentProblem.source">
              <p class="title">{{ $t('m.Source') }}</p>
              <p class="content">{{ currentProblem.source }}</p>
            </div>
          </div>
        </Panel>

        <AICard
          title="智能解题提示"
          icon="ios-bulb"
          iconColor="#ff9900"
          btnText="获取提示"
          btnType="warning"
          :fetchFn="fetchHint"
        />

        <Card :padding="20" id="submit-code" dis-hover>
          <CodeMirror ref="codeMirror" :value.sync="code"
                      :languages="problemLanguages"
                      :language="language"
                      :theme="theme"
                      @resetCode="onResetToTemplate"
                      @changeTheme="onChangeTheme"
                      @changeLang="onChangeLang"></CodeMirror>

          <div class="self-test-section">
            <p class="self-test-label">{{ $t('m.Self_Test') }}</p>
            <div class="self-test-row">
              <div class="self-test-left">
                <p class="self-test-col-title">{{ $t('m.Self_Test_Input') }}</p>
                <textarea v-model="selfTestInput" rows="5"
                          :placeholder="$t('m.Self_Test_Placeholder')"
                          class="self-test-textarea"></textarea>
              </div>
              <div class="self-test-right">
                <p class="self-test-col-title">
                  {{ $t('m.Self_Test_Output') }}
                  <span v-if="selfTestResult" class="self-test-meta" :class="{ success: selfTestResult.success }">
                    <span v-if="selfTestResult.success" class="self-test-tag self-test-tag-success">{{ $t('m.Self_Test_Run') }} {{ $t('m.Success') }}</span>
                    <span v-else class="self-test-tag self-test-tag-error">{{ $t('m.Error') }}</span>
                    <span v-if="selfTestResult.success" class="meta-text">{{ $t('m.Time') }}: {{ selfTestResult.time_cost }}ms</span>
                    <span v-if="selfTestResult.success" class="meta-text">{{ $t('m.Memory') }}: {{ (selfTestResult.memory_cost / 1024 / 1024).toFixed(2) }}MB</span>
                  </span>
                </p>
                <pre v-if="selfTestResult" class="self-test-pre">{{ selfTestResult.output || selfTestResult.error }}</pre>
                <pre v-else class="self-test-pre self-test-pre-empty">{{ $t('m.Self_Test_Output_Hint') }}</pre>
              </div>
            </div>
          </div>

          <div class="submit-row">
            <div class="submit-row-left">
              <Button type="primary" icon="edit" :loading="submitting" @click="submitCode"
                      :disabled="!code.trim()">
                <span v-if="submitting">{{ $t('m.Submitting') }}</span>
                <span v-else>{{ $t('m.Submit') }}</span>
              </Button>
              <Button type="primary" :loading="selfTesting" @click="runSelfTest">
                {{ $t('m.Self_Test') }}
              </Button>
            </div>
          </div>

          <div class="status" v-if="statusVisible">
            <span>{{ $t('m.Status') }}</span>
            <Tag type="dot" :color="submissionStatus.color" @click.native="handleRoute('/status/' + submissionId)">
              {{ $t('m.' + submissionStatus.text.replace(/ /g, '_')) }}
            </Tag>
          </div>

          <div class="alert-row">
            <Alert v-if="currentProblem.my_status === 0 && !statusVisible" type="success" show-icon>
              {{ $t('m.You_have_solved_the_problem') }}
            </Alert>
          </div>
        </Card>

        <div class="nav-bottom">
          <Button @click="prevProblem" :disabled="currentIndex <= 0">
            <Icon type="ios-arrow-back" /> 上一题
          </Button>
          <div class="nav-center">
            <div class="dot-nav">
              <span
                v-for="(p, idx) in problemList"
                :key="p._id"
                class="dot"
                :class="{ active: idx === currentIndex }"
                @click="jumpTo(idx)"
                :title="p._id + '. ' + p.title"
              ></span>
            </div>
            <span class="progress-text">{{ currentIndex + 1 }} / {{ problemList.length }}</span>
          </div>
          <Button @click="nextProblem" :disabled="currentIndex >= problemList.length - 1">
            下一题 <Icon type="ios-arrow-forward" />
          </Button>
        </div>
      </div>

      <div id="right-column">
        <Card id="info">
          <div slot="title" class="header">
            <Icon type="information-circled"></Icon>
            <span class="card-title">{{ $t('m.Information') }}</span>
          </div>
          <ul>
            <li><p>ID</p><p>{{ currentProblem._id }}</p></li>
            <li><p>{{ $t('m.Time_Limit') }}</p><p>{{ currentProblem.time_limit || 1000 }}MS</p></li>
            <li><p>{{ $t('m.Memory_Limit') }}</p><p>{{ currentProblem.memory_limit || 256 }}MB</p></li>
            <li><p>{{ $t('m.IOMode') }}</p><p>{{ currentProblemIO }}</p></li>
            <li v-if="currentProblem.created_by"><p>{{ $t('m.Created') }}</p><p>{{ currentProblem.created_by.username }}</p></li>
            <li v-if="currentProblem.difficulty"><p>{{ $t('m.Level') }}</p><p>{{ difficultyText }}</p></li>
            <li v-if="currentProblem.total_score"><p>{{ $t('m.Score') }}</p><p>{{ currentProblem.total_score }}</p></li>
            <li><p>{{ $t('m.Tags') }}</p>
              <p>
                <Poptip trigger="hover" placement="top" transfer word-wrap width="260">
                  <a>{{ $t('m.Show') }}</a>
                  <div slot="content" style="display: flex; flex-wrap: wrap; gap: 4px">
                    <Tag v-for="tag in currentProblem.tags" :key="tag">{{ m.tag[tag] || tag }}</Tag>
                  </div>
                </Poptip>
              </p>
            </li>
          </ul>
        </Card>

        <Card id="pieChart" ref="pieChart" :padding="0">
          <div slot="title" class="header">
            <Icon type="ios-analytics"></Icon>
            <span class="card-title">{{ $t('m.Statistic') }}</span>
            <Button type="ghost" size="small" id="detail" @click="graphVisible = !graphVisible">Details</Button>
          </div>
          <div class="echarts" ref="pieChartDom"></div>
        </Card>

        <Modal v-model="graphVisible">
          <div id="pieChart-detail" ref="pieChartDetail"></div>
          <div slot="footer">
            <Button type="ghost" @click="graphVisible=false">{{ $t('m.Close') }}</Button>
          </div>
        </Modal>
      </div>
    </div>

    <div v-if="resultVisible" class="result-overlay" @click.self="resultVisible = false">
      <div class="result-modal">
        <div class="result-close" @click="resultVisible = false">
          <Icon type="ios-close" size="24" />
        </div>

        <table class="result-meta-table">
          <tr><td class="meta-label">{{ $t('m.Problem') }}</td><td class="meta-value">{{ currentProblem._id }} {{ currentProblem.title }}</td></tr>
          <tr><td class="meta-label">{{ $t('m.Submit_Time') }}</td><td class="meta-value">{{ submissionDetail.create_time | localtime }}</td></tr>
          <tr><td class="meta-label">{{ $t('m.Language') }}</td><td class="meta-value">{{ submissionDetail.language }}</td></tr>
          <tr><td class="meta-label">{{ $t('m.Memory') }}</td><td class="meta-value">{{ (submissionDetail.statistic_info.memory_cost || 0) / 1024 }} / {{ (currentProblem.memory_limit || 256) * 1024 }} KB</td></tr>
          <tr><td class="meta-label">{{ $t('m.Time') }}</td><td class="meta-value">{{ submissionDetail.statistic_info.time_cost || 0 }} / {{ currentProblem.time_limit || 1000 }} ms</td></tr>
          <tr><td class="meta-label">{{ $t('m.Status') }}</td><td class="meta-value result-status" :class="resultHeaderClass">{{ resultTitle }}</td></tr>
        </table>

        <div v-if="compileError" class="compile-error-section">
          <h4>{{ $t('m.Compile_Error') }}</h4>
          <pre>{{ submissionDetail.statistic_info.err_info }}</pre>
        </div>

        <div v-else class="testcases-table-wrap">
          <h4 class="testcases-title">{{ $t('m.Test_Case_Details') }}</h4>
          <table class="testcases-table">
            <thead>
              <tr>
                <th>{{ $t('m.Test_Case') }}</th>
                <th>{{ $t('m.Memory') }}(KB)</th>
                <th>{{ $t('m.Time') }}(ms)</th>
                <th>{{ $t('m.Result') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tc in testCases" :key="tc.test_case" :class="tcStatusClass(tc.result)">
                <td>{{ tc.test_case }}</td>
                <td>{{ tc.memory }}</td>
                <td>{{ tc.cpu_time }}</td>
                <td>{{ tcStatusText(tc.result) }}</td>
              </tr>
            </tbody>
          </table>

          <div v-if="failedDetails.length" class="failed-details-section">
            <h4 class="failed-details-title">{{ $t('m.Failed_Test_Cases') }}</h4>
            <div v-for="fd in failedDetails" :key="fd.test_case" class="failed-case">
              <p class="failed-case-header">
                <span class="tc-badge tc-badge-fail">{{ $t('m.Test_Case') }} {{ fd.test_case }}</span>
              </p>
              <div class="failed-io">
                <div class="failed-io-block">
                  <span class="io-label">{{ $t('m.Self_Test_Input') }}</span>
                  <pre>{{ fd.input }}</pre>
                </div>
                <div class="failed-io-block">
                  <span class="io-label">{{ $t('m.Expected_Output') }}</span>
                  <pre>{{ fd.expected }}</pre>
                </div>
                <div class="failed-io-block">
                  <span class="io-label">{{ $t('m.Your_Output') }}</span>
                  <pre>{{ fd.your_output }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@oj/api'
import { mapGetters } from 'vuex'
import { JUDGE_STATUS } from '@/utils/constants'
import storage from '@/utils/storage'
import CodeMirror from '@oj/components/CodeMirror.vue'
import AICard from '@oj/components/AICard.vue'
import { pie, largePie } from '../problem/chartData'
import * as echarts from 'echarts'
import { m } from '@/i18n/oj/zh-CN.js'

const IMMERSION_PREFS_KEY = 'immersion_practice_prefs'

export default {
  name: 'ImmersionPractice',
  components: { CodeMirror, AICard },
  data () {
    return {
      loading: true,
      problemList: [],
      currentIndex: 0,
      code: '',
      language: 'C++',
      theme: 'solarized',
      submitting: false,
      selfTesting: false,
      selfTestInput: '',
      selfTestResult: null,
      submissionId: '',
      statusVisible: false,
      resultVisible: false,
      submissionDetail: { statistic_info: {}, info: {} },
      refreshTimer: null,
      graphVisible: false,
      pie: pie,
      largePie: largePie,
      pieChart: null,
      largePieChart: null,
      _savedPrefs: { language: '', theme: 'solarized' },
      m: m
    }
  },
  computed: {
    ...mapGetters(['isAuthenticated']),
    currentProblem () {
      return this.problemList[this.currentIndex] || {}
    },
    problemLanguages () {
      const p = this.currentProblem
      if (p.languages && p.languages.length) return p.languages.sort()
      return ['C', 'C++', 'Java', 'Python3', 'Go', 'JavaScript'].sort()
    },
    diffLabel () {
      const d = this.currentProblem.difficulty
      if (typeof d === 'number') {
        if (d <= 1) return '简单'
        if (d <= 2) return '普通'
        if (d <= 3) return '中等'
        if (d <= 4) return '较难'
        return '困难'
      }
      return String(d || '未知')
    },
    diffClass () {
      const d = this.currentProblem.difficulty
      if (typeof d === 'number') {
        if (d <= 1) return 'easy'
        if (d <= 2) return 'easy'
        if (d <= 3) return 'mid'
        return 'hard'
      }
      if (d === 'Low') return 'easy'
      if (d === 'Mid') return 'mid'
      return 'hard'
    },
    difficultyText () {
      const d = this.currentProblem.difficulty
      if (typeof d === 'number') {
        if (d <= 1) return this.$t('m.Low')
        if (d <= 2) return this.$t('m.Low')
        if (d <= 3) return this.$t('m.Mid')
        if (d <= 4) return this.$t('m.Mid')
        return this.$t('m.High')
      }
      return this.$t('m.' + d, String(d))
    },
    currentProblemIO () {
      const p = this.currentProblem
      if (p.io_mode && p.io_mode.io_mode) return p.io_mode.io_mode
      return 'Standard IO'
    },
    submissionStatus () {
      return {
        text: this.submissionDetail.result !== undefined ? (JUDGE_STATUS[this.submissionDetail.result] ? JUDGE_STATUS[this.submissionDetail.result].name : 'Pending') : 'Pending',
        color: this.submissionDetail.result !== undefined ? (JUDGE_STATUS[this.submissionDetail.result] ? JUDGE_STATUS[this.submissionDetail.result].color : 'default') : 'default'
      }
    },
    resultTitle () {
      const r = this.submissionDetail.result
      const map = {
        '-2': this.$t('m.Compile_Error'),
        '-1': this.$t('m.Wrong_Answer'),
        '0': this.$t('m.Accepted'),
        '1': this.$t('m.CPU_Time_Limit_Exceeded'),
        '2': this.$t('m.Real_Time_Limit_Exceeded'),
        '3': this.$t('m.Memory_Limit_Exceeded'),
        '4': this.$t('m.Runtime_Error'),
        '5': this.$t('m.System_Error'),
        '8': this.$t('m.Partially_Accepted')
      }
      return map[r] || this.$t('m.Unknown')
    },
    resultHeaderClass () {
      const r = this.submissionDetail.result
      if (r === 0) return 'result-ac'
      if (r === 8) return 'result-pa'
      return 'result-fail'
    },
    compileError () {
      return this.submissionDetail.result === -2
    },
    testCases () {
      const info = this.submissionDetail.info
      if (info && info.data) return info.data
      return []
    },
    failedDetails () {
      return this.submissionDetail.failed_testcase_details || []
    }
  },
  watch: {
    currentIndex () {
      this.loadCurrentProblem()
    },
    graphVisible (val) {
      if (val) {
        this.$nextTick(() => {
          this.initLargePieChart()
        })
      }
    }
  },
  created () {
    if (!this.isAuthenticated) {
      this.$router.push({name: 'home'})
      return
    }
    this._restorePrefs()
    this.loadProblems()
  },
  beforeDestroy () {
    this._savePrefs()
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
    this.disposeCharts()
  },
  methods: {
    _restorePrefs () {
      const saved = storage.get(IMMERSION_PREFS_KEY)
      if (saved) {
        this._savedPrefs = {
          language: saved.language || '',
          theme: saved.theme || 'solarized'
        }
        this.theme = this._savedPrefs.theme
      }
    },
    _savePrefs () {
      storage.set(IMMERSION_PREFS_KEY, {
        language: this.language,
        theme: this.theme
      })
    },
    loadProblems () {
      this.loading = true
      return api.getImmersionRecommendations({ limit: 15, offset: 0 })
        .then(res => {
          const data = res.data || res || {}
          this.problemList = data.problems || data.recommendations || []
          this.loading = false
          if (this.problemList.length) {
            this.loadCurrentProblem()
          }
        })
        .catch(() => {
          this.loading = false
        })
    },
    loadCurrentProblem () {
      const p = this.currentProblem
      if (!p || (!p.id && !p._id)) return
      const problemId = p._id || p.id
      this.statusVisible = false
      this.selfTestResult = null
      this.selfTestInput = ''
      api.getProblem(problemId).then(res => {
        const problem = res.data.data
        if (problem) {
          this.problemList[this.currentIndex] = { ...this.problemList[this.currentIndex], ...problem }
          if (problem.samples && problem.samples.length > 0) {
            this.selfTestInput = problem.samples[0].input
          }
          const availableLangs = (problem.languages && problem.languages.length) ? problem.languages.sort() : ['C++']
          const savedLang = this._savedPrefs.language
          this.language = (savedLang && availableLangs.includes(savedLang)) ? savedLang : availableLangs[0]
          const templateCode = this.getTemplateCode(this.language)
          this.code = templateCode || this.defaultCode(this.language)
          api.submissionExists(problem._id).then(res => {
            this.$set(this.problemList[this.currentIndex], 'my_status', res.data.data ? 0 : -1)
          }).catch(() => {})
          this.changePie(problem)
        }
      }).catch(() => {})
    },
    toApiLanguage (lang) {
      if (lang === 'Python') return 'Python3'
      return lang
    },
    defaultCode (lang) {
      const key = lang === 'Python3' ? 'Python' : lang
      const defaults = {
        'C++': '#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n',
        'C': '#include <stdio.h>\n\nint main() {\n    \n    return 0;\n}\n',
        'Java': 'public class Main {\n    public static void main(String[] args) {\n        \n    }\n}\n',
        'Python': '# Write your code here\n',
        'Go': 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}\n',
        'JavaScript': '// Write your code here\n'
      }
      return defaults[key] || defaults['C++'] || ''
    },
    getTemplateCode (lang) {
      const p = this.currentProblem
      if (!p || !p.template) return null
      if (p.template[lang]) return p.template[lang]
      if (lang === 'Python3' && p.template['Python']) return p.template['Python']
      if (lang === 'Python' && p.template['Python3']) return p.template['Python3']
      return null
    },
    refetch () {
      this.currentIndex = 0
      this.loadProblems()
    },
    prevProblem () {
      if (this.currentIndex > 0) this.currentIndex--
    },
    nextProblem () {
      if (this.currentIndex < this.problemList.length - 1) this.currentIndex++
    },
    jumpTo (idx) {
      if (idx >= 0 && idx < this.problemList.length) this.currentIndex = idx
    },
    handleRoute (route) {
      this.$router.push(route)
    },
    onChangeLang (newLang) {
      const templateCode = this.getTemplateCode(newLang)
      if (templateCode && this.code.trim() === '') {
        this.code = templateCode
      }
      this.language = newLang
    },
    onChangeTheme (newTheme) {
      this.theme = newTheme
    },
    onResetToTemplate () {
      this.$Modal.confirm({
        content: this.$i18n.t('m.Are_you_sure_you_want_to_reset_your_code'),
        onOk: () => {
          const templateCode = this.getTemplateCode(this.language)
          this.code = templateCode || this.defaultCode(this.language)
        }
      })
    },
    fetchHint () {
      const p = this.currentProblem
      const problemId = (p && (p._id || p.id)) || ''
      return api.getProblemHint({
        problem_id: problemId,
        message: `题目《${p.title || ''}》(ID: ${p._id || p.id}) 怎么做？请给我解题提示。`
      })
    },
    runSelfTest () {
      if (this.code.trim() === '') {
        this.$Message.error(this.$i18n.t('m.Code_can_not_be_empty'))
        return
      }
      this.selfTestResult = null
      this.selfTesting = true
      api.selfTest({
        code: this.code,
        language: this.toApiLanguage(this.language),
        input: this.selfTestInput
      }).then(res => {
        const result = res.data.data
        if (res.data.error === null) {
          this.selfTestResult = {
            success: true,
            output: result.output || '',
            time_cost: result.time_cost || 0,
            memory_cost: result.memory_cost || 0
          }
        } else {
          this.selfTestResult = {
            success: false,
            error: res.data.data || res.data.error || 'Unknown error'
          }
        }
        this.selfTesting = false
      }).catch(() => {
        this.selfTesting = false
        this.$Message.error('Self test failed')
      })
    },
    submitCode () {
      if (this.code.trim() === '') {
        this.$Message.error(this.$i18n.t('m.Code_can_not_be_empty'))
        return
      }
      const problem = this.currentProblem
      const problemId = (problem && (problem._id || problem.id)) || null
      if (!problemId) {
        this.$Message.error('题目信息不完整')
        return
      }
      this.submissionId = ''
      this.submissionDetail = { statistic_info: {}, info: {} }
      this.statusVisible = true
      this.submitting = true
      api.submitCode({
        problem_id: problemId,
        language: this.toApiLanguage(this.language),
        code: this.code
      }).then(res => {
        this.submissionId = res.data.data && res.data.data.submission_id
        this.submitting = false
        this.checkSubmissionStatus()
      }).catch(() => {
        this.submitting = false
        this.statusVisible = false
      })
    },
    checkSubmissionStatus () {
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer)
      }
      const poll = () => {
        api.getSubmission(this.submissionId).then(res => {
          this.submissionDetail = res.data.data
          if (Object.keys(res.data.data.statistic_info).length !== 0) {
            this.submitting = false
            this.resultVisible = true
            this.refreshTimer = null
          } else {
            this.refreshTimer = setTimeout(poll, 2000)
          }
        }).catch(() => {
          this.submitting = false
          this.refreshTimer = null
        })
      }
      this.refreshTimer = setTimeout(poll, 2000)
    },
    tcStatusClass (result) {
      if (result === 0) return 'tc-ac'
      return 'tc-fail'
    },
    tcStatusText (result) {
      if (result === 0) return this.$t('m.Accepted')
      if (result === -1) return this.$t('m.Wrong_Answer')
      if (result === 1) return this.$t('m.CPU_Time_Limit_Exceeded')
      if (result === 2) return this.$t('m.Real_Time_Limit_Exceeded')
      if (result === 3) return this.$t('m.Memory_Limit_Exceeded')
      if (result === 4) return this.$t('m.Runtime_Error')
      if (result === 8) return this.$t('m.Partially_Accepted')
      return 'Error'
    },
    onCopy () {
      this.$Message.success('Code copied')
    },
    onCopyError () {
      this.$Message.error('Failed to copy code')
    },
    goProblemList () {
      this.$router.push({name: 'problem-list'})
    },
    changePie (problemData) {
      if (!problemData.statistic_info) {
        problemData.statistic_info = {}
      }
      const filtedStatus = ['-1', '-2', '0', '1', '2', '3', '4', '8']
      for (const k in problemData.statistic_info) {
        if (filtedStatus.indexOf(k) === -1) {
          delete problemData.statistic_info[k]
        }
      }
      const acNum = problemData.accepted_number || 0
      const subNum = problemData.submission_number || 0
      const data = [
        {name: 'WA', value: Math.max(0, subNum - acNum)},
        {name: 'AC', value: acNum}
      ]
      this.pie.series[0].data = data

      const data2 = JSON.parse(JSON.stringify(data))
      data2[1].selected = true
      this.largePie.series[1].data = data2

      const legend = Object.keys(problemData.statistic_info).map(ele => JUDGE_STATUS[ele].short)
      if (legend.length === 0) {
        legend.push('AC', 'WA')
      }
      this.largePie.legend.data = legend

      const acCount = problemData.statistic_info['0'] || 0
      delete problemData.statistic_info['0']

      const largePieData = []
      Object.keys(problemData.statistic_info).forEach(ele => {
        largePieData.push({name: JUDGE_STATUS[ele].short, value: problemData.statistic_info[ele]})
      })
      largePieData.push({name: 'AC', value: acCount})
      this.largePie.series[0].data = largePieData

      this.$nextTick(() => {
        this.initPieChart()
      })
    },
    initPieChart () {
      const dom = this.$refs.pieChartDom
      if (!dom) return
      if (this.pieChart) {
        this.pieChart.dispose()
      }
      this.pieChart = echarts.init(dom)
      this.pieChart.setOption(this.pie)
    },
    initLargePieChart () {
      const dom = this.$refs.pieChartDetail
      if (!dom) return
      if (this.largePieChart) {
        this.largePieChart.dispose()
      }
      this.largePieChart = echarts.init(dom)
      this.largePieChart.setOption(this.largePie)
    },
    disposeCharts () {
      if (this.pieChart) {
        this.pieChart.dispose()
        this.pieChart = null
      }
      if (this.largePieChart) {
        this.largePieChart.dispose()
        this.largePieChart = null
      }
    }
  }
}
</script>

<style lang="less" scoped>
.immersion-container {
  .loading-state, .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    color: #808695;
    .spin-icon { animation: spin 1s linear infinite; margin-bottom: 16px; }
    p { margin: 16px 0; font-size: 17px; }
  }
}

@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.flex-container {
  display: flex;
  width: 100%;
  max-width: 1500px;
  margin: 0 auto;
  padding: 40px 24px 80px;
  background: linear-gradient(180deg, #f0f4f8 0%, #f8fafc 100%);
  min-height: calc(100vh - 60px);
}

#problem-main {
  flex: 1;
  min-width: 0;
  margin-right: 24px;

  /deep/ .ivu-panel,
  /deep/ .ivu-card {
    width: 100%;
  }

  .panel-title-row {
    display: flex;
    align-items: center;
    gap: 10px;
    .problem-title-id {
      font-size: 22px;
      font-weight: 700;
      color: #1e3a8a;
    }
    .problem-title-text {
      font-size: 22px;
      font-weight: 600;
      color: #17233d;
    }
    .diff-tag {
      display: inline-block;
      font-size: 13px;
      font-weight: 600;
      padding: 3px 12px;
      border-radius: 4px;
      line-height: 22px;
      &.easy { background: #19be6b; color: #fff; }
      &.mid { background: #f90; color: #fff; }
      &.hard { background: #ed4014; color: #fff; }
    }
  }

  .reason-note {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    color: #515a6e;
    font-size: 15px;
    line-height: 1.7;
    padding: 14px 18px;
    margin-bottom: 16px;
    background: #f8fafc;
    border-radius: 8px;
    border-left: 3px solid #2d8cf0;
    .rn-dot {
      flex-shrink: 0;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #2d8cf0;
      margin-top: 8px;
    }
  }

  #problem-content {
    .title {
      font-size: 18px;
      font-weight: 600;
      color: #17233d;
      margin: 24px 0 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e8eaec;
    }
    .content {
      font-size: 16px;
      line-height: 1.9;
      color: #515a6e;
      /deep/ p { margin: 8px 0; }
    }
    .sample {
      display: flex;
      gap: 16px;
      margin-top: 8px;
      .sample-input, .sample-output {
        flex: 1;
        pre {
          background: #f5f7fa;
          border: 1px solid #e8eaec;
          border-radius: 6px;
          padding: 12px 16px;
          font-size: 14px;
          line-height: 1.7;
          color: #333;
          white-space: pre-wrap;
          word-break: break-all;
          margin: 0;
        }
      }
    }
    .copy { color: #2d8cf0; cursor: pointer; margin-left: 8px; font-size: 14px; }
  }

  .self-test-section {
    margin-top: 20px;
    margin-bottom: 12px;

    .self-test-label {
      font-size: 1rem;
      font-weight: 600;
      color: #1e3a8a;
      margin-bottom: 10px;
      margin-top: 0;
    }

    .self-test-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      width: 100%;
    }

    .self-test-left,
    .self-test-right {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .self-test-col-title {
       font-size: 0.9rem;
       font-weight: 600;
       color: #475569;
       margin-bottom: 8px;
       margin-top: 0;
       display: flex;
       align-items: center;
       gap: 8px;
       flex-wrap: wrap;
     }

     .self-test-meta {
       display: inline-flex;
       align-items: center;
       gap: 8px;
       flex-wrap: wrap;
       font-weight: 400;

       .meta-text {
         font-size: 11px;
         color: #64748b;
       }
     }

    .self-test-textarea,
    .self-test-pre {
      width: 100%;
      margin: 0;
      padding: 8px;
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.6;
      color: #334155;
      outline: none;
      resize: vertical;
      min-height: 119px;
      max-height: 200px;
      overflow: auto;
      white-space: pre-wrap;
      word-break: break-all;
      box-sizing: border-box;

      &::placeholder {
        color: #94a3b8;
      }
    }

    .self-test-pre-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
    }

    .self-test-tag {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 12px;
      font-weight: 500;
      line-height: 1.5;
    }

    .self-test-tag-success {
      background: #dcfce7;
      color: #16a34a;
    }

    .self-test-tag-error {
      background: #fef2f2;
      color: #ef4444;
    }
  }

  .submit-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 16px;
    .submit-row-left {
      display: flex;
      gap: 10px;
      align-items: center;
    }
  }

  .status {
    margin-top: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #515a6e;
  }

  .alert-row {
    margin-top: 12px;
  }

  .nav-bottom {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 20px;
    padding: 14px 20px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

    .nav-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .dot-nav {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      justify-content: center;
      .dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #e8eaec;
        cursor: pointer;
        transition: all 0.2s;
        &:hover { background: #2d8cf0; opacity: 0.6; }
        &.active { background: #2d8cf0; transform: scale(1.3); }
      }
    }
    .progress-text {
      font-size: 15px;
      font-weight: 600;
      color: #17233d;
    }
  }
}

#right-column {
  flex: none;
  width: 320px;

  #info {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    overflow: hidden;
    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.1rem;
      font-weight: 600;
      color: #1e3a8a;
    }
    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      li {
        display: flex;
        justify-content: space-between;
        padding: 10px 16px;
        border-bottom: 1px solid #f1f5f9;
        p { margin: 0; font-size: 13px; }
        p:first-child { color: #808695; }
        p:last-child { color: #17233d; font-weight: 500; }
      }
    }
  }
}

.result-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-modal {
  background: #fff;
  border-radius: 8px;
  width: 640px;
  max-width: 90vw;
  max-height: 85vh;
  overflow-y: auto;
  padding: 28px 32px;
  position: relative;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.18);
}

.result-close {
  position: absolute;
  top: 10px;
  right: 14px;
  color: #999;
  cursor: pointer;
  transition: color 0.2s;
  &:hover { color: #333; }
}

.result-meta-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  td {
    padding: 6px 0;
    font-size: 13px;
    border-bottom: 1px solid #f0f0f0;
  }
  .meta-label { width: 80px; color: #808695; font-weight: 500; }
  .meta-value { color: #17233d; }
  .result-status {
    font-weight: 700;
    font-size: 15px;
    &.result-ac { color: #19be6b; }
    &.result-pa { color: #f90; }
    &.result-fail { color: #ed4014; }
  }
}

.compile-error-section {
  margin-top: 16px;
  h4 { font-size: 14px; color: #ed4014; margin-bottom: 8px; }
  pre {
    background: #fef0f0;
    border: 1px solid #fde2e2;
    border-radius: 6px;
    padding: 12px 16px;
    font-size: 13px;
    line-height: 1.6;
    color: #ed4014;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 200px;
    overflow-y: auto;
  }
}

.testcases-table-wrap {
  margin-top: 12px;
  .testcases-title { font-size: 15px; font-weight: 600; color: #17233d; margin-bottom: 10px; }
}

.testcases-table {
  width: 100%;
  border-collapse: collapse;
  th, td {
    padding: 8px 10px;
    font-size: 13px;
    border: 1px solid #e8eaec;
    text-align: center;
  }
  th { background: #f5f7fa; font-weight: 600; color: #515a6e; }
  .tc-ac { background: #f0faf5; color: #19be6b; }
  .tc-fail { background: #fef0f0; color: #ed4014; }
}

.failed-details-section {
  margin-top: 18px;
  .failed-details-title { font-size: 15px; font-weight: 600; color: #ed4014; margin-bottom: 10px; }
  .failed-case {
    margin-bottom: 14px;
    .failed-case-header { margin-bottom: 6px; }
    .tc-badge-fail {
      font-size: 12px;
      background: #ed4014;
      color: #fff;
      padding: 2px 10px;
      border-radius: 10px;
    }
  }
  .failed-io {
    display: flex;
    gap: 8px;
    .failed-io-block {
      flex: 1;
      min-width: 0;
      .io-label { font-size: 11px; color: #808695; display: block; margin-bottom: 3px; }
      pre {
        background: #f5f7fa;
        border: 1px solid #e8eaec;
        border-radius: 4px;
        padding: 8px 10px;
        font-size: 12px;
        line-height: 1.5;
        white-space: pre-wrap;
        word-break: break-all;
        max-height: 120px;
        overflow-y: auto;
      }
    }
  }
}
</style>

<style lang="less">
#pieChart {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  margin-bottom: 20px;

  .ivu-card-body {
    padding: 0 !important;
  }

  .header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1.1rem;
    font-weight: 600;
    color: #1e3a8a;
    padding: 16px 20px;
    border-bottom: 2px solid #f1f5f9;
    position: relative;

    .ivu-icon {
      font-size: 20px;
    }

    #detail {
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
    }
  }

  .echarts {
    display: block;
    height: 250px !important;
    min-height: 250px !important;
    width: 100% !important;
    padding: 0;
    overflow: hidden;
  }
}
</style>
