<template>
  <div class="global-sidebar-container">
    <!-- 侧边栏主体 -->
    <div
      class="global-sidebar"
      :class="{ collapsed: isCollapsed, dragging: sidebarDragging }"
      :style="{ top: sidebarPos.y + 'px', left: sidebarPos.x + 'px' }"
      @mousedown="onSidebarMouseDown"
    >
      <img v-if="isCollapsed" src="@/assets/logo3.png" class="collapsed-logo" @click.stop="toggleSidebarLocal" />
      <template v-else>
      <div class="sidebar-toggle" :class="{ 'toggle-left': sidebarSnapped === 'right' }" @click.stop="toggleSidebarLocal">
        <Icon :type="sidebarSnapped === 'left' ? 'ios-arrow-back' : 'ios-arrow-forward'" size="16" />
      </div>
      <div class="sidebar-content">
        <div class="menu-item" @click.stop="openAIChat">
          <div class="menu-icon" style="background: linear-gradient(135deg, #1e3a8a, #3b82f6);">
            <Icon type="chatbubble-working" size="18" color="#fff" />
          </div>
          <span class="menu-text">AI Chat</span>
        </div>
        <div class="menu-item" @click.stop="openCodeEditor">
          <div class="menu-icon" style="background: linear-gradient(135deg, #1e40af, #6366f1);">
            <Icon type="ios-paper" size="18" color="#fff" />
          </div>
          <span class="menu-text">{{ $t('m.Code_Editor') }}</span>
        </div>
        <div class="menu-item" @click.stop="openFeedback">
          <div class="menu-icon" style="background: linear-gradient(135deg, #1e3a8a, #3b82f6);">
            <Icon type="ios-flag" size="18" color="#fff" />
          </div>
          <span class="menu-text">{{ $t('m.Feedback') }}</span>
        </div>
      </div>
      </template>
    </div>

    <!-- AI Chat 面板 -->
    <div
      v-if="showAIChat"
      class="side-panel ai-panel"
      :style="`
        left: ${aiPanelPos.x}px !important;
        top: ${aiPanelPos.y}px !important;
        width: ${aiPanelSize.w}px !important;
        height: ${aiPanelSize.h}px !important;
      `"
    >
      <div class="panel-header" @mousedown="startDrag($event, 'ai')">
        <Icon type="chatbubble-working" size="18" color="#3b82f6" style="margin-right: 6px;" />
        <h3>{{ aiFullName }}</h3>
        <div class="panel-actions">
          <Select v-model="chatState.aiModel" size="small" class="model-select" @on-change="onModelChange">
            <Option value="agent">
              <img src="~@/assets/logo3.png" class="model-option-icon" />
              Agent
            </Option>
            <Option value="spark">
              <img src="/static/pictures/xh.png" class="model-option-icon" />
              Spark
            </Option>
            <Option value="deepseek">
              <img src="/static/pictures/ds.png" class="model-option-icon" />
              DeepSeek
            </Option>
          </Select>
          <Button type="text" size="small" @click="openFullscreen('ai')" :title="$t('m.Fullscreen')">
            <Icon type="ios-expand" size="16" color="#fff" />
          </Button>
          <Button type="text" size="small" @click="closeAIChat">
            <Icon type="ios-close" size="16" color="#fff" />
          </Button>
        </div>
      </div>
      <div class="panel-content">
        <div class="message-container" ref="aiMessageList">
          <div v-if="chatState.messages.length === 0" class="welcome-section">
            <div class="welcome-icon">
              <img :src="aiAvatar" :alt="aiDisplayName" :key="aiAvatar" />
            </div>
            <h3>{{ aiWelcomeTitle }}</h3>
            <p>{{ aiWelcomeDesc }}</p>
          </div>
          <template v-else>
              <MessageItem
                v-for="(msg, idx) in chatState.messages"
                :key="idx"
                :role="msg.role"
                :content="msg.content"
                :agent-name="msg.agentName"
                :thinking-steps="msg.thinkingSteps"
                :all-steps-done="msg.allStepsDone"
                :current-step-index="msg.currentStepIndex"
                :ai-avatar="aiAvatar"
                :ai-name="aiDisplayName"
                :display-type="msg.displayType"
                :display-data="msg.displayData"
              />
            </template>
        </div>
        <div class="input-area">
          <Input v-model="chatState.inputText" type="textarea" :rows="3"
            :placeholder="chatState.messages.length === 0 ? $t('m.Enter_Your_Question_Start') : $t('m.Enter_Your_Question')"
            @on-keydown="handleAIKeydown" />
          <div style="display:flex; gap: 6px;">
            <Button v-if="aiSending" type="warning" size="small" @click="stopAIGeneration">
              <Icon type="ios-close-circle" /> 停止
            </Button>
            <Button type="primary" long @click="sendAIMessage" :loading="aiSending" :disabled="!chatState.inputText.trim()">
              <Icon type="ios-send" /> {{ $t('m.Send') }}
            </Button>
          </div>
        </div>
      </div>
      <div class="resize-handle resize-right" @mousedown="startResize($event, 'ai', 'right')"></div>
      <div class="resize-handle resize-bottom" @mousedown="startResize($event, 'ai', 'bottom')"></div>
      <div class="resize-handle resize-corner" @mousedown="startResize($event, 'ai', 'corner')"></div>
    </div>

    <!-- 代码编辑器面板 -->
    <div
      v-if="showCodeEditor"
      class="side-panel editor-panel"
      :style="`
        left: ${editorPanelPos.x}px !important;
        top: ${editorPanelPos.y}px !important;
        width: ${editorPanelSize.w}px !important;
        height: ${editorPanelSize.h}px !important;
      `"
    >
      <div class="panel-header" @mousedown="startDrag($event, 'editor')">
        <Icon type="ios-paper" size="18" color="#3b82f6" style="margin-right: 6px;" />
        <h3>{{ $t('m.Code_Editor') }}</h3>
        <div class="panel-actions">
          <Button type="text" size="small" @click="openFullscreen('editor')" :title="$t('m.Fullscreen')">
            <Icon type="ios-expand" size="16" color="#fff" />
          </Button>
          <Button type="text" size="small" @click="closeCodeEditor">
            <Icon type="ios-close" size="16" color="#fff" />
          </Button>
        </div>
      </div>
      <div class="panel-content">
        <div class="editor-controls">
          <Select v-model="editorLanguage" style="width: 120px;">
            <Option value="C++">C++</Option>
            <Option value="C">C</Option>
            <Option value="Java">Java</Option>
            <Option value="Python">Python</Option>
          </Select>
          <Select v-model="editorTheme" style="width: 120px;">
            <Option value="monokai">Monokai</Option>
            <Option value="solarized">Solarized</Option>
            <Option value="material">Material</Option>
          </Select>
        </div>
        <codemirror v-model="editorCode" :options="editorOptions" ref="codeEditor" class="code-editor" />
        <div class="editor-input-area">
          <label>Input (stdin)</label>
          <Input v-model="editorInput" type="textarea" :rows="2" placeholder="输入你的测试数据..." />
        </div>
        <div class="editor-actions">
          <Button type="primary" @click="runCode" :loading="runningCode">
            <Icon type="ios-play" /> {{ $t('m.Run_Code') }}
          </Button>
          <Button @click="clearCode">
            <Icon type="ios-trash" /> {{ $t('m.Clear') }}
          </Button>
        </div>
        <div v-if="runResult" class="run-result">
          <h4>{{ $t('m.Run_Result') }}</h4>
          <pre :class="runResult.error ? 'error' : 'success'">{{ runResult.output }}</pre>
        </div>
      </div>
      <div class="resize-handle resize-right" @mousedown="startResize($event, 'editor', 'right')"></div>
      <div class="resize-handle resize-bottom" @mousedown="startResize($event, 'editor', 'bottom')"></div>
      <div class="resize-handle resize-corner" @mousedown="startResize($event, 'editor', 'corner')"></div>
    </div>

    <!-- 反馈面板 -->
    <div
      v-if="showFeedback"
      class="side-panel feedback-panel"
      :style="`
        left: ${feedbackPanelPos.x}px !important;
        top: ${feedbackPanelPos.y}px !important;
        width: ${feedbackPanelSize.w}px !important;
        height: ${feedbackPanelSize.h}px !important;
      `"
    >
      <div class="panel-header" @mousedown="startDrag($event, 'feedback')">
        <Icon type="ios-flag" size="18" color="#3b82f6" style="margin-right: 6px;" />
        <h3>{{ $t('m.Feedback') }}</h3>
        <div class="panel-actions">
          <Button type="text" size="small" @click="closeFeedback">
            <Icon type="ios-close" size="16" color="#fff" />
          </Button>
        </div>
      </div>
      <div class="panel-content feedback-content">
        <div class="feedback-form">
          <Input v-model="feedbackTitle" :placeholder="$t('m.Feedback_Title')" class="feedback-title-input" />
          <textarea ref="feedbackEditor" class="feedback-editor-textarea"></textarea>
          <Button type="primary" long @click="submitFeedback" :loading="submittingFeedback" :disabled="!feedbackTitle.trim()">
            <Icon type="ios-send" /> {{ $t('m.Submit') }}
          </Button>
        </div>
      </div>
      <div class="resize-handle resize-right" @mousedown="startResize($event, 'feedback', 'right')"></div>
      <div class="resize-handle resize-bottom" @mousedown="startResize($event, 'feedback', 'bottom')"></div>
      <div class="resize-handle resize-corner" @mousedown="startResize($event, 'feedback', 'corner')"></div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import { codemirror } from 'vue-codemirror-lite'
import MessageItem from '@oj/views/chat/components/MessageItem.vue'
import { formatAgentResponse, extractAgentDisplay } from '@oj/views/chat/utils.js'
import chatState from '@oj/views/chat/chatState.js'

import 'codemirror/theme/monokai.css'
import 'codemirror/theme/solarized.css'
import 'codemirror/theme/material.css'
import 'codemirror/mode/clike/clike.js'
import 'codemirror/mode/python/python.js'
import 'codemirror/mode/javascript/javascript.js'

import Simditor from 'tar-simditor'
import 'tar-simditor/styles/simditor.css'

export default {
  name: 'GlobalSidebar',
  components: {
    codemirror,
    MessageItem
  },
  data () {
    return {
      showAIChat: false,
      showCodeEditor: false,

      sidebarPos: { x: 16, y: 0 },
      sidebarDragging: false,
      sideDragPending: false,
      sideDragStart: { x: 0, y: 0, barX: 0, barY: 0 },
      sideDragTimer: null,
      sideDragOccurred: false,
      sidebarSnapped: 'right',

      chatState,
      aiSending: false,
      aiAbortController: null,
      aiPanelPos: { x: 180, y: 80 },
      aiPanelSize: { w: 380, h: 520 },

      editorCode: this.$t('m.Write_Code_Here'),
      editorLanguage: 'C++',
      editorTheme: 'monokai',
      runningCode: false,
      runResult: null,
      editorPanelPos: { x: 180, y: 80 },
      editorPanelSize: { w: 380, h: 520 },

      dragging: null,
      panelDragPending: null,
      panelDragTimer: null,
      dragStart: { x: 0, y: 0, panelX: 0, panelY: 0 },
      resizing: null,
      resizeStart: { x: 0, y: 0, w: 0, h: 0 },

      pollingTimer: null,
      pollingTimeout: null,

      editorInput: '',   // 新增：用户输入

      showFeedback: false,
      feedbackTitle: '',
      feedbackEditor: null,
      submittingFeedback: false,
      feedbackPanelPos: { x: 180, y: 80 },
      feedbackPanelSize: { w: 420, h: 480 },
    }
  },
  computed: {
    ...mapState(['sidebarCollapsed']),
    isCollapsed: {
      get () {
        return this.sidebarCollapsed
      },
      set (val) {
        this.toggleSidebar({ collapsed: val })
      }
    },
    aiAvatar () {
      if (this.chatState.aiModel === 'agent') return require('@/assets/logo3.png')
      return this.chatState.aiModel === 'deepseek' ? '/static/pictures/ds.png' : '/static/pictures/xh.png'
    },
    aiDisplayName () {
      if (this.chatState.aiModel === 'agent') return 'OJ Agent'
      return this.chatState.aiModel === 'deepseek' ? 'DeepSeek' : this.$t('m.Spark_AI')
    },
    aiFullName () {
      if (this.chatState.aiModel === 'agent') return 'OJ 智能助手 (Agent)'
      return this.chatState.aiModel === 'deepseek' ? 'DeepSeek V4 PRO' : this.$t('m.Spark_AI_Assistant')
    },
    aiWelcomeTitle () {
      if (this.chatState.aiModel === 'agent') return '你好！我是 OJ 智能助手'
      return this.chatState.aiModel === 'deepseek' ? this.$t('m.Hello_I_Am_DeepSeek') : this.$t('m.Hello_I_Am_Spark_AI')
    },
    aiWelcomeDesc () {
      if (this.chatState.aiModel === 'agent') return '我可以帮你推荐题目、规划学习路径、生成练习题、提供解题提示、分析提交错误。尽管问我吧！'
      return this.chatState.aiModel === 'deepseek' ? this.$t('m.DeepSeek_Description') : this.$t('m.Spark_AI_Description')
    },
    editorOptions () {
      const modeMap = {
        'C++': 'text/x-csrc',
        'C': 'text/x-csrc',
        'Java': 'text/x-java',
        'Python': 'text/x-python'
      }
      return {
        tabSize: 4,
        mode: modeMap[this.editorLanguage] || 'text/x-csrc',
        theme: this.editorTheme,
        lineNumbers: true,
        line: true,
        lineWrapping: true,
        styleSelectedText: true
      }
    }
  },
  watch: {
    isCollapsed () {
      this.$nextTick(() => {
        this.snapToEdge()
      })
    },
    '$route' (to) {
      if (to.name === 'ai-chat-fullscreen') {
        this.closeAIChat()
      }
      if (to.name === 'code-editor-fullscreen') {
        this.closeCodeEditor()
      }
    }
  },
  mounted () {
    this.sidebarPos.y = window.innerHeight * 0.5 - 80
    // 默认显示在右边
    const sidebarWidth = this.isCollapsed ? 48 : 160
    this.sidebarPos.x = window.innerWidth - sidebarWidth - 16
    this.snapToEdge()
    window.addEventListener('resize', this.onWindowResize)
    this.$root.$on('open-ai-chat', this.openAIChat)
  },
  beforeDestroy () {
    this.clearPollingTimer()
    window.removeEventListener('resize', this.onWindowResize)
    this.$root.$off('open-ai-chat', this.openAIChat)
  },
  methods: {
    ...mapActions(['toggleSidebar']),

    onWindowResize () {
      this.snapToEdge()
    },

    clearPollingTimer () {
      if (this.pollingTimer) {
        clearInterval(this.pollingTimer)
        this.pollingTimer = null
      }
      if (this.pollingTimeout) {
        clearTimeout(this.pollingTimeout)
        this.pollingTimeout = null
      }
    },

    toggleSidebarLocal () {
      // 拖动后浏览器会派发 click 事件，此处拦截避免误展开
      if (this.sideDragOccurred) {
        this.sideDragOccurred = false
        return
      }
      this.isCollapsed = !this.isCollapsed
      if (this.isCollapsed) {
        this.showAIChat = false
        this.showCodeEditor = false
        this.showFeedback = false
      }
    },

    onSidebarMouseDown (e) {
      if (e.target.closest('.menu-item') || e.target.closest('.sidebar-toggle')) return
      e.preventDefault()
      this.sideDragPending = true
      this.sideDragStart = { x: e.clientX, y: e.clientY, barX: this.sidebarPos.x, barY: this.sidebarPos.y }
      this.sideDragTimer = setTimeout(() => {
        this.activateSidebarDrag()
      }, 300)
      document.addEventListener('mousemove', this.onSidebarDrag)
      document.addEventListener('mouseup', this.stopSidebarDrag)
    },

    activateSidebarDrag () {
      if (!this.sideDragPending) return
      this.sideDragPending = false
      if (this.sideDragTimer) {
        clearTimeout(this.sideDragTimer)
        this.sideDragTimer = null
      }
      this.sidebarDragging = true
    },

    onSidebarDrag (e) {
      if (!this.sideDragPending && !this.sidebarDragging) return
      const dx = e.clientX - this.sideDragStart.x
      const dy = e.clientY - this.sideDragStart.y
      if (this.sideDragPending && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        this.activateSidebarDrag()
      }
      if (this.sidebarDragging) {
        this.sidebarPos.x = this.sideDragStart.barX + dx
        this.sidebarPos.y = this.sideDragStart.barY + dy
      }
    },

    stopSidebarDrag () {
      document.removeEventListener('mousemove', this.onSidebarDrag)
      document.removeEventListener('mouseup', this.stopSidebarDrag)
      if (this.sideDragTimer) {
        clearTimeout(this.sideDragTimer)
        this.sideDragTimer = null
      }
      if (this.sidebarDragging) {
        this.sidebarDragging = false
        this.snapToEdge()
        // 标记发生过拖动，拦截随后派发的 click 事件，防止误展开
        this.sideDragOccurred = true
      }
      this.sideDragPending = false
    },

    snapToEdge () {
      const sidebarWidth = this.isCollapsed ? 48 : 160
      const halfW = window.innerWidth / 2
      const centerX = this.sidebarPos.x + sidebarWidth / 2
      if (centerX < halfW) {
        this.sidebarPos.x = 16
        this.sidebarSnapped = 'left'
      } else {
        this.sidebarPos.x = window.innerWidth - sidebarWidth - 16
        this.sidebarSnapped = 'right'
      }
      this.sidebarPos.y = Math.max(60, Math.min(window.innerHeight - 200, this.sidebarPos.y))
    },

    openAIChat() {
      if (this.isCollapsed) {
        this.isCollapsed = false
      }
      const sidebarRight = this.sidebarPos.x + 160 + 8
      this.aiPanelPos = {
        x: this.sidebarSnapped === 'left' ? sidebarRight : Math.max(0, this.sidebarPos.x - 396),
        y: Math.max(0, this.sidebarPos.y)
      }
      this.aiPanelSize = { w: 380, h: 520 }
      if (this.showAIChat) {
        this.showAIChat = false
        return
      }
      this.closeCodeEditor()
      this.closeFeedback()
      this.showAIChat = true
    },

    openCodeEditor() {
      if (this.isCollapsed) {
        this.isCollapsed = false
      }
      this.restoreEditorState()
      const sidebarRight = this.sidebarPos.x + 160 + 8
      this.editorPanelPos = {
        x: this.sidebarSnapped === 'left' ? sidebarRight : Math.max(0, this.sidebarPos.x - 396),
        y: Math.max(0, this.sidebarPos.y)
      }
      this.editorPanelSize = { w: 380, h: 520 }
      if (this.showCodeEditor) {
        this.showCodeEditor = false
        return
      }
      this.closeAIChat()
      this.closeFeedback()
      this.showCodeEditor = true
    },

    closeAIChat () {
      this.showAIChat = false
    },

    closeCodeEditor () {
      this.showCodeEditor = false
      this.clearPollingTimer()
      this.runningCode = false
    },

    openFeedback () {
      if (this.isCollapsed) {
        this.isCollapsed = false
      }
      const sidebarRight = this.sidebarPos.x + 160 + 8
      this.feedbackPanelPos = {
        x: this.sidebarSnapped === 'left' ? sidebarRight : Math.max(0, this.sidebarPos.x - 436),
        y: Math.max(0, this.sidebarPos.y)
      }
      this.feedbackPanelSize = { w: 420, h: 480 }
      if (this.showFeedback) {
        this.showFeedback = false
        return
      }
      this.closeAIChat()
      this.closeCodeEditor()
      this.showFeedback = true
      this.$nextTick(() => {
        this.initFeedbackEditor()
      })
    },

    closeFeedback () {
      this.showFeedback = false
      if (this._feedbackImgObserver) {
        this._feedbackImgObserver.disconnect()
        this._feedbackImgObserver = null
      }
      if (this.feedbackEditor) {
        this.feedbackEditor.destroy()
        this.feedbackEditor = null
      }
    },

    initFeedbackEditor () {
      if (this.feedbackEditor) return
      const textarea = this.$refs.feedbackEditor
      if (!textarea) return
      this.feedbackEditor = new Simditor({
        textarea: textarea,
        toolbar: ['title', 'bold', 'italic', 'underline', 'fontScale', 'color', 'ol', 'ul', '|', 'blockquote', 'code', 'link', 'table', 'image', 'hr', '|', 'indent', 'outdent', 'alignment'],
        pasteImage: true,
        upload: {
          url: '/api/admin/upload_image/',
          fileKey: 'image',
          connectionCount: 3
        }
      })
      this._bindFeedbackImageResize()
    },

    _bindFeedbackImageResize () {
      const editor = this.feedbackEditor
      if (!editor) return
      const bodyEl = editor.body ? editor.body[0] : null
      if (!bodyEl) return
      this._feedbackImgObserver = new MutationObserver((mutations) => {
        mutations.forEach((m) => {
          m.addedNodes.forEach((node) => {
            if (node.tagName === 'IMG') {
              this._handleNewImage(node, bodyEl)
            } else if (node.querySelectorAll) {
              node.querySelectorAll('img').forEach((img) => {
                this._handleNewImage(img, bodyEl)
              })
            }
          })
        })
      })
      bodyEl.addEventListener('load', (e) => {
        if (e.target && e.target.tagName === 'IMG' && e.target.isConnected) {
          this._handleNewImage(e.target, bodyEl)
        }
      }, true)
      this._feedbackImgObserver.observe(bodyEl, { childList: true, subtree: true })
    },

    _handleNewImage (img, container) {
      if (img._feedbackResized) return
      if (img.complete) {
        this._resizeImageToFit(img, container)
        img._feedbackResized = true
      } else {
        img.addEventListener('load', () => {
          this._resizeImageToFit(img, container)
          img._feedbackResized = true
        }, { once: true })
      }
    },

    _resizeImageToFit (img, container) {
      const containerWidth = container.clientWidth - 24
      if (img.naturalWidth > containerWidth) {
        const canvas = document.createElement('canvas')
        const ratio = containerWidth / img.naturalWidth
        canvas.width = containerWidth
        canvas.height = Math.round(img.naturalHeight * ratio)
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        img.src = canvas.toDataURL('image/png')
      }
    },

    submitFeedback () {
      if (!this.feedbackTitle.trim() || this.submittingFeedback) return
      this.submittingFeedback = true
      const content = this.feedbackEditor ? this.feedbackEditor.getValue() : ''
      fetch('/api/feedback/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': this.getCsrfToken()
        },
        body: JSON.stringify({
          title: this.feedbackTitle.trim(),
          content: content
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.error !== null) {
          this.$Message.error(data.data || '提交失败')
        } else {
          this.$Message.success('反馈已提交，感谢你的反馈！')
          this.feedbackTitle = ''
          if (this.feedbackEditor) {
            this.feedbackEditor.setValue('')
          }
          this.closeFeedback()
        }
        this.submittingFeedback = false
      })
      .catch(() => {
        this.$Message.error('提交失败，请稍后重试')
        this.submittingFeedback = false
      })
    },

    clearCode () {
      this.editorCode = this.$t('m.Write_Code_Here')
      this.editorInput = ''
      this.runResult = null
      this.clearPollingTimer()
      this.runningCode = false
    },

    openFullscreen (type) {
      if (type === 'ai') {
        this.closeAIChat()
        this.$router.push({ name: 'ai-chat-fullscreen' })
      } else if (type === 'editor') {
        this.saveEditorState()
        this.closeCodeEditor()
        this.$router.push({ name: 'code-editor-fullscreen' })
      }
    },

    saveEditorState () {
      localStorage.setItem('free-code-editor', JSON.stringify({
        code: this.editorCode,
        language: this.editorLanguage,
        theme: this.editorTheme,
        input: this.editorInput || ''
      }))
    },

    restoreEditorState () {
      try {
        const raw = localStorage.getItem('free-code-editor')
        if (raw) {
          const state = JSON.parse(raw)
          if (state.code) this.editorCode = state.code
          if (state.language) this.editorLanguage = state.language === 'Python3' ? 'Python' : state.language
          if (state.theme) this.editorTheme = state.theme
          if (state.input !== undefined) this.editorInput = state.input
        }
      } catch (e) {}
    },

    onModelChange () {
      chatState.messages = []
      chatState.inputText = ''
    },

    handleAIKeydown (e) {
      if (e && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        this.sendAIMessage()
      }
    },

    stopAIGeneration () {
      if (this.aiAbortController) {
        this.aiAbortController.abort()
        this.aiAbortController = null
      }
      this.aiSending = false
    },

    async sendAIMessage () {
      const text = chatState.inputText.trim()
      if (!text || this.aiSending) return

      chatState.messages.push({ role: 'user', content: text })
      chatState.inputText = ''
      this.aiSending = true

      const loadingIdx = chatState.messages.length
      chatState.messages.push({ role: 'loading', content: '' })
      this.scrollToBottom()

      this.aiAbortController = new AbortController()

      try {
        if (chatState.aiModel === 'agent') {
          await this._sendAgentStream(text, loadingIdx)
        } else {
          await this._sendLLMStream(text, loadingIdx)
        }
      } catch (e) {
        if (e && e.name !== 'AbortError') {
          chatState.messages.splice(loadingIdx, 1)
          chatState.messages.push({ role: 'assistant', content: this.$t('m.Network_Error_Text') })
        } else {
          chatState.messages.splice(loadingIdx, 1)
        }
      } finally {
        this.aiSending = false
        this.aiAbortController = null
        this.scrollToBottom()
      }
    },

    async _sendAgentStream (text, loadingIdx) {
      const response = await fetch('/api/agent/chat/stream/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
        signal: this.aiAbortController.signal
      })

      if (!response.ok) {
        chatState.messages.splice(loadingIdx, 1)
        chatState.messages.push({ role: 'assistant', content: this.$t('m.Request_Failed') })
        return
      }

      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('text/event-stream')) {
        chatState.messages[loadingIdx].streaming = true
        await this._handleAgentSSE(response, loadingIdx)
      } else {
        chatState.messages.splice(loadingIdx, 1)
        const result = await response.json()
        const agentData = result.data || result
        const formatted = formatAgentResponse(agentData)
        const display = extractAgentDisplay(agentData)
        chatState.messages.push({
          role: 'assistant',
          content: formatted.content || this.$t('m.No_Reply'),
          agentName: agentData.agent || '',
          thinkingSteps: agentData.thinking_steps || [],
          allStepsDone: true,
          displayType: display.displayType,
          displayData: display.displayData
        })
      }
    },

    async _handleAgentSSE (response, loadingIdx) {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6))
              if (data.event === 'step') {
                const steps = chatState.messages[loadingIdx].thinkingSteps || []
                steps.push(data.text)
                this.$set(chatState.messages[loadingIdx], 'thinkingSteps', steps)
                this.$set(chatState.messages[loadingIdx], 'currentStepIndex', steps.length)
                await this.$nextTick()
              } else if (data.event === 'done') {
                chatState.messages[loadingIdx].allStepsDone = true
                await this.$nextTick()
              } else if (data.event === 'result') {
                const agentData = data.data || data
                const formatted = formatAgentResponse(agentData)
                const display = extractAgentDisplay(agentData)
                chatState.messages.splice(loadingIdx, 1)
                chatState.messages.push({
                  role: 'assistant',
                  content: formatted.content,
                  agentName: agentData.agent || '',
                  thinkingSteps: agentData.thinking_steps || [],
                  allStepsDone: true,
                  displayType: display.displayType,
                  displayData: display.displayData
                })
                await this.$nextTick()
              }
              this.scrollToBottom()
            }
          }
        }
      } finally {
        if (chatState.messages[loadingIdx]) {
          chatState.messages[loadingIdx].streamDone = true
          chatState.messages[loadingIdx].streaming = false
        }
        reader.releaseLock()
      }
    },

    async _sendLLMStream (text, loadingIdx) {
      const response = await fetch('/api/spark/chat/stream/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, model: chatState.aiModel }),
        signal: this.aiAbortController.signal
      })

      if (!response.ok) {
        chatState.messages.splice(loadingIdx, 1)
        chatState.messages.push({ role: 'assistant', content: this.$t('m.Request_Failed') })
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6))
              if (data.event === 'chunk') {
                fullContent += data.text
                if (chatState.messages[loadingIdx].role === 'loading') {
                  chatState.messages[loadingIdx] = {
                    role: 'assistant',
                    content: fullContent,
                    streaming: true,
                    streamDone: false
                  }
                } else {
                  chatState.messages[loadingIdx].content = fullContent
                }
                await this.$nextTick()
                this.scrollToBottom()
              } else if (data.event === 'done') {
                chatState.messages[loadingIdx].streaming = false
                chatState.messages[loadingIdx].streamDone = true
                await this.$nextTick()
              }
            }
          }
        }
      } finally {
        if (chatState.messages[loadingIdx]) {
          chatState.messages[loadingIdx].streamDone = true
          chatState.messages[loadingIdx].streaming = false
        }
        reader.releaseLock()
      }
    },

    scrollToBottom () {
      this.$nextTick(() => {
        const list = this.$refs.aiMessageList || this.$refs.fsAiMessageList
        if (list) {
          list.scrollTop = list.scrollHeight
        }
      })
    },

    formatMessage (content) {
      return content
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>')
    },

    startDrag (e, panel) {
      if (e.target.closest('.panel-actions')) return
      e.preventDefault()
      const posMap = { ai: this.aiPanelPos, editor: this.editorPanelPos, feedback: this.feedbackPanelPos }
      const pos = posMap[panel] || this.editorPanelPos
      this.panelDragPending = panel
      this.dragStart = { x: e.clientX, y: e.clientY, panelX: pos.x, panelY: pos.y }
      this.panelDragTimer = setTimeout(() => {
        this.activatePanelDrag()
      }, 300)
      document.addEventListener('mousemove', this.onDrag)
      document.addEventListener('mouseup', this.stopDrag)
    },

    activatePanelDrag () {
      if (!this.panelDragPending) return
      this.dragging = this.panelDragPending
      this.panelDragPending = null
      if (this.panelDragTimer) {
        clearTimeout(this.panelDragTimer)
        this.panelDragTimer = null
      }
    },

    onDrag (e) {
      if (!this.panelDragPending && !this.dragging) return
      const dx = e.clientX - this.dragStart.x
      const dy = e.clientY - this.dragStart.y
      if (this.panelDragPending && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        this.activatePanelDrag()
      }
      if (this.dragging) {
        const posMap = { ai: this.aiPanelPos, editor: this.editorPanelPos, feedback: this.feedbackPanelPos }
        const pos = posMap[this.dragging] || this.editorPanelPos
        pos.x = Math.max(0, this.dragStart.panelX + dx)
        pos.y = Math.max(0, this.dragStart.panelY + dy)
      }
    },

    stopDrag () {
      if (this.panelDragTimer) {
        clearTimeout(this.panelDragTimer)
        this.panelDragTimer = null
      }
      this.panelDragPending = null
      this.dragging = null
      document.removeEventListener('mousemove', this.onDrag)
      document.removeEventListener('mouseup', this.stopDrag)
    },

    startResize (e, panel, direction) {
      e.preventDefault()
      e.stopPropagation()
      const sizeMap = { ai: this.aiPanelSize, editor: this.editorPanelSize, feedback: this.feedbackPanelSize }
      const posMap = { ai: this.aiPanelPos, editor: this.editorPanelPos, feedback: this.feedbackPanelPos }
      const size = sizeMap[panel] || this.editorPanelSize
      const pos = posMap[panel] || this.editorPanelPos
      this.resizing = { panel, direction }
      this.resizeStart = { x: e.clientX, y: e.clientY, w: size.w, h: size.h, left: pos.x, top: pos.y }
      document.addEventListener('mousemove', this.onResize)
      document.addEventListener('mouseup', this.stopResize)
    },

    onResize (e) {
      if (!this.resizing) return
      const { panel, direction } = this.resizing
      const sizeMap = { ai: this.aiPanelSize, editor: this.editorPanelSize, feedback: this.feedbackPanelSize }
      const size = sizeMap[panel] || this.editorPanelSize
      const dx = e.clientX - this.resizeStart.x
      const dy = e.clientY - this.resizeStart.y
      const minWidth = 300
      const minHeight = 300

      if (direction === 'right' || direction === 'corner') {
        size.w = Math.max(minWidth, this.resizeStart.w + dx)
      }
      if (direction === 'bottom' || direction === 'corner') {
        size.h = Math.max(minHeight, this.resizeStart.h + dy)
      }
    },

    stopResize () {
      this.resizing = null
      document.removeEventListener('mousemove', this.onResize)
      document.removeEventListener('mouseup', this.stopResize)
    },

    runCode () {
      if (this.runningCode) return
      this.runningCode = true
      this.runResult = null

      const langMap = {
        'C++': 'C++',
        'C': 'C',
        'Java': 'Java',
        'Python': 'Python3',
        'JavaScript': 'JavaScript',
        'Go': 'Go'
      }
      const language = langMap[this.editorLanguage] || 'C++'
      const code = this.editorCode
      const input = this.editorInput || ''

      const self = this
      fetch('/api/self_test/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': this.getCsrfToken()
        },
        body: JSON.stringify({ language, code, input })
      })
      .then(res => {
        if (!res.ok) throw new Error(res.statusText)
        return res.json()
      })
      .then(data => {
        if (data.error !== null) {
          self.runResult = { output: data.data || data.error || self.$t('m.Run_Failed'), error: true }
        } else {
          const result = data.data || {}
          if (result.success === false) {
            self.runResult = { output: result.error || self.$t('m.Run_Failed'), error: true }
          } else {
            self.runResult = { output: result.output || 'No output', error: false }
          }
        }
        self.runningCode = false
      })
      .catch(err => {
        self.runResult = {
          output: err.message || self.$t('m.Run_Failed'),
          error: true
        }
        self.runningCode = false
      })
    },

    clearPollingTimer () {
      if (this.pollingTimer) {
        clearInterval(this.pollingTimer)
        this.pollingTimer = null
      }
      if (this.pollingTimeout) {
        clearTimeout(this.pollingTimeout)
        this.pollingTimeout = null
      }
    },

    getCsrfToken () {
      const name = 'csrftoken'
      let cookieValue = null
      if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';')
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim()
          if (cookie.substring(0, name.length + 1) === (name + '=')) {
            cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
            break
          }
        }
      }
      return cookieValue || ''
    }
  }
}
</script>

<style lang="less" scoped>
.global-sidebar {
  position: fixed;
  width: 160px;
  background: rgba(30, 30, 50, 0.75);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  z-index: 999;
  transition: top 0.25s ease, left 0.25s ease, width 0.3s ease, height 0.3s ease, border-radius 0.3s ease;
  overflow: visible;
  padding: 12px 8px;
  cursor: grab;
  user-select: none;

  &.dragging {
    cursor: grabbing;
    transition: none;
    opacity: 0.9;
  }

  &.collapsed {
    width: 48px;
    height: 48px;
    padding: 0;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    background: #1a1a2e;
    border: 2px solid rgba(255, 255, 255, 0.2);
  }
}

.sidebar-toggle {
  position: absolute;
  right: -14px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  background: rgba(30, 30, 50, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1000;
  transition: all 0.2s ease;
  color: rgba(255, 255, 255, 0.9);

  &.toggle-left {
    right: auto;
    left: -14px;
  }

  &:hover {
    background: rgba(30, 30, 50, 0.9);
    transform: translateY(-50%) scale(1.1);
  }
}

.sidebar-content {
  opacity: 1;
  transition: opacity 0.2s ease;
}

.collapsed-logo {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #fff;
  padding: 4px;
  object-fit: contain;
  cursor: pointer;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  margin-bottom: 6px;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.25s ease;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &:last-child {
    margin-bottom: 0;
  }

  .menu-icon {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .menu-text {
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.95);
    white-space: nowrap;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
}

// 侧边面板
.side-panel {
  position: fixed !important;
  max-height: none !important;
  min-height: 0 !important;
  background: rgba(30, 30, 50, 0.75);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  display: flex !important;
  flex-direction: column !important;
  z-index: 10000;
  animation: slideIn 0.3s ease;
  pointer-events: auto;
  user-select: none;
  box-sizing: border-box;
  overflow: visible !important;

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    background: rgba(255, 255, 255, 0.05);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px 20px 0 0;
    flex-shrink: 0;
    position: relative;
    z-index: 10;
    overflow: visible;

    h3 {
      font-size: 15px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.95);
      margin: 0;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }

    .panel-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      position: relative;
      z-index: 10;

      .model-select {
        width: 130px;

        /deep/ .ivu-select-selection {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.9);
          border-radius: 6px;
          height: 30px;
          line-height: 30px;

          .ivu-select-placeholder,
          .ivu-select-selected-value {
            color: rgba(255, 255, 255, 0.9);
            font-size: 12px;
          }
        }
        /deep/ .ivu-select-arrow {
          color: rgba(255, 255, 255, 0.7);
        }
      }

      button {
        color: rgba(255, 255, 255, 0.9) !important;
        width: 28px;
        height: 28px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;

        i {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.9) !important;
        }

        &:hover {
          background: rgba(255, 255, 255, 0.25) !important;

          i {
            color: white !important;
          }
        }
      }
    }
  }

  .panel-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
    box-sizing: border-box;
    border-radius: 0 0 20px 20px;
  }
}

// 拖拽调整大小手柄
.resize-handle {
  position: absolute;
  z-index: 1001;

  &.resize-right {
    right: -3px;
    top: 0;
    width: 6px;
    height: 100%;
    cursor: ew-resize;
  }

  &.resize-bottom {
    bottom: -3px;
    left: 0;
    width: 100%;
    height: 6px;
    cursor: ns-resize;
  }

  &.resize-corner {
    bottom: -3px;
    right: -3px;
    width: 16px;
    height: 16px;
    cursor: nwse-resize;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

// AI Chat 面板
.ai-panel .message-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }

  .welcome-section {
    text-align: center;
    padding: 20px 10px;

    .welcome-icon {
      width: 70px;
      height: 70px;
      margin: 0 auto 14px;
      background: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      overflow: hidden;

      img {
        width: 70%;
        height: 70%;
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
    }

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.95);
      margin-bottom: 6px;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }

    p {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 16px;
    }
  }

  .message-item {
    display: flex;
    gap: 10px;
    margin-bottom: 14px;
    animation: fadeIn 0.3s ease;

    &.user {
      flex-direction: row-reverse;

      .message-content {
        align-items: flex-end;

        .message-body {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border-radius: 16px 16px 4px 16px;
        }
      }
    }

    &.assistant {
      .message-body {
        background: rgba(255, 255, 255, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 16px 16px 16px 4px;
      }
    }

    &.loading {
      .message-body {
        background: rgba(255, 247, 230, 0.2);
        border: 1px solid rgba(255, 213, 145, 0.3);
        border-radius: 16px 16px 16px 4px;
      }
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .message-avatar {
    flex-shrink: 0;

    .ai-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;

      img {
        width: 70%;
        height: 70%;
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
    }
  }

  .message-content {
    display: flex;
    flex-direction: column;
    max-width: 75%;

    .message-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;

      .sender-name {
        font-size: 12px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.8);
      }
    }

    .message-body {
      padding: 10px 14px;
      font-size: 14px;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.9);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

      .loading-indicator {
        display: flex;
        align-items: center;
        gap: 6px;
        color: rgba(255, 255, 255, 0.8);
      }

      .message-text {
        /deep/ pre {
          background: rgba(0, 0, 0, 0.2);
          padding: 10px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 6px 0;

          code {
            font-family: 'Courier New', monospace;
            font-size: 13px;
            color: rgba(255, 255, 255, 0.9);
          }
        }

        /deep/ code {
          background: rgba(0, 0, 0, 0.2);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.9);
        }
      }
    }
  }
}

.input-area {
  padding: 14px;
  background: rgba(255, 255, 255, 0.05);
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  /deep/ .ivu-input {
    background: rgba(255, 255, 255, 0.15) !important;
    border-color: rgba(255, 255, 255, 0.2) !important;
    color: rgba(255, 255, 255, 0.9) !important;

    &::placeholder {
      color: rgba(255, 255, 255, 0.5) !important;
    }
  }

  .ivu-btn {
    margin-top: 8px;
  }
}

// 代码编辑器面板
.editor-panel {
  .panel-content {
    padding: 14px;
    overflow-y: auto;
  }

  .editor-controls {
    display: flex;
    gap: 10px;
    margin-bottom: 12px;
  }

  .code-editor {
    /deep/ .CodeMirror {
      min-height: 280px;
      max-height: 450px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
  }

  .editor-actions {
    display: flex;
    gap: 10px;
    margin-top: 12px;
  }

  .run-result {
    margin-top: 12px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);

    h4 {
      font-size: 13px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      margin: 0 0 8px;
    }

    pre {
      padding: 10px;
      border-radius: 8px;
      font-size: 13px;
      font-family: 'Courier New', monospace;
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 180px;
      overflow-y: auto;

      &.success {
        background: rgba(25, 190, 107, 0.15);
        color: #19be6b;
        border: 1px solid rgba(25, 190, 107, 0.3);
      }

      &.error {
        background: rgba(237, 64, 20, 0.15);
        color: #ff6b6b;
        border: 1px solid rgba(237, 64, 20, 0.3);
      }
    }
  }
}

.editor-input-area {
  margin-top: 12px;
  label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 4px;
    display: block;
  }
  /deep/ .ivu-input {
    background: rgba(255, 255, 255, 0.15) !important;
    border-color: rgba(255, 255, 255, 0.2) !important;
    color: rgba(255, 255, 255, 0.9) !important;
    &::placeholder {
      color: rgba(255, 255, 255, 0.5) !important;
    }
  }
}

.feedback-content {
  padding: 16px;
  overflow-y: auto;

  .feedback-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .feedback-title-input {
    /deep/ .ivu-input {
      background: rgba(255, 255, 255, 0.15) !important;
      border-color: rgba(255, 255, 255, 0.2) !important;
      color: rgba(255, 255, 255, 0.9) !important;
      font-size: 14px;
      font-weight: 600;
      &::placeholder {
        color: rgba(255, 255, 255, 0.5) !important;
      }
    }
  }

  .feedback-editor-textarea {
    display: block;
    width: 100%;
    min-height: 180px;
  }

  /deep/ .simditor {
     border: 1px solid rgba(255, 255, 255, 0.2) !important;
     border-radius: 8px;
     background: rgba(255, 255, 255, 0.1) !important;

     .simditor-wrapper {
       background: transparent !important;

       .simditor-body,
       .simditor-placeholder {
         color: rgba(255, 255, 255, 0.9) !important;
       }
     }

     .simditor-toolbar {
       background: rgba(255, 255, 255, 0.08) !important;
       border-bottom: 1px solid rgba(255, 255, 255, 0.15) !important;
       border-radius: 8px 8px 0 0;

       > ul > li {
         > span.separator {
           opacity: 0.3;
         }

         > .toolbar-item {
           span {
             opacity: 1 !important;
             color: rgba(255, 255, 255, 0.85) !important;
           }

           &:hover span {
             color: #fff !important;
             background: rgba(255, 255, 255, 0.15);
           }
         }
       }

       .toolbar-menu {
         background: #1e1e32 !important;
         border-color: rgba(255, 255, 255, 0.15) !important;

         ul > li .menu-item {
           color: rgba(255, 255, 255, 0.85) !important;

           &:hover {
             background: rgba(255, 255, 255, 0.1) !important;
             color: #fff !important;
           }
         }
       }
     }

     .simditor-body {
       background: rgba(255, 255, 255, 0.06) !important;
       color: rgba(255, 255, 255, 0.9) !important;
       min-height: 180px;
       padding: 12px !important;
       font-size: 13px;
       line-height: 1.6;

       * {
         color: rgba(255, 255, 255, 0.9) !important;
       }

       &:focus {
         outline: none !important;
       }

       a {
         color: #3b82f6 !important;
       }

       blockquote {
         border-left-color: rgba(255, 255, 255, 0.3) !important;
         color: rgba(255, 255, 255, 0.7) !important;
       }

       table {
         th, td {
           border-color: rgba(255, 255, 255, 0.2) !important;
           color: rgba(255, 255, 255, 0.9) !important;
         }
         th {
           background: rgba(255, 255, 255, 0.1) !important;
         }
       }

       pre, code {
         background: rgba(0, 0, 0, 0.3) !important;
         color: rgba(255, 255, 255, 0.9) !important;
       }

       p, div, span, h1, h2, h3, h4, h5, h6, li, td, th {
         color: rgba(255, 255, 255, 0.9) !important;
       }

       img {
          max-width: 100% !important;
          height: auto !important;
          object-fit: contain !important;
        }
     }

     .simditor-placeholder {
       color: rgba(255, 255, 255, 0.4) !important;
       font-style: italic;
     }
   }
}
</style>

<style lang="less">
.model-option-icon {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  object-fit: contain;
  vertical-align: middle;
  margin-right: 6px;
}
</style>