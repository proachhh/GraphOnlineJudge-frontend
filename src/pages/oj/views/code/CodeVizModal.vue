<template>
  <Modal v-model="showModal" :width="1200" :styles="{ top: '20px' }" :closable="true" :mask-closable="false" class-name="code-viz-modal">
    <div slot="header" class="modal-header">
      <span class="header-title">代码执行可视化</span>
      <span class="header-badge" v-if="totalSteps > 0">{{ currentStep + 1 }} / {{ totalSteps }}</span>
      <span class="step-type-badge" v-if="currentStepData && currentStepData.type !== 'end'" :class="'badge-' + currentStepData.type">{{ stepTypeLabel }}</span>
    </div>
    <div class="viz-body">
      <!-- 空状态 -->
      <div class="empty-state" v-if="steps.length === 0 && !loading">
        <Icon type="ios-code" size="50" color="#cbd5e1"></Icon>
        <p>点击「开始可视化」逐步查看代码执行过程</p>
      </div>
      <!-- 加载中 -->
      <div class="loading-state" v-if="loading">
        <Spin size="large"></Spin>
        <p>正在执行代码并捕获执行轨迹...</p>
      </div>
      <!-- 可视化内容 -->
      <template v-if="steps.length > 0 && !loading">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <div class="viz-content">
          <div class="viz-top">
            <!-- 代码高亮 -->
            <div class="code-display">
              <div class="panel-header">
                <Icon type="ios-eye" color="#1e3a8a"></Icon>
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
            <!-- 变量 + 调用栈 -->
            <div class="var-panel">
              <div class="panel-header">
                <Icon type="ios-filing" color="#1e3a8a"></Icon>
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
                <p style="color: #94a3b8; font-size: 14px;">当前无局部变量</p>
              </div>
              <div class="panel-header" style="margin-top: 10px;">
                <Icon type="ios-list" color="#1e3a8a"></Icon>
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
                <p style="color: #94a3b8; font-size: 14px;">全局作用域</p>
              </div>
            </div>
          </div>
          <!-- 控制台输出 -->
          <div class="console-output">
            <div class="panel-header">
              <Icon type="ios-terminal" color="#1e3a8a"></Icon>
              <span>控制台输出</span>
            </div>
            <pre class="console-text">{{ currentOutput || '（无输出）' }}</pre>
          </div>
          <!-- 播放控制 -->
          <div class="playback-controls">
            <div class="control-group">
              <Button @click="reset" size="small"><Icon type="ios-skipbackward"></Icon></Button>
              <Button @click="stepBack" size="small" :disabled="currentStep === 0"><Icon type="ios-arrow-back"></Icon></Button>
              <Button @click="togglePlay" type="primary" size="small" v-if="!isPlaying"><Icon type="ios-play"></Icon></Button>
              <Button @click="togglePlay" size="small" v-else><Icon type="ios-pause"></Icon></Button>
              <Button @click="stepForward" size="small" :disabled="currentStep >= totalSteps - 1"><Icon type="ios-arrow-forward"></Icon></Button>
              <Button @click="jumpToEnd" size="small" :disabled="currentStep >= totalSteps - 1"><Icon type="ios-skipforward"></Icon></Button>
            </div>
            <div class="speed-control">
              <span class="speed-label">速度</span>
              <Slider v-model="playSpeed" :min="1" :max="10" :step="1" style="width: 100px;"></Slider>
              <span class="speed-value">{{ playSpeed }}x</span>
            </div>
          </div>
        </div>
      </template>
    </div>
    <div slot="footer">
      <Button @click="runVisualization" type="primary" :loading="loading" v-if="steps.length === 0 || currentStep >= totalSteps - 1 || codeChanged">
        <Icon type="ios-play"></Icon>
        重新可视化
      </Button>
      <Button @click="showModal = false">关闭</Button>
    </div>
  </Modal>
</template>

<script>
import api from '@oj/api'

export default {
  props: {
    visible: { type: Boolean, default: false },
    code: { type: String, default: '' }
  },
  data () {
    return {
      loading: false,
      steps: [],
      currentStep: 0,
      isPlaying: false,
      playTimer: null,
      playSpeed: 5,
      lastVizCode: ''
    }
  },
  computed: {
    showModal: {
      get () { return this.visible },
      set (val) { this.$emit('update:visible', val) }
    },
    totalSteps () { return this.steps.length },
    currentStepData () { return this.steps[this.currentStep] || null },
    codeChanged () { return this.lastVizCode !== '' && this.code !== this.lastVizCode },
    stepTypeLabel () {
      if (!this.currentStepData) return ''
      var s = this.currentStepData
      if (s.type === 'call') return '调用 ' + (s.function || '')
      if (s.type === 'return') return '返回 ' + (s.function || '') + ' → ' + (s.return_value || 'None')
      if (s.type === 'exception') return '异常: ' + (s.exception || '')
      if (s.type === 'line') return '执行'
      return s.type
    },
    codeLines () { return this.code.split('\n') },
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
      if (!this.code || !this.code.trim()) {
        this.$Message.warning('请先输入代码')
        return
      }
      this.loading = true
      this.steps = []
      this.currentStep = 0
      this.isPlaying = false
      this.lastVizCode = this.code
      if (this.playTimer) { clearInterval(this.playTimer); this.playTimer = null }
      try {
        const res = await api.visualizeCode({ code: this.code, input: '' })
        this.steps = res.data.steps || []
        if (this.steps.length === 0) {
          this.$Message.warning('未捕获到执行步骤')
        } else {
          this.$Message.success('已捕获 ' + this.steps.length + ' 个执行步骤')
        }
      } catch (err) {
        this.$Message.error((err && err.data && err.data.error) || '执行失败')
      } finally {
        this.loading = false
      }
    },
    togglePlay () {
      if (this.isPlaying) {
        this.isPlaying = false
        if (this.playTimer) { clearInterval(this.playTimer); this.playTimer = null }
      } else {
        if (this.currentStep >= this.totalSteps - 1) this.currentStep = 0
        this.isPlaying = true
        var self = this
        var interval = Math.max(100, 1100 - this.playSpeed * 100)
        this.playTimer = setInterval(function () {
          if (self.currentStep >= self.totalSteps - 1) {
            self.isPlaying = false
            clearInterval(self.playTimer)
            self.playTimer = null
            return
          }
          self.currentStep++
        }, interval)
      }
    },
    stepForward () { if (this.currentStep < this.totalSteps - 1) this.currentStep++ },
    stepBack () { if (this.currentStep > 0) this.currentStep-- },
    reset () {
      this.currentStep = 0
      this.isPlaying = false
      if (this.playTimer) { clearInterval(this.playTimer); this.playTimer = null }
    },
    jumpToEnd () {
      this.currentStep = this.totalSteps - 1
      this.isPlaying = false
      if (this.playTimer) { clearInterval(this.playTimer); this.playTimer = null }
    },
    scrollToCurrentLine () {
      var self = this
      this.$nextTick(function () {
        var el = self.$refs.codeLines && self.$refs.codeLines.querySelector('.current-line')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    }
  },
  watch: {
    currentStep () { this.scrollToCurrentLine() },
    visible (val) {
      if (val && this.code) {
        if (this.code !== this.lastVizCode) {
          this.runVisualization()
        }
      }
      if (!val) {
        this.isPlaying = false
        if (this.playTimer) { clearInterval(this.playTimer); this.playTimer = null }
      }
    }
  },
  beforeDestroy () {
    if (this.playTimer) clearInterval(this.playTimer)
  }
}
</script>

<style lang="less" scoped>
.modal-header {
  display: flex;
  align-items: center;
  gap: 10px;

  .header-title {
    font-size: 22px;
    font-weight: 700;
    color: #1e3a8a;
  }

  .header-badge {
    background: #1e3a8a;
    color: #fff;
    padding: 3px 12px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
  }

  .step-type-badge {
    padding: 3px 12px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;

    &.badge-call { background: #dbeafe; color: #1e3a8a; }
    &.badge-return { background: #dcfce7; color: #166534; }
    &.badge-line { background: #fef3c7; color: #92400e; }
    &.badge-exception { background: #fee2e2; color: #991b1b; }
  }
}

.viz-body {
  min-height: 400px;
}

.empty-state, .loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  gap: 12px;

  p {
    color: #64748b;
    font-size: 16px;
  }
}

.progress-bar {
  height: 3px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 10px;

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #1e3a8a, #3b82f6);
    border-radius: 2px;
    transition: width 0.3s ease;
  }
}

.viz-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.viz-top {
  display: flex;
  gap: 10px;
  height: 380px;
}

.code-display {
  flex: 1;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .code-lines {
    flex: 1;
    overflow: auto;
    font-family: 'Fira Code', 'Consolas', monospace;
    font-size: 15px;
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
  border: 1px solid #e2e8f0;
  border-radius: 8px;
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

    .var-name {
      font-weight: 600;
      color: #1e3a8a;
      font-size: 14px;
      min-width: 50px;
    }

    .var-type {
      font-size: 12px;
      color: #64748b;
      background: #e0e7ff;
      padding: 2px 7px;
      border-radius: 6px;
    }

    .var-value {
      flex: 1;
      font-family: 'Fira Code', monospace;
      font-size: 14px;
      color: #0f172a;
      word-break: break-all;
    }
  }

  .var-empty {
    text-align: center;
    padding: 8px;
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
    padding: 5px 10px;
    background: #eff6ff;
    border-radius: 5px;
    border-left: 3px solid #3b82f6;
    font-size: 14px;

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
  height: 140px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .console-text {
    flex: 1;
    overflow: auto;
    padding: 8px 12px;
    margin: 0;
    font-family: 'Fira Code', monospace;
    font-size: 15px;
    line-height: 1.5;
    color: #e2e8f0;
    background: #1e293b;
    white-space: pre-wrap;
    word-break: break-all;
  }
}

.playback-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;

  .control-group {
    display: flex;
    gap: 5px;
    align-items: center;
  }

  .speed-control {
    display: flex;
    align-items: center;
    gap: 8px;

    .speed-label {
      font-size: 14px;
      color: #64748b;
    }

    .speed-value {
      font-size: 14px;
      font-weight: 600;
      color: #1e3a8a;
      min-width: 20px;
    }
  }
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 16px;
  font-weight: 600;
  color: #1e3a8a;
  border-bottom: 1px solid #f1f5f9;

  .line-badge {
    margin-left: auto;
    font-size: 13px;
    color: #f59e0b;
    background: #fef3c7;
    padding: 2px 8px;
    border-radius: 8px;
  }

  .stack-badge {
    margin-left: auto;
    font-size: 13px;
    color: #3b82f6;
    background: #dbeafe;
    padding: 2px 8px;
    border-radius: 8px;
  }
}
</style>

<style lang="less">
.code-viz-modal .ivu-modal-body {
  padding: 12px;
}
</style>
