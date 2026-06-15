<template>
  <div class="learning-path-page">
    <!-- 全屏背景知识图谱 -->
    <div class="fullscreen-graph">
      <KnowledgeGraphSection ref="knowledgeGraph" @node-click="onNodeClick" />
    </div>

    <!-- 页面内容 -->
    <div class="page-content">
      <!-- 标题 -->
      <div class="content-header">
        <h1 class="page-title">{{ $t('m.Learning_Path') }}</h1>
        <p class="page-subtitle">{{ $t('m.Learning_Path_Subtitle') }}</p>
      </div>

      <!-- 搜索 -->
      <div class="search-wrapper">
        <Input
          v-model="searchQuery"
          :placeholder="$t('m.Search_Topics')"
          prefix="ios-search"
          clearable
          class="topic-search"
        />
      </div>

      <!-- 知识点选择 -->
      <div class="selection-wrapper">
        <!-- 起点 -->
        <div class="selection-group">
          <div class="group-label">
            <Icon type="ios-navigate" size="18" color="#2d8cf0" />
            <span>{{ $t('m.Start_Topic') }}</span>
            <Tag v-if="startTopic" closable @on-close="clearStartTopic" class="start-tag" size="small">
              {{ translateTopic(startTopic) }}
            </Tag>
          </div>
          <div class="tags-scroll">
            <Tag
              v-for="topic in filteredTopics"
              :key="'start-'+topic"
              :class="['selectable-tag', { 'start-selected': startTopic === topic }]"
              @click.native="selectStartTopic(topic)"
            >
              {{ translateTopic(topic) }}
            </Tag>
          </div>
        </div>

        <!-- 目标 -->
        <div class="selection-group">
          <div class="group-label">
            <Icon type="ios-flag" size="18" color="#ed4014" />
            <span>{{ $t('m.Target_Topic') }}</span>
            <Tag v-if="targetTopic" closable @on-close="clearTargetTopic" class="target-tag" size="small">
              {{ translateTopic(targetTopic) }}
            </Tag>
          </div>
          <div class="tags-scroll">
            <Tag
              v-for="topic in filteredTopics"
              :key="'target-'+topic"
              :class="['selectable-tag', { 'target-selected': targetTopic === topic }]"
              @click.native="selectTargetTopic(topic)"
            >
              {{ translateTopic(topic) }}
            </Tag>
          </div>
        </div>
      </div>

      <!-- 生成按钮 -->
      <div class="generate-wrapper">
        <Button
          type="primary"
          size="large"
          @click="fetchPath"
          :loading="loading"
          :disabled="!targetTopic"
          class="generate-btn"
        >
          <Icon type="ios-git-branch" />
          {{ $t('m.Generate_Path') }}
        </Button>
      </div>

      <!-- 路径结果 -->
      <div v-if="pathData" class="result-wrapper">
        <div class="weak-info">
          <span class="label">{{ $t('m.Your_Weakest_Topic') }}:</span>
          <Tag color="red">{{ translateTopic(pathData.start) }}</Tag>
          <span class="goal-label">→ {{ $t('m.Target_Topic') }}:</span>
          <Tag color="blue">{{ translateTopic(pathData.goal) }}</Tag>
          <Tag v-if="pathData.fallback" color="yellow" size="small">备选路径</Tag>
        </div>
        <Timeline class="path-timeline">
          <TimelineItem v-for="(item, index) in pathData.path_plan" :key="index">
            <div class="timeline-node" :class="{ 'is-target': index === pathData.path_plan.length - 1 }">
              <div class="node-header">
                <span class="step-badge">{{ index + 1 }}</span>
                <span class="topic-text">{{ translateTopic(item.name) }}</span>
                <div class="node-meta">
                  <span class="meta-tag meta-difficulty" :style="getDifficultyStyle(item.difficulty)">
                    难度 {{ formatDifficulty(item.difficulty) }}
                  </span>
                  <span class="meta-tag" style="background: #00bcd4; color: #fff;">
                    重要度 {{ item.importance.toFixed(0) }}
                  </span>
                  <span v-if="item.problem_count" class="meta-tag" style="background: #2d8cf0; color: #fff;">
                    {{ item.problem_count }} 题
                  </span>
                </div>
              </div>
              <div v-if="item.problems && item.problems.length" class="problem-list">
                <div class="problem-list-label">
                  <Icon type="ios-book" size="14" /> 推荐题目
                </div>
                <div
                  v-for="prob in item.problems"
                  :key="prob.id"
                  class="problem-item"
                  @click="goProblem(prob._id || prob.id)"
                >
                  <span class="problem-diff-tag" :style="getDifficultyStyle(prob.difficulty)">
                    {{ formatDifficulty(prob.difficulty) }}
                  </span>
                  <span class="problem-title-link">#{{ prob._id }} {{ prob.title }}</span>
                </div>
              </div>
              <div v-else-if="item.snippet" class="snippet-info">
                {{ item.snippet }}
              </div>
              <div v-else class="no-problem">
                {{ $t('m.No_Problem_Yet') }}
              </div>
            </div>
          </TimelineItem>
        </Timeline>
      </div>

      <!-- 错误提示 -->
      <div v-if="error" class="error-wrapper">
        <Icon type="ios-warning" size="18" />
        <span>{{ error }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@oj/api'
import KnowledgeGraphSection from '../general/KnowledgeGraphSection.vue'

export default {
  name: 'LearningPath',
  components: {
    KnowledgeGraphSection
  },
  data () {
    return {
      loading: false,
      error: '',
      allTopics: [],
      startTopic: '',
      targetTopic: '',
      searchQuery: '',
      pathData: null
    }
  },
  computed: {
    filteredTopics () {
      if (!this.searchQuery) return this.allTopics
      const query = this.searchQuery.toLowerCase()
      return this.allTopics.filter(topic => {
        const translated = this.translateTopic(topic).toLowerCase()
        return topic.toLowerCase().includes(query) || translated.includes(query)
      })
    }
  },
  mounted () {
    this.fetchAllTopics()
    // 设置导航栏为透明
    this.$nextTick(() => {
      const header = document.getElementById('header')
      if (header) {
        header.classList.add('header-transparent-white')
      }
    })
  },
  beforeDestroy () {
    // 移除导航栏透明样式
    const header = document.getElementById('header')
    if (header) {
      header.classList.remove('header-transparent-white')
    }
  },
  methods: {
    translateTopic (topic) {
      if (!topic) return ''
      // 尝试多种大小写格式
      const formats = [
        topic,                                    // 原始格式: Backtracking
        topic.toLowerCase(),                      // 全小写: backtracking
        topic.charAt(0).toLowerCase() + topic.slice(1), // 首字母小写: backtracking
        topic.charAt(0).toUpperCase() + topic.slice(1).toLowerCase() // 首字母大写: Backtracking
      ]

      for (const format of formats) {
        const key = 'm.tag.' + format
        const translated = this.$t(key)
        if (translated !== key) {
          return translated
        }
      }

      // 如果没有找到翻译，返回原始值
      return topic
    },
    // 使用 getKnowledgeGraph 获取所有知识点，而不是 getLearningStats
    fetchAllTopics () {
      api.getKnowledgeGraph().then(res => {
        const nodes = res.data.nodes
        if (nodes && nodes.length > 0) {
          this.allTopics = nodes.map(n => n.name).sort()
        } else {
          this.error = this.$t('m.No_Knowledge_Data')
        }
      }).catch(err => {
        console.error('knowledge-graph 请求失败:', err)
        this.error = this.$i18n.t('m.Fetch_Topics_Failed')
      })
    },
    selectStartTopic (topic) {
      this.startTopic = this.startTopic === topic ? '' : topic
    },
    selectTargetTopic (topic) {
      this.targetTopic = this.targetTopic === topic ? '' : topic
    },
    clearStartTopic () {
      this.startTopic = ''
    },
    clearTargetTopic () {
      this.targetTopic = ''
    },
    onNodeClick (nodeName) {
      if (!this.startTopic) {
        this.startTopic = nodeName
      } else if (!this.targetTopic && nodeName !== this.startTopic) {
        this.targetTopic = nodeName
      }
    },
    fetchPath () {
      if (!this.targetTopic) {
        this.$Message.warning(this.$i18n.t('m.Please_Select_Target_Topic'))
        return
      }
      this.loading = true
      this.error = ''
      this.pathData = null
      const params = { target_topic: this.targetTopic }
      if (this.startTopic) params.start_topic = this.startTopic
      api.getLearningPath(params).then(res => {
        this.pathData = res.data
        this.loading = false
      }).catch(err => {
        this.loading = false
        if (err.response && err.response.status === 404) {
          this.error = err.response.data.error || this.$i18n.t('m.Path_Not_Found')
        } else {
          this.error = this.$i18n.t('m.Network_Error')
        }
      })
    },
    getDifficultyStyle (diff) {
      if (diff <= 2.5) return { background: '#2d8cf0', color: '#fff' }
      if (diff <= 3.5) return { background: '#f90', color: '#fff' }
      return { background: '#ed4014', color: '#fff' }
    },
    formatDifficulty (diff) {
      if (diff <= 2.5) return 'Easy'
      if (diff <= 3.5) return 'Mid'
      return 'Hard'
    },
    goProblem (problemId) {
      this.$router.push({ name: 'problem-details', params: { problemID: problemId } })
    }
  }
}
</script>

<style lang="less" scoped>
.learning-path-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  z-index: 1;
  padding-bottom: 60px;
  background: #0a1929;
}

// 全屏知识图谱
.fullscreen-graph {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  background: #0a1929;
}

// 页面内容
.page-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  overflow-y: auto;
  padding: 100px 40px 40px;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }
}

// 标题
.content-header {
  text-align: center;
  margin-bottom: 30px;

  .page-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: white;
    margin: 0 0 10px;
    text-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
  }

  .page-subtitle {
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
  }
}

// 搜索
.search-wrapper {
  max-width: 500px;
  margin: 0 auto 20px;

  .topic-search {
    /deep/ .ivu-input {
      background: rgba(255, 255, 255, 0.95);
      border: none;
      border-radius: 24px;
      height: 48px;
      font-size: 15px;
      padding-left: 45px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);

      &::placeholder {
        color: #808695;
      }
    }

    /deep/ .ivu-input-prefix {
      left: 15px;
      color: #808695;
    }
  }
}

// 知识点选择
.selection-wrapper {
  max-width: 900px;
  margin: 0 auto 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
}

.selection-group {
  & + .selection-group {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #e8eaec;
  }

  .group-label {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
    color: #17233d;
    font-size: 15px;
    font-weight: 600;

    .start-tag,
    .start-tag /deep/ .ivu-tag-text {
      background: #2d8cf0 !important;
      border-color: #2d8cf0 !important;
      color: white !important;
    }

    .target-tag,
    .target-tag /deep/ .ivu-tag-text {
      background: #ed4014 !important;
      border-color: #ed4014 !important;
      color: white !important;
    }
  }

  .tags-scroll {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    max-height: 240px;
    overflow-y: auto;
    padding: 4px;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: #c5c8ce;
      border-radius: 2px;
    }

    .selectable-tag {
      cursor: pointer;
      transition: all 0.2s ease;
      background: #f5f7fa !important;
      border: 1px solid #e8eaec !important;
      color: #515a6e !important;
      border-radius: 16px !important;
      padding: 8px 16px !important;
      font-size: 14px !important;
      height: auto !important;
      line-height: 1.4 !important;

      &:hover {
        background: #e8eaec !important;
        border-color: #dcdee2 !important;
        transform: translateY(-1px);
      }

      &.start-selected {
        background: #2d8cf0 !important;
        border-color: #2d8cf0 !important;
        color: white !important;
        box-shadow: 0 2px 8px rgba(45, 140, 240, 0.3);
      }

      &.target-selected {
        background: #ed4014 !important;
        border-color: #ed4014 !important;
        color: white !important;
        box-shadow: 0 2px 8px rgba(237, 64, 20, 0.3);
      }
    }
  }
}

// 生成按钮
.generate-wrapper {
  text-align: center;
  margin-bottom: 24px;

  .generate-btn {
    height: 48px;
    padding: 0 40px;
    font-size: 16px;
    border-radius: 24px;
    background: linear-gradient(135deg, #2d8cf0 0%, #1a6fc4 100%);
    border: none;
    box-shadow: 0 4px 20px rgba(45, 140, 240, 0.4);

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(45, 140, 240, 0.5);
    }

    &:disabled {
      background: rgba(255, 255, 255, 0.3);
      box-shadow: none;
    }

    i {
      margin-right: 6px;
    }
  }
}

// 结果区域
.result-wrapper {
  max-width: 900px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);

  .weak-info {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    padding: 12px 16px;
    background: #fff1f0;
    border-radius: 8px;
    border-left: 3px solid #ed4014;

    .label {
      color: #515a6e;
      font-size: 14px;
    }

    .goal-label {
      color: #515a6e;
      font-size: 14px;
      margin-left: 16px;
    }
  }

  .path-timeline {
    /deep/ .ivu-timeline-item-tail {
      border-left: 2px solid #e8eaec;
      left: 15px;
    }

    /deep/ .ivu-timeline-item-head {
      width: 12px;
      height: 12px;
      left: 10px;
      background: #2d8cf0;
      border-color: #2d8cf0;
    }

    /deep/ .ivu-timeline-item-content {
      padding-left: 24px;
    }

    .timeline-node {
      padding: 12px 16px;
      background: #f5f7fa;
      border-radius: 10px;
      margin-bottom: 8px;

      &.is-target {
        background: #fff1f0;
        border: 1px solid #ffccc7;
      }

      .node-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;

        .step-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          background: #2d8cf0;
          color: white;
          border-radius: 50%;
          font-size: 12px;
          font-weight: 600;
        }

        .topic-text {
          color: #17233d;
          font-weight: 500;
          font-size: 15px;
        }
      }

      .node-meta {
        display: flex;
        gap: 6px;
        padding-left: 32px;
        flex-wrap: wrap;

        .meta-tag {
          display: inline-block;
          font-size: 12px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 4px;
          line-height: 20px;
        }
      }

      .snippet-info {
        padding-left: 32px;
        color: #515a6e;
        font-size: 13px;
        line-height: 1.6;
        margin-top: 8px;
        padding: 10px 16px;
        background: rgba(45, 140, 240, 0.05);
        border-radius: 6px;
        border-left: 3px solid #2d8cf0;
      }

      .problem-list {
        padding-left: 32px;
        margin-top: 8px;

        .problem-list-label {
          font-size: 12px;
          color: #808695;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .problem-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          margin-bottom: 4px;
          background: rgba(45, 140, 240, 0.06);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;

          &:hover {
            background: rgba(45, 140, 240, 0.15);
            transform: translateX(4px);
          }

          .problem-diff-tag {
            font-size: 11px;
            font-weight: 600;
            padding: 1px 6px;
            border-radius: 3px;
            white-space: nowrap;
            flex-shrink: 0;
          }

          .problem-title-link {
            color: #2d8cf0;
            font-size: 13px;
            font-weight: 500;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      }

      .no-problem {
        padding-left: 32px;
        color: #808695;
        font-size: 13px;
      }
    }
  }
}

// 错误提示
.error-wrapper {
  max-width: 600px;
  margin: 20px auto;
  padding: 12px 20px;
  background: rgba(237, 64, 20, 0.1);
  border: 1px solid rgba(237, 64, 20, 0.3);
  border-radius: 8px;
  color: #ed4014;
  display: flex;
  align-items: center;
  gap: 8px;
}

// 智能知识点总结区域
.topic-summary-section {
  max-width: 900px;
  margin: 20px auto 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);

  .summary-header {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #17233d;
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 12px;

    .summary-input {
      flex: 1;
      max-width: 300px;
    }
  }

  /deep/ .ai-response-card {
    margin-top: 0;
  }
}
</style>

<style lang="less">
// 导航栏透明白色样式 - 全局样式
#header.header-transparent-white {
  background-color: rgba(255, 255, 255, 0.15) !important;
  backdrop-filter: blur(10px);
  box-shadow: none;
  border: none !important;

  &::before, &::after {
    display: none !important;
  }

  .header-content {
    background-color: transparent;

    .logo .logo-img {
      /* 移除滤镜，显示原始 logo 颜色 */
    }

    .oj-menu {
      border-bottom: none !important;

      &::after {
        display: none !important;
      }

      .ivu-menu-item, .ivu-menu-submenu-title {
        border: 2px solid rgba(255, 255, 255, 0.8);
        color: rgba(255, 255, 255, 0.9) !important;

        &:hover {
          background: rgba(255, 255, 255, 0.15) !important;
          box-shadow: 0 0 12px rgba(255, 255, 255, 0.2);
        }

        &.ivu-menu-item-active {
          background: rgba(255, 255, 255, 0.25) !important;
          color: rgba(255, 255, 255, 1) !important;
          border-color: rgba(255, 255, 255, 1);
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
        }

        .ivu-icon {
          color: rgba(255, 255, 255, 0.9);
        }
      }
    }

    .auth-menu {
      .user-info {
        &:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .user-avatar {
          border-color: rgba(255, 255, 255, 0.9);
        }

        .user-name {
          color: rgba(255, 255, 255, 0.9);
        }
      }

      .ivu-btn-ghost {
        border: 2px solid rgba(255, 255, 255, 0.8);
        color: rgba(255, 255, 255, 0.9);

        &:hover {
          background: rgba(255, 255, 255, 0.15);
          box-shadow: 0 0 12px rgba(255, 255, 255, 0.2);
        }
      }
    }
  }
}
</style>
