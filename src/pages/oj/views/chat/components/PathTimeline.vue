<template>
  <div class="path-timeline-compact">
    <div class="pt-header">
      <Icon type="ios-git-branch" size="18" color="#2d8cf0" />
      <span class="pt-title">学习路径</span>
      <span class="pt-route">{{ start }} → {{ goal }}</span>
      <span v-if="fallback" class="pt-fallback-badge">备选路径</span>
    </div>

    <div class="pt-steps">
      <div v-for="(node, i) in nodes" :key="i" class="pt-step">
        <div class="pt-step-connector">
          <div class="pt-dot" :class="{ active: i === 0, done: true }">
            <span>{{ i + 1 }}</span>
          </div>
          <div v-if="i < nodes.length - 1" class="pt-line"></div>
        </div>

        <div class="pt-step-body">
          <div class="pt-step-header">
            <span class="pt-step-name">{{ node.name }}</span>
            <div class="pt-stars">
              <span v-for="s in maxStars" :key="s" class="pt-star" :class="{ filled: s <= starCount(node.difficulty) }">★</span>
              <span class="pt-diff-badge" :class="diffClass(node.difficulty)">{{ diffLabel(node.difficulty) }}</span>
            </div>
          </div>

          <div class="pt-step-meta">
            <span class="pt-meta-tag pt-meta-blue">
              📄 {{ node.problem_count || 0 }} 道题
            </span>
            <span class="pt-meta-tag pt-meta-purple">
              重要度 {{ (node.importance || 0).toFixed(0) }}
            </span>
          </div>

          <div v-if="node.snippet" class="pt-snippet-toggle" @click="toggleSnippet(i)">
            <Icon :type="expandedSnippets[i] ? 'ios-arrow-up' : 'ios-arrow-down'" size="14" />
            <span>{{ expandedSnippets[i] ? '收起摘要' : '查看教案摘要' }}</span>
          </div>
          <transition name="slide">
            <div v-if="expandedSnippets[i] && node.snippet" class="pt-snippet" v-html="renderMD(node.snippet)"></div>
          </transition>

          <div class="pt-step-actions">
            <Button size="small" type="primary" ghost @click="startLearn(node)">
              <Icon type="ios-play" size="14" /> 开始学习
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PathTimeline',
  props: {
    nodes: { type: Array, default: () => [] },
    start: { type: String, default: '' },
    goal: { type: String, default: '' },
    fallback: { type: Boolean, default: false },
    maxStars: { type: Number, default: 5 }
  },
  data () {
    return {
      expandedSnippets: {}
    }
  },
  methods: {
    starCount (difficulty) {
      const d = parseFloat(difficulty) || 3
      return Math.round(d)
    },
    diffLabel (difficulty) {
      const d = parseFloat(difficulty) || 3
      if (d <= 1.5) return '入门'
      if (d <= 2.5) return '基础'
      if (d <= 3.5) return '中等'
      if (d <= 4.5) return '较难'
      return '困难'
    },
    diffClass (difficulty) {
      const d = parseFloat(difficulty) || 3
      if (d <= 1.5) return 'easy'
      if (d <= 2.5) return 'easy'
      if (d <= 3.5) return 'mid'
      return 'hard'
    },
    toggleSnippet (i) {
      this.expandedSnippets[i] = !this.expandedSnippets[i]
    },
    startLearn (node) {
      if (this.$router && node.name) {
        this.$router.push({
          name: 'ai-chat-fullscreen',
          query: { prompt: `请帮我讲解知识点：${node.name}` }
        })
      }
    },
    renderMD (text) {
      if (!text) return ''
      let html = text
      html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => '<pre class="md-code"><code>' + this._esc(code.trim()) + '</code></pre>')
      html = html.replace(/`([^`]+)`/g, (_, code) => '<code>' + this._esc(code) + '</code>')
      html = html.replace(/^## (.+)$/gm, '<h4>$1</h4>')
      html = html.replace(/^# (.+)$/gm, '<h3>$1</h3>')
      html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
      html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
      html = html.replace(/((?:<li>[\s\S]*?<\/li>\n?)+)/g, '<ul>$1</ul>')
      html = html.replace(/\n/g, '<br>')
      return html
    },
    _esc (str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    }
  }
}
</script>

<style lang="less" scoped>
.path-timeline-compact {
  background: #f8f9fc;
  border: 1px solid #e8eaec;
  border-radius: 12px;
  padding: 16px;
  margin: 8px 0;
}

.pt-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e8eaec;

  .pt-title {
    font-weight: 700;
    font-size: 15px;
    color: #17233d;
  }

  .pt-route {
    color: #808695;
    font-size: 13px;
    margin-left: auto;
  }

  .pt-fallback-badge {
    display: inline-block;
    font-size: 11px;
    font-weight: 600;
    padding: 1px 8px;
    border-radius: 3px;
    background: #f90;
    color: #fff;
  }
}

.pt-steps {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.pt-step {
  display: flex;
  gap: 12px;
}

.pt-step-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 28px;
  flex-shrink: 0;

  .pt-dot {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #e8eaec;
    color: #808695;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    transition: all 0.3s;

    &.active {
      background: linear-gradient(135deg, #2d8cf0, #19be6b);
      color: #fff;
      box-shadow: 0 2px 8px rgba(45, 140, 240, 0.3);
    }

    &.done {
      background: #19be6b;
      color: #fff;
    }
  }

  .pt-line {
    width: 2px;
    flex: 1;
    min-height: 24px;
    background: linear-gradient(to bottom, #19be6b, #e8eaec);
    margin: 4px 0;
  }
}

.pt-step-body {
  flex: 1;
  padding-bottom: 16px;
  min-width: 0;
}

.pt-step-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;

  .pt-step-name {
    font-weight: 600;
    font-size: 15px;
    color: #17233d;
  }

  .pt-stars {
    display: flex;
    align-items: center;
    gap: 1px;
    flex-shrink: 0;

    .pt-star {
      color: #e8eaec;
      font-size: 14px;
      transition: color 0.2s;

      &.filled {
        color: #f5a623;
      }
    }

    .pt-diff-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      padding: 1px 8px;
      border-radius: 3px;
      line-height: 18px;
      margin-left: 6px;

      &.easy { background: #19be6b; color: #fff; }
      &.mid { background: #f90; color: #fff; }
      &.hard { background: #ed4014; color: #fff; }
    }
  }
}

.pt-step-meta {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;

  .pt-meta-tag {
    display: inline-block;
    font-size: 12px;
    font-weight: 600;
    padding: 2px 10px;
    border-radius: 4px;
    line-height: 20px;

    &.pt-meta-blue { background: #2d8cf0; color: #fff; }
    &.pt-meta-purple { background: #722ed1; color: #fff; }
  }
}

.pt-snippet-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: #2d8cf0;
  font-size: 13px;
  margin-bottom: 4px;
  user-select: none;

  &:hover {
    opacity: 0.8;
  }
}

.pt-snippet {
  background: #fff;
  border: 1px solid #e8eaec;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  color: #515a6e;
  line-height: 1.6;
  margin: 4px 0 8px;
  white-space: normal;
  word-break: break-word;
  max-height: 260px;
  overflow-y: auto;

  :deep(h3){ font-size: 15px; font-weight: 600; margin: 8px 0 4px; color: #17233d; }
  :deep(h4){ font-size: 14px; font-weight: 600; margin: 6px 0 3px; color: #333; }
  :deep(strong){ font-weight: 700; }
  :deep(em){ font-style: italic; }
  :deep(ul){ padding-left: 18px; margin: 4px 0; }
  :deep(li){ margin: 2px 0; }
  :deep(code){ background: rgba(0,0,0,0.06); padding: 1px 5px; border-radius: 3px; font-size: 90%; }
  :deep(pre.md-code){ background: #1e1e2e; color: #cdd6f4; border-radius: 6px; padding: 10px; overflow-x: auto; margin: 6px 0; font-size: 12px; line-height: 1.4; }
  :deep(a){ color: #2d8cf0; }
}

.pt-step-actions {
  margin-top: 8px;
}

.slide-enter-active, .slide-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.slide-enter, .slide-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.slide-enter-to, .slide-leave-from {
  max-height: 200px;
  opacity: 1;
}
</style>
