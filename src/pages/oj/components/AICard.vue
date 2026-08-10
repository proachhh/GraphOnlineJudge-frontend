<template>
  <Card :dis-hover="true" class="ai-response-card" :class="{ expanded: isExpanded }">
    <div class="ai-card-header" @click="toggleExpand">
      <div class="header-left">
        <Icon :type="icon" :color="iconColor" size="20" />
        <span class="header-title">{{ title }}</span>
        <Spin fix v-if="loading"></Spin>
        <Tag v-else-if="result" class="ai-reply-tag" size="small">已回复</Tag>
      </div>
      <div class="header-right">
        <Button
          v-if="!loading && !result"
          :type="btnType"
          :icon="icon"
          :loading="loading"
          @click.stop="fetchAI"
          size="small"
        >
          {{ btnText }}
        </Button>
        <Icon
          v-if="result"
          :type="isExpanded ? 'ios-arrow-up' : 'ios-arrow-down'"
          size="18"
          class="expand-icon"
        />
      </div>
    </div>
    <transition name="slide">
      <div v-if="isExpanded && result" class="ai-card-body">
        <div class="ai-content markdown-body" v-html="renderedContent"></div>
        <div class="ai-actions">
          <Button size="small" @click="refresh" :loading="loading" icon="ios-refresh">
            重新生成
          </Button>
        </div>
      </div>
    </transition>
  </Card>
</template>

<script>
import { renderMarkdown } from '@/utils/markdown'

export default {
  name: 'AICard',
  props: {
    title: { type: String, required: true },
    icon: { type: String, default: 'ios-bulb' },
    iconColor: { type: String, default: '#2d8cf0' },
    btnText: { type: String, default: 'AI 分析' },
    btnType: { type: String, default: 'primary' },
    fetchFn: { type: Function, required: true },
    streamFn: { type: Function, default: null }
  },
  data () {
    return {
      loading: false,
      result: '',
      isExpanded: false
    }
  },
  computed: {
    renderedContent () {
      if (!this.result) return ''
      return renderMarkdown(this.result)
    }
  },
  methods: {
    async fetchAI () {
      this.loading = true
      this.isExpanded = true
      this.result = ''

      if (this.streamFn) {
        await this.fetchAIStream()
      } else {
        await this.fetchAINormal()
      }
    },
    async fetchAINormal () {
      try {
        const res = await this.fetchFn()
        const data = res.data || res
        const agentResult = data.data || data
        this.result = agentResult.analysis || agentResult.hint || agentResult.advice || agentResult.review || agentResult.summary || agentResult.message || ''
        if (!this.result) {
          this.result = 'AI 暂未返回内容，请重试'
        }
      } catch (e) {
        var errMsg = '网络错误'
        if (e && e.response && e.response.data && e.response.data.error) {
          errMsg = e.response.data.error
        } else if (e && e.message) {
          errMsg = e.message
        }
        this.result = '请求失败：' + errMsg
      } finally {
        this.loading = false
      }
    },
    async fetchAIStream () {
      try {
        const { url, body } = this.streamFn()
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(body)
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          this.result = '请求失败：' + (errData.error || res.statusText)
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n\n')
          buffer = lines.pop()
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim()
              if (data === '[DONE]') return
              try {
                const parsed = JSON.parse(data)
                if (parsed.text) {
                  this.result += parsed.text
                }
              } catch (e) {}
            }
          }
        }
        if (!this.result) {
          this.result = 'AI 暂未返回内容，请重试'
        }
      } catch (e) {
        this.result = '请求失败：' + (e.message || '网络错误')
      } finally {
        this.loading = false
      }
    },
    async refresh () {
      await this.fetchAI()
    },
    toggleExpand () {
      if (this.result) {
        this.isExpanded = !this.isExpanded
      }
    }
  }
}
</script>

<style scoped lang="less">
.ai-response-card {
  margin-top: 16px;
  border-radius: 12px;
  border: 1px solid #e8eaec;
  transition: all 0.3s ease;

  &:hover {
    border-color: #2d8cf0;
    box-shadow: 0 2px 12px rgba(45, 140, 240, 0.1);
  }

  &.expanded {
    border-color: #2d8cf0;
  }
}

.ai-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;

    .header-title {
      font-size: 15px;
      font-weight: 600;
      color: #17233d;
    }

    /deep/ .ivu-spin-fix {
      position: static;
      background: none;
      margin-left: 8px;
    }

    .ai-reply-tag {
      background: #19be6b !important;
      border-color: #19be6b !important;
      color: #fff !important;
      font-weight: 600;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;

    .expand-icon {
      color: #808695;
      transition: transform 0.3s;
    }
  }
}

.ai-card-body {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e8eaec;

  .ai-content {
    font-size: 14px;
    line-height: 1.8;
    color: #515a6e;

    /deep/ strong {
      color: #17233d;
      font-weight: 600;
    }

    /deep/ pre code, /deep/ .md-code-block code {
      background: transparent !important;
      color: inherit !important;
      padding: 0 !important;
      font-size: inherit !important;
    }

    /deep/ code {
      background: #f0f2f5;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Fira Code', 'Consolas', monospace;
      font-size: 13px;
      color: #ed4014;
    }

    /deep/ h2, /deep/ h3, /deep/ h4 {
      margin-top: 16px;
      margin-bottom: 8px;
      font-weight: 600;
      color: #17233d;
    }

    /deep/ h2 { font-size: 18px; }
    /deep/ h3 { font-size: 16px; }
    /deep/ h4 { font-size: 14px; }

    /deep/ ul, /deep/ ol {
      padding-left: 20px;
      margin: 8px 0;
    }

    /deep/ blockquote {
      border-left: 3px solid #bbbec4;
      padding: 6px 12px;
      margin: 8px 0;
      color: #808695;
      background: #fafafa;
    }
  }

  .ai-actions {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
}
</style>
