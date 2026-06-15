/* eslint-disable */
/**
 * CodeMirror 语言关键字自动补全
 */

// ---------- C / C++ 关键字 ----------
var C_KEYWORDS = [
  'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do',
  'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if',
  'int', 'long', 'register', 'return', 'short', 'signed', 'sizeof', 'static',
  'struct', 'switch', 'typedef', 'union', 'unsigned', 'void', 'volatile', 'while'
]

var CPP_KEYWORDS = [
  'bool', 'catch', 'class', 'const_cast', 'delete', 'dynamic_cast',
  'explicit', 'false', 'friend', 'inline', 'mutable', 'namespace',
  'new', 'operator', 'private', 'protected', 'public',
  'reinterpret_cast', 'static_cast', 'template', 'this', 'throw',
  'true', 'try', 'typeid', 'typename', 'using', 'virtual', 'wchar_t',
  'override', 'final', 'nullptr', 'noexcept', 'constexpr',
  'decltype', 'thread_local', 'alignas', 'alignof',
  'static_assert', 'char16_t', 'char32_t'
]

var CPP_STL = [
  'std', 'cin', 'cout', 'cerr', 'clog', 'endl', 'string',
  'vector', 'map', 'set', 'list', 'deque', 'queue', 'stack',
  'priority_queue', 'pair', 'tuple', 'unordered_map', 'unordered_set',
  'algorithm', 'sort', 'lower_bound', 'upper_bound', 'binary_search',
  'swap', 'min', 'max', 'abs', 'reverse', 'find', 'count',
  'push_back', 'emplace_back', 'pop_back', 'begin', 'end', 'size',
  'empty', 'clear', 'insert', 'erase', 'front', 'back', 'top',
  'make_pair', 'make_tuple', 'tie', 'get', 'move', 'forward',
  'iostream', 'cstdio', 'cmath', 'cstring', 'cstdlib',
  'printf', 'scanf', 'malloc', 'free', 'realloc', 'calloc',
  'memset', 'memcpy', 'memmove', 'strlen', 'strcmp', 'strcpy',
  'strcat', 'sprintf', 'fopen', 'fclose', 'fread', 'fwrite',
  'fprintf', 'fscanf', 'getchar', 'putchar', 'gets', 'puts',
  'FILE', 'size_t', 'NULL'
]

var C_EXTRA = [
  'bool', 'true', 'false', 'NULL', 'printf', 'scanf', 'malloc',
  'free', 'calloc', 'realloc', 'memcpy', 'memset', 'memmove',
  'strlen', 'strcmp', 'strcpy', 'strcat', 'sprintf', 'sscanf',
  'fopen', 'fclose', 'fread', 'fwrite', 'fprintf', 'fscanf',
  'getchar', 'putchar', 'gets', 'puts', 'FILE', 'size_t', 'ssize_t',
  'int8_t', 'int16_t', 'int32_t', 'int64_t', 'uint8_t', 'uint16_t',
  'uint32_t', 'uint64_t', 'stdint', 'stdlib', 'stdio', 'stringh',
  'assert', 'errno', 'EXIT_SUCCESS', 'EXIT_FAILURE'
]

var JAVA_KEYWORDS = [
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch',
  'char', 'class', 'continue', 'default', 'do', 'double', 'else',
  'enum', 'extends', 'final', 'finally', 'float', 'for', 'if',
  'implements', 'import', 'instanceof', 'int', 'interface', 'long',
  'native', 'new', 'package', 'private', 'protected', 'public',
  'return', 'short', 'static', 'strictfp', 'super', 'switch',
  'synchronized', 'this', 'throw', 'throws', 'transient', 'try',
  'void', 'volatile', 'while', 'true', 'false', 'null',
  'Main', 'String', 'System', 'out', 'println', 'print', 'printf',
  'Scanner', 'InputStream', 'OutputStream', 'BufferedReader',
  'InputStreamReader', 'IOException', 'Exception', 'RuntimeException',
  'Math', 'Arrays', 'Collections', 'ArrayList', 'LinkedList',
  'HashMap', 'HashSet', 'TreeMap', 'TreeSet', 'Stack',
  'Queue', 'Deque', 'PriorityQueue', 'StringBuilder', 'StringBuffer',
  'Integer', 'Long', 'Double', 'Float', 'Boolean', 'Character',
  'parseInt', 'parseLong', 'parseDouble', 'toString', 'equals',
  'hashCode', 'compareTo', 'length', 'charAt', 'substring',
  'indexOf', 'split', 'trim', 'toLowerCase', 'toUpperCase',
  'valueOf', 'nextInt', 'nextLine', 'next', 'hasNext',
  'sort', 'binarySearch', 'add', 'remove', 'get', 'put',
  'size', 'isEmpty', 'contains'
]

var PYTHON_KEYWORDS = [
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
  'break', 'class', 'continue', 'def', 'del', 'elif', 'else',
  'except', 'finally', 'for', 'from', 'global', 'if', 'import',
  'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass',
  'raise', 'return', 'try', 'while', 'with', 'yield',
  'print', 'input', 'range', 'len', 'type', 'int', 'float',
  'str', 'list', 'dict', 'set', 'tuple', 'bool', 'map',
  'filter', 'zip', 'enumerate', 'sorted', 'reversed',
  'open', 'read', 'write', 'close', 'readlines', 'readline',
  'split', 'join', 'strip', 'replace', 'find', 'lower', 'upper',
  'append', 'extend', 'pop', 'insert', 'remove', 'index',
  'keys', 'values', 'items', 'update', 'get', 'setdefault',
  'max', 'min', 'sum', 'abs', 'round', 'pow', 'divmod',
  'ord', 'chr', 'bin', 'hex', 'oct', 'format',
  'isinstance', 'issubclass', 'hasattr', 'getattr', 'setattr',
  'Exception', 'ValueError', 'TypeError', 'KeyError', 'IndexError',
  'ZeroDivisionError', 'FileNotFoundError', 'StopIteration',
  'self', '__init__', '__str__', '__repr__', '__len__',
  'sys', 'os', 'math', 'collections', 'itertools', 'functools',
  'defaultdict', 'Counter', 'deque', 'namedtuple', 'OrderedDict'
]

var GO_KEYWORDS = [
  'break', 'case', 'chan', 'const', 'continue', 'default', 'defer',
  'else', 'fallthrough', 'for', 'func', 'go', 'goto', 'if',
  'import', 'interface', 'map', 'package', 'range', 'return',
  'select', 'struct', 'switch', 'type', 'var',
  'true', 'false', 'nil', 'iota',
  'int', 'int8', 'int16', 'int32', 'int64',
  'uint', 'uint8', 'uint16', 'uint32', 'uint64',
  'float32', 'float64', 'complex64', 'complex128',
  'byte', 'rune', 'string', 'bool', 'error',
  'make', 'new', 'append', 'copy', 'delete', 'len', 'cap',
  'panic', 'recover', 'close', 'print', 'println',
  'fmt', 'Printf', 'Println', 'Sprintf', 'Scanf', 'Scan',
  'Fprintf', 'Fprintln', 'Errorf',
  'sort', 'strings', 'strconv', 'math', 'os', 'io',
  'bufio', 'sync', 'time', 'context'
]

var JS_KEYWORDS = [
  'async', 'await', 'break', 'case', 'catch', 'class', 'const',
  'continue', 'debugger', 'default', 'delete', 'do', 'else',
  'export', 'extends', 'finally', 'for', 'function', 'if',
  'import', 'in', 'instanceof', 'let', 'new', 'of', 'return',
  'super', 'switch', 'this', 'throw', 'try', 'typeof',
  'var', 'void', 'while', 'with', 'yield',
  'true', 'false', 'null', 'undefined', 'NaN', 'Infinity',
  'console', 'log', 'error', 'warn', 'info', 'debug',
  'Array', 'Object', 'String', 'Number', 'Boolean', 'Date',
  'Math', 'JSON', 'parse', 'stringify', 'Promise',
  'Map', 'Set', 'WeakMap', 'WeakSet', 'Symbol',
  'RegExp', 'Error', 'TypeError', 'RangeError',
  'document', 'window', 'querySelector', 'getElementById',
  'addEventListener', 'removeEventListener',
  'push', 'pop', 'shift', 'unshift', 'splice', 'slice',
  'map', 'filter', 'reduce', 'forEach', 'find', 'findIndex',
  'includes', 'indexOf', 'join', 'split', 'concat',
  'sort', 'reverse', 'toString', 'toFixed', 'toPrecision',
  'trim', 'replace', 'match', 'test', 'exec',
  'then', 'catch', 'finally', 'resolve', 'reject',
  'require', 'module', 'exports', '__dirname', '__filename',
  'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval'
]

// ---------- 根据语言模式获取关键字 ----------
function getKeywordsForMode (modeName) {
  if (!modeName) return C_KEYWORDS
  var m = String(modeName)
  if (/python/i.test(m)) return PYTHON_KEYWORDS
  if (/javascript|jsx|typescript/i.test(m)) return JS_KEYWORDS
  if (/go/i.test(m)) return GO_KEYWORDS
  if (/text\/x-c\+\+src/i.test(m)) return [].concat(C_KEYWORDS, CPP_KEYWORDS, CPP_STL)
  if (/text\/x-csrc|text\/x-c\b/i.test(m)) return [].concat(C_KEYWORDS, C_EXTRA)
  if (/text\/x-java|java/i.test(m)) return JAVA_KEYWORDS
  return [].concat(C_KEYWORDS, CPP_KEYWORDS, CPP_STL)
}

// ---------- 补全函数（直接导出，由 CodeMirror.vue 传入 showHint） ----------
export default function (editor) {
  var cur = editor.getCursor()
  var token = editor.getTokenAt(cur)
  var word = token.string

  if (!word || word.length < 1 || !/^[a-zA-Z_]/.test(word)) {
    return { list: [], from: cur, to: cur }
  }

  var mode = editor.getModeAt(cur)
  var modeName = mode && mode.name ? mode.name : ''
  var keywords = getKeywordsForMode(modeName)

  var wordSet = new Set(keywords)
  var docText = editor.getValue()
  var wordRe = /\b\w{2,}\b/g
  var m
  while ((m = wordRe.exec(docText)) !== null) { wordSet.add(m[0]) }

  var list = []
  var prefix = word.toLowerCase()
  wordSet.forEach(function (w) {
    if (w === word) return
    if (w.length < 2) return
    if (w.toLowerCase().indexOf(prefix) === 0) list.push(w)
  })
  list.sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()) })

  return {
    list: list.slice(0, 30),
    from: { line: cur.line, ch: token.start },
    to: { line: cur.line, ch: token.end }
  }
}
