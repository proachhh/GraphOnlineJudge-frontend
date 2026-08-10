<template>
  <div class="code-viz-page">
    <!-- 页头 -->
    <div class="viz-header">
      <div class="header-left">
        <h2 class="header-title">代码执行可视化</h2>
        <span class="header-badge" v-if="totalSteps > 0">{{ currentStep + 1 }} / {{ totalSteps }}</span>
      </div>
      <div class="header-actions">
        <Select v-model="language" style="width: 120px" size="small">
          <Option value="python">Python</Option>
        </Select>
        <Button type="primary" @click="runVisualization" :loading="loading" size="small">
          <Icon type="ios-play"></Icon>
          开始可视化
        </Button>
      </div>
    </div>

    <!-- 进度条 -->
    <div class="progress-bar" v-if="totalSteps > 0">
      <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
    </div>

    <!-- 主体区域 -->
    <div class="viz-body">
      <!-- 左侧：代码编辑器 -->
      <div class="left-panel">
        <div class="panel-header">
          <Icon type="ios-code-working"></Icon>
          <span>代码编辑器</span>
        </div>
        <codemirror v-model="code" :options="cmOptions" class="code-editor" ref="editor"></codemirror>
        
        <div class="input-section">
          <div class="panel-header">
            <Icon type="ios-input"></Icon>
            <span>标准输入 (stdin)</span>
          </div>
          <Input v-model="stdinInput" type="textarea" :rows="3" placeholder="输入数据，每行一个值" />
        </div>

        <div class="example-section">
          <span class="example-label">示例代码：</span>
          <Button v-for="ex in examples" :key="ex.name" size="small" @click="loadExample(ex)" style="margin-right: 6px; margin-bottom: 4px;">
            {{ ex.name }}
          </Button>
        </div>
      </div>

      <!-- 右侧：可视化区域 -->
      <div class="right-panel">
        <!-- 空状态 -->
        <div class="empty-state" v-if="steps.length === 0 && !loading">
          <Icon type="ios-code" size="60" color="#cbd5e1"></Icon>
          <p>输入代码后点击「开始可视化」</p>
          <p class="sub-text">逐步查看变量变化、调用栈和输出</p>
        </div>

        <!-- 加载中 -->
        <div class="loading-state" v-if="loading">
          <Spin size="large"></Spin>
          <p>正在执行代码并捕获执行轨迹...</p>
        </div>

        <!-- 可视化内容 -->
        <div class="viz-content" v-if="steps.length > 0 && !loading">
          <!-- 上半部分：代码高亮 + 变量 -->
          <div class="viz-top">
            <!-- 代码高亮显示 -->
            <div class="code-display">
              <div class="panel-header">
                <Icon type="ios-eye"></Icon>
                <span>执行位置</span>
                <span class="line-badge" v-if="currentStepData">第 {{ currentStepData.line }} 行</span>
              </div>
              <div class="code-lines" ref="codeLines">
                <div 
                  v-for="(line, idx) in codeLines" 
                  :key="idx"
                  class="code-line"
                  :class="{ 
                    'current-line': currentStepData && idx + 1 === currentStepData.line,
                    'error-line': currentStepData && currentStepData.type === 'error' && idx + 1 === currentStepData.line
                  }"
                >
                  <span class="line-num">{{ idx + 1 }}</span>
                  <span class="line-content">{{ line || ' ' }}</span>
                </div>
              </div>
            </div>

            <!-- 变量面板 -->
            <div class="var-panel">
              <!-- 变量表 -->
              <div class="panel-header">
                <Icon type="ios-filing"></Icon>
                <span>变量状态</span>
              </div>
              <div class="var-table" v-if="currentVars && Object.keys(currentVars).length > 0">
                <div class="var-row" v-for="(v, k) in currentVars" :key="k">
                  <span class="var-name">{{ k }}</span>
                  <span class="var-type">{{ v.type }}</span>
                  <span class="var-value">{{ v.value }}</span>
                </div>
              </div>
              <div class="var-empty" v-else>
                <Icon type="ios-folder-outline" size="32" color="#cbd5e1"></Icon>
                <p>当前无变量</p>
              </div>

              <!-- 调用栈 -->
              <div class="panel-header" style="margin-top: 12px;">
                <Icon type="ios-list"></Icon>
                <span>调用栈</span>
                <span class="stack-badge" v-if="currentStepData">{{ callStackDepth }}</span>
              </div>
              <div class="stack-list" v-if="currentStepData && currentStepData.stack && currentStepData.stack.length > 0">
                <div class="stack-item" v-for="(s, i) in currentStepData.stack" :key="i">
                  <span class="stack-fn">{{ s.function }}</span>
                  <span class="stack-line">@ L{{ s.line }}</span>
                </div>
              </div>
              <div class="var-empty" v-else>
                <p style="color: #94a3b8; font-size: 12px;">全局作用域</p>
              </div>
            </div>
          </div>

          <!-- 控制台输出 -->
          <div class="console-output">
            <div class="panel-header">
              <Icon type="ios-terminal"></Icon>
              <span>控制台输出</span>
              <Button size="small" type="text" @click="copyOutput" v-if="currentOutput">
                <Icon type="ios-copy"></Icon>
              </Button>
            </div>
            <pre class="console-text">{{ currentOutput || '（无输出）' }}</pre>
          </div>

          <!-- 播放控制 -->
          <div class="playback-controls">
            <div class="control-group">
              <Button @click="reset" size="small" title="重置">
                <Icon type="ios-skipbackward"></Icon>
              </Button>
              <Button @click="stepBack" size="small" :disabled="currentStep === 0" title="上一步">
                <Icon type="ios-arrow-back"></Icon>
              </Button>
              <Button @click="togglePlay" type="primary" size="small" v-if="!isPlaying">
                <Icon type="ios-play"></Icon>
              </Button>
              <Button @click="togglePlay" size="small" v-else>
                <Icon type="ios-pause"></Icon>
              </Button>
              <Button @click="stepForward" size="small" :disabled="currentStep >= totalSteps - 1" title="下一步">
                <Icon type="ios-arrow-forward"></Icon>
              </Button>
              <Button @click="jumpToEnd" size="small" :disabled="currentStep >= totalSteps - 1" title="跳到末尾">
                <Icon type="ios-skipforward"></Icon>
              </Button>
            </div>
            <div class="speed-control">
              <span class="speed-label">速度</span>
              <Slider v-model="playSpeed" :min="1" :max="10" :step="1" style="width: 120px;"></Slider>
              <span class="speed-value">{{ playSpeed }}x</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { codemirror } from 'vue-codemirror-lite'
import 'codemirror/theme/material.css'
import 'codemirror/mode/python/python.js'
import 'codemirror/addon/edit/closebrackets.js'
import 'codemirror/addon/edit/matchbrackets.js'
import api from '@oj/api'

export default {
  components: { codemirror },
  data () {
    return {
      code: `# 示例：冒泡排序
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

nums = [64, 34, 25, 12, 22, 11, 90]
result = bubble_sort(nums)
print("排序结果:", result)`,
      stdinInput: '',
      language: 'python',
      loading: false,
      steps: [],
      currentStep: 0,
      isPlaying: false,
      playTimer: null,
      playSpeed: 5,
      cmOptions: {
        mode: 'python',
        theme: 'material',
        lineNumbers: true,
        tabSize: 4,
        indentUnit: 4,
        autoCloseBrackets: true,
        matchBrackets: true
      },
      examples: [
        {
          name: '冒泡排序',
          code: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

nums = [64, 34, 25, 12, 22, 11, 90]
result = bubble_sort(nums)
print("排序结果:", result)`
        },
        {
          name: '递归阶乘',
          code: `def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

result = factorial(5)
print(f"5! = {result}")`
        },
        {
          name: '斐波那契',
          code: `def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)

for i in range(8):
    print(f"fib({i}) = {fib(i)}")`
        },
        {
          name: '二分查找',
          code: `def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1

arr = [1, 3, 5, 7, 9, 11, 13, 15]
idx = binary_search(arr, 7)
print(f"找到索引: {idx}")`
        },
        {
          name: '输入交互',
          code: `n = int(input("请输入n: "))
total = 0
for i in range(1, n + 1):
    total += i
print(f"1到{n}的和: {total}")`
        }
      ]
    }
  },
  computed: {
    totalSteps () {
      return this.steps.length
    },
    currentStepData () {
      return this.steps[this.currentStep] || null
    },
    codeLines () {
      return this.code.split('\n')
    },
    currentVars () {
      if (!this.currentStepData) return {}
      return this.currentStepData.locals || {}
    },
    currentOutput () {
      if (!this.currentStepData) return ''
      return this.currentStepData.output || ''
    },
    callStackDepth () {
      if (!this.currentStepData || !this.currentStepData.stack) return 0
      return this.currentStepData.stack.length
    },
    progressPercent () {
      if (this.totalSteps === 0) return 0
      return Math.round(((this.currentStep + 1) / this.totalSteps) * 100)
    }
  },
  methods: {
    async runVisualization () {
      if (!this.code.trim()) {
        this.$Message.warning('请输入代码')
        return
      }
      this.loading = true
      this.steps = []
      this.currentStep = 0
      this.isPlaying = false
      if (this.playTimer) {
        clearInterval(this.playTimer)
        this.playTimer = null
      }
      try {
        const res = await api.visualizeCode({
          code: this.code,
          input: this.stdinInput
        })
        this.steps = res.data.steps || []
        if (this.steps.length === 0) {
          this.$Message.warning('未捕获到执行步骤')
        } else {
          this.$Message.success(`已捕获 ${this.steps.length} 个执行步骤`)
        }
      } catch (err) {
        const msg = (err && err.data && err.data.error) || '执行失败'
        this.$Message.error(msg)
      } finally {
        this.loading = false
      }
    },
    togglePlay () {
      if (this.isPlaying) {
        this.isPlaying = false
        if (this.playTimer) {
          clearInterval(this.playTimer)
          this.playTimer = null
        }
      } else {
        if (this.currentStep >= this.totalSteps - 1) {
          this.currentStep = 0
        }
        this.isPlaying = true
        const interval = Math.max(100, 1100 - this.playSpeed * 100)
        this.playTimer = setInterval(() => {
          if (this.currentStep >= this.totalSteps - 1) {
            this.isPlaying = false
            clearInterval(this.playTimer)
            this.playTimer = null
            return
          }
          this.currentStep++
        }, interval)
      }
    },
    stepForward () {
      if (this.currentStep < this.totalSteps - 1) {
        this.currentStep++
      }
    },
    stepBack () {
      if (this.currentStep > 0) {
        this.currentStep--
      }
    },
    reset () {
      this.currentStep = 0
      this.isPlaying = false
      if (this.playTimer) {
        clearInterval(this.playTimer)
        this.playTimer = null
      }
    },
    jumpToEnd () {
      this.currentStep = this.totalSteps - 1
      this.isPlaying = false
      if (this.playTimer) {
        clearInterval(this.playTimer)
        this.playTimer = null
      }
    },
    loadExample (ex) {
      this.code = ex.code
      this.steps = []
      this.currentStep = 0
    },
    copyOutput () {
      navigator.clipboard.writeText(this.currentOutput)
      this.$Message.success('已复制到剪贴板')
    },
    scrollToCurrentLine () {
      this.$nextTick(() => {
        const el = this.$refs.codeLines && this.$refs.codeLines.querySelector('.current-line')
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      })
    }
  },
  watch: {
    currentStep () {
      this.scrollToCurrentLine()
    }
  },
  mounted () {
    const savedCode = sessionStorage.getItem('viz_code')
    if (savedCode) {
      this.code = savedCode
      sessionStorage.removeItem('viz_code')
    }
  },
  beforeDestroy () {
    if (this.playTimer) {
      clearInterval(this.playTimer)
    }
  }
}
</script>

<style lang="less" scoped>
.code-viz-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 80px 20px 20px;
  box-sizing: border-box;
  background: #f0f2f5;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.viz-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 0 12px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .header-title {
      font-size: 22px;
      font-weight: 700;
      color: #1e3a8a;
      margin: 0;
    }

    .header-badge {
      background: #1e3a8a;
      color: #fff;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
    }
  }

  .header-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }
}

.progress-bar {
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 12px;

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #1e3a8a, #3b82f6);
    border-radius: 2px;
    transition: width 0.3s ease;
  }
}

.viz-body {
  flex: 1;
  display: flex;
  gap: 16px;
  overflow: hidden;
}

.left-panel {
  width: 45%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;

  .code-editor {
    flex: 1;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    min-height: 200px;
  }

  .input-section {
    flex-shrink: 0;
  }

  .example-section {
    flex-shrink: 0;
    padding: 8px 0;

    .example-label {
      font-size: 13px;
      color: #64748b;
      margin-right: 8px;
    }
  }
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}

.empty-state, .loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;

  p {
    color: #64748b;
    font-size: 15px;
    margin: 0;
  }

  .sub-text {
    font-size: 13px;
    color: #94a3b8;
  }
}

.viz-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}

.viz-top {
  flex: 1;
  display: flex;
  gap: 12px;
  overflow: hidden;
  min-height: 0;
}

.code-display {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .code-lines {
    flex: 1;
    overflow: auto;
    font-family: 'Fira Code', 'Consolas', monospace;
    font-size: 13px;
    line-height: 1.6;
    padding: 8px 0;
    background: #1e293b;
    color: #e2e8f0;
  }

  .code-line {
    display: flex;
    padding: 0 12px;
    transition: background 0.2s ease;

    &.current-line {
      background: rgba(251, 191, 36, 0.2);
      border-left: 3px solid #fbbf24;
      padding-left: 9px;
    }

    &.error-line {
      background: rgba(239, 68, 68, 0.2);
      border-left: 3px solid #ef4444;
      padding-left: 9px;
    }

    .line-num {
      width: 32px;
      text-align: right;
      color: #64748b;
      margin-right: 12px;
      user-select: none;
      flex-shrink: 0;
    }

    .line-content {
      white-space: pre;
      color: #e2e8f0;
    }
  }
}

.var-panel {
  width: 320px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 12px;
  display: flex;
  flex-direction: column;
  overflow: auto;

  .var-table {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .var-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    background: #f8fafc;
    border-radius: 6px;
    border: 1px solid #f1f5f9;
    transition: all 0.2s ease;

    &:hover {
      border-color: #c7d2fe;
    }

    .var-name {
      font-weight: 600;
      color: #1e3a8a;
      font-size: 13px;
      min-width: 50px;
    }

    .var-type {
      font-size: 11px;
      color: #64748b;
      background: #e0e7ff;
      padding: 1px 6px;
      border-radius: 8px;
    }

    .var-value {
      flex: 1;
      font-family: 'Fira Code', monospace;
      font-size: 13px;
      color: #0f172a;
      word-break: break-all;
    }
  }

  .var-empty {
    text-align: center;
    padding: 16px;
    color: #94a3b8;

    p {
      margin: 4px 0 0;
      font-size: 13px;
    }
  }

  .stack-list {
    display: flex;
    flex-direction: column;
    gap: 3px;
    margin-top: 4px;
  }

  .stack-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 10px;
    background: #eff6ff;
    border-radius: 4px;
    border-left: 3px solid #3b82f6;
    font-size: 12px;

    .stack-fn {
      font-weight: 600;
      color: #1e3a8a;
    }

    .stack-line {
      color: #64748b;
      margin-left: auto;
    }
  }
}

.console-output {
  height: 160px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .console-text {
    flex: 1;
    overflow: auto;
    padding: 8px 12px;
    margin: 0;
    font-family: 'Fira Code', 'Consolas', monospace;
    font-size: 13px;
    line-height: 1.5;
    color: #e2e8f0;
    background: #1e293b;
    white-space: pre-wrap;
    word-break: break-all;
  }
}

.playback-controls {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;

  .control-group {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .speed-control {
    display: flex;
    align-items: center;
    gap: 8px;

    .speed-label {
      font-size: 13px;
      color: #64748b;
    }

    .speed-value {
      font-size: 13px;
      font-weight: 600;
      color: #1e3a8a;
      min-width: 24px;
    }
  }
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 600;
  color: #1e3a8a;
  border-bottom: 1px solid #f1f5f9;

  .line-badge {
    margin-left: auto;
    font-size: 12px;
    font-weight: 600;
    color: #f59e0b;
    background: #fef3c7;
    padding: 1px 8px;
    border-radius: 10px;
  }

  .stack-badge {
    margin-left: auto;
    font-size: 12px;
    color: #3b82f6;
    background: #dbeafe;
    padding: 1px 8px;
    border-radius: 10px;
  }
}
</style>
