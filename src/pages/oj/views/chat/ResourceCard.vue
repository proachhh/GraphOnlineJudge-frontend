<template>
  <div class="resource-card" :class="'type-' + displayType">
    <div class="resource-header">
      <div class="resource-badge">{{ typeLabel }}</div>
      <TopicTag v-if="topic" class="topic-tag">{{ topic }}</TopicTag>
      <Button
        v-if="content"
        type="text"
        size="small"
        icon="ios-copy-outline"
        @click="copyContent"
        class="copy-btn"
      >复制</Button>
    </div>

    <Divider class="resource-divider" />

    <!-- Markdown 课程讲解 -->
    <div v-if="displayType === 'markdown'" class="markdown-body">
      <div v-katex v-html="renderedMarkdown"></div>
    </div>

    <!-- Mermaid 思维导图 -->
    <div v-if="displayType === 'mermaid'" class="mermaid-container">
      <div class="mermaid-code-block">
        <pre><code>{{ content }}</code></pre>
      </div>
      <div ref="mermaidChart" class="mermaid-chart"></div>
    </div>

    <!-- 练习题 -->
    <div v-if="displayType === 'exercises'" class="exercises-body">
      <div v-if="exercises.choice && exercises.choice.stem" class="exercise-section">
        <div class="ex-type-tag">选择题</div>
        <div class="ex-stem" v-katex v-html="renderMarkdown(exercises.choice.stem)"></div>
        <RadioGroup v-model="selectedChoice" class="ex-options">
          <Radio v-for="(opt, i) in exercises.choice.options" :key="i" :label="opt.charAt(0)">
            {{ opt }}
          </Radio>
        </RadioGroup>
        <div v-if="showAnswers" class="ex-answer correct">
          正确答案: {{ exercises.choice.answer }}
          <div class="ex-explanation">{{ exercises.choice.explanation }}</div>
        </div>
        <Button size="small" @click="showAnswers = !showAnswers" class="toggle-answer-btn">
          {{ showAnswers ? '隐藏答案' : '查看答案' }}
        </Button>
      </div>

      <div v-if="exercises.fill_blank && exercises.fill_blank.stem" class="exercise-section">
        <div class="ex-type-tag">填空题</div>
        <div class="ex-stem" v-katex v-html="renderMarkdown(exercises.fill_blank.stem)"></div>
        <div v-if="showAnswers" class="ex-answer correct">
          答案: {{ exercises.fill_blank.answers.join(' ; ') }}
          <div class="ex-explanation">{{ exercises.fill_blank.explanation }}</div>
        </div>
      </div>

      <div v-if="exercises.true_false && exercises.true_false.stem" class="exercise-section">
        <div class="ex-type-tag">判断题</div>
        <div class="ex-stem" v-katex v-html="renderMarkdown(exercises.true_false.stem)"></div>
        <div v-if="showAnswers" class="ex-answer" :class="exercises.true_false.answer ? 'correct' : 'wrong'">
          答案: {{ exercises.true_false.answer ? '正确 ✓' : '错误 ✗' }}
          <div class="ex-explanation">{{ exercises.true_false.explanation }}</div>
        </div>
      </div>

      <div v-if="exercises.short_answer && exercises.short_answer.stem" class="exercise-section">
        <div class="ex-type-tag">简答题</div>
        <div class="ex-stem" v-katex v-html="renderMarkdown(exercises.short_answer.stem)"></div>
        <div v-if="showAnswers" class="ex-answer">
          参考答案: {{ exercises.short_answer.reference_answer }}
          <div class="ex-explanation">{{ exercises.short_answer.explanation }}</div>
        </div>
      </div>
    </div>

    <!-- 阅读清单 -->
    <div v-if="displayType === 'reading_list'" class="reading-body">
      <div v-if="readings.readings && readings.readings.length" class="reading-list">
        <div v-for="(item, i) in readings.readings" :key="i" class="reading-item">
          <div class="reading-index">{{ i + 1 }}</div>
          <div class="reading-info">
            <h4>{{ item.title }}</h4>
            <p class="reading-reason"><Icon type="ios-bulb-outline" /> {{ item.reason }}</p>
            <p class="reading-summary">{{ item.summary }}</p>
            <Tag color="blue">{{ item.audience }}</Tag>
          </div>
        </div>
      </div>
      <div v-if="readings.reading_order" class="reading-order">
        <Icon type="ios-list-box-outline" />
        {{ readings.reading_order }}
      </div>
    </div>

    <!-- 代码案例 -->
    <div v-if="displayType === 'code_example'" class="code-example-body">
      <div v-katex v-html="renderedMarkdown"></div>
    </div>

    <!-- 编程题 -->
    <div v-if="displayType === 'coding_problem'" class="coding-problem-body">
      <div class="cp-header">
        <h3>{{ codingProblem.title || '编程题' }}</h3>
        <div class="cp-meta">
          <Tag :color="getDifficultyColor(codingProblem.difficulty)">{{ codingProblem.difficulty }}</Tag>
          <Tag v-for="tag in codingProblem.tags" :key="tag" color="cyan">{{ tag }}</Tag>
          <span class="cp-limits">⏱ {{ codingProblem.time_limit || 1000 }}ms | 💾 {{ codingProblem.memory_limit || 256 }}MB</span>
        </div>
      </div>
      <div v-if="codingProblem.description" class="cp-section">
        <h4>题目描述</h4>
        <div v-html="codingProblem.description"></div>
      </div>
      <div v-if="codingProblem.input_description" class="cp-section">
        <h4>输入说明</h4>
        <div v-html="codingProblem.input_description"></div>
      </div>
      <div v-if="codingProblem.output_description" class="cp-section">
        <h4>输出说明</h4>
        <div v-html="codingProblem.output_description"></div>
      </div>
      <div v-if="codingProblem.samples && codingProblem.samples.length" class="cp-section">
        <h4>样例</h4>
        <div v-for="(sample, i) in codingProblem.samples" :key="i" class="cp-sample">
          <div class="sample-block">
            <div class="sample-label">输入</div>
            <pre>{{ sample.input }}</pre>
          </div>
          <div class="sample-block">
            <div class="sample-label">输出</div>
            <pre>{{ sample.output }}</pre>
          </div>
        </div>
      </div>
      <div v-if="codingProblem.hint" class="cp-section">
        <h4>提示</h4>
        <div v-html="codingProblem.hint"></div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-block">
      <Spin>
        <Icon type="ios-loading" size="24" class="spin-icon"></Icon>
        <div>正在生成资源...</div>
      </Spin>
    </div>
  </div>
</template>

<script>
import { renderMarkdown } from '@/utils/markdown'
export default {
  name: 'ResourceCard',
  props: {
    data: {
      type: Object,
      default: () => ({})
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      showAnswers: false,
      selectedChoice: ''
    }
  },
  computed: {
    displayType () {
      return this.data.display_type || 'markdown'
    },
    topic () {
      return this.data.topic || ''
    },
    content () {
      return this.data.content || ''
    },
    exercises () {
      if (typeof this.data.content === 'object') return this.data.content
      return {}
    },
    readings () {
      if (typeof this.data.content === 'object') return this.data.content
      return { readings: [], reading_order: '' }
    },
    typeLabel () {
      const map = {
        'lecture': '课程讲解',
        'mindmap': '思维导图',
        'exercise': '练习题',
        'reading': '阅读清单',
        'code_example': '代码案例',
        'coding_problem': '编程题'
      }
      return map[this.data.resource_type] || '资源'
    },
    codingProblem () {
      if (typeof this.data.content === 'object') return this.data.content
      return {}
    },
    renderedMarkdown () {
      if (!this.content || typeof this.content !== 'string') return ''
      if (typeof this.$markdownRender === 'function') {
        return this.$markdownRender(this.content)
      }
      return renderMarkdown(this.content)
    }
  },
  methods: {
    renderMarkdown (text) {
      if (!text || typeof text !== 'string') return text
      if (typeof this.$markdownRender === 'function') {
        return this.$markdownRender(text)
      }
      return renderMarkdown(text)
    },
    copyContent () {
      const text = typeof this.content === 'string' ? this.content : JSON.stringify(this.content, null, 2)
      navigator.clipboard.writeText(text).then(() => {
        this.$Message.success('已复制')
      })
    },
    getDifficultyColor (diff) {
      const map = { 'Low': 'success', 'Mid': 'warning', 'High': 'error' }
      return map[diff] || 'default'
    }
  }
}
</script>

<style lang="less" scoped>
.resource-card {
  background: #112240;
  border: 1px solid #233554;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  color: #ccd6f6;

  &.type-mindmap {
    background: linear-gradient(135deg, #112240 0%, #1a1a3e 100%);
  }
}

.resource-header {
  display: flex;
  align-items: center;
  gap: 10px;

  .resource-badge {
    background: linear-gradient(135deg, #64ffda, #4fc3f7);
    color: #0a192f;
    padding: 3px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 700;
  }

  .topic-tag {
    background: rgba(100, 255, 218, 0.1);
    color: #64ffda;
  }

  .copy-btn {
    margin-left: auto;
    color: #8892b0;
  }
}

.resource-divider {
  background: #233554;
  margin: 12px 0;
}

.markdown-body {
  line-height: 1.8;
  font-size: 14px;

  /deep/ h2 { color: #64ffda; font-size: 18px; margin: 16px 0 8px; }
  /deep/ h3 { color: #ccd6f6; font-size: 15px; margin: 12px 0 6px; }
  /deep/ code { background: #1d2d50; padding: 2px 6px; border-radius: 4px; }
  /deep/ pre { background: #0a192f; padding: 16px; border-radius: 8px; overflow-x: auto; }
  /deep/ ul, /deep/ ol { padding-left: 20px; }
  /deep/ li { margin: 4px 0; }
}

.mermaid-container {
  .mermaid-code-block {
    background: #0a192f;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
    overflow-x: auto;

    pre {
      margin: 0;
      code { color: #a8b2d1; font-size: 13px; }
    }
  }
}

.exercises-body {
  .exercise-section {
    background: #0a192f;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;

    .ex-type-tag {
      display: inline-block;
      background: #64ffda;
      color: #0a192f;
      padding: 2px 10px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .ex-stem {
      margin-bottom: 10px;
      line-height: 1.7;
    }

    .ex-options {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 10px;

      /deep/ .ivu-radio-wrapper { color: #a8b2d1; }
    }

    .ex-answer {
      margin-top: 8px;
      padding: 10px;
      background: #1d2d50;
      border-radius: 6px;
      font-size: 13px;

      &.correct { border-left: 3px solid #4caf50; }
      &.wrong { border-left: 3px solid #f44336; }

      .ex-explanation {
        color: #8892b0;
        margin-top: 4px;
        font-size: 12px;
      }
    }

    .toggle-answer-btn {
      margin-top: 6px;
    }
  }
}

.reading-body {
  .reading-list {
    .reading-item {
      display: flex;
      gap: 14px;
      background: #0a192f;
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 10px;

      .reading-index {
        width: 28px;
        height: 28px;
        background: #64ffda;
        color: #0a192f;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        flex-shrink: 0;
      }

      .reading-info {
        h4 { color: #e6f1ff; margin: 0 0 6px; }
        .reading-reason { color: #64ffda; font-size: 12px; margin: 0 0 4px; }
        .reading-summary { color: #8892b0; font-size: 13px; margin: 0 0 6px; }
      }
    }
  }

  .reading-order {
    color: #8892b0;
    font-size: 13px;
    margin-top: 8px;
  }
}

.code-example-body {
  line-height: 1.8;
  /deep/ pre { background: #0a192f; }
  /deep/ code { background: #1d2d50; }
}

.loading-block {
  display: flex;
  justify-content: center;
  padding: 40px;
  color: #8892b0;

  .spin-icon {
    animation: spin 1s linear infinite;
    margin-bottom: 8px;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.coding-problem-body {
  .cp-header {
    margin-bottom: 16px;
    h3 {
      color: #e6f1ff;
      margin: 0 0 8px;
      font-size: 18px;
    }
    .cp-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      .cp-limits {
        color: #8892b0;
        font-size: 13px;
      }
    }
  }
  .cp-section {
    margin-bottom: 16px;
    h4 {
      color: #64ffda;
      font-size: 14px;
      margin-bottom: 8px;
    }
    div { color: #ccd6f6; font-size: 14px; line-height: 1.6; }
  }
  .cp-sample {
    display: flex;
    gap: 12px;
    .sample-block {
      flex: 1;
      background: #0a192f;
      border-radius: 8px;
      padding: 12px;
      .sample-label {
        color: #64ffda;
        font-size: 12px;
        margin-bottom: 6px;
        font-weight: 600;
      }
      pre {
        margin: 0;
        color: #a8b2d1;
        font-size: 13px;
        white-space: pre-wrap;
        word-break: break-all;
      }
    }
  }
}
</style>
