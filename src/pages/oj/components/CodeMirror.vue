<template>
  <div style="margin: 0px 0px 15px 0px">
    <Row type="flex" justify="space-between" class="header">
      <Col :span=12>
      <div>
        <span>{{$t('m.Language')}}:</span>
        <Select :value="language" @on-change="onLangChange" class="adjust">
          <Option v-for="item in languages" :key="item" :value="item">{{item}}
          </Option>
        </Select>

        <Tooltip :content="this.$i18n.t('m.Reset_to_default_code_definition')" placement="top" style="margin-left: 10px">
          <Button icon="refresh" @click="onResetClick"></Button>
        </Tooltip>

        <Tooltip :content="this.$i18n.t('m.Upload_file')" placement="top" style="margin-left: 10px">
          <Button icon="upload" @click="onUploadFile"></Button>
        </Tooltip>

        <input type="file" id="file-uploader" style="display: none" @change="onUploadFileDone">

      </div>
      </Col>
      <Col :span=12>
      <div class="fl-right">
        <span>{{$t('m.Theme')}}:</span>
        <Select :value="theme" @on-change="onThemeChange" class="adjust">
          <Option v-for="item in themes" :key="item.label" :value="item.value">{{item.label}}
          </Option>
        </Select>
      </div>
      </Col>
    </Row>
    <codemirror :value="value" :options="options" @change="onEditorCodeChange" ref="myEditor">
    </codemirror>
  </div>
</template>
<script>
  import utils from '@/utils/utils'
  import { codemirror } from 'vue-codemirror-lite'

  // theme
  import 'codemirror/theme/monokai.css'
  import 'codemirror/theme/solarized.css'
  import 'codemirror/theme/material.css'

  // mode
  import 'codemirror/mode/clike/clike.js'
  import 'codemirror/mode/python/python.js'
  import 'codemirror/mode/go/go.js'
  import 'codemirror/mode/javascript/javascript.js'

  // active-line.js
  import 'codemirror/addon/selection/active-line.js'

  // foldGutter
  import 'codemirror/addon/fold/foldgutter.css'
  import 'codemirror/addon/fold/foldgutter.js'
  import 'codemirror/addon/fold/brace-fold.js'
  import 'codemirror/addon/fold/indent-fold.js'

  // auto-complete / hint
  import 'codemirror/addon/hint/show-hint.css'
  var CodeMirror = require('codemirror')

  export default {
    name: 'CodeMirror',
    components: {
      codemirror
    },
    props: {
      value: {
        type: String,
        default: ''
      },
      languages: {
        type: Array,
        default: () => {
          return ['C', 'C++', 'Java', 'Python2']
        }
      },
      language: {
        type: String,
        default: 'C++'
      },
      theme: {
        type: String,
        default: 'solarized'
      }
    },
    data () {
      return {
        options: {
          tabSize: 4,
          mode: 'text/x-csrc',
          theme: 'solarized',
          lineNumbers: true,
          line: true,
          foldGutter: true,
          gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
          styleSelectedText: true,
          lineWrapping: true,
          highlightSelectionMatches: {showToken: /\w/, annotateScrollbar: true}
        },
        mode: {
          'C++': 'text/x-csrc'
        },
        themes: []
      }
    },
    created () {
      this.themes = [
        {label: this.$i18n.t('m.Monokai'), value: 'monokai'},
        {label: this.$i18n.t('m.Solarized_Light'), value: 'solarized'},
        {label: this.$i18n.t('m.Material'), value: 'material'}
      ]
    },
    mounted () {
      var vm = this

      utils.getLanguages().then(function (languages) {
        var mode = {}
        languages.forEach(function (lang) {
          mode[lang.name] = lang.content_type
        })
        vm.mode = mode
        vm.editor.setOption('mode', vm.mode[vm.language])
      })

      vm.editor.focus()

      // ---- 核心：键入后弹出补全 ----
      var KEYWORDS = {
        'text/x-csrc': ['auto','break','case','char','const','continue','default','do','double','else','enum','extern','float','for','goto','if','int','long','register','return','short','signed','sizeof','static','struct','switch','typedef','union','unsigned','void','volatile','while','bool','true','false','NULL','printf','scanf','malloc','free','stdin','stdout','FILE','size_t'],
        'text/x-c++src': ['auto','break','case','char','const','continue','default','do','double','else','enum','extern','float','for','goto','if','int','long','register','return','short','signed','sizeof','static','struct','switch','typedef','union','unsigned','void','volatile','while','bool','catch','class','const_cast','delete','dynamic_cast','explicit','false','friend','inline','mutable','namespace','new','operator','private','protected','public','reinterpret_cast','static_cast','template','this','throw','true','try','typeid','typename','using','virtual','wchar_t','string','vector','map','set','queue','stack','pair','sort','lower_bound','upper_bound','swap','min','max','push_back','pop_back','begin','end','size','empty','clear','cout','cin','endl','std','make_pair','printf','scanf','malloc','free','NULL'],
        'python': ['False','None','True','and','as','assert','break','class','continue','def','del','elif','else','except','finally','for','from','global','if','import','in','is','lambda','nonlocal','not','or','pass','raise','return','try','while','with','yield','print','input','range','len','int','float','str','list','dict','set','tuple','map','filter','zip','enumerate','sorted','reversed','open','split','join','append','pop','max','min','sum','abs','self','__init__'],
        'text/x-java': ['abstract','assert','boolean','break','byte','case','catch','char','class','continue','default','do','double','else','enum','extends','final','finally','float','for','if','implements','import','instanceof','int','interface','long','native','new','package','private','protected','public','return','short','static','strictfp','super','switch','synchronized','this','throw','throws','transient','try','void','volatile','while','true','false','null','public','class','static','void','main','String','System','out','println','Scanner','Math','Arrays','ArrayList','HashMap','Integer','sort']
      }

      var getCompletions = function (editor) {
        var cur = editor.getCursor()
        var token = editor.getTokenAt(cur)
        var word = token.string
        if (!word || !/^[a-zA-Z_]/.test(word)) return
        var mode = editor.getModeAt(cur)
        var modeName = mode && mode.name ? mode.name : 'text/x-c++src'
        var kw = KEYWORDS[modeName] || KEYWORDS['text/x-c++src']
        var allWords = {}
        for (var i = 0; i < kw.length; i++) { allWords[kw[i]] = true }
        var docText = editor.getValue()
        var re = /\b\w{2,}\b/g
        var m
        while ((m = re.exec(docText)) !== null) { allWords[m[0]] = true }
        var list = []
        var prefix = word.toLowerCase()
        for (var w in allWords) {
          if (w !== word && w.toLowerCase().indexOf(prefix) === 0) list.push(w)
        }
        list.sort()
        return {
          list: list.slice(0, 50),
          from: { line: cur.line, ch: token.start },
          to: { line: cur.line, ch: token.end }
        }
      }

      // 自动补全触发
      var tryAutocomplete = function (cm) {
        if (typeof cm.showHint !== 'function') {
          console.log('[CodeMirror] showHint not available on editor instance, trying CodeMirror global')
          if (typeof CodeMirror.showHint === 'function') {
            CodeMirror.showHint(cm, getCompletions, { completeSingle: false })
          } else {
            console.log('[CodeMirror] global CodeMirror.showHint also not available')
          }
          return
        }
        cm.showHint({ hint: getCompletions, completeSingle: false })
      }

      vm.editor.on('changes', function (cm, change) {
        if (change.origin === '+input') {
          tryAutocomplete(cm)
        }
      })

      vm.editor.on('keyup', function (cm, e) {
        if (e.key === 'Backspace' || e.key === 'Delete') {
          tryAutocomplete(cm)
        }
        if (e.ctrlKey && e.key === ' ') {
          e.preventDefault()
          tryAutocomplete(cm)
        }
      })
    },
    watch: {
      language (newLang) {
        if (this.mode[newLang] && this.editor) {
          this.editor.setOption('mode', this.mode[newLang])
        }
      }
    },
    methods: {
      onEditorCodeChange (newCode) {
        this.$emit('update:value', newCode)
      },
      onLangChange (newVal) {
        this.editor.setOption('mode', this.mode[newVal])
        this.$emit('changeLang', newVal)
      },
      onThemeChange (newTheme) {
        this.editor.setOption('theme', newTheme)
        this.$emit('changeTheme', newTheme)
      },
      onResetClick () {
        this.$emit('resetCode')
      },
      onUploadFile () {
        document.getElementById('file-uploader').click()
      },
      onUploadFileDone () {
        let f = document.getElementById('file-uploader').files[0]
        let fileReader = new window.FileReader()
        let self = this
        fileReader.onload = function (e) {
          var text = e.target.result
          self.editor.setValue(text)
          document.getElementById('file-uploader').value = ''
        }
        fileReader.readAsText(f, 'UTF-8')
      }
    },
    computed: {
      editor () {
        return this.$refs.myEditor.editor
      }
    },
    watch: {
      'theme' (newVal, oldVal) {
        this.editor.setOption('theme', newVal)
      }
    }
  }
</script>

<style lang="less" scoped>
  .header {
    margin: 5px 5px 15px 5px;
    .adjust {
      width: 150px;
      margin-left: 10px;
    }
    .fl-right {
      float: right;
    }
  }
</style>

<style>
  .CodeMirror {
    height: auto !important;
  }
  .CodeMirror-scroll {
    min-height: 300px;
    max-height: 1000px;
  }
</style>
