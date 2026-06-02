<template>
  <div class="code-editor-fullscreen">
    <div class="editor-header">
      <div class="header-left">
        <Button type="text" @click="goBack" class="back-btn">
          <Icon type="ios-arrow-back" size="20" />
          <span>{{ $t('m.Back') }}</span>
        </Button>
        <Icon type="ios-code" size="20" color="#fff" />
        <span class="header-title">{{ $t('m.Code_Editor') }}</span>
      </div>
      <div class="header-right">
        <span class="header-info">{{ $t('m.Free_Code_Editor_Desc') }}</span>
      </div>
    </div>

    <div class="editor-body">
      <Panel :padding="20" shadow>
        <CodeMirror
          :value.sync="code"
          :languages="languages"
          :language="language"
          :theme="theme"
          @changeLang="onChangeLang"
          @changeTheme="onChangeTheme"
          @resetCode="onResetCode"
        />

        <div class="editor-actions">
          <Button @click="clearCode" icon="ios-trash">
            {{ $t('m.Clear') }}
          </Button>
          <Button @click="copyCode" icon="ios-copy">
            {{ $t('m.Copy') }}
          </Button>
        </div>

        <div class="self-test-section">
          <p class="self-test-label">{{ $t('m.Self_Test') }}</p>
          <div class="self-test-row">
            <div class="self-test-left">
              <p class="self-test-col-title">{{ $t('m.Self_Test_Input') }}</p>
              <textarea v-model="selfTestInput" rows="5"
                        :placeholder="$t('m.Self_Test_Placeholder')"
                        class="self-test-textarea"></textarea>
              <div class="self-test-btns">
                <Button type="primary" :loading="running" @click="runCodeWithInput(selfTestInput)" icon="ios-flask">
                  {{ $t('m.Self_Test') }}
                </Button>
              </div>
            </div>
            <div class="self-test-right">
              <p class="self-test-col-title">{{ $t('m.Self_Test_Output') }}
                <span v-if="lastResult" class="self-test-meta">
                  <span v-if="lastResult.success" class="self-test-tag self-test-tag-success">{{ $t('m.Self_Test_Run') }} {{ $t('m.Success') }}</span>
                  <span v-else class="self-test-tag self-test-tag-error">{{ $t('m.Error') }}</span>
                  <span v-if="lastResult.success" class="self-test-time">{{ lastResult.time_cost }}ms | {{ (lastResult.memory_cost / 1024 / 1024).toFixed(2) }}MB</span>
                </span>
              </p>
              <pre class="self-test-pre">{{ lastResult ? (lastResult.output || lastResult.error) : '' }}</pre>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  </div>
</template>

<script>
import CodeMirror from '@oj/components/CodeMirror.vue'
import Panel from '@oj/components/Panel.vue'
import axios from 'axios'

const defaultCode = {
  'C++': '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}',
  'C': '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
  'Java': 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
  'Python3': 'print("Hello, World!")',
  'JavaScript': 'console.log("Hello, World!");',
  'Go': 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}'
}

export default {
  name: 'CodeEditorFullscreen',
  components: {
    CodeMirror,
    Panel
  },
  data () {
    return {
      code: defaultCode['C++'],
      language: 'C++',
      theme: 'solarized',
      running: false,
      selfTestInput: '',
      lastResult: null,
      languages: ['C', 'C++', 'Java', 'Python3', 'JavaScript', 'Go']
    }
  },
  created () {
    try {
      const raw = localStorage.getItem('free-code-editor')
      if (raw) {
        const state = JSON.parse(raw)
        if (state.code) this.code = state.code
        if (state.language) this.language = state.language === 'Python' ? 'Python3' : state.language
        if (state.theme) this.theme = state.theme
        if (state.input !== undefined) this.selfTestInput = state.input
      }
    } catch (e) {}
  },
  beforeDestroy () {
    this.saveState()
  },
  methods: {
    goBack () {
      this.saveState()
      this.$router.go(-1)
    },
    onChangeLang (lang) {
      this.language = lang
    },
    onChangeTheme (theme) {
      this.theme = theme
    },
    onResetCode () {
      this.code = defaultCode[this.language] || defaultCode['C++']
    },
    saveState () {
      localStorage.setItem('free-code-editor', JSON.stringify({
        code: this.code,
        language: this.language,
        theme: this.theme,
        input: this.selfTestInput || ''
      }))
    },
    clearCode () {
      this.code = ''
      this.lastResult = null
      this.selfTestInput = ''
    },
    copyCode () {
      var self = this
      navigator.clipboard.writeText(this.code).then(function () {
        self.$Message.success(self.$t('m.Code_Copied'))
      }).catch(function () {
        self.$Message.error(self.$t('m.Copy_Failed'))
      })
    },
    runCodeWithInput (input) {
      if (this.code.trim() === '') {
        this.$Message.error(this.$t('m.Code_Cannot_Be_Empty'))
        return
      }
      this.running = true
      this.lastResult = null

      var csrf = document.cookie.match(/csrftoken=([^;]+)/)
      var headers = { 'Content-Type': 'application/json' }
      if (csrf) headers['X-CSRFToken'] = csrf[1]

      var self = this
      axios.post('/self_test/', {
        code: this.code,
        language: this.language,
        input: input || ''
      }, { headers: headers }).then(function (res) {
        var data = res.data
        if (data.error === null) {
          self.lastResult = {
            success: true,
            output: (data.data && data.data.output) || '',
            time_cost: (data.data && data.data.time_cost) || 0,
            memory_cost: (data.data && data.data.memory_cost) || 0
          }
        } else {
          self.lastResult = {
            success: false,
            error: data.data || data.error || 'Unknown error'
          }
        }
      }).catch(function () {
        self.lastResult = {
          success: false,
          error: 'Request failed'
        }
      }).finally(function () {
        self.running = false
      })
    }
  }
}
</script>

<style lang="less" scoped>
.code-editor-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #f0f2f5;
  display: flex;
  flex-direction: column;
  z-index: 9999;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .back-btn {
      color: white;
      padding: 0 8px;
      font-size: 14px;

      &:hover { background: rgba(255, 255, 255, 0.2); }

      span { margin-left: 4px; }
    }

    .header-title {
      font-size: 18px;
      font-weight: 600;
    }
  }

  .header-right {
    .header-info {
      font-size: 13px;
      opacity: 0.9;
    }
  }
}

.editor-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;

  ::v-deep .ivu-card {
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  }
}

.editor-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.self-test-section {
  margin-top: 20px;

  .self-test-label {
    font-size: 1rem;
    font-weight: 600;
    color: #1e3a8a;
    margin: 0 0 10px;
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
    margin: 0 0 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .self-test-meta {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 400;
  }

  .self-test-textarea,
  .self-test-pre {
    width: 100%;
    margin: 0;
    padding: 10px;
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.5;
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

  .self-test-left .self-test-textarea {
    margin-bottom: 8px;
  }

  .self-test-btns {
    display: flex;
    gap: 8px;
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

  .self-test-time {
    font-size: 12px;
    color: #64748b;
  }
}
</style>
