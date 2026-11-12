<template>
  <div class="cm-outer">
    <div class="header-flex">
      <div class="tool-group">
        <span class="tool-label">{{$t('m.Language')}}:</span>
        <Select :model-value="language" @on-change="onLangChange" class="adjust">
          <Option v-for="item in languages" :key="item" :value="item">{{item}}
          </Option>
        </Select>

        <Tooltip :content="this.$i18n.t('m.Reset_to_default_code_definition')" placement="top">
          <Button icon="ios-refresh" @click="onResetClick"></Button>
        </Tooltip>

        <Tooltip :content="this.$i18n.t('m.Upload_file')" placement="top">
          <Button icon="ios-cloud-upload" @click="onUploadFile"></Button>
        </Tooltip>

        <input type="file" id="file-uploader" style="display: none" @change="onUploadFileDone">
      </div>
      <div class="tool-group">
        <span class="tool-label">{{$t('m.Theme')}}:</span>
        <Select :model-value="theme" @on-change="onThemeChange" class="adjust">
          <Option v-for="item in themes" :key="item.label" :value="item.value">{{item.label}}
          </Option>
        </Select>

        <span class="tool-label">字号:</span>
        <Select :model-value="fontSize" @on-change="onFontSizeChange" class="adjust font-size-select">
          <Option v-for="s in fontSizes" :key="s" :value="s">{{ s }}px</Option>
        </Select>
      </div>
    </div>
    <CodemirrorEditor :value="value" :options="options" @change="onEditorCodeChange" ref="myEditor" />
  </div>
</template>
<script>
  import CodeMirror from 'codemirror'
  import CodemirrorEditor from '@/components/Codemirror.vue'
  import utils from '@/utils/utils'

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
  import 'codemirror/addon/hint/show-hint.js'

  export default {
    name: 'CodeMirror',
    components: { CodemirrorEditor },
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
        fontSizes: [12, 13, 14, 16, 18, 20, 24],
        fontSize: 14,
        options: {
          tabSize: 4,
          mode: 'text/x-csrc',
          theme: this.theme,
          lineNumbers: true,
          line: true,
          foldGutter: true,
          gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
          styleSelectedText: true,
          lineWrapping: true,
          highlightSelectionMatches: {showToken: /\w/, annotateScrollbar: true}
        },
        mode: {
          'C++': 'text/x-c++src'
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
        if (vm.editor && vm.mode[vm.language]) {
          vm.editor.setOption('mode', vm.mode[vm.language])
        }
      })

      vm.editor.focus()
      vm.applyFontSize()

      // ---- 核心：键入后弹出补全 ----
      // 词库按 CodeMirror content_type 键控，切换语言时自动切换词库
      var PY_WORDS = [
        // 关键字（Python3 + match/case）
        'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'match', 'case', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
        // 内置函数
        'abs', 'aiter', 'all', 'anext', 'any', 'ascii', 'bin', 'bool', 'bytearray', 'bytes', 'callable', 'chr', 'classmethod', 'compile', 'complex', 'delattr', 'dict', 'dir', 'divmod', 'enumerate', 'eval', 'exec', 'filter', 'float', 'format', 'frozenset', 'getattr', 'globals', 'hasattr', 'hash', 'help', 'hex', 'id', 'input', 'int', 'isinstance', 'issubclass', 'iter', 'len', 'list', 'locals', 'map', 'max', 'memoryview', 'min', 'next', 'object', 'oct', 'open', 'ord', 'pow', 'print', 'range', 'repr', 'reversed', 'round', 'set', 'setattr', 'slice', 'sorted', 'staticmethod', 'str', 'sum', 'super', 'tuple', 'type', 'vars', 'zip',
        // 魔术属性 / self
        '__import__', '__name__', '__main__', '__init__', '__len__', '__str__', '__repr__', '__iter__', '__next__', 'self',
        // 常用方法
        'append', 'extend', 'insert', 'pop', 'remove', 'index', 'count', 'sort', 'reverse', 'keys', 'values', 'items', 'get', 'copy', 'update', 'join', 'split', 'rsplit', 'splitlines', 'strip', 'lstrip', 'rstrip', 'replace', 'startswith', 'endswith', 'find', 'rfind', 'format', 'encode', 'decode', 'read', 'readline', 'readlines', 'write', 'writelines', 'close', 'seek', 'tell',
        // 常用模块与竞赛常用
        'sys', 'os', 'math', 're', 'random', 'collections', 'itertools', 'functools', 'heapq', 'bisect', 'datetime', 'time', 'string', 'io', 'json', 'numpy', 'Counter', 'defaultdict', 'deque', 'OrderedDict', 'heappush', 'heappop', 'heapreplace', 'bisect_left', 'bisect_right', 'reduce', 'lru_cache', 'permutations', 'combinations', 'product', 'accumulate', 'pi', 'sqrt', 'inf', 'factorial', 'gcd', 'lcm', 'randint', 'seed', 'shuffle', 'choice', 'sample'
      ]

      var KEYWORDS = {
        'text/x-csrc': [
          // C89 关键字
          'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if', 'int', 'long', 'register', 'return', 'short', 'signed', 'sizeof', 'static', 'struct', 'switch', 'typedef', 'union', 'unsigned', 'void', 'volatile', 'while',
          // C99 / C11
          'inline', 'restrict', '_Bool', '_Complex', '_Imaginary', '_Alignas', '_Alignof', '_Atomic', '_Generic', '_Noreturn', '_Static_assert', '_Thread_local',
          // 常用类型与宏
          'bool', 'true', 'false', 'NULL', 'EOF', 'FILE', 'size_t', 'ssize_t', 'ptrdiff_t', 'intptr_t', 'uintptr_t', 'int8_t', 'int16_t', 'int32_t', 'int64_t', 'uint8_t', 'uint16_t', 'uint32_t', 'uint64_t', 'INT_MAX', 'INT_MIN', 'LONG_MAX', 'LONG_MIN', 'LLONG_MAX', 'LLONG_MIN', 'UINT_MAX', 'DBL_MAX', 'FLT_MAX', 'RAND_MAX', 'EXIT_SUCCESS', 'EXIT_FAILURE', 'stdin', 'stdout', 'stderr', 'M_PI', 'M_E',
          // stdio.h
          'printf', 'fprintf', 'sprintf', 'snprintf', 'scanf', 'fscanf', 'sscanf', 'fgets', 'fputs', 'fputc', 'putc', 'getchar', 'getchar_unlocked', 'putchar', 'putchar_unlocked', 'fopen', 'freopen', 'fclose', 'fread', 'fwrite', 'fseek', 'ftell', 'rewind', 'feof', 'ferror', 'perror', 'fflush', 'setvbuf', 'ungetc', 'remove', 'rename',
          // stdlib.h
          'malloc', 'calloc', 'realloc', 'free', 'exit', 'abort', 'atexit', 'atoi', 'atol', 'atof', 'strtol', 'strtoul', 'strtod', 'abs', 'labs', 'llabs', 'div', 'ldiv', 'rand', 'srand', 'qsort', 'bsearch', 'system', 'getenv',
          // string.h
          'memcpy', 'memmove', 'memset', 'memcmp', 'strcpy', 'strncpy', 'strcat', 'strncat', 'strcmp', 'strncmp', 'strchr', 'strrchr', 'strstr', 'strlen', 'strtok', 'strdup', 'strerror',
          // math.h
          'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2', 'sinh', 'cosh', 'tanh', 'exp', 'log', 'log2', 'log10', 'pow', 'sqrt', 'cbrt', 'hypot', 'ceil', 'floor', 'round', 'fabs', 'fmod', 'modf', 'trunc',
          // ctype.h
          'isalpha', 'isdigit', 'isalnum', 'isspace', 'isupper', 'islower', 'ispunct', 'toupper', 'tolower',
          // time.h / assert.h
          'time', 'clock', 'difftime', 'mktime', 'asctime', 'ctime', 'gmtime', 'localtime', 'strftime', 'assert'
        ],
        'text/x-c++src': [
          // 关键字（C++98 ~ C++20）
          'alignas', 'alignof', 'and', 'and_eq', 'asm', 'auto', 'bitand', 'bitor', 'bool', 'break', 'case', 'catch', 'char', 'char8_t', 'char16_t', 'char32_t', 'class', 'compl', 'concept', 'const', 'consteval', 'constexpr', 'constinit', 'const_cast', 'continue', 'co_await', 'co_return', 'co_yield', 'decltype', 'default', 'delete', 'do', 'dynamic_cast', 'else', 'enum', 'explicit', 'export', 'extern', 'false', 'float', 'for', 'friend', 'goto', 'if', 'inline', 'int', 'long', 'mutable', 'namespace', 'new', 'noexcept', 'not', 'not_eq', 'nullptr', 'operator', 'or', 'or_eq', 'private', 'protected', 'public', 'register', 'reinterpret_cast', 'requires', 'return', 'short', 'signed', 'sizeof', 'static', 'static_assert', 'static_cast', 'struct', 'switch', 'template', 'this', 'thread_local', 'throw', 'true', 'try', 'typedef', 'typeid', 'typename', 'union', 'unsigned', 'using', 'virtual', 'void', 'volatile', 'wchar_t', 'while', 'xor', 'xor_eq',
          // STL 容器与常用类型
          'std', 'string', 'wstring', 'vector', 'deque', 'list', 'forward_list', 'array', 'set', 'multiset', 'map', 'multimap', 'unordered_set', 'unordered_multiset', 'unordered_map', 'unordered_multimap', 'stack', 'queue', 'priority_queue', 'pair', 'tuple', 'bitset', 'function', 'shared_ptr', 'unique_ptr', 'weak_ptr', 'make_shared', 'make_unique', 'make_pair', 'make_tuple', 'optional', 'variant', 'size_t', 'int8_t', 'int16_t', 'int32_t', 'int64_t', 'uint8_t', 'uint16_t', 'uint32_t', 'uint64_t', 'iterator', 'reverse_iterator', 'ostream', 'istream', 'ostringstream', 'istringstream', 'stringstream', 'fstream', 'ifstream', 'ofstream',
          // STL 算法
          'sort', 'stable_sort', 'partial_sort', 'nth_element', 'reverse', 'rotate', 'shuffle', 'unique', 'binary_search', 'lower_bound', 'upper_bound', 'equal_range', 'accumulate', 'reduce', 'inner_product', 'partial_sum', 'iota', 'count', 'count_if', 'find', 'find_if', 'find_if_not', 'for_each', 'generate', 'fill', 'fill_n', 'transform', 'copy', 'copy_if', 'copy_n', 'move', 'swap', 'swap_ranges', 'remove', 'remove_if', 'remove_copy', 'replace', 'replace_if', 'max_element', 'min_element', 'minmax_element', 'next_permutation', 'prev_permutation', 'all_of', 'any_of', 'none_of', 'max', 'min', 'minmax', 'clamp', 'abs', 'div',
          // 容器常用成员
          'push_back', 'pop_back', 'push_front', 'pop_front', 'emplace', 'emplace_back', 'emplace_front', 'insert', 'erase', 'clear', 'size', 'empty', 'front', 'back', 'top', 'push', 'pop', 'at', 'begin', 'end', 'rbegin', 'rend', 'find', 'count', 'contains', 'key_comp', 'value_comp', 'insert_or_assign', 'try_emplace', 'reserve', 'resize', 'capacity', 'shrink_to_fit', 'data',
          // IO 与杂项
          'cin', 'cout', 'cerr', 'clog', 'endl', 'ends', 'flush', 'setw', 'setfill', 'setprecision', 'fixed', 'scientific', 'left', 'right', 'getline', 'tie', 'sync_with_stdio', 'printf', 'scanf', 'memset', 'memcpy', 'strlen', 'hash', 'greater', 'less', 'numeric_limits', 'INT_MAX', 'INT_MIN', 'LLONG_MAX', 'LLONG_MIN', 'NULL', 'ios', 'ios_base'
        ],
        'text/x-python': PY_WORDS,
        'python': PY_WORDS,
        'text/x-java': [
          // 关键字
          'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 'finally', 'float', 'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new', 'package', 'permits', 'private', 'protected', 'public', 'record', 'return', 'sealed', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'try', 'var', 'void', 'volatile', 'while', 'yield', 'true', 'false', 'null',
          // 常用类型
          'String', 'StringBuilder', 'StringBuffer', 'Character', 'Integer', 'Long', 'Double', 'Float', 'Boolean', 'Byte', 'Short', 'Object', 'Math', 'System', 'Arrays', 'Collections', 'Objects', 'ArrayList', 'LinkedList', 'ArrayDeque', 'PriorityQueue', 'HashMap', 'HashSet', 'TreeMap', 'TreeSet', 'LinkedHashMap', 'LinkedHashSet', 'Stack', 'Vector', 'Iterator', 'Iterable', 'List', 'Map', 'Set', 'Queue', 'Deque', 'Comparator', 'Optional', 'Stream', 'Random', 'Scanner', 'Thread', 'Runnable', 'Exception', 'RuntimeException', 'IOException', 'Throwable', 'Error', 'Number', 'BigInteger', 'BigDecimal',
          // 常用成员与方法
          'out', 'err', 'main', 'args', 'length', 'charAt', 'substring', 'indexOf', 'lastIndexOf', 'equals', 'equalsIgnoreCase', 'compareTo', 'contains', 'startsWith', 'endsWith', 'toUpperCase', 'toLowerCase', 'trim', 'strip', 'split', 'replace', 'replaceAll', 'matches', 'concat', 'isEmpty', 'isBlank', 'valueOf', 'parseInt', 'parseLong', 'parseDouble', 'toString', 'hashCode', 'getClass', 'abs', 'max', 'min', 'pow', 'sqrt', 'cbrt', 'floor', 'ceil', 'round', 'random', 'sort', 'fill', 'copyOf', 'copyOfRange', 'binarySearch', 'asList', 'add', 'remove', 'get', 'set', 'size', 'containsKey', 'containsValue', 'keySet', 'values', 'entrySet', 'put', 'poll', 'offer', 'peek', 'push', 'pop', 'isEmpty', 'hasNext', 'nextInt', 'nextLine', 'close', 'append', 'reverse', 'stream', 'filter', 'forEach', 'println', 'printf', 'print'
        ]
      }

      // C/C++ 预处理指令（输入 # 时提示，如 #inc -> #include）
      var PREPROC = ['#include', '#define', '#ifndef', '#ifdef', '#ifndef', '#endif', '#else', '#elif', '#if', '#pragma', '#undef', '#error']

      var getCompletions = function (editor) {
        var cur = editor.getCursor()
        var token = editor.getTokenAt(cur)
        var word = token.string
        // 允许字母/下划线/# 开头（# 开头走预处理指令补全）
        if (!word || !/^[a-zA-Z_#]/.test(word)) return
        var isPre = word.charAt(0) === '#'
        // 用编辑器当前 mode 设置值（content_type）选词库：
        // C/C++/Java 同属 clike，getModeAt().name 都返回 'clike' 无法区分
        var modeOpt = editor.getOption('mode')
        var modeStr = typeof modeOpt === 'string' ? modeOpt : ((modeOpt && modeOpt.name) || '')
        var kw = KEYWORDS[modeStr]
        if (!kw) {
          var mAt = editor.getModeAt(cur)
          kw = KEYWORDS[mAt && mAt.name]
        }
        if (!kw) kw = KEYWORDS['text/x-c++src']
        var candidates = isPre ? PREPROC : kw
        var kwList = []
        var docList = []
        var seen = {}
        var prefix = word.toLowerCase()
        for (var i = 0; i < candidates.length; i++) {
          var w = candidates[i]
          if (w !== word && !seen[w] && w.toLowerCase().indexOf(prefix) === 0) {
            seen[w] = 1
            kwList.push(w)
          }
        }
        if (!isPre) {
          var docText = editor.getValue()
          var re = /\b\w{2,}\b/g
          var m
          while ((m = re.exec(docText)) !== null) {
            var d = m[0]
            if (d !== word && !seen[d] && d.toLowerCase().indexOf(prefix) === 0) {
              seen[d] = 1
              docList.push(d)
            }
          }
        }
        // 关键字排前面、文档词排后面，去掉全局 sort 保持该顺序
        kwList.sort()
        var list = kwList.concat(docList)
        if (!list.length) return
        return {
          list: list.slice(0, 100),
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

      vm.editor.on('change', function (cm, change) {
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

      // 中文输入法：拼音组合期间 CodeMirror 不触发 change，
      // 上屏（compositionend）后再补一次，保证敲完字母按回车也能弹提示
      var inputField = vm.editor.getInputField()
      if (inputField && inputField.addEventListener) {
        inputField.addEventListener('compositionend', function () {
          setTimeout(function () {
            tryAutocomplete(vm.editor)
          }, 50)
        })
      }
    },
    watch: {
      language (newLang) {
        if (this.mode[newLang] && this.editor) {
          this.editor.setOption('mode', this.mode[newLang])
        }
      },
      theme (newTheme) {
        if (this.editor) {
          this.editor.setOption('theme', newTheme)
        }
      }
    },
    methods: {
      onEditorCodeChange (newCode) {
        this.$emit('update:value', newCode)
      },
      applyFontSize () {
        if (!this.editor) return
        var wrap = this.editor.getWrapperElement()
        if (wrap) {
          wrap.style.fontSize = this.fontSize + 'px'
          this.editor.refresh()
        }
      },
      onFontSizeChange (size) {
        this.fontSize = size
        this.applyFontSize()
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
        return this.$refs.myEditor && this.$refs.myEditor.editor
      }
    }
  }
</script>

<style lang="less" scoped>
  .cm-outer {
    margin: 0 0 15px 0;
  }

  .header-flex {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: nowrap;
    gap: 10px;
    margin: 5px 5px 15px 5px;

    .tool-group {
      display: flex;
      align-items: center;
      flex-wrap: nowrap;
      gap: 8px;
      white-space: nowrap;

      .tool-label {
        flex-shrink: 0;
      }

      .adjust {
        // 空间不足时下拉允许收缩，保证整组始终单行
        width: 150px;
        min-width: 70px;
        flex: 0 1 auto;
        margin-left: 0;
      }

      .font-size-select {
        width: 80px;
        min-width: 60px;
      }
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
  /* 补全下拉框挂在 body 上，必须压过答题页编辑器区域的多层 z-index（30/2000 等），否则会被盖住不可见 */
  .CodeMirror-hints {
    z-index: 10000 !important;
  }
</style>
