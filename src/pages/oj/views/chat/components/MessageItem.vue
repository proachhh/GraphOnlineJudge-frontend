<template>
  <div :class="['msg-item', role]">
    <div class="msg-avatar">
      <Avatar v-if="role === 'user'" icon="ios-person" style="background: #2d8cf0" />
      <div v-else class="ai-avatar-wrap">
        <img :src="aiAvatar" alt="AI" />
      </div>
    </div>
    <div class="msg-body">
      <div class="msg-header">
        <span class="msg-sender">{{ role === 'user' ? senderName : aiName }}</span>
        <Tag v-if="agentTag" :color="agentColor" size="small" class="agent-tag">{{ agentTag }}</Tag>
        <span class="msg-time" v-if="msgTime">{{ msgTime }}</span>
      </div>

      <div v-if="thinkingSteps && thinkingSteps.length && role !== 'user'" class="thinking-steps">
        <div class="thinking-toggle" @click="showThinking = !showThinking">
          <Icon :type="showThinking ? 'ios-arrow-down' : 'ios-arrow-forward'" size="14" />
          <span>思考过程 ({{ thinkingSteps.length }} 步)</span>
          <Icon v-if="allStepsDone" type="ios-checkmark-circle" size="14" color="#19be6b" />
        </div>
        <transition name="slide">
          <div v-if="showThinking" class="thinking-list">
            <div v-for="(step, i) in thinkingSteps" :key="i" class="thinking-step" :class="{ done: i < currentStepIndex || allStepsDone }">
              <span class="step-dot">
                <Icon v-if="i < currentStepIndex || allStepsDone" type="ios-checkmark" size="12" color="#19be6b" />
                <span v-else-if="i === currentStepIndex && !allStepsDone" class="dot-pulse"></span>
                <span v-else class="dot-pending"></span>
              </span>
              <span class="step-text">{{ step }}</span>
            </div>
          </div>
        </transition>
      </div>

      <div v-if="role !== 'user' && displayType === 'path_plan' && displayData" class="msg-embedded">
        <PathTimeline
          :nodes="displayData.nodes"
          :start="displayData.start"
          :goal="displayData.goal"
          :fallback="displayData.fallback"
        />
      </div>

      <div v-if="role === 'loading'" class="loading-block">
        <div class="loading-pulse">
          <span class="pulse-dot"></span>
          <span class="pulse-dot"></span>
          <span class="pulse-dot"></span>
        </div>
        <span class="loading-text">智能体思考中...</span>
      </div>

      <div v-else class="msg-content" v-html="renderedContent"></div>

      <div v-if="streaming && !streamDone" class="stream-cursor">|</div>
    </div>
  </div>
</template>

<script>
import PathTimeline from './PathTimeline.vue'
import { renderMarkdown } from '@/utils/markdown'

const AGENT_COLORS = {
  'ProfileAgent': 'geekblue',
  'ResourceAgent': 'purple',
  'PathPlanningAgent': 'green',
  'RecommendAgent': 'orange',
  'HintAgent': 'cyan',
  'ErrorAnalysisAgent': 'red',
  'MasterAgent': 'blue'
}

const AGENT_LABELS = {
  'ProfileAgent': '画像分析',
  'ResourceAgent': '资源生成',
  'PathPlanningAgent': '路径规划',
  'RecommendAgent': '题目推荐',
  'HintAgent': '解题提示',
  'ErrorAnalysisAgent': '错误诊断',
  'MasterAgent': '智能助手'
}

export default {
  name: 'MessageItem',
  components: { PathTimeline },
  props: {
    role: { type: String, default: 'user' },
    content: { type: String, default: '' },
    agentName: { type: String, default: '' },
    thinkingSteps: { type: Array, default: () => [] },
    allStepsDone: { type: Boolean, default: false },
    currentStepIndex: { type: Number, default: 0 },
    msgTime: { type: String, default: '' },
    aiAvatar: { type: String, default: '' },
    aiName: { type: String, default: 'AI' },
    senderName: { type: String, default: '我' },
    streaming: { type: Boolean, default: false },
    streamDone: { type: Boolean, default: false },
    displayType: { type: String, default: '' },
    displayData: { type: Object, default: null }
  },
  data () {
    return {
      showThinking: false
    }
  },
  computed: {
    agentTag () {
      if (!this.agentName) return ''
      return AGENT_LABELS[this.agentName] || this.agentName
    },
    agentColor () {
      return AGENT_COLORS[this.agentName] || 'default'
    },
    renderedContent () {
      if (!this.content) return ''
      return renderMarkdown(this.content)
    }
  }
}
</script>

<style lang="less" scoped>
.msg-item {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;

  &.assistant, &.loading { flex-direction: row; }
  &.user { flex-direction: row-reverse; }

  .msg-avatar {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    .ai-avatar-wrap img {
      width: 36px; height: 36px; border-radius: 50%; object-fit: contain;
      background: #fff; padding: 2px;
    }
  }

  .msg-body {
    max-width: 75%;
    .user & { text-align: right; }
  }

  .msg-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
    .user & { justify-content: flex-end; flex-direction: row-reverse; }

    .msg-sender { font-size: 13px; font-weight: 600; color: #17233d; }
    .agent-tag { font-size: 11px; }
    .msg-time { font-size: 11px; color: #c5c8ce; margin-left: auto; .user & { margin-left: 0; margin-right: auto; } }
  }

  .msg-content {
    display: inline-block;
    background: #fff;
    border-radius: 12px;
    padding: 12px 16px;
    font-size: 14px;
    line-height: 1.7;
    color: #333;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    word-break: break-word;

    .assistant & { border-top-left-radius: 4px; }
    .user & { background: #2d8cf0; color: #fff; border-top-right-radius: 4px; }

    /deep/ pre {
      background: #1e1e2e; color: #cdd6f4; border-radius: 8px; padding: 14px;
      overflow-x: auto; margin: 8px 0; font-size: 13px; line-height: 1.5;
    }
    /deep/ code { background: rgba(0,0,0,0.06); padding: 2px 5px; border-radius: 3px; font-size: 90%; }
    .user & /deep/ code { background: rgba(255,255,255,0.2); }

    /deep/ h2 { font-size: 18px; font-weight: 700; margin: 12px 0 6px; color: #17233d; }
    /deep/ h3 { font-size: 16px; font-weight: 600; margin: 10px 0 5px; color: #17233d; }
    /deep/ h4 { font-size: 14px; font-weight: 600; margin: 8px 0 4px; color: #333; }
    /deep/ strong { font-weight: 700; }
    /deep/ em { font-style: italic; }
    /deep/ del { text-decoration: line-through; opacity: 0.6; }
    /deep/ blockquote {
      border-left: 3px solid #2d8cf0; padding: 3px 10px; margin: 2px 0;
      color: #515a6e; background: rgba(45,140,240,0.04); border-radius: 0 6px 6px 0;
    }
    /deep/ hr { border: none; border-top: 1px solid #e8eaec; margin: 10px 0; }
    /deep/ .md-ul { padding-left: 18px; margin: 6px 0; }
    /deep/ .md-li { margin: 3px 0; list-style: disc; }
    /deep/ a { color: #2d8cf0; text-decoration: none; &:hover { text-decoration: underline; } }
  }

  .thinking-steps {
    margin-bottom: 8px;
    .thinking-toggle {
      display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
      font-size: 12px; color: #808695; padding: 4px 0; user-select: none;
      &:hover { color: #2d8cf0; }
    }
    .thinking-list {
      background: #f8f9fa; border-radius: 8px; padding: 10px 14px; margin-top: 4px;
    }
    .thinking-step {
      display: flex; align-items: center; gap: 8px; padding: 3px 0; font-size: 13px; color: #bbb;
      &.done { color: #515a6e; }
      .step-dot { width: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .dot-pulse {
        width: 8px; height: 8px; border-radius: 50%; background: #2d8cf0;
        animation: pulse-dot 1s infinite;
      }
      .dot-pending {
        width: 6px; height: 6px; border-radius: 50%; border: 1.5px solid #ddd;
      }
    }
  }

  .loading-block {
    display: flex; align-items: center; gap: 10px; padding: 12px 16px;
    background: #fff; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    .loading-pulse {
      display: flex; gap: 4px;
      .pulse-dot {
        width: 8px; height: 8px; border-radius: 50%; background: #2d8cf0;
        animation: pulse-dot 1.4s ease-in-out infinite;
        &:nth-child(2) { animation-delay: 0.2s; }
        &:nth-child(3) { animation-delay: 0.4s; }
      }
    }
    .loading-text { font-size: 13px; color: #808695; }
  }

  .stream-cursor {
    display: inline; color: #2d8cf0; font-weight: bold;
    animation: blink 0.8s infinite;
  }
}

@keyframes pulse-dot {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.slide-enter-active, .slide-leave-active { transition: all 0.3s ease; overflow: hidden; }
.slide-enter, .slide-leave-to { max-height: 0; opacity: 0; }
.slide-enter-to, .slide-leave { max-height: 400px; opacity: 1; }
</style>
