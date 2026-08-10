<template>
  <div class="lesson-plan-study">
    <div v-if="loading" class="loading-container">
      <Spin size="large" fix></Spin>
    </div>
    <div v-else-if="lessonPlan" class="study-container">
      <!-- 顶部信息栏 -->
      <div class="top-bar">
        <div class="top-bar-left">
          <Button type="text" @click="$router.back()" icon="ios-arrow-back">Back</Button>
          <span class="divider">|</span>
          <h1 class="top-bar-title">{{ lessonPlan.title }}</h1>
        </div>
        <div class="top-bar-center">
          <span class="meta-item">
            <Icon type="ios-person" />
            {{ lessonPlan.created_by_username }}
          </span>
          <span class="meta-item">
            <Icon type="ios-calendar" />
            {{ lessonPlan.create_time | localtime }}
          </span>
          <span class="meta-item">
            <Icon type="ios-list" />
            {{ lessonPlan.problems_count }} Problems
          </span>
        </div>
        <div class="top-bar-right">
          <Button v-if="currentProblem" type="primary" size="small" @click="showFullRight = !showFullRight" icon="ios-split">
            {{ showFullRight ? 'Show Split' : 'Focus Mode' }}
          </Button>
        </div>
      </div>

      <!-- 学习进度条 -->
      <div class="progress-bar-section" v-if="progress.total > 0 || progressLoaded">
        <div class="progress-info">
          <Icon type="ios-checkmark-circle" class="progress-icon" :class="{ done: progress.solved === progress.total && progress.total > 0 }" />
          <span class="progress-label">学习进度</span>
          <span class="progress-count"><b>{{ progress.solved }}</b> / {{ progress.total }}</span>
          <span class="progress-percent" v-if="progress.total > 0">{{ Math.round(progress.solved / progress.total * 100) }}%</span>
          <span class="progress-hint" v-else>本教案暂无关联题目</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: (progress.total > 0 ? (progress.solved / progress.total * 100) : 0) + '%' }"></div>
        </div>
      </div>

      <!-- 主内容区 -->
      <div class="main-content" ref="mainContent">
        <!-- 左侧：教案内容 / PDF 预览 -->
        <div v-show="!showFullRight" class="content-left" :style="{ width: leftWidth + '%' }">
          <div class="content-scroll">
            <!-- 如果有 PDF，优先显示 PDF 预览 -->
            <div v-if="lessonPlan.pdf_file" class="pdf-full-preview">
              <iframe :src="pdfUrl" width="100%" height="100%" frameborder="0"></iframe>
            </div>
            <!-- 否则显示 HTML 内容 -->
            <div v-else class="lesson-content" v-html="renderedContent"></div>
          </div>
        </div>

        <!-- 拖拽分隔条 -->
        <div v-show="!showFullRight" class="resize-handle" @mousedown="startResize"></div>

        <!-- 拖拽遮罩层 -->
        <div v-show="isResizing" class="resize-overlay"></div>

        <!-- 右侧：题目列表 / 题目详情 -->
        <div class="content-right" :style="{ width: showFullRight ? '100%' : (100 - leftWidth) + '%' }">
          <!-- 题目列表视图 -->
          <div v-if="!currentProblem" class="problems-view">
            <div class="view-header">
              <h2><Icon type="ios-list" /> Related Problems</h2>
              <div class="view-header-right">
                <span class="problem-count">{{ sortedProblems.length }} problems</span>
                <RadioGroup v-model="viewMode" type="button" size="small">
                  <Radio label="list">
                    <Icon type="ios-list" />
                  </Radio>
                  <Radio label="card">
                    <Icon type="ios-apps" />
                  </Radio>
                </RadioGroup>
              </div>
            </div>
            <!-- 列表视图 -->
            <div v-if="viewMode === 'list'" class="problems-list">
              <div 
                v-for="problem in sortedProblems" 
                :key="problem.id" 
                class="problem-item"
                @click="selectProblem(problem)"
              >
                <div class="problem-info">
                  <span class="problem-id">{{ problem._id }}</span>
                  <span class="problem-title">{{ problem.title }}</span>
                  <Tag :color="getDifficultyColor(problem.difficulty)" size="small">
                    {{ problem.difficulty }}
                  </Tag>
                  <Icon v-if="isSolved(problem)" type="ios-checkmark-circle" class="solved-mark" title="已通过" />
                </div>
                <Icon type="ios-arrow-forward" class="arrow-icon" />
              </div>
            </div>
            <!-- 卡片视图 -->
            <div v-else class="problems-cards">
              <Card
                v-for="problem in sortedProblems"
                :key="problem.id"
                class="problem-card"
                :padding="16"
                shadow
                @click.native="selectProblem(problem)"
              >
                <div class="card-top">
                  <span class="problem-id">{{ problem._id }}</span>
                  <Tag :color="getDifficultyColor(problem.difficulty)" size="small">
                    {{ problem.difficulty }}
                  </Tag>
                  <Icon v-if="isSolved(problem)" type="ios-checkmark-circle" class="solved-mark" title="已通过" />
                </div>
                <p class="problem-title">{{ problem.title }}</p>
                <div class="card-bottom">
                  <Icon type="ios-arrow-forward" class="arrow-icon" />
                  <span class="card-action">开始做题</span>
                </div>
              </Card>
            </div>
          </div>

          <!-- 嵌入式题目界面 -->
          <div v-else class="embedded-problem-container">
            <div class="problem-header">
              <div class="header-left">
                <Button type="text" @click="backToList" icon="ios-arrow-back">Back to List</Button>
                <span class="divider">|</span>
                <span class="problem-id">{{ currentProblem._id }}</span>
                <h2 class="problem-title">{{ currentProblem.title }}</h2>
                <Tag :color="getDifficultyColor(currentProblem.difficulty)">
                  {{ currentProblem.difficulty }}
                </Tag>
              </div>
              <div class="header-right">
                <Button type="ghost" size="small" @click="openInNewTab" icon="ios-open">
                  Open in New Tab
                </Button>
              </div>
            </div>
            <div class="problem-content">
              <EmbeddedProblem :problem-id="currentProblem._id" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@oj/api'
import EmbeddedProblem from './EmbeddedProblem.vue'
import { renderMarkdown } from '@/utils/markdown'

export default {
  name: 'LessonPlanStudy',
  components: {
    EmbeddedProblem
  },
  data () {
    return {
      lessonPlan: null,
      loading: false,
      leftWidth: 60,
      isResizing: false,
      currentProblem: null,
      showFullRight: false,
      viewMode: 'list',
      progress: { total: 0, solved: 0, problems: [] },
      progressLoaded: false
    }
  },
  computed: {
    sortedProblems () {
      if (!this.lessonPlan || !this.lessonPlan.problems) {
        return []
      }
      return [...this.lessonPlan.problems].sort((a, b) => a.order - b.order)
    },
    pdfUrl () {
      if (!this.lessonPlan || !this.lessonPlan.pdf_file) return ''
      let url = this.lessonPlan.pdf_file
      if (url.startsWith('//')) {
        url = url.substring(1)
      }
      return url
    },
    renderedContent () {
      if (!this.lessonPlan || !this.lessonPlan.content) return ''
      const content = this.lessonPlan.content || ''
      if (content.startsWith('[MD]')) {
        return renderMarkdown(content.replace(/^\[MD\]\n?/, ''))
      }
      return content
    }
  },
  mounted () {
    this.getLessonPlanDetail()
  },
  methods: {
    getLessonPlanDetail () {
      this.loading = true
      const id = this.$route.params.id
      api.getLessonPlanDetail(id).then(res => {
        this.lessonPlan = res.data.data
        this.loading = false
        this.loadProgress()
      }).catch(() => {
        this.loading = false
      })
    },
    loadProgress () {
      const id = this.$route.params.id
      api.getLessonPlanProgress(id).then(res => {
        this.progress = res.data.data || { total: 0, solved: 0, problems: [] }
        this.progressLoaded = true
      }).catch(() => {
        this.progressLoaded = true
      })
    },
    isSolved (problem) {
      if (!this.progress || !this.progress.problems) return false
      const p = this.progress.problems.find(x => x.problem_id === problem.id)
      return !!(p && p.solved)
    },
    backToList () {
      this.currentProblem = null
      this.loadProgress()
    },
    selectProblem (problem) {
      this.currentProblem = problem
    },
    getDifficultyColor (difficulty) {
      const colors = {
        'Low': 'green',
        'Mid': 'blue',
        'High': 'red'
      }
      return colors[difficulty] || 'default'
    },
    openInNewTab () {
      window.open(`/problem/${this.currentProblem._id}`, '_blank')
    },
    startResize (e) {
      this.isResizing = true
      window.addEventListener('mousemove', this.handleResize)
      window.addEventListener('mouseup', this.stopResize)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      e.preventDefault()
    },
    handleResize (e) {
      if (!this.isResizing) return
      const container = this.$refs.mainContent
      if (!container) return
      const containerRect = container.getBoundingClientRect()
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100
      this.leftWidth = Math.min(Math.max(newWidth, 30), 80)
    },
    stopResize () {
      this.isResizing = false
      window.removeEventListener('mousemove', this.handleResize)
      window.removeEventListener('mouseup', this.stopResize)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  },
  beforeDestroy () {
    document.removeEventListener('mousemove', this.handleResize)
    document.removeEventListener('mouseup', this.stopResize)
  }
}
</script>

<style lang="less" scoped>
.lesson-plan-study {
  position: fixed;
  top: 80px;
  left: 0;
  right: 0;
  bottom: 60px;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.study-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 顶部导航栏 */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  z-index: 100;

  .top-bar-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 200px;

    .divider {
      color: #cbd5e1;
    }

    .top-bar-title {
      font-size: 1rem;
      font-weight: 600;
      color: #1e3a8a;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 300px;
    }
  }

  .top-bar-center {
    display: flex;
    gap: 20px;
    justify-content: center;
    flex: 1;

    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      color: #64748b;

      .ivu-icon {
        font-size: 14px;
      }
    }
  }

  .top-bar-right {
    min-width: 100px;
    display: flex;
    justify-content: flex-end;
  }
}

/* 学习进度条 */
.progress-bar-section {
  padding: 12px 20px;
  background: linear-gradient(135deg, #f0f7ff 0%, #e8f5e9 100%);
  border-bottom: 1px solid #e2e8f0;

  .progress-info {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;

    .progress-icon {
      font-size: 20px;
      color: #c0c8d8;
      &.done { color: #19be6b; }
    }
    .progress-label { font-size: 14px; color: #64748b; }
    .progress-count {
      font-size: 15px; color: #1e3a8a;
      b { font-size: 18px; font-weight: 700; }
    }
    .progress-percent {
      margin-left: auto;
      font-size: 13px; font-weight: 600;
      color: #2d8cf0;
      background: rgba(45,140,240,0.1);
      padding: 2px 10px;
      border-radius: 10px;
    }
    .progress-hint { margin-left: auto; font-size: 13px; color: #94a3b8; }
  }

  .progress-track {
    height: 8px;
    background: #e2e8f0;
    border-radius: 4px;
    overflow: hidden;

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #2d8cf0, #19be6b);
      border-radius: 4px;
      transition: width 0.5s ease;
    }
  }
}

/* 主内容区 */
.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.solved-mark {
  color: #19be6b;
  font-size: 18px;
  margin-left: 2px;
}

/* 左侧内容 */
.content-left {
  background: white;
  overflow: hidden;
  transition: width 0.1s ease;
}

.content-scroll {
  height: 100%;
  overflow-y: auto;
}

/* 右侧内容 */
.content-right {
  background: #f8fafc;
  overflow: hidden;
  transition: width 0.2s ease;
}

/* 拖拽分隔条 */
.resize-handle {
  width: 4px;
  background: #e2e8f0;
  cursor: col-resize;
  transition: background 0.2s ease;
  z-index: 10;

  &:hover {
    background: #1e3a8a;
  }
}

/* 拖拽遮罩层 */
.resize-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  cursor: col-resize;
}

/* PDF 全屏预览 */
.pdf-full-preview {
  height: 100%;
  min-height: 100%;

  embed {
    width: 100%;
    height: 100%;
    border: none;
  }
}

/* 教案内容 */
.lesson-content {
  padding: 28px 32px;
  font-size: 17px;
  line-height: 1.9;
  color: #334155;

  /deep/ img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 16px 0;
  }

  /deep/ h1 { font-size: 1.8em; color: #1e3a8a; margin: 28px 0 14px; }
  /deep/ h2 { font-size: 1.5em; color: #1e3a8a; margin: 24px 0 12px; }
  /deep/ h3 { font-size: 1.25em; color: #1e3a8a; margin: 20px 0 10px; }
  /deep/ h4, /deep/ h5, /deep/ h6 {
    color: #1e3a8a;
    margin-top: 20px;
    margin-bottom: 10px;
  }

  /deep/ p {
    margin-bottom: 16px;
  }

  /deep/ code {
    background: #f1f5f9;
    padding: 2px 8px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
  }

  /deep/ pre {
    background: #1e293b;
    color: #e2e8f0;
    padding: 18px 20px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 16px 0;
    font-size: 15px;
    line-height: 1.4;

    code {
      background: transparent;
      padding: 0;
      font-size: inherit;
    }
  }

  /deep/ ul, /deep/ ol {
    padding-left: 32px;
    margin-bottom: 16px;
  }

  /deep/ ol {
    list-style-position: outside;
  }

  /deep/ ol li {
    word-break: break-word;
  }

  /deep/ ul li {
    word-break: break-word;
  }

  /deep/ blockquote {
    border-left: 4px solid #3b82f6;
    padding-left: 16px;
    margin: 16px 0;
    color: #64748b;
  }

  /deep/ a {
    color: #2563eb;
    text-decoration: underline;
  }

  /deep/ hr {
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 20px 0;
  }

  /deep/ table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;

    th {
      background: #f8fafc;
      font-weight: 600;
      text-align: left;
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
    }

    td {
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
    }
  }

  /deep/ strong {
    color: #1e3a8a;
  }
}

/* 题目列表视图 */
.problems-view {
  height: 100%;
  display: flex;
  flex-direction: column;

  .view-header {
    padding: 14px 16px;
    background: white;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;

    h2 {
      font-size: 0.95rem;
      font-weight: 600;
      color: #1e3a8a;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;

      .ivu-icon {
        font-size: 16px;
      }
    }

    .view-header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .problem-count {
      font-size: 0.8rem;
      color: #94a3b8;
    }
  }
}

.problems-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.problem-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  background: white;
  border-radius: 8px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #e2e8f0;

  &:hover {
    background: #f0f9ff;
    border-color: #bae6fd;
    transform: translateX(4px);
  }

  .problem-info {
    display: flex;
    align-items: center;
    gap: 10px;

    .solved-mark {
      color: #19be6b;
      font-size: 18px;
      margin-left: 2px;
    }

    .problem-id {
      font-size: 0.8rem;
      font-weight: 600;
      color: #64748b;
      min-width: 45px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .problem-title {
      font-size: 0.9rem;
      font-weight: 500;
      color: #1e3a8a;
    }
  }

  .arrow-icon {
    font-size: 14px;
    color: #94a3b8;
  }
}

/* 嵌入式题目容器 */
.embedded-problem-container {
  height: 100%;
  display: flex;
  flex-direction: column;

  .problem-header {
    padding: 10px 16px;
    background: white;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;

    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;

      .divider {
        color: #cbd5e1;
      }

      .problem-id {
        font-size: 0.8rem;
        font-weight: 600;
        color: #64748b;
      }

      .problem-title {
        font-size: 1rem;
        font-weight: 600;
        color: #1e3a8a;
        margin: 0;
      }
    }

    .header-right {
      display: flex;
      gap: 8px;
    }
  }

  .problem-content {
    flex: 1;
    overflow: hidden;
  }
}

/* 卡片视图 */
.problems-cards {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  align-content: start;
}

.problem-card {
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 10px;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(30, 58, 138, 0.12);
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    .problem-id {
      font-size: 0.8rem;
      font-weight: 700;
      color: #3b82f6;
    }
  }

  .problem-title {
    font-size: 0.9rem;
    font-weight: 500;
    color: #1e3a8a;
    margin: 0 0 14px;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-bottom {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    color: #3b82f6;
    font-size: 0.8rem;
    font-weight: 500;

    .arrow-icon {
      font-size: 13px;
    }
  }
}

</style>
