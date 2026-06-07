<template>
  <div class="embedded-problem">
    <div class="problem-content-wrapper">
      <!-- 题目描述区 -->
      <div class="problem-description-section">
        <div class="problem-header">
          <h1>{{ problem.title }}</h1>
          <Tag :color="getDifficultyColor(problem.difficulty)">{{ problem.difficulty }}</Tag>
        </div>
        <div id="problem-content" class="markdown-body" v-katex>
          <p class="title">{{$t('m.Description')}}</p>
          <p class="content" v-html="problem.description"></p>

          <p class="title">{{$t('m.Input')}} <span v-if="problem.io_mode.io_mode=='File IO'">({{$t('m.FromFile')}}: {{ problem.io_mode.input }})</span></p>
          <p class="content" v-html="problem.input_description"></p>

          <p class="title">{{$t('m.Output')}} <span v-if="problem.io_mode.io_mode=='File IO'">({{$t('m.ToFile')}}: {{ problem.io_mode.output }})</span></p>
          <p class="content" v-html="problem.output_description"></p>

          <div v-for="(sample, index) of problem.samples" :key="index">
            <div class="sample">
              <div class="sample-input">
                <p class="title">{{$t('m.Sample_Input')}} {{index + 1}}
                  <a class="copy" v-clipboard:copy="sample.input" v-clipboard:success="onCopy" v-clipboard:error="onCopyError">
                    <Icon type="clipboard"></Icon>
                  </a>
                </p>
                <pre>{{sample.input}}</pre>
              </div>
              <div class="sample-output">
                <p class="title">{{$t('m.Sample_Output')}} {{index + 1}}</p>
                <pre>{{sample.output}}</pre>
              </div>
            </div>
          </div>

          <div v-if="problem.hint">
            <p class="title">{{$t('m.Hint')}}</p>
            <Card dis-hover>
              <div class="content" v-html="problem.hint"></div>
            </Card>
          </div>

          <div v-if="problem.source">
            <p class="title">{{$t('m.Source')}}</p>
            <p class="content">{{problem.source}}</p>
          </div>

          <div class="problem-info-bar">
            <span class="info-item"><b>ID</b> {{problem._id}}</span>
            <span class="info-item"><b>{{$t('m.Time_Limit')}}</b> {{problem.time_limit}}MS</span>
            <span class="info-item"><b>{{$t('m.Memory_Limit')}}</b> {{problem.memory_limit}}MB</span>
            <span v-if="problem.difficulty" class="info-item"><b>{{$t('m.Level')}}</b> {{$t('m.' + problem.difficulty)}}</span>
            <span class="info-item"><b>{{$t('m.Tags')}}</b>
              <Tag v-for="tag in problem.tags" :key="tag" size="small">{{ m.tag[tag] || tag }}</Tag>
            </span>
          </div>
        </div>
      </div>

      <!-- 代码编辑区 -->
      <div class="code-editor-section">
        <CodeMirror 
          :value.sync="code"
          :languages="problem.languages"
          :language="language"
          :theme="theme"
          @resetCode="onResetToTemplate"
          @changeTheme="onChangeTheme"
          @changeLang="onChangeLang"
        ></CodeMirror>
        
        <div class="self-test-section">
          <p class="self-test-label">{{$t('m.Self_Test')}}</p>
          <div class="self-test-row">
            <div class="self-test-left">
              <p class="self-test-col-title">{{$t('m.Self_Test_Input')}}</p>
              <textarea v-model="selfTestInput" rows="5"
                        :placeholder="$t('m.Self_Test_Placeholder')"
                        class="self-test-textarea"></textarea>
            </div>
            <div class="self-test-right">
              <p class="self-test-col-title">
                {{$t('m.Self_Test_Output')}}
                <span v-if="selfTestResult" class="self-test-meta" :class="{ success: selfTestResult.success }">
                  <span v-if="selfTestResult.success" class="self-test-tag self-test-tag-success">{{$t('m.Self_Test_Run')}} {{$t('m.Success')}}</span>
                  <span v-else class="self-test-tag self-test-tag-error">{{$t('m.Error')}}</span>
                  <span v-if="selfTestResult.success" class="meta-text">{{$t('m.Time')}}: {{ selfTestResult.time_cost }}ms</span>
                  <span v-if="selfTestResult.success" class="meta-text">{{$t('m.Memory')}}: {{ (selfTestResult.memory_cost / 1024 / 1024).toFixed(2) }}MB</span>
                </span>
              </p>
              <pre v-if="selfTestResult" class="self-test-pre">{{ selfTestResult.output || selfTestResult.error }}</pre>
              <pre v-else class="self-test-pre self-test-pre-empty">{{ $t('m.Self_Test_Output_Hint') }}</pre>
            </div>
          </div>
        </div>

        <div class="submit-bar">
          <div class="status" v-if="statusVisible">
            <span>Status</span>
            <Tag type="dot" :color="submissionStatus.color" @click.native="handleRoute('/status/'+submissionId)">
              {{ submissionStatus.text.replace(/ /g, "_") }}
            </Tag>
          </div>
          <div v-else-if="problem.my_status === 0">
            <Alert type="success" show-icon>You have solved the problem</Alert>
          </div>
          
          <Button 
            type="primary" 
            icon="edit" 
            :loading="submitting" 
            @click="submitCode"
            :disabled="submitting"
            class="submit-btn"
          >
            <span v-if="submitting">Submitting</span>
            <span v-else>Submit</span>
          </Button>
          <Button type="default" :loading="selfTesting" @click="runSelfTest" class="self-test-btn">
            {{$t('m.Self_Test')}}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@oj/api'
import CodeMirror from '@oj/components/CodeMirror.vue'
import storage from '@/utils/storage'
import { JUDGE_STATUS, buildProblemCodeKey } from '@/utils/constants'
import { m } from '@/i18n/oj/zh-CN.js'

export default {
  name: 'EmbeddedProblem',
  components: {
    CodeMirror
  },
  props: {
    problemId: {
      type: String,
      required: true
    }
  },
  data () {
    return {
      problem: {
        title: '',
        description: '',
        hint: '',
        my_status: '',
        template: {},
        languages: [],
        created_by: { username: '' },
        tags: [],
        io_mode: { io_mode: 'Standard IO' },
        time_limit: 0,
        memory_limit: 0,
        difficulty: '',
        samples: []
      },
      code: '',
      language: 'C++',
      theme: 'solarized',
      submitting: false,
      statusVisible: false,
      submissionId: '',
      captchaRequired: false,
      captchaCode: '',
      captchaSrc: '',
      result: { result: 9 },
      selfTesting: false,
      selfTestInput: '',
      selfTestResult: null,
      m: m
    }
  },
  computed: {
    submissionStatus () {
      const resultValue = this.result && this.result.result
      return {
        text: JUDGE_STATUS[resultValue] ? JUDGE_STATUS[resultValue].name : 'Unknown',
        color: JUDGE_STATUS[resultValue] ? JUDGE_STATUS[resultValue].color : 'default'
      }
    }
  },
  watch: {
    problemId: {
      handler () {
        this.loadProblem()
      },
      immediate: true
    }
  },
  mounted () {
    this.loadProblem()
  },
  methods: {
    loadProblem () {
      if (!this.problemId) return
      api.getProblem(this.problemId).then(res => {
        this.problem = res.data.data
        this.problem.description = this.processMathContent(this.problem.description)
        this.problem.input_description = this.processMathContent(this.problem.input_description)
        this.problem.output_description = this.processMathContent(this.problem.output_description)
        this.problem.hint = this.processMathContent(this.problem.hint)
        this.problem.languages = this.problem.languages.sort()
        
        if (this.problem.samples && this.problem.samples.length > 0) {
          this.selfTestInput = this.problem.samples[0].input
        }
        
        let problemCode = storage.get(buildProblemCodeKey(this.problem._id, null))
        if (problemCode) {
          this.language = problemCode.language
          this.code = problemCode.code
          this.theme = problemCode.theme
        } else {
          this.language = this.problem.languages[0]
          let template = this.problem.template
          if (template && template[this.language]) {
            this.code = template[this.language]
          }
        }
      })
    },
    getDifficultyColor (difficulty) {
      const colors = {
        'Low': 'green',
        'Mid': 'blue',
        'High': 'red'
      }
      return colors[difficulty] || 'default'
    },
    onChangeLang (newLang) {
      if (this.problem.template[newLang]) {
        if (this.code.trim() === '') {
          this.code = this.problem.template[newLang]
        }
      }
      this.language = newLang
    },
    onChangeTheme (newTheme) {
      this.theme = newTheme
    },
    onResetToTemplate () {
      this.$Modal.confirm({
        content: 'Are you sure you want to reset your code?',
        onOk: () => {
          let template = this.problem.template
          if (template && template[this.language]) {
            this.code = template[this.language]
          } else {
            this.code = ''
          }
        }
      })
    },
    submitCode () {
      if (this.code.trim() === '') {
        this.$error('Code can not be empty')
        return
      }
      this.submitting = true
      let data = {
        problem_id: this.problem.id,
        language: this.language,
        code: this.code
      }
      if (this.captchaRequired) {
        data.captcha = this.captchaCode
      }
      
      api.submitCode(data).then(res => {
        this.submissionId = res.data.data && res.data.data.submission_id
        this.statusVisible = true
        this.submitting = false
        this.checkSubmissionStatus()
      }, res => {
        this.getCaptchaSrc()
        if (res.data.data && res.data.data.startsWith('Captcha is required')) {
          this.captchaRequired = true
        }
        this.submitting = false
        this.statusVisible = false
      })
    },
    checkSubmissionStatus () {
      const checkStatus = () => {
        api.getSubmission(this.submissionId).then(res => {
          this.result = res.data.data
          if (Object.keys(res.data.data.statistic_info || {}).length !== 0) {
            this.submitting = false
            clearTimeout(this.refreshStatus)
          } else {
            this.refreshStatus = setTimeout(checkStatus, 2000)
          }
        }, () => {
          this.submitting = false
          clearTimeout(this.refreshStatus)
        })
      }
      this.refreshStatus = setTimeout(checkStatus, 2000)
    },
    getCaptchaSrc () {
      // Implement captcha logic if needed
    },
    handleRoute (route) {
      this.$router.push(route)
    },
    onCopy (event) {
      this.$success('Code copied')
    },
    onCopyError (e) {
      this.$error('Failed to copy code')
    },
    runSelfTest () {
      if (this.code.trim() === '') {
        this.$error('Code can not be empty')
        return
      }
      this.selfTestResult = null
      this.selfTesting = true
      api.selfTest({
        code: this.code,
        language: this.language,
        input: this.selfTestInput
      }).then(res => {
        let result = res.data.data
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
        this.$error('Self test failed')
      })
    },
    processMathContent (text) {
      if (!text) return text
      const placeholders = []
      text = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, inner) => {
        placeholders.push(inner)
        return '@@LPH' + (placeholders.length - 1) + '@@'
      })
      text = text.replace(/\\\[([\s\S]*?)\\\]/g, '$$$1$$')
      text = text.replace(/\\\(([\s\S]*?)\\\)/g, '$$1$$')
      text = text.replace(/(^|[^$@])\$(?!\$)([^$\n]+?)\$(?!\$|$|[0-9])/g, '$1$$2$')

      const tagPlaceholders = []
      text = text.replace(/(<[^>]+>)/g, (match) => {
        tagPlaceholders.push(match)
        return '@@TAG' + (tagPlaceholders.length - 1) + '@@'
      })

      const knownCmds = 'times|cdot|frac|sum|int|sqrt|leq|geq|le|ge|alpha|beta|gamma|delta|pi|sigma|omega|lambda|mu|pm|to|rightarrow|Rightarrow|leftarrow|Leftarrow|leftrightarrow|Leftrightarrow|forall|exists|in|notin|subset|subseteq|supset|supseteq|cup|cap|infty|partial|nabla|approx|equiv|neq|propto|sim|dots|ldots|cdots|vdots|ddots|angle|triangle|oplus|otimes|odot|circ|text|mathbf|mathit|mathrm|dfrac|tfrac|binom|bmod|pmod|overline|underline|overrightarrow|overleftarrow|hat|tilde|bar|vec|dot|ddot|not|neg|land|lor|vdash|models|mid|parallel|perp|ast|star|diamond|bullet|div|mod|wedge|vee|bigcirc|bigtriangleup|bigtriangledown|triangleright|triangleleft|sqcap|sqcup|doublecup|doublecap|displaystyle|textstyle|lim|max|min|sup|inf|limsup|liminf|arg|deg|dim|hom|ker|Pr|det|gcd|lcm|log|ln|lg|exp|sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|sinh|cosh|tanh|coth'
      const cmdRe = new RegExp('\\\\(' + knownCmds + ')(?![a-zA-Z])', 'g')
      const mathChars = /^[a-zA-Z0-9_\{\}\^\\,\s\.\-\+\=\<\>\|\(\)\[\]\/\'\*]+$/
      const ranges = []
      let m
      while ((m = cmdRe.exec(text)) !== null) {
        let start = m.index
        let end = m.index + m[0].length
        while (start > 0 && mathChars.test(text[start - 1]) && text.substring(start - 4, start) !== '@@LP') start--
        while (end < text.length && mathChars.test(text[end]) && text.substring(end, end + 3) !== '@@') end++
        let merged = false
        for (let i = ranges.length - 1; i >= 0; i--) {
          const r = ranges[i]
          if (start <= r.end && end >= r.start) {
            r.start = Math.min(r.start, start)
            r.end = Math.max(r.end, end)
            merged = true
            break
          }
        }
        if (!merged) ranges.push({ start, end })
      }

      if (ranges.length > 0) {
        ranges.sort((a, b) => a.start - b.start)
        let rst = ''
        let pos = 0
        for (const r of ranges) {
          if (r.start > pos) rst += text.substring(pos, r.start)
          const fragment = text.substring(r.start, r.end).trim()
          if (fragment) rst += '$' + fragment + '$'
          pos = r.end
        }
        if (pos < text.length) rst += text.substring(pos)
        text = rst
      }

      text = text.replace(/@@TAG(\d+)@@/g, (m, idx) => tagPlaceholders[parseInt(idx)])
      text = text.replace(/@@LPH(\d+)@@/g, (m, idx) => '$$' + placeholders[parseInt(idx)] + '$$')
      return text
    }
  }
}
</script>

<style lang="less" scoped>
.embedded-problem {
  height: 100%;
  overflow: hidden;
}

.problem-content-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.problem-description-section {
  padding: 16px;
  background: white;
  border-bottom: 1px solid #e2e8f0;

  .problem-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;

    h1 {
      font-size: 1.2rem;
      font-weight: 600;
      color: #1e3a8a;
      margin: 0;
    }
  }

  #problem-content {
    word-break: break-word;
    overflow-wrap: break-word;
    min-width: 0;

    /deep/ pre {
      overflow-x: auto;
    }

    /deep/ img {
      max-width: 100%;
      height: auto;
    }

    /deep/ table {
      display: block;
      overflow-x: auto;
      max-width: 100%;
    }

    .title {
      font-size: 1.4rem;
      font-weight: 600;
      margin: 40px 0 16px 0;
      color: #1e3a8a;
      display: flex;
      align-items: center;
      gap: 8px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e2e8f0;

      &:first-child {
        margin-top: 0;
      }

      .copy {
        padding-left: 8px;
        color: #3b82f6;
        cursor: pointer;
        transition: color 0.2s;

        &:hover {
          color: #1e3a8a;
        }
      }
    }

    p.content {
      margin-left: 0;
      margin-right: 0;
      margin-bottom: 24px;
      font-size: 15px;
      line-height: 1.85;
      color: #334155;
    }

    .sample {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 20px;
      margin-bottom: 28px;
      width: 100%;

      &-input, &-output {
        display: flex;
        flex-direction: column;
        min-width: 0;

        .title {
          font-size: 1rem;
          margin-bottom: 10px;
          margin-top: 0;
          color: #1e3a8a;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
      }

      pre {
        margin: 0;
        background: #f8fafc;
        border: 2px solid #e2e8f0;
        border-radius: 10px;
        padding: 16px;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        line-height: 1.6;
        max-height: 180px;
        overflow: auto;
        white-space: pre-wrap;
        word-break: break-word;
        color: #334155;
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);

        &::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        &::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }

        &::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;

          &:hover {
            background: #94a3b8;
          }
        }
      }
    }
  }

  .problem-info-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;

    .info-item {
      font-size: 13px;
      color: #475569;
      padding: 2px 0;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;

      b {
        color: #1e3a8a;
        font-weight: 600;
      }
    }
  }
}

.code-editor-section {
  padding: 16px;
  background: #f8fafc;

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
      background: #19be6b;
      color: #fff;
    }

    .self-test-tag-error {
      background: #ed4014;
      color: #fff;
    }
  }

  .submit-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;

    .self-test-btn {
      margin-left: 8px;
    }

    .status {
      span {
        margin-right: 8px;
      }
    }

    .submit-btn {
      min-width: 120px;
    }
  }
}
</style>
