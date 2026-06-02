<template>
  <div class="problem">
    <Panel :title="title">
      <el-form ref="form" :model="problem" :rules="rules" label-position="top" label-width="70px">
        <!-- AI 生成 + LOJ 导入按钮独立行 -->
        <el-row :gutter="20">
          <el-col :span="24">
            <el-button type="primary" icon="el-icon-magic-stick" @click="openAIGenerateDialog" style="margin-bottom: 20px;">
              智能生成题目
            </el-button>
            <el-button type="success" icon="el-icon-download" @click="openScrapeDialog" style="margin-bottom: 20px;">
              从链接导入
            </el-button>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item prop="_id" :label="$t('m.Display_ID')"
                          :required="this.routeName === 'create-contest-problem' || this.routeName === 'edit-contest-problem'">
              <el-input :placeholder="$t('m.Display_ID')" v-model="problem._id"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="18">
            <el-form-item prop="title" :label="$t('m.Title')" required>
              <el-input :placeholder="$t('m.Title')" v-model="problem.title"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item prop="description" :label="$t('m.Description')" required>
              <Simditor v-model="problem.description" ref="simDesc"></Simditor>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item prop="input_description" :label="$t('m.Input_Description')" required>
              <Simditor v-model="problem.input_description" ref="simInDesc"></Simditor>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item prop="output_description" :label="$t('m.Output_Description')" required>
              <Simditor v-model="problem.output_description" ref="simOutDesc"></Simditor>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item :label="$t('m.Time_Limit') + ' (ms)' " required>
              <el-input type="Number" :placeholder="$t('m.Time_Limit')" v-model="problem.time_limit"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('m.Memory_limit') + ' (MB)' " required>
              <el-input type="Number" :placeholder="$t('m.Memory_limit')" v-model="problem.memory_limit"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('m.Difficulty')">
              <el-select class="difficulty-select" size="small" :placeholder="$t('m.Difficulty')" v-model="problem.difficulty">
                <el-option :label="$t('m.Low')" value="Low"></el-option>
                <el-option :label="$t('m.Mid')" value="Mid"></el-option>
                <el-option :label="$t('m.High')" value="High"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="4">
            <el-form-item :label="$t('m.Visible')">
              <el-switch
                v-model="problem.visible"
                active-text=""
                inactive-text="">
              </el-switch>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item :label="$t('m.ShareSubmission')">
              <el-switch
                v-model="problem.share_submission"
                active-text=""
                inactive-text="">
              </el-switch>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('m.Tag')" :error="error.tags" required>
              <span class="tags">
                <el-tag
                  v-for="tag in problem.tags"
                  :closable="true"
                  :close-transition="false"
                  :key="tag"
                  type="success"
                  @close="closeTag(tag)"
                >{{tag}}</el-tag>
              </span>
              <el-autocomplete
                v-if="inputVisible"
                size="mini"
                class="input-new-tag"
                popper-class="problem-tag-poper"
                v-model="tagInput"
                :trigger-on-focus="false"
                @keyup.enter.native="addTag"
                @select="addTag"
                :fetch-suggestions="querySearch">
              </el-autocomplete>
              <el-button class="button-new-tag" v-else size="small" @click="inputVisible = true">+ {{$t('m.New_Tag')}}</el-button>
              <el-button class="button-match-tags" size="small" type="text" icon="el-icon-magic-stick" @click="matchTags" :loading="matchingTags">
                {{ $t('m.Smart_Match_Tag') || '智能匹配标签' }}
              </el-button>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('m.Languages')" :error="error.languages" required>
              <el-checkbox-group v-model="problem.languages">
                <el-tooltip class="spj-radio" v-for="lang in allLanguage.languages" :key="'spj'+lang.name" effect="dark"
                            :content="lang.description" placement="top-start">
                  <el-checkbox :label="lang.name"></el-checkbox>
                </el-tooltip>
              </el-checkbox-group>
            </el-form-item>
          </el-col>
        </el-row>

        <div>
          <el-form-item v-for="(sample, index) in problem.samples" :key="'sample'+index">
            <Accordion :title="'Sample' + (index + 1)">
              <el-button type="warning" size="small" icon="el-icon-delete" slot="header" @click="deleteSample(index)">
                Delete
              </el-button>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item :label="$t('m.Input_Samples')" required>
                    <el-input
                      :rows="5"
                      type="textarea"
                      :placeholder="$t('m.Input_Samples')"
                      v-model="sample.input">
                    </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item :label="$t('m.Output_Samples')" required>
                    <el-input
                      :rows="5"
                      type="textarea"
                      :placeholder="$t('m.Output_Samples')"
                      v-model="sample.output">
                    </el-input>
                  </el-form-item>
                </el-col>
              </el-row>
            </Accordion>
          </el-form-item>
        </div>

        <div class="add-sample-btn">
          <button type="button" class="add-samples" @click="addSample()"><i class="el-icon-plus"></i>{{$t('m.Add_Sample')}}
          </button>
        </div>

        <el-form-item style="margin-top: 20px" :label="$t('m.Hint')">
          <Simditor v-model="problem.hint" ref="simHint" placeholder=""></Simditor>
        </el-form-item>

        <el-form-item :label="$t('m.Code_Template')">
          <el-row>
            <el-col :span="24" v-for="(v, k) in template" :key="'template'+k">
              <el-form-item>
                <el-checkbox v-model="v.checked">{{ k }}</el-checkbox>
                <div v-if="v.checked">
                  <code-mirror v-model="v.code" :mode="v.mode"></code-mirror>
                </div>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form-item>

        <el-form-item :label="$t('m.Special_Judge')" :error="error.spj">
          <el-col :span="24">
            <el-checkbox v-model="problem.spj" @click.native.prevent="switchSpj()">{{$t('m.Use_Special_Judge')}}</el-checkbox>
          </el-col>
        </el-form-item>

        <el-form-item v-if="problem.spj">
          <Accordion :title="$t('m.Special_Judge_Code')">
            <template slot="header">
              <span>{{$t('m.SPJ_language')}}</span>
              <el-radio-group v-model="problem.spj_language">
                <el-tooltip class="spj-radio" v-for="lang in allLanguage.spj_languages" :key="lang.name" effect="dark"
                            :content="lang.description" placement="top-start">
                  <el-radio :label="lang.name">{{ lang.name }}</el-radio>
                </el-tooltip>
              </el-radio-group>
              <el-button type="primary" size="small" icon="el-icon-fa-random" @click="compileSPJ"
                         :loading="loadingCompile">
                {{$t('m.Compile')}}
              </el-button>
            </template>
            <code-mirror v-model="problem.spj_code" :mode="spjMode"></code-mirror>
          </Accordion>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="4">
            <el-form-item :label="$t('m.Type')">
              <el-radio-group v-model="problem.rule_type" :disabled="disableRuleType">
                <el-radio label="ACM">ACM</el-radio>
                <el-radio label="OI">OI</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item :label="$t('m.TestCase')" :error="error.testcase">
              <el-upload
                action="/api/admin/test_case"
                name="file"
                :data="{spj: problem.spj}"
                :show-file-list="true"
                :on-success="uploadSucceeded"
                :on-error="uploadFailed">
                <el-button size="small" type="primary" icon="el-icon-fa-upload">Choose File</el-button>
              </el-upload>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item :label="$t('m.IOMode')">
              <el-radio-group v-model="problem.io_mode.io_mode">
                <el-radio label="Standard IO">Standard IO</el-radio>
                <el-radio label="File IO">File IO</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>

          <el-col :span="4" v-if="problem.io_mode.io_mode == 'File IO'">
            <el-form-item :label="$t('m.InputFileName')" required>
              <el-input type="text" v-model="problem.io_mode.input"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="4" v-if="problem.io_mode.io_mode == 'File IO'">
            <el-form-item :label="$t('m.OutputFileName')" required>
              <el-input type="text" v-model="problem.io_mode.output"></el-input>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-table
              :data="problem.test_case_score"
              style="width: 100%">
              <el-table-column
                prop="input_name"
                :label="$t('m.Input')">
              </el-table-column>
              <el-table-column
                prop="output_name"
                :label="$t('m.Output')">
              </el-table-column>
              <el-table-column
                prop="score"
                :label="$t('m.Score')">
                <template slot-scope="scope">
                  <el-input
                    size="small"
                    :placeholder="$t('m.Score')"
                    v-model="scope.row.score"
                    :disabled="problem.rule_type !== 'OI'">
                  </el-input>
                </template>
              </el-table-column>
            </el-table>
          </el-col>
        </el-row>

        <el-collapse v-model="activePreview" v-if="testCasePreview && testCasePreview.length">
          <el-collapse-item :title="'测试点 ' + item.index" :name="item.index" v-for="item in testCasePreview" :key="item.index">
            <el-row :gutter="20">
              <el-col :span="12">
                <strong>输入 ({{ item.input_name }})：</strong>
                <pre>{{ item.input_preview }}</pre>
              </el-col>
              <el-col :span="12" v-if="item.output_name">
                <strong>输出 ({{ item.output_name }})：</strong>
                <pre>{{ item.output_preview }}</pre>
              </el-col>
            </el-row>
          </el-collapse-item>
        </el-collapse>

        <el-form-item :label="$t('m.Source')">
          <el-input :placeholder="$t('m.Source')" v-model="problem.source"></el-input>
        </el-form-item>

        <save @click.native="submit()">Save</save>
      </el-form>
    </Panel>

    <!-- 从 LOJ 链接导入对话框 -->
    <el-dialog title="从 LOJ 链接导入题目" :visible.sync="scrapeDialogVisible" width="580px" :close-on-click-modal="false" @close="resetScrapeDialog">
      <div v-if="!scrapeMode || scrapeMode === 'input'">
        <el-form label-width="80px">
          <el-form-item label="题目链接">
            <el-input v-model="scrapeUrl" placeholder="https://loj.ac/p/5" @keyup.enter.native="doScrape">
              <el-button slot="append" icon="el-icon-download" @click="doScrape" :loading="scrapeLoading">
                获取
              </el-button>
            </el-input>
          </el-form-item>
        </el-form>
        <div v-if="scrapeLoading" style="text-align:center;padding:20px;color:#909399;">
          <i class="el-icon-loading"></i> 正在从 LOJ 获取题目数据...
        </div>
        <div v-if="scrapeError" class="scrape-error-msg">
          <i class="el-icon-warning"></i> {{ scrapeError }}
        </div>
      </div>

      <div v-if="scrapeMode === 'manual'">
        <div class="scrape-info-row">
          <span class="scrape-label">在终端执行以下命令获取题目数据：</span>
        </div>
        <!-- Linux / Mac -->
        <div class="scrape-cmd-label">Linux / Mac：</div>
        <el-input :value="scrapeCurlCmd" type="textarea" :rows="2" readonly class="scrape-cmd-input" style="margin-bottom:8px;">
          <el-button slot="append" v-clipboard:copy="scrapeCurlCmd" v-clipboard:success="onCurlCopied" size="mini">复制</el-button>
        </el-input>
        <!-- Windows PowerShell -->
        <div class="scrape-cmd-label">Windows PowerShell：</div>
        <el-input :value="scrapePowershellCmd" type="textarea" :rows="2" readonly class="scrape-cmd-input" style="margin-bottom:8px;">
          <el-button slot="append" v-clipboard:copy="scrapePowershellCmd" v-clipboard:success="onCurlCopied" size="mini">复制</el-button>
        </el-input>
        <!-- 浏览器 Console -->
        <div class="scrape-cmd-label">浏览器 DevTools Console（推荐）：</div>
        <el-input :value="scrapeBrowserConsoleCmd" type="textarea" :rows="3" readonly class="scrape-cmd-input" style="margin-bottom:12px;">
          <el-button slot="append" v-clipboard:copy="scrapeBrowserConsoleCmd" v-clipboard:success="onBrowserCmdCopied" size="mini">复制</el-button>
        </el-input>

        <div class="scrape-info-row" style="margin-top:4px">
          <span class="scrape-label">API 地址：</span>
          <el-input :value="scrapeApiUrl" size="small" readonly>
            <el-button slot="append" v-clipboard:copy="scrapeApiUrl" v-clipboard:success="() => $message.success('已复制')" size="mini">复制</el-button>
          </el-input>
        </div>
        <div class="scrape-info-row">
          <span class="scrape-label">请求体：</span>
          <el-input :value="scrapeApiBodyStr" size="small" type="textarea" :rows="3" readonly>
            <el-button slot="append" v-clipboard:copy="scrapeApiBodyStr" v-clipboard:success="() => $message.success('已复制')" size="mini">复制</el-button>
          </el-input>
        </div>

        <div class="scrape-hint">
          <i class="el-icon-info"></i>
          在终端执行上方 cURL 命令，将返回的 JSON 粘贴到下方文本框中。
        </div>

        <el-form-item label="API JSON">
          <el-input v-model="scrapeRawJson" type="textarea" :rows="10"
            placeholder="将 LOJ API 返回的 JSON 粘贴到这里..."></el-input>
        </el-form-item>

        <div style="text-align: right; margin-top: 12px;">
          <el-button @click="scrapeMode = 'input'">返回</el-button>
          <el-button type="primary" @click="doParseAndFill" :loading="scrapeParsing" :disabled="!scrapeRawJson">
            解析并填入
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
  import Simditor from '../../components/Simditor'
  import Accordion from '../../components/Accordion'
  import CodeMirror from '../../components/CodeMirror'
  import api from '../../api'

  export default {
    name: 'Problem',
    components: {
      Simditor,
      Accordion,
      CodeMirror
    },
    data () {
      return {
        rules: {
          _id: {required: true, message: 'Display ID is required', trigger: 'blur'},
          title: {required: true, message: 'Title is required', trigger: 'blur'},
          input_description: {required: true, message: 'Input Description is required', trigger: 'blur'},
          output_description: {required: true, message: 'Output Description is required', trigger: 'blur'}
        },
        loadingCompile: false,
        mode: '',
        contest: {},
        problem: {
          languages: [],
          io_mode: {'io_mode': 'Standard IO', 'input': 'input.txt', 'output': 'output.txt'}
        },
        reProblem: {
          languages: [],
          io_mode: {'io_mode': 'Standard IO', 'input': 'input.txt', 'output': 'output.txt'}
        },
        testCaseUploaded: false,
        allLanguage: {},
        inputVisible: false,
        tagInput: '',
        matchingTags: false,
        // 从 LOJ 导入
        scrapeDialogVisible: false,
        scrapeMode: 'input',
        scrapeUrl: '',
        scrapeLoading: false,
        scrapeParsing: false,
        scrapeError: '',
        scrapeApiUrl: '',
        scrapeApiBodyStr: '',
        scrapeCurlCmd: '',
        scrapePowershellCmd: '',
        scrapeBrowserConsoleCmd: '',
        scrapeRawJson: '',
        template: {},
        title: '',
        spjMode: '',
        disableRuleType: false,
        routeName: '',
        error: {
          tags: '',
          spj: '',
          languages: '',
          testCase: ''
        },
        // 新增测试用例预览数据
        testCasePreview: [],   // 存储测试用例预览数据
        activePreview: []      // 存储展开的折叠面板项（可选）
      }
    },
    mounted () {
      this.routeName = this.$route.name
      if (this.routeName === 'edit-problem' || this.routeName === 'edit-contest-problem') {
        this.mode = 'edit'
      } else {
        this.mode = 'add'
      }
      api.getLanguages().then(res => {
        this.problem = this.reProblem = {
          _id: '',
          title: '',
          description: '',
          input_description: '',
          output_description: '',
          time_limit: 1000,
          memory_limit: 256,
          difficulty: 'Low',
          visible: true,
          share_submission: false,
          tags: [],
          languages: [],
          template: {},
          samples: [{input: '', output: ''}],
          spj: false,
          spj_language: '',
          spj_code: '',
          spj_compile_ok: false,
          test_case_id: '',
          test_case_score: [],
          rule_type: 'OI',
          hint: '',
          source: '',
          io_mode: {'io_mode': 'Standard IO', 'input': 'input.txt', 'output': 'output.txt'}
        }
        let contestID = this.$route.params.contestId
        if (contestID) {
          this.problem.contest_id = this.reProblem.contest_id = contestID
          this.disableRuleType = true
          api.getContest(contestID).then(res => {
            this.problem.rule_type = this.reProblem.rule_type = res.data.data.rule_type
            this.contest = res.data.data
          })
        }

        this.problem.spj_language = 'C'

        let allLanguage = res.data.data
        this.allLanguage = allLanguage

        // get problem after getting languages list to avoid find undefined value in `watch problem.languages`
        if (this.mode === 'edit') {
          this.title = this.$i18n.t('m.Edit_Problem')
          let funcName = {'edit-problem': 'getProblem', 'edit-contest-problem': 'getContestProblem'}[this.routeName]
          api[funcName](this.$route.params.problemId).then(problemRes => {
            let data = problemRes.data.data
            if (!data.spj_code) {
              data.spj_code = ''
            }
            data.spj_language = data.spj_language || 'C'
            this.problem = data
            this.testCaseUploaded = true
          })
        } else {
          this.title = this.$i18n.t('m.Add_Problem')
          for (let item of allLanguage.languages) {
            this.problem.languages.push(item.name)
          }
        }
      })
    },
    watch: {
      '$route' () {
        this.$refs.form.resetFields()
        this.problem = this.reProblem
      },
      'problem.languages' (newVal) {
        let data = {}
        // use deep copy to avoid infinite loop
        let languages = JSON.parse(JSON.stringify(newVal)).sort()
        for (let item of languages) {
          if (this.template[item] === undefined) {
            let langConfig = this.allLanguage.languages.find(lang => {
              return lang.name === item
            })
            if (this.problem.template[item] === undefined) {
              let code = langConfig.config.template
              if (item === 'C++') {
                code = '#include <iostream>\nusing namespace std;\n\nint main() {\n\n  return 0;\n}'
              }
              data[item] = {checked: item === 'C++', code: code, mode: langConfig.content_type}
            } else {
              data[item] = {checked: true, code: this.problem.template[item], mode: langConfig.content_type}
            }
          } else {
            data[item] = this.template[item]
          }
        }
        this.template = data
      },
      'problem.spj_language' (newVal) {
        this.spjMode = this.allLanguage.spj_languages.find(item => {
          return item.name === this.problem.spj_language
        }).content_type
      }
    },
    methods: {
      switchSpj () {
        if (this.testCaseUploaded) {
          this.$confirm('If you change problem judge method, you need to re-upload test cases', 'Warning', {
            confirmButtonText: 'Yes',
            cancelButtonText: 'Cancel',
            type: 'warning'
          }).then(() => {
            this.problem.spj = !this.problem.spj
            this.resetTestCase()
          }).catch(() => {
          })
        } else {
          this.problem.spj = !this.problem.spj
        }
      },
      querySearch (queryString, cb) {
        api.getProblemTagList({ keyword: queryString }).then(res => {
          let tagList = []
          for (let tag of res.data.data) {
            tagList.push({value: tag.name})
          }
          cb(tagList)
        }).catch(() => {
        })
      },
      resetTestCase () {
        this.testCaseUploaded = false
        this.problem.test_case_score = []
        this.problem.test_case_id = ''
      },
      addTag () {
        let inputValue = this.tagInput
        if (inputValue) {
          this.problem.tags.push(inputValue)
        }
        this.inputVisible = false
        this.tagInput = ''
      },
      closeTag (tag) {
        this.problem.tags.splice(this.problem.tags.indexOf(tag), 1)
      },
      matchTags () {
        this.matchingTags = true
        api.matchProblemTags({
          title: this.problem.title,
          description: this.problem.description,
          input_description: this.problem.input_description,
          output_description: this.problem.output_description
        }).then(res => {
          this.matchingTags = false
          const data = res.data.data
          const newTags = data.tags || []
          if (newTags.length === 0) {
            this.$message.info(data.message || '未匹配到标签')
            return
          }
          const existing = new Set(this.problem.tags)
          let addedCount = 0
          newTags.forEach(tag => {
            if (!existing.has(tag)) {
              this.problem.tags.push(tag)
              existing.add(tag)
              addedCount++
            }
          })
          this.$success(`智能匹配完成，新增 ${addedCount} 个标签：${newTags.join('、')}`)
        }).catch(() => {
          this.matchingTags = false
          this.$error('智能匹配标签失败，请稍后重试')
        })
      },
      addSample () {
        this.problem.samples.push({input: '', output: ''})
      },
      deleteSample (index) {
        this.problem.samples.splice(index, 1)
      },
      uploadSucceeded(response) {
        if (response.error) {
          this.$error(response.data);
          return;
        }
        let fileList = response.data.info;
        for (let file of fileList) {
          file.score = (100 / fileList.length).toFixed(0);
          if (!file.output_name && this.problem.spj) {
            file.output_name = '-';
          }
        }
        this.problem.test_case_score = fileList;
        this.testCaseUploaded = true;
        this.problem.test_case_id = response.data.id;

        // 调用预览接口
        this.loadTestCasePreview();
      },
      loadTestCasePreview() {
        if (!this.problem.id) return;
        api.getTestCasePreview(this.problem.id).then(res => {
          if (res.data.error) return;
          this.testCasePreview = res.data.data.test_cases;
        }).catch(() => {});
      },
      uploadFailed () {
        this.$error('Upload failed')
      },
      compileSPJ () {
        let data = {
          id: this.problem.id,
          spj_code: this.problem.spj_code,
          spj_language: this.problem.spj_language
        }
        this.loadingCompile = true
        api.compileSPJ(data).then(res => {
          this.loadingCompile = false
          this.problem.spj_compile_ok = true
          this.error.spj = ''
        }, err => {
          this.loadingCompile = false
          this.problem.spj_compile_ok = false
          const h = this.$createElement
          this.$msgbox({
            title: 'Compile Error',
            type: 'error',
            message: h('pre', err.data.data),
            showCancelButton: false,
            closeOnClickModal: false,
            customClass: 'dialog-compile-error'
          })
        })
      },
      submit () {
        if (!this.problem.samples.length) {
          this.$error('Sample is required')
          return
        }
        for (let sample of this.problem.samples) {
          if (!sample.input || !sample.output) {
            this.$error('Sample input and output is required')
            return
          }
        }
        if (!this.problem.tags.length) {
          this.error.tags = 'Please add at least one tag'
          this.$error(this.error.tags)
          return
        }
        if (this.problem.spj) {
          if (!this.problem.spj_code) {
            this.error.spj = 'Spj code is required'
            this.$error(this.error.spj)
          } else if (!this.problem.spj_compile_ok) {
            this.error.spj = 'SPJ code has not been successfully compiled'
          }
          if (this.error.spj) {
            this.$error(this.error.spj)
            return
          }
        }
        if (!this.problem.languages.length) {
          this.error.languages = 'Please choose at least one language for problem'
          this.$error(this.error.languages)
          return
        }
        if (!this.testCaseUploaded) {
          this.error.testCase = 'Test case is not uploaded yet'
          this.$error(this.error.testCase)
          return
        }
        if (this.problem.rule_type === 'OI') {
          for (let item of this.problem.test_case_score) {
            try {
              if (parseInt(item.score) <= 0) {
                this.$error('Invalid test case score')
                return
              }
            } catch (e) {
              this.$error('Test case score must be an integer')
              return
            }
          }
        }
        this.problem.languages = this.problem.languages.sort()
        this.problem.template = {}
        for (let k in this.template) {
          if (this.template[k].checked) {
            this.problem.template[k] = this.template[k].code
          }
        }
        let funcName = {
          'create-problem': 'createProblem',
          'edit-problem': 'editProblem',
          'create-contest-problem': 'createContestProblem',
          'edit-contest-problem': 'editContestProblem'
        }[this.routeName]
        // edit contest problem 时, contest_id会被后来的请求覆盖掉
        if (funcName === 'editContestProblem') {
          this.problem.contest_id = this.contest.id
        }
        api[funcName](this.problem).then(res => {
          if (this.routeName === 'create-contest-problem' || this.routeName === 'edit-contest-problem') {
            this.$router.push({name: 'contest-problem-list', params: {contestId: this.$route.params.contestId}})
          } else {
            this.$router.push({name: 'problem-list'})
          }
        }).catch(() => {
        })
      },
      openScrapeDialog () {
        this.scrapeUrl = ''
        this.scrapeMode = 'input'
        this.scrapeError = ''
        this.scrapeApiUrl = ''
        this.scrapeApiBodyStr = ''
        this.scrapeCurlCmd = ''
        this.scrapePowershellCmd = ''
        this.scrapeBrowserConsoleCmd = ''
        this.scrapeRawJson = ''
        this.scrapeDialogVisible = true
      },
      resetScrapeDialog () {
        this.scrapeUrl = ''
        this.scrapeMode = 'input'
        this.scrapeError = ''
        this.scrapeCurlCmd = ''
        this.scrapePowershellCmd = ''
        this.scrapeBrowserConsoleCmd = ''
        this.scrapeRawJson = ''
      },
      doScrape () {
        if (!this.scrapeUrl.trim()) {
          this.$message.warning('请输入 LOJ 题目链接')
          return
        }
        this.scrapeLoading = true
        this.scrapeError = ''
        this.scrapeMode = 'input'

        api.scrapeLojProblem({ url: this.scrapeUrl.trim() }).then(res => {
          const info = res.data.data
          const apiUrl = info.api_url
          const apiBody = info.api_body
          const apiBodyStr = JSON.stringify(apiBody)

          // 保存 API 信息供手动模式使用
          this.scrapeApiUrl = apiUrl
          this.scrapeApiBodyStr = apiBodyStr
          const escapedBody = apiBodyStr.replace(/'/g, `'\\''`)
          this.scrapeCurlCmd = `curl -X POST '${apiUrl}' -H 'Content-Type: application/json' -d '${escapedBody}'`
          this.scrapePowershellCmd = `iwr -Uri '${apiUrl}' -Method POST -ContentType 'application/json' -Body '${apiBodyStr}'`
          this.scrapeBrowserConsoleCmd = `fetch('${apiUrl}', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '${apiBodyStr.replace(/'/g, "\\'")}' }).then(r => r.json()).then(d => console.log(JSON.stringify(d, null, 2)))`

          // 尝试浏览器直连 api.loj.ac
          fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: apiBodyStr,
            mode: 'cors'
          }).then(fetchResp => {
            if (fetchResp.ok) {
              return fetchResp.json()
            }
            throw new Error('HTTP ' + fetchResp.status)
          }).then(jsonData => {
            this.scrapeLoading = false
            // 浏览器直连成功，直接解析填入
            return this._fillProblemData(jsonData)
          }).catch(() => {
            // 浏览器直连失败（CORS 或网络问题），切换到手动模式
            this.scrapeLoading = false
            this.scrapeMode = 'manual'
            this.$message.info('自动获取失败，请使用手动方式复制 JSON')
          })
        }).catch(err => {
          this.scrapeLoading = false
          const errData = err && err.data
          this.scrapeError = (errData && errData.data) || '链接解析失败，请检查链接格式'
        })
      },
      _fillProblemData (rawJson) {
        return api.parseLojJson({ raw: typeof rawJson === 'string' ? rawJson : JSON.stringify(rawJson) }).then(res => {
          const d = res.data.data
          if (d.title) this.problem.title = d.title
          if (d.description) this.problem.description = d.description
          if (d.input_description) this.problem.input_description = d.input_description
          if (d.output_description) this.problem.output_description = d.output_description
          if (d.hint) this.problem.hint = d.hint
          if (d.time_limit) this.problem.time_limit = d.time_limit
          if (d.memory_limit) this.problem.memory_limit = d.memory_limit
          if (d.difficulty) this.problem.difficulty = d.difficulty
          if (d.source) this.problem.source = d.source
          if (d.tags && d.tags.length) this.problem.tags = d.tags
          if (d.samples && d.samples.length) this.problem.samples = d.samples
          this.scrapeDialogVisible = false
          this.$message.success('题目数据已填入表单，请检查并调整')
        })
      },
      doParseAndFill () {
        if (!this.scrapeRawJson.trim()) return
        this.scrapeParsing = true
        this._fillProblemData(this.scrapeRawJson.trim()).then(() => {
          this.scrapeParsing = false
        }).catch(err => {
          this.scrapeParsing = false
          const errData = err && err.data
          this.scrapeError = (errData && errData.data) || '数据解析失败，请确认 JSON 格式正确'
        })
      },
      onCurlCopied () {
        this.$message.success('命令行已复制，执行后将返回的 JSON 粘贴到下方文本框')
      },
      onBrowserCmdCopied () {
        this.$message.success('已复制，打开 loj.ac 页面后按 F12 → Console 粘贴执行，将输出的 JSON 复制到下方文本框')
      },
      openAIGenerateDialog() {
        this.$prompt('请输入题目生成要求（例如：生成一道关于二叉树的题目）', '智能生成题目', {
          confirmButtonText: '生成',
          cancelButtonText: '取消',
          inputPlaceholder: '例如：生成一道关于动态规划的题目，难度中等'
        }).then(({ value }) => {
          this.generateProblemWithAI(value);
        }).catch(() => {});
      },
      generateProblemWithAI(prompt) {
        const loading = this.$loading({ text: "智能生成中..." });
        api.generateProblemWithAI(prompt)
          .then(res => {
            if (res.data.error) {
              this.$error(res.data.data);
              return;
            }
            const data = res.data.data;
            this.problem.title = data.title;
            this.problem.description = data.description;
            this.problem.input_description = data.input_description;
            this.problem.output_description = data.output_description;
            this.problem.hint = data.hint || "";
            this.problem.source = data.source || "";
            this.problem.time_limit = data.time_limit;
            this.problem.memory_limit = data.memory_limit;
            this.problem.difficulty = data.difficulty;
            this.problem.tags = data.tags;
            if (data.samples && data.samples.length) {
              this.problem.samples = data.samples;
            }
            this.$message.success("智能生成完成，请检查并调整");
          })
          .catch(err => {
            let errorMsg = err.message;
            if (err.response && err.response.data && err.response.data.data) {
              errorMsg = err.response.data.data;
            }
            this.$error("智能生成失败：" + errorMsg);
          })
          .finally(() => {
            loading.close();
          });
      }
    }
  }
</script>

<style lang="less" scoped>
  .problem {
    .difficulty-select {
      width: 120px;
    }
    .spj-radio {
      margin-left: 10px;
      &:last-child {
        margin-right: 20px;
      }
    }
    .input-new-tag {
      width: 78px;
    }
    .button-new-tag {
      height: 24px;
      line-height: 22px;
      padding-top: 0;
      padding-bottom: 0;
    }
    .button-match-tags {
      margin-left: 6px;
      font-size: 12px;
      color: #409EFF;
    }
    .tags {
      .el-tag {
        margin-right: 10px;
      }
    }
    .accordion {
      margin-bottom: 10px;
    }
    .add-samples {
      width: 100%;
      background-color: #fff;
      border: 1px dashed #aaa;
      outline: none;
      cursor: pointer;
      color: #666;
      height: 35px;
      font-size: 14px;
      &:hover {
        background-color: #f9fafc;
      }
      i {
        margin-right: 10px;
      }
    }
    .add-sample-btn {
      margin-bottom: 10px;
    }

  }
</style>

<style lang="less" scoped>
.problem {
  padding: 20px;
  min-height: calc(100vh - 60px);
  background: linear-gradient(180deg, #f0f4f8 0%, #f8fafc 100%);
  animation: fadeInDown 0.6s ease-out;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

<style>
  .problem-tag-poper {
    width: 200px !important;
  }
  .scrape-info-row {
    margin-bottom: 10px;
    display: flex;
    align-items: center;
  }
  .scrape-label {
    min-width: 80px;
    font-weight: 600;
    color: #303133;
  }
  .scrape-api-input {
    flex: 1;
  }
  .scrape-cmd-input {
    width: 100%;
  }
  .scrape-cmd-label {
    font-size: 12px;
    font-weight: 600;
    color: #909399;
    margin-bottom: 4px;
  }
  .scrape-error-msg {
    margin-top: 12px;
    padding: 10px 14px;
    background: #fef0f0;
    border-radius: 4px;
    color: #f56c6c;
    font-size: 13px;
    border-left: 3px solid #f56c6c;
  }
  .scrape-error-msg i {
    margin-right: 4px;
  }
  .scrape-hint {
    margin: 12px 0;
    padding: 10px 14px;
    background: #ecf5ff;
    border-radius: 4px;
    color: #409EFF;
    font-size: 13px;
    line-height: 1.6;
  }
  .scrape-hint i {
    margin-right: 4px;
  }
</style>

<style>
  .dialog-compile-error {
    width: auto;
    max-width: 80%;
    overflow-x: scroll;
  }
</style>

