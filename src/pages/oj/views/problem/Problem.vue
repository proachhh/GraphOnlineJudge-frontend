<template>
  <div class="problem-page-root">
    <div v-if="contestID" class="contest-problem-sidebar full-width-mode">
    <div class="sidebar-header">
      <Icon type="ios-photos" size="16" />
      <span>题目列表</span>
      <span class="sidebar-count">{{ contestProblems.length }}</span>
    </div>
    <div class="sidebar-list">
      <div
        v-for="p in contestProblems"
        :key="p._id"
        class="sidebar-item"
        :class="{ active: p._id === problemID }"
        @click="switchContestProblem(p)"
      >
        <span class="sidebar-pid">{{ p._id }}</span>
        <span class="sidebar-ptitle" :title="cleanTitle(p.title)">{{ cleanTitle(p.title) }}</span>
      </div>
    </div>
    <div class="sidebar-footer">
      <router-link :to="{ name: 'contest-details', params: { contestID: contestID } }">
        <Icon type="ios-arrow-back" />
        <span>返回题目列表</span>
      </router-link>
    </div>
  </div>
  <div class="flex-container full-width-layout" :class="{ 'contest-mode': contestID }">
    <div id="problem-main">
      <!-- 顶部工具行 -->
      <div class="layout-toggle-row">
        <div class="toggle-left">
          <el-button icon="el-icon-arrow-left" size="small" plain @click="$router.back()">返回</el-button>
        </div>
      </div>

      <!-- 2×2 四卡片网格：左上题目描述 / 右上信息+编辑器 / 左下智能提示 / 右下自测 -->
      <div class="quad-grid" ref="quadGrid" :style="gridStyle">
        <div class="q-col q-col-left">
          <Panel class="q-card q-tl" :padding="40" shadow :style="{height: leftTopHeight + '%'}">
            <template #title><div class="problem-title-header">
              <span class="problem-title-id">#{{problem._id}}.</span>
              <span class="problem-title-text">{{problem.title}}</span>
            </div></template>
            <div id="problem-content" class="markdown-body">
              <p class="title">{{$t('m.Description')}}</p>
              <p class="content" v-html=problem.description></p>
              <p class="title">{{$t('m.Input')}} <span v-if="problem.io_mode.io_mode=='File IO'">({{$t('m.FromFile')}}: {{ problem.io_mode.input }})</span></p>
              <p class="content" v-if="problem.input_description" v-html=problem.input_description></p>
              <p class="content placeholder" v-else>{{$t('m.None')}}</p>
              <p class="title">{{$t('m.Output')}} <span v-if="problem.io_mode.io_mode=='File IO'">({{$t('m.ToFile')}}: {{ problem.io_mode.output }})</span></p>
              <p class="content" v-if="problem.output_description" v-html=problem.output_description></p>
              <p class="content placeholder" v-else>{{$t('m.None')}}</p>

              <div v-if="problem.samples && problem.samples.length">
                <div v-for="(sample, index) of problem.samples" :key="index">
                <div class="sample">
                  <div class="sample-input">
                    <p class="title">{{$t('m.Sample_Input')}} {{index + 1}}
                      <a class="copy"
                         v-clipboard:copy="sample.input"
                         v-clipboard:success="onCopy"
                         v-clipboard:error="onCopyError">
                        <Icon type="ios-clipboard"></Icon>
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
              </div>

              <div v-if="problem.hint">
                <p class="title">{{$t('m.Hint')}}</p>
                <Card dis-hover>
                  <div class="content" v-html=problem.hint></div>
                </Card>
              </div>

              <div v-if="problem.source">
                <p class="title">{{$t('m.Source')}}</p>
                <p class="content">{{problem.source}}</p>
              </div>

            </div>
          </Panel>

          <div class="q-splitter q-splitter-h" @mousedown="startRowResize('left', $event)"></div>

          <AICard
            class="q-card q-bl"
            title="智能解题提示"
            icon="ios-bulb"
            iconColor="#ff9900"
            btnText="获取提示"
            btnType="warning"
            :fetchFn="fetchHint"
            :streamFn="fetchHintStream"
          />
        </div>

        <div class="q-splitter q-splitter-v" @mousedown="startColResize($event)"></div>

        <div class="q-col q-col-right">
          <Card class="q-card q-tr" :padding="20" id="submit-code" dis-hover :style="{height: rightTopHeight + '%'}">
            <!-- 题目元信息 -->
            <div class="q-meta-grid">
              <span class="q-meta-item"><b>ID</b>{{ problem._id || '—' }}</span>
              <span class="q-meta-item"><b>{{$t('m.Time_Limit')}}</b>{{ problem.time_limit || '—' }}MS</span>
              <span class="q-meta-item"><b>{{$t('m.Memory_Limit')}}</b>{{ problem.memory_limit || '—' }}MB</span>
              <span class="q-meta-item"><b>{{$t('m.IOMode')}}</b>{{ (problem.io_mode && problem.io_mode.io_mode) || '—' }}</span>
              <span class="q-meta-item"><b>{{$t('m.Created')}}</b>{{ problem.created_by && problem.created_by.username || '—' }}</span>
              <span v-if="problem.difficulty" class="q-meta-item"><b>{{$t('m.Level')}}</b>{{$t('m.' + problem.difficulty)}}</span>
              <span v-if="problem.total_score" class="q-meta-item"><b>{{$t('m.Score')}}</b>{{problem.total_score}}</span>
              <span class="q-meta-item q-meta-tags"><b>{{$t('m.Tags')}}</b>
                <Tag v-for="tag in problem.tags" :key="tag" size="small">{{ tagDisplayName(tag) }}</Tag>
              </span>
            </div>
        <CodeMirror ref="codeMirror" :value.sync="code"
                    :languages="problem.languages"
                    :language="language"
                    :theme="theme"
                    @resetCode="onResetToTemplate"
                    @changeTheme="onChangeTheme"
                    @changeLang="onChangeLang"></CodeMirror>

        <div class="submit-row">
          <div class="submit-row-left">
            <Button type="primary" icon="ios-create" :loading="submitting" @click="submitCode"
                    :disabled="problemSubmitDisabled || submitted">
              <span v-if="submitting">{{$t('m.Submitting')}}</span>
              <span v-else>{{$t('m.Submit')}}</span>
            </Button>
            <Button type="info" @click="goVisualizer" title="逐步可视化代码执行过程">
              <Icon type="ios-code-working"></Icon>
              可视化执行
            </Button>
            <Button type="success" v-if="submissionId" @click="goCodeReview" title="AI 分析代码质量">
              <Icon type="ios-pulse"></Icon>
              AI 审查
            </Button>

            <template v-if="captchaRequired">
              <Tooltip content="Click to refresh" placement="top">
                <img :src="captchaSrc" @click="getCaptchaSrc" class="captcha-img"/>
              </Tooltip>
              <Input v-model="captchaCode" class="captcha-code-inline"/>
            </template>
          </div>
        </div>

        <div class="status" v-if="statusVisible">
          <template v-if="!this.contestID || (this.contestID && OIContestRealTimePermission)">
            <span>{{$t('m.Status')}}</span>
            <Tag type="dot" :color="submissionStatus.color" @click.native="handleRoute('/status/'+submissionId)">
              {{$t('m.' + submissionStatus.text.replace(/ /g, "_"))}}
            </Tag>
            <Button type="success" size="small" @click="goCodeReview" style="margin-left: 8px;">
              <Icon type="ios-pulse"></Icon>
              AI 审查代码
            </Button>
          </template>
          <template v-else-if="this.contestID && !OIContestRealTimePermission">
            <span class="status-text">{{$t('m.Submitted_successfully')}}</span>
          </template>
        </div>

        <div class="alert-row">
          <Alert v-if="problem.my_status === 0 && !statusVisible" type="success" show-icon>
            {{$t('m.You_have_solved_the_problem')}}
          </Alert>
          <Alert v-if="contestID && !OIContestRealTimePermission && submissionExists && !statusVisible"
                 type="success" show-icon>
            {{$t('m.You_have_submitted_a_solution')}}
          </Alert>
          <Alert v-if="contestEnded" type="warning" show-icon>
            {{$t('m.Contest_has_ended')}}
          </Alert>
        </div>
      </Card>

          <div class="q-splitter q-splitter-h" @mousedown="startRowResize('right', $event)"></div>

          <Card class="q-card q-br" dis-hover :padding="20">
            <div class="self-test-section">
              <div class="self-test-head">
                <p class="self-test-label">{{$t('m.Self_Test')}}</p>
                <Button type="primary" :loading="selfTesting" @click="runSelfTest">
                  {{$t('m.Self_Test')}}
                </Button>
              </div>
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
          </Card>
        </div>
      </div>
    </div>

  </div>
  <div v-if="resultVisible" class="result-overlay" @click.self="resultVisible = false">
    <div class="result-modal">
      <div class="result-close" @click="resultVisible = false">
        <Icon type="ios-close" size="24" />
      </div>

      <table class="result-meta-table">
        <tr><td class="meta-label">{{$t('m.Problem')}}</td><td class="meta-value">{{ problem._id }} {{ problem.title }}</td></tr>
        <tr><td class="meta-label">{{$t('m.Submit_Time')}}</td><td class="meta-value">{{ submissionDetail.create_time | localtime }}</td></tr>
        <tr><td class="meta-label">{{$t('m.Language')}}</td><td class="meta-value">{{ submissionDetail.language }}</td></tr>
        <tr><td class="meta-label">{{$t('m.Memory')}}</td><td class="meta-value">{{ (submissionDetail.statistic_info.memory_cost || 0) / 1024 }} / {{ problem.memory_limit * 1024 }} KB</td></tr>
        <tr><td class="meta-label">{{$t('m.Time')}}</td><td class="meta-value">{{ submissionDetail.statistic_info.time_cost || 0 }} / {{ problem.time_limit }} ms</td></tr>
        <tr><td class="meta-label">{{$t('m.Status')}}</td><td class="meta-value result-status" :class="resultHeaderClass">{{ resultTitle }}</td></tr>
        <tr v-if="submissionDetail.statistic_info.score !== undefined"><td class="meta-label">{{$t('m.Score')}}</td><td class="meta-value">{{ submissionDetail.statistic_info.score }} / {{ problem.total_score }}</td></tr>
      </table>

      <div v-if="compileError" class="compile-error-section">
        <h4>{{$t('m.Compile_Error')}}</h4>
        <pre>{{ submissionDetail.statistic_info.err_info }}</pre>
      </div>

      <div v-else class="testcases-table-wrap">
        <h4 class="testcases-title">{{$t('m.Test_Case_Details')}}</h4>
        <table class="testcases-table">
          <thead>
            <tr>
              <th>{{$t('m.Test_Case')}}</th>
              <th>{{$t('m.Memory')}}(KB)</th>
              <th>{{$t('m.Time')}}(ms)</th>
              <th>{{$t('m.Result')}}</th>
              <th v-if="isOIProblem">{{$t('m.Score')}}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tc in testCases" :key="tc.test_case" :class="tcStatusClass(tc.result)">
              <td>{{ tc.test_case }}</td>
              <td>{{ tc.memory }}</td>
              <td>{{ tc.cpu_time }}</td>
              <td>{{ tcStatusText(tc.result) }}</td>
              <td v-if="isOIProblem">{{ tc.score || 0 }} / {{ getTestCaseScore(tc.test_case) }}</td>
            </tr>
          </tbody>
        </table>

        <div v-if="failedDetails.length" class="failed-details-section">
          <h4 class="failed-details-title">{{$t('m.Failed_Test_Cases')}}</h4>
          <div v-for="fd in failedDetails" :key="fd.test_case" class="failed-case">
            <p class="failed-case-header">
              <span class="tc-badge tc-badge-fail">{{$t('m.Test_Case')}} {{ fd.test_case }}</span>
            </p>
            <div class="failed-io">
              <div class="failed-io-block">
                <span class="io-label">{{$t('m.Self_Test_Input')}}</span>
                <pre>{{ fd.input }}</pre>
              </div>
              <div class="failed-io-block">
                <span class="io-label">{{$t('m.Expected_Output')}}</span>
                <pre>{{ fd.expected }}</pre>
              </div>
              <div class="failed-io-block">
                <span class="io-label">{{$t('m.Your_Output')}}</span>
                <pre>{{ fd.your_output }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

    <!-- 代码执行可视化弹窗 -->
    <CodeVizModal :visible.sync="vizModalVisible" :code="code" />
  </div>
</template>

<script>
import {mapGetters, mapActions} from 'vuex'
  import {types} from '../../../../store'
  import CodeMirror from '@oj/components/CodeMirror.vue'
  import AICard from '@oj/components/AICard.vue'
  import CodeVizModal from '@oj/views/code/CodeVizModal.vue'
  import storage from '@/utils/storage'
  import {FormMixin} from '@oj/components/mixins'
  import {JUDGE_STATUS, CONTEST_STATUS, buildProblemCodeKey} from '@/utils/constants'
  import api from '@oj/api'
  import { tagDisplayName } from '@/i18n'
  import katex from 'katex'

  export default {
    name: 'Problem',
    components: {
      CodeMirror,
      AICard,
      CodeVizModal
    },
    mixins: [FormMixin],
    data () {
      return {
        statusVisible: false,
        captchaRequired: false,
        submissionExists: false,
        leftWidth: 50,
        leftTopHeight: 83,
        rightTopHeight: 74,
        vizModalVisible: false,
        captchaCode: '',
        captchaSrc: '',
        contestID: '',
        problemID: '',
        submitting: false,
        selfTesting: false,
        selfTestInput: '',
        selfTestResult: null,
        resultVisible: false,
        submissionDetail: { statistic_info: {}, info: {} },
        code: '',
        language: 'C++',
        theme: 'solarized',
        submissionId: '',
        submitted: false,
        result: {
          result: 9
        },
        problem: {
          _id: '',
          title: '',
          description: '',
          input_description: '',
          output_description: '',
          hint: '',
          source: '',
          time_limit: '',
          memory_limit: '',
          difficulty: '',
          total_score: '',
          my_status: '',
          template: {},
          languages: [],
          created_by: {
            username: ''
          },
          tags: [],
          samples: [],
          statistic_info: {},
          io_mode: {'io_mode': 'Standard IO'}
        },
        contestProblems: []
      }
    },
    beforeRouteEnter (to, from, next) {
      let problemCode = storage.get(buildProblemCodeKey(to.params.problemID, to.params.contestID))
      if (problemCode) {
        next(vm => {
          vm.language = problemCode.language
          vm.code = problemCode.code
          vm.theme = problemCode.theme
        })
      } else {
        next()
      }
    },
    mounted () {
      this.$store.commit(types.CHANGE_CONTEST_ITEM_VISIBLE, {menu: false})
      this.init()
      this._resizeHandler = () => { this.fixLayoutHeights() }
      window.addEventListener('resize', this._resizeHandler)
    },
    methods: {
      ...mapActions(['changeDomTitle']),
      tagDisplayName,
      cleanTitle (title) {
        if (!title) return title
        // 去除「...」前缀（如「一本通 1.1 例 1」），只保留实际标题
        return title.replace(/^「[^」]*」\s*/, '')
      },
      fetchHint () {
        return api.getProblemHint({
          problem_id: this.problemID,
          message: `题目《${this.problem.title || ''}》(ID: ${this.problemID}) 怎么做？请给我解题提示。`
        })
      },
      fetchHintStream () {
        return {
          url: '/api/spark/problem-hint/stream/',
          body: { problem_id: this.problemID, hint_level: 1 }
        }
      },
      processMathContent (text) {
        if (!text) return text
        // 去除 \r 回车符，避免渲染时产生多余换行
        text = text.replace(/\r/g, '')
        // 合并连续的 <br> 标签
        text = text.replace(/(<br\s*\/?>\s*){3,}/g, '<br><br>')
        const placeholders = []
        text = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, inner) => {
          placeholders.push(inner)
          return '@@LPH' + (placeholders.length - 1) + '@@'
        })
        text = text.replace(/\\\[([\s\S]*?)\\\]/g, (m, g1) => '$$' + g1 + '$$')
        text = text.replace(/\\\(([\s\S]*?)\\\)/g, (m, g1) => '$' + g1 + '$')
        text = text.replace(/(^|[^$@])\$(?!\$)([^$\n]+?)\$(?!\$|$|[0-9])/g, (m, g1, g2) => g1 + '$' + g2 + '$')

        // 提取已有 $$...$$ 和 $...$ 公式到占位符，防止 ranges 逻辑重复包裹导致 $$ 块级渲染
        const mathDelimPlaceholders = []
        text = text.replace(/\$\$([\s\S]*?)\$\$/g, (match) => {
          mathDelimPlaceholders.push(match)
          return '@@MDP' + (mathDelimPlaceholders.length - 1) + '@@'
        })
        text = text.replace(/\$(?!\$)([^$\n]+?)\$(?!\$)/g, (match) => {
          mathDelimPlaceholders.push(match)
          return '@@MDP' + (mathDelimPlaceholders.length - 1) + '@@'
        })

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
        text = text.replace(/@@MDP(\d+)@@/g, (m, idx) => mathDelimPlaceholders[parseInt(idx)])
        text = text.replace(/@@LPH(\d+)@@/g, (m, idx) => '$$' + placeholders[parseInt(idx)] + '$$')
        // Vue3 迁移: 在字符串层直接渲染 katex(替代 DOM 后处理 auto-render),
        // 避免挂载后替换 DOM 节点破坏 Vue3 patchBlockChildren 的 container/anchor 推导导致 insertBefore null 崩溃
        const renderMath = (tex, displayMode) => {
          try {
            return katex.renderToString(tex, { displayMode, throwOnError: false })
          } catch (e) {
            return null
          }
        }
        text = text.replace(/\$\$([\s\S]*?)\$\$/g, (m, inner) => renderMath(inner, true) || m)
        text = text.replace(/\$(?!\$)([^$\n]+?)\$(?!\$)/g, (m, inner) => renderMath(inner, false) || m)
        return text
      },
      init () {
        this.$Loading.start()
        this.contestID = this.$route.params.contestID
        this.problemID = this.$route.params.problemID
        if (this.contestID) {
          this.loadContestProblems()
        }
        let func = this.$route.name === 'problem-details' ? 'getProblem' : 'getContestProblem'
        api[func](this.problemID, this.contestID).then(res => {
          this.$Loading.finish()
          let problem = res.data.data
          // 先在字符串层完成 katex 渲染再赋值, v-html 直接得到最终数学公式 HTML
          problem.description = this.processMathContent(problem.description)
          problem.input_description = this.processMathContent(problem.input_description)
          problem.output_description = this.processMathContent(problem.output_description)
          problem.hint = this.processMathContent(problem.hint)
          this.problem = problem
          this.changeDomTitle({title: problem.title})
          api.submissionExists(problem.id).then(res => {
            this.submissionExists = res.data.data
          })
          if (problem.languages) {
            problem.languages = problem.languages.sort()
          }

          if (problem.samples && problem.samples.length > 0) {
            this.selfTestInput = problem.samples[0].input
          }

          // 在beforeRouteEnter中修改了, 说明本地有code，无需加载template
          if (this.code !== '') {
            return
          }
          // try to load problem template
          if (this.problem.languages && this.problem.languages.length > 0) {
            this.language = this.problem.languages[0]
          }
          let template = this.problem.template
          if (template && template[this.language]) {
            this.code = template[this.language]
          }
        }, () => {
          this.$Loading.error()
        })
      },
      loadContestProblems () {
        api.getContestProblemList(this.contestID).then(res => {
          const list = res.data.data || []
          list.sort((a, b) => {
            const na = parseInt(a._id), nb = parseInt(b._id)
            if (!isNaN(na) && !isNaN(nb)) return na - nb
            return String(a._id || '').localeCompare(String(b._id || ''))
          })
          this.contestProblems = list
        }).catch(() => {})
      },
      switchContestProblem (problem) {
        this.$router.push({
          name: 'contest-problem-details',
          params: {
            contestID: this.contestID,
            problemID: problem._id
          }
        })
      },
      handleRoute (route) {
        this.$router.push(route)
      },
      goVisualizer () {
        if (!this.code || !this.code.trim()) {
          this.$Message.warning('请先输入代码')
          return
        }
        if (this.language !== 'Python3' && this.language !== 'Python2' && this.language !== 'python') {
          this.$Message.info('可视化执行当前仅支持 Python，可切换语言后重试')
        }
        this.vizModalVisible = true
      },
      goCodeReview () {
        if (!this.submissionId) {
          this.$Message.warning('请先提交代码')
          return
        }
        this.$router.push('/code-review?submission_id=' + this.submissionId)
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
          content: this.$i18n.t('m.Are_you_sure_you_want_to_reset_your_code'),
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
      checkSubmissionStatus () {
        // 使用setTimeout避免一些问题
        if (this.refreshStatus) {
          // 如果之前的提交状态检查还没有停止,则停止,否则将会失去timeout的引用造成无限请求
          clearTimeout(this.refreshStatus)
        }
        const checkStatus = () => {
          let id = this.submissionId
          api.getSubmission(id).then(res => {
            this.result = res.data.data
            this.submissionDetail = res.data.data
            if (Object.keys(res.data.data.statistic_info).length !== 0) {
              this.submitting = false
              this.submitted = false
              this.resultVisible = true
              clearTimeout(this.refreshStatus)
              this.init()
            } else {
              this.refreshStatus = setTimeout(checkStatus, 2000)
            }
          }, res => {
            this.submitting = false
            clearTimeout(this.refreshStatus)
          })
        }
        this.refreshStatus = setTimeout(checkStatus, 2000)
      },
      submitCode () {
        if (this.code.trim() === '') {
          this.$error(this.$i18n.t('m.Code_can_not_be_empty'))
          return
        }
        this.submissionId = ''
        this.result = {result: 9}
        this.submitting = true
        let data = {
          problem_id: this.problem.id,
          language: this.language,
          code: this.code,
          contest_id: this.contestID
        }
        if (this.captchaRequired) {
          data.captcha = this.captchaCode
        }
        const submitFunc = (data, detailsVisible) => {
          this.statusVisible = true
          api.submitCode(data).then(res => {
            this.submissionId = res.data.data && res.data.data.submission_id
            // 定时检查状态
            this.submitting = false
            this.submissionExists = true
            if (!detailsVisible) {
              this.$Modal.success({
                title: this.$i18n.t('m.Success'),
                content: this.$i18n.t('m.Submit_code_successfully')
              })
              return
            }
            this.submitted = true
            this.checkSubmissionStatus()
          }, res => {
            this.getCaptchaSrc()
            if (res.data.data.startsWith('Captcha is required')) {
              this.captchaRequired = true
            }
            this.submitting = false
            this.statusVisible = false
          })
        }

        if (this.contestRuleType === 'OI' && !this.OIContestRealTimePermission) {
          if (this.submissionExists) {
            this.$Modal.confirm({
              title: '',
              content: '<h3>' + this.$i18n.t('m.You_have_submission_in_this_problem_sure_to_cover_it') + '<h3>',
              onOk: () => {
                // 暂时解决对话框与后面提示对话框冲突的问题(否则一闪而过）
                setTimeout(() => {
                  submitFunc(data, false)
                }, 1000)
              },
              onCancel: () => {
                this.submitting = false
              }
            })
          } else {
            submitFunc(data, false)
          }
        } else {
          submitFunc(data, true)
        }
      },
      onCopy (event) {
        this.$success('Code copied')
      },
      onCopyError (e) {
        this.$error('Failed to copy code')
      },
      runSelfTest () {
        if (this.code.trim() === '') {
          this.$error(this.$i18n.t('m.Code_can_not_be_empty'))
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
      startColResize (e) {
        this.beginGridResize('col', e)
      },
      startRowResize (side, e) {
        this.beginGridResize(side === 'left' ? 'rowLeft' : 'rowRight', e)
      },
      beginGridResize (dir, e) {
        const splitter = e.target
        const container = dir === 'col' ? this.$refs.quadGrid : splitter.parentElement
        if (!container) return
        this._resizeDir = dir
        this._resizeRect = container.getBoundingClientRect()
        // 拖拽过程中直接操作 DOM，绕过 Vue 重渲染（大模板每帧重 patch 是卡顿主因）
        this._resizeCardEl = dir === 'col' ? null : splitter.previousElementSibling
        this._dragVal = null
        window.addEventListener('mousemove', this.onGridResize)
        window.addEventListener('mouseup', this.endGridResize)
        document.body.style.cursor = dir === 'col' ? 'col-resize' : 'row-resize'
        document.body.style.userSelect = 'none'
        e.preventDefault()
      },
      onGridResize (e) {
        // rAF 合并高频 mousemove
        this._moveEvent = e
        if (this._resizeRAF) return
        this._resizeRAF = requestAnimationFrame(() => {
          this._resizeRAF = null
          const ev = this._moveEvent
          if (!ev || !this._resizeDir || !this._resizeRect) return
          const rect = this._resizeRect
          if (this._resizeDir === 'col') {
            // 减去分割条宽度一半，让边界精准跟随鼠标、无跳变
            const w = Math.min(Math.max(((ev.clientX - rect.left - 5) / rect.width) * 100, 30), 70)
            this._dragVal = w
            if (this.$refs.quadGrid) this.$refs.quadGrid.style.gridTemplateColumns = `${w}% 10px 1fr`
          } else {
            const h = Math.min(Math.max(((ev.clientY - rect.top - 5) / rect.height) * 100, 15), 85)
            this._dragVal = h
            if (this._resizeCardEl) this._resizeCardEl.style.height = h + '%'
          }
        })
      },
      endGridResize () {
        // 拖拽结束才把结果写回响应式数据（与 DOM 当前值一致，无跳变、仅一次渲染）
        if (this._dragVal != null) {
          if (this._resizeDir === 'col') {
            this.leftWidth = this._dragVal
          } else if (this._resizeDir === 'rowLeft') {
            this.leftTopHeight = this._dragVal
          } else if (this._resizeDir === 'rowRight') {
            this.rightTopHeight = this._dragVal
          }
        }
        this._resizeDir = null
        this._dragVal = null
        this._resizeCardEl = null
        if (this._resizeRAF) {
          cancelAnimationFrame(this._resizeRAF)
          this._resizeRAF = null
        }
        window.removeEventListener('mousemove', this.onGridResize)
        window.removeEventListener('mouseup', this.endGridResize)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        // 拖拽结束后再刷新一次编辑器尺寸
        this.fixLayoutHeights()
      },
      fixLayoutHeights () {
        if (this.$refs.codeMirror && this.$refs.codeMirror.editor) {
          this.$refs.codeMirror.editor.refresh()
        }
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
      getTestCaseScore (testCaseIndex) {
        if (this.problem.test_case_score && this.problem.test_case_score.length) {
          const item = this.problem.test_case_score.find(
            s => String(s.input_name) === String(testCaseIndex) + '.in' ||
                 String(s.output_name) === String(testCaseIndex) + '.out'
          )
          if (item && item.score) return item.score
        }
        return 0
      }
    },
    computed: {
      ...mapGetters(['problemSubmitDisabled', 'contestRuleType', 'OIContestRealTimePermission', 'contestStatus']),
      contest () {
        return this.$store.state.contest.contest
      },
      contestEnded () {
        return this.contestStatus === CONTEST_STATUS.ENDED
      },
      submissionStatus () {
        return {
          text: JUDGE_STATUS[this.result.result]['name'],
          color: JUDGE_STATUS[this.result.result]['color']
        }
      },
      submissionRoute () {
        if (this.contestID) {
          return {name: 'contest-submission-list', query: {problemID: this.problemID}}
        } else {
          return {name: 'submission-list', query: {problemID: this.problemID}}
        }
      },
      gridStyle () {
        return {
          gridTemplateColumns: `${this.leftWidth}% 10px 1fr`
        }
      },
      resultHeaderClass () {
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
      },
      isOIProblem () {
        return this.problem.rule_type === 'OI'
      }
    },
    beforeRouteLeave (to, from, next) {
      // 防止切换组件后仍然不断请求
      clearInterval(this.refreshStatus)

      this.$store.commit(types.CHANGE_CONTEST_ITEM_VISIBLE, {menu: true})
      storage.set(buildProblemCodeKey(this.problem._id, from.params.contestID), {
        code: this.code,
        language: this.language,
        theme: this.theme
      })
      next()
    },
    beforeUnmount () {
      window.removeEventListener('mousemove', this.onGridResize)
      window.removeEventListener('mouseup', this.endGridResize)
      window.removeEventListener('resize', this._resizeHandler)
      if (this._resizeRAF) {
        cancelAnimationFrame(this._resizeRAF)
        this._resizeRAF = null
      }
    },
    watch: {
      '$route' () {
        this.init()
      }
    },
    updated () {
      // 拖拽分割条期间跳过，避免每次 mousemove 都触发编辑器 refresh 造成卡顿
      if (this._resizeDir) return
      this.fixLayoutHeights()
    }
  }
</script>

<style lang="less" scoped>
  .card-title {
    margin-left: 8px;
  }

  .flex-container {
    display: flex;
    width: 100%;
    background: #f5f7fa;

    &.full-width-layout {
      max-width: none;
      width: 100%;
      padding: 0;
      background: #f5f7fa;
      margin: 0;
      position: fixed;
      top: 56px;
      left: 0;
      right: 0;
      bottom: 30px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      z-index: 20;

      #problem-main {
        margin-right: 0;
        flex: 1 1 0%;
        min-width: 0;
        min-height: 0;
        width: 100%;
        display: flex;
        flex-direction: column;
        /* 卡片与屏幕左右、底部边缘等宽小间隙 */
        padding: 0 10px 10px;

        .layout-toggle-row {
          flex-shrink: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
        }

        .quad-grid {
          flex: 1 1 0%;
          min-height: 0;
          width: 100%;
        }
      }
    }

    &.contest-mode {
      #problem-main {
        padding-left: 210px;
      }
    }
  }

  .problem-title-header {
    display: flex;
    align-items: baseline;
    gap: 10px;

    .problem-title-id {
      font-size: 2rem;
      font-weight: 700;
      font-family: inherit;
      color: #1e3a8a;
    }

    .problem-title-text {
      font-size: 2rem;
      font-weight: 700;
      font-family: inherit;
      color: #111827;
    }
  }

  #problem-content {
    padding: 24px;
    word-break: break-word;
    overflow-wrap: break-word;
    min-width: 0;

    :deep(pre){
      overflow-x: auto;
    }

    :deep(img){
      max-width: 100%;
      height: auto;
    }

    :deep(table){
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

      @media (max-width: 640px) {
        grid-template-columns: 1fr;
      }

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
        font-size: 14px;
        line-height: 1.7;
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
</style>

<style lang="less">
  .contest-problem-sidebar {
    position: fixed;
    left: 0;
    top: 56px;
    bottom: 0;
    width: 200px;
    z-index: 99;
    background: #fff;
    border-right: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    &.full-width-mode {
      width: 200px;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 14px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 14px;
      font-weight: 600;
      color: #1e3a8a;
      flex-shrink: 0;
      background: #fff;

      .sidebar-count {
        margin-left: auto;
        font-size: 12px;
        color: #94a3b8;
        background: #f1f5f9;
        padding: 2px 8px;
        border-radius: 10px;
      }
    }

    .sidebar-list {
      flex: 1;
      overflow-y: auto;
      padding: 6px 0;

      .sidebar-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px;
        cursor: pointer;
        transition: all 0.15s;
        font-size: 13px;
        border-left: 3px solid transparent;

        &:hover {
          background: #f0f9ff;
        }

        &.active {
          background: #e8f0fe;
          border-left-color: #1e3a8a;
          font-weight: 600;
        }

        .sidebar-pid {
          color: #94a3b8;
          font-size: 12px;
          font-weight: 600;
          min-width: 26px;
          flex-shrink: 0;
        }

        &.active .sidebar-pid {
          color: #1e3a8a;
        }

        .sidebar-ptitle {
          color: #334155;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        &.active .sidebar-ptitle {
          color: #1e3a8a;
        }
      }
    }

    .sidebar-footer {
      padding: 10px 14px;
      border-top: 1px solid #f1f5f9;
      flex-shrink: 0;
      font-size: 13px;
      background: #fff;

      a {
        color: #64748b;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: color 0.2s;

        &:hover {
          color: #1e3a8a;
        }
      }
    }
  }

  /* ============ 2×2 四卡片网格（左右两列，横分割条各列独立） ============ */
  .quad-grid {
    display: grid;

    /* 左右两列，列内为纵向 flex：上卡片（高度%由内联样式控制）+ 横条 + 下卡片 */
    .q-col {
      display: flex;
      flex-direction: column;
      min-width: 0;
      min-height: 0;
    }

    /* 分割条：默认与背景同色，悬停高亮，可拖拽调比例 */
    .q-splitter {
      background: transparent;
      border-radius: 4px;
      transition: background 0.15s;
      z-index: 5;

      &:hover {
        background: rgba(30, 58, 138, 0.18);
      }
    }

    .q-splitter-v { cursor: col-resize; }
    .q-splitter-h {
      cursor: row-resize;
      height: 10px;
      width: 100%;
      flex-shrink: 0;
    }

    /* 卡片通用：小圆角矩形 */
    .q-card {
      min-width: 0;
      min-height: 0;
      /* ivu-card 全局有 transition: all .2s ease-in-out，会让拖拽调高度呈缓动动画（慢启动再加速），必须关掉 */
      transition: none !important;
    }

    .q-card.ivu-card {
      border-radius: 8px !important;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(15, 23, 42, 0.07);
    }

    /* 左上：题目描述卡片（高度由列内联样式 % 控制） */
    .q-tl.ivu-card {
      display: flex;
      flex-direction: column;
      flex-shrink: 0;

      > .ivu-card-body {
        flex: 1 1 0;
        min-height: 0;
        overflow-y: auto;
      }
    }

    /* 右上：元信息 + 编辑器卡片（高度由列内联样式 % 控制） */
    .q-tr.ivu-card {
      display: flex;
      flex-direction: column;
      flex-shrink: 0;

      > .ivu-card-body {
        flex: 1 1 0;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .q-meta-grid {
        flex-shrink: 0;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px 22px;
        padding-bottom: 10px;
        margin-bottom: 12px;
        border-bottom: 1px solid #e8edf3;

        .q-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: #475569;
          flex-wrap: wrap;

          b {
            color: #1e3a8a;
            font-weight: 600;
          }
        }
      }

      /* 编辑器撑满剩余高度 */
      .cm-outer {
        flex: 1 1 0;
        min-height: 0;
        display: flex;
        flex-direction: column;
        margin: 0 0 12px 0;
      }

      .cm-outer .codemirror-editor {
        flex: 1 1 0;
        min-height: 0;
      }

      .cm-outer .CodeMirror {
        height: 100% !important;
      }

      .cm-outer .CodeMirror-scroll {
        min-height: 0 !important;
        max-height: none !important;
      }

      .submit-row,
      .status,
      .alert-row {
        flex-shrink: 0;
      }
    }

    /* 左下：智能解题提示卡片（撑满列剩余高度） */
    .ai-response-card {
      margin: 0 !important;
      border-radius: 8px !important;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      flex: 1 1 0;
      box-shadow: 0 2px 10px rgba(15, 23, 42, 0.07);

      > .ivu-card-body {
        flex: 1 1 0;
        min-height: 0;
        overflow-y: auto;
      }
    }

    /* 右下：自测卡片（撑满列剩余高度） */
    .q-br.ivu-card {
      display: flex;
      flex-direction: column;
      flex: 1 1 0;

      > .ivu-card-body {
        flex: 1 1 0;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
      }

      .self-test-section {
        flex: 1 1 0;
        min-height: 0;
        display: flex;
        flex-direction: column;
        margin: 0;

        .self-test-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;

          .self-test-label {
            margin-bottom: 0;
          }
        }

        .self-test-row {
          flex: 1 1 0;
          min-height: 0;
        }

        .self-test-left,
        .self-test-right {
          flex: 1 1 0;
          min-height: 0;
        }

        .self-test-textarea,
        .self-test-pre {
          flex: 1 1 0;
          min-height: 0;
          height: auto;
          max-height: none;
          resize: none;
        }
      }
    }
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

    .self-test-output-box {
      flex: 1;
      display: flex;
      flex-direction: column;
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

  .submit-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;

    .submit-row-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .submit-row-right {
      display: flex;
      align-items: center;
    }

    .captcha-img {
      height: 32px;
      cursor: pointer;
    }

    .captcha-code-inline {
      width: 100px;
    }

    .status-text {
      font-size: 13px;
      color: #19be6b;
    }
  }

  .alert-row {
    margin-top: 8px;
  }

  .status {
    margin-top: 8px;
  }

  #submit-code.ivu-card {
    border-radius: 8px !important;
    overflow: hidden;
  }

  #submit-code .ivu-card-body {
    border-radius: 8px !important;
  }

  .fl-right {
    float: right;
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

    .meta-label {
      color: #999;
      width: 90px;
      vertical-align: top;
    }

    .meta-value {
      color: #333;
    }
  }

  .result-status {
    font-weight: 600;
    &.result-ac { color: #52c41a; }
    &.result-pa { color: #faad14; }
    &.result-fail { color: #ff4d4f; }
  }

  .compile-error-section {
    h4 { font-size: 14px; color: #ff4d4f; margin: 0 0 10px; }
    pre {
      background: #fff2f0;
      border: 1px solid #ffccc7;
      color: #333;
      padding: 12px;
      border-radius: 6px;
      font-size: 12px;
      max-height: 260px;
      overflow: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }
  }

  .testcases-table-wrap {
    .testcases-title {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      margin: 0 0 10px;
    }
  }

  .testcases-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;

    th {
      background: #fafafa;
      padding: 8px 10px;
      text-align: left;
      font-weight: 500;
      color: #666;
      border: 1px solid #f0f0f0;
    }

    td {
      padding: 7px 10px;
      border: 1px solid #f0f0f0;
      color: #333;
    }

    tr.tc-ac td {
      color: #52c41a;
    }

    tr.tc-fail td {
       color: #ff4d4f;
     }
   }

   .failed-details-section {
     margin-top: 20px;

     .failed-details-title {
       font-size: 14px;
       font-weight: 600;
       color: #ff4d4f;
       margin: 0 0 12px;
     }
   }

   .failed-case {
     margin-bottom: 16px;

     .failed-case-header {
       margin: 0 0 8px;
     }

     .tc-badge-fail {
       display: inline-block;
       background: #fff2f0;
       border: 1px solid #ffccc7;
       color: #ff4d4f;
       padding: 2px 10px;
       border-radius: 4px;
       font-size: 12px;
       font-weight: 500;
     }
   }

   .failed-io {
     display: grid;
     grid-template-columns: 1fr 1fr 1fr;
     gap: 10px;

     .failed-io-block {
       min-width: 0;

       .io-label {
         display: block;
         font-size: 11px;
         color: #999;
         margin-bottom: 4px;
       }

       pre {
         margin: 0;
         background: #fafafa;
         border: 1px solid #e8e8e8;
         border-radius: 4px;
         padding: 8px;
         font-size: 11px;
         line-height: 1.5;
         max-height: 140px;
         overflow: auto;
         white-space: pre-wrap;
         word-break: break-all;
         color: #333;
       }
     }
   }
</style>

<style lang="less">
/* 强制 full-width-layout 铺满全屏 */
.problem-page-root > .flex-container.full-width-layout {
  z-index: 30 !important;
}

/* 卡片内显示细滚动条 */
.problem-page-root ::-webkit-scrollbar,
.problem-page-root *::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.problem-page-root ::-webkit-scrollbar-thumb,
.problem-page-root *::-webkit-scrollbar-thumb {
  background: #c4ccd8;
  border-radius: 4px;
}

.problem-page-root ::-webkit-scrollbar-thumb:hover,
.problem-page-root *::-webkit-scrollbar-thumb:hover {
  background: #a9b4c6;
}

.problem-page-root ::-webkit-scrollbar-track,
.problem-page-root *::-webkit-scrollbar-track {
  background: transparent;
}

/* 题目页内容为全屏固定布局，禁用无用的页面级滚动条 */
html:has(.problem-page-root),
body:has(.problem-page-root) {
  overflow: hidden;
}
</style>

