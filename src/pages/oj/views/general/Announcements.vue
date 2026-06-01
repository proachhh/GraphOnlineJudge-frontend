<template>
  <div class="announcements-elegant">
    <!-- 主内容区 -->
    <div class="content-wrapper">
      <!-- 轮播图 + 公告列表布局 -->
      <div class="main-layout">
        <!-- 左侧堆叠卡片轮播 -->
        <div class="stacked-carousel" v-if="carouselItems.length">
          <div class="stacked-container">
            <div class="stack-wrapper">
              <!-- 所有卡片层叠 -->
              <div 
                v-for="(item, index) in carouselItems" 
                :key="index"
                class="stack-card"
                :class="{ 
                  'stack-active': index === carouselIndex,
                  'stack-next': index === nextIndex,
                  'stack-hidden': index !== carouselIndex && index !== nextIndex
                }"
                :style="{ backgroundImage: `url(${item.image})` }"
                @click="index === carouselIndex && goAnnouncement(item.announcement)"
              >
                <div class="stack-overlay">
                  <span class="stack-badge">{{ index === carouselIndex ? 'Featured' : 'Next' }}</span>
                  <h3 class="stack-title">{{ item.announcement.title }}</h3>
                  <p class="stack-meta">
                    <span class="author">{{ item.announcement.created_by.username }}</span>
                    <span class="divider">·</span>
                    <span class="time">{{ item.announcement.create_time | localtime }}</span>
                  </p>
                </div>
              </div>
            </div>
            <!-- 轮播指示器 -->
            <div class="stack-dots">
              <span 
                v-for="(item, index) in carouselItems" 
                :key="index"
                :class="['dot', { active: index === carouselIndex }]"
                @click="carouselIndex = index"
              />
            </div>
          </div>
        </div>

        <!-- 右侧公告列表 -->
        <div class="list-section">
          <div class="list-header">
            <span>{{ $t('m.Recent_Announcements') }}</span>
          </div>
          <div class="announcement-list">
            <div 
              v-for="(item, index) in displayAnnouncements" 
              :key="item.id"
              class="announcement-item"
              @click="goAnnouncement(item)"
            >
              <div class="item-content">
                <div class="item-header">
                  <span class="item-number">{{ String(index + 1).padStart(2, '0') }}</span>
                  <h4 class="item-title" :title="item.title">{{ item.title }}</h4>
                </div>
                <p class="item-meta">
                  <span class="time">{{ item.create_time | localtime }}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="!isContest && total > limit" class="pagination-section">
        <Pagination
          :total="total"
          :page-size="limit"
          @on-change="getAnnouncementList"
        />
      </div>
    </div>

    <!-- 详情弹窗 -->
    <transition name="fade">
      <div v-if="!listVisible && announcement" class="detail-modal" @click.self="goBack">
        <div class="detail-content">
          <button class="close-btn" @click="goBack">
            <Icon type="ios-close" />
          </button>
          <h2 class="detail-title">{{ announcement.title }}</h2>
          <div class="detail-meta">
            <span class="author">{{ announcement.created_by.username }}</span>
            <span class="divider">·</span>
            <span class="time">{{ announcement.create_time | localtime }}</span>
          </div>
          <div class="detail-body markdown-body" v-katex v-html="announcement.content"></div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import api from '@oj/api'
import Pagination from '@oj/components/Pagination'

export default {
  name: 'Announcement',
  components: { Pagination },
  data() {
    return {
      limit: 6,
      total: 0,
      btnLoading: false,
      announcements: [],
      announcement: null,
      listVisible: true,
      carouselIndex: 0,
      preloadedImages: new Set()
    }
  },
  mounted() {
    this.init()
    this.startAutoPlay()
  },
  beforeDestroy() {
    this.stopAutoPlay()
  },
  computed: {
    isContest() {
      return !!this.$route.params.contestID
    },
    // 只显示6个公告
    displayAnnouncements() {
      return this.announcements.slice(0, 6)
    },
    // 轮播图项目（取前4个有图片的公告）
    carouselItems() {
      return this.announcements
        .map(ann => {
          const image = this.extractFirstImage(ann.content)
          return image ? { announcement: ann, image } : null
        })
        .filter(item => item !== null)
        .slice(0, 4)
    },
    // 下一张索引
    nextIndex() {
      if (this.carouselItems.length <= 1) return 0
      return (this.carouselIndex + 1) % this.carouselItems.length
    }
  },
  watch: {
    carouselIndex() {
      // 索引变化时重置自动轮播计时
      this.resetAutoPlay()
    }
  },
  methods: {
    init() {
      if (this.isContest) {
        this.getContestAnnouncementList()
      } else {
        this.getAnnouncementList()
      }
    },
    getAnnouncementList(page = 1) {
      this.btnLoading = true
      api.getAnnouncementList((page - 1) * this.limit, this.limit).then(res => {
        this.btnLoading = false
        this.announcements = res.data.data.results
        this.total = res.data.data.total
        // 预加载轮播图图片
        this.$nextTick(() => {
          this.preloadCarouselImages()
        })
      }, () => {
        this.btnLoading = false
      })
    },
    getContestAnnouncementList() {
      this.btnLoading = true
      api.getContestAnnouncementList(this.$route.params.contestID).then(res => {
        this.btnLoading = false
        this.announcements = res.data.data
      }, () => {
        this.btnLoading = false
      })
    },
    goAnnouncement(announcement) {
      this.announcement = announcement
      this.listVisible = false
    },
    goBack() {
      this.listVisible = true
      this.announcement = null
    },
    extractFirstImage(content) {
      if (!content) return null
      const mdMatch = content.match(/!\[.*?\]\((.*?)\)/)
      if (mdMatch) return mdMatch[1]
      const htmlMatch = content.match(/<img[^>]+src="([^">]+)"/)
      if (htmlMatch) return htmlMatch[1]
      return null
    },
    preloadCarouselImages() {
      // 预加载所有轮播图图片
      this.carouselItems.forEach(item => {
        if (item.image && !this.preloadedImages.has(item.image)) {
          const img = new Image()
          img.src = item.image
          this.preloadedImages.add(item.image)
        }
      })
    },
    startAutoPlay() {
      this.stopAutoPlay()
      this.autoPlayTimer = setInterval(() => {
        if (this.carouselItems.length > 1) {
          // 先预加载下一张图片
          const nextIdx = (this.carouselIndex + 1) % this.carouselItems.length
          const nextItem = this.carouselItems[nextIdx]
          const nextImage = nextItem ? nextItem.image : null
          if (nextImage && !this.preloadedImages.has(nextImage)) {
            const img = new Image()
            img.src = nextImage
            this.preloadedImages.add(nextImage)
          }
          this.carouselIndex = nextIdx
        }
      }, 4000)
    },
    stopAutoPlay() {
      if (this.autoPlayTimer) {
        clearInterval(this.autoPlayTimer)
        this.autoPlayTimer = null
      }
    },
    resetAutoPlay() {
      this.startAutoPlay()
    }
  }
}
</script>

<style scoped lang="less">
.announcements-elegant {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px;
}

/* 标题区 */
.header-section {
  text-align: center;
  margin-bottom: 30px;

  .section-title {
    font-size: 1.8rem;
    font-weight: 300;
    color: #1a1a2e;
    letter-spacing: 0.15em;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-bottom: 8px;

    .title-line {
      width: 50px;
      height: 1px;
      background: linear-gradient(90deg, transparent, #1e3a8a, transparent);
    }
  }

  .section-subtitle {
    font-size: 0.8rem;
    color: #64748b;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }
}

/* 主布局 - 左右分栏 */
.main-layout {
  display: flex;
  gap: 24px;
  margin-bottom: 30px;
}

/* 堆叠轮播区域 */
.stacked-carousel {
  flex: 3;
  min-width: 0;
}

.stacked-container {
  position: relative;
  height: 520px;
}

.stack-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.stack-card {
  position: absolute;
  width: 92%;
  height: 460px;
  border-radius: 16px;
  background-size: cover;
  background-position: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  transition: all 0.5s cubic-bezier(0.25, 0.1, 0.25, 1);

  /* 当前激活的卡片 */
  &.stack-active {
    top: 0;
    left: 0;
    z-index: 10;
    opacity: 1;
    transform: scale(1);
    cursor: pointer;

    &:hover {
      transform: translateY(-6px) scale(1.01);
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
    }

    .stack-title,
    .stack-meta {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* 下一张卡片 */
  &.stack-next {
    bottom: 10px;
    right: 10px;
    z-index: 5;
    opacity: 0.6;
    transform: scale(0.94);
    filter: brightness(0.85);

    .stack-title,
    .stack-meta {
      opacity: 0;
      transform: translateY(10px);
    }
  }

  /* 隐藏的卡片 */
  &.stack-hidden {
    bottom: 20px;
    right: 20px;
    z-index: 1;
    opacity: 0;
    transform: scale(0.88);
    pointer-events: none;

    .stack-title,
    .stack-meta {
      opacity: 0;
    }
  }
}

.stack-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 32px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.75));
  color: white;

  .stack-badge {
    display: inline-block;
    padding: 5px 14px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    font-size: 0.8rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 14px;
  }

  .stack-title {
    font-size: 1.5rem;
    font-weight: 500;
    margin-bottom: 12px;
    line-height: 1.4;
    transition: all 0.4s ease;
  }

  .stack-meta {
    font-size: 1rem;
    opacity: 0.85;
    margin: 0;
    transition: all 0.4s ease;

    .divider {
      margin: 0 6px;
    }
  }
}

/* 轮播指示器 */
.stack-dots {
  position: absolute;
  bottom: -30px;
  left: 0;
  display: flex;
  gap: 8px;

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #cbd5e1;
    cursor: pointer;
    transition: all 0.3s ease;

    &.active {
      width: 24px;
      border-radius: 4px;
      background: #1e3a8a;
    }

    &:hover {
      background: #64748b;
    }
  }
}

/* 公告列表区域 */
.list-section {
  flex: 1.5;
  min-width: 300px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;

  .list-header {
    padding: 14px 18px;
    font-size: 1rem;
    font-weight: 500;
    color: #1e3a8a;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
  }
}

.announcement-list {
  display: flex;
  flex-direction: column;
}

.announcement-item {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #f8fafc;
    padding-left: 18px;
  }

  .item-content {
    flex: 1;
    min-width: 0;
  }

  .item-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 6px;

    .item-number {
      font-size: 0.8rem;
      font-weight: 600;
      color: #1e3a8a;
      letter-spacing: 0.05em;
      min-width: 22px;
    }

    .item-title {
      font-size: 1.05rem;
      font-weight: 400;
      color: #334155;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .item-meta {
    font-size: 0.85rem;
    color: #94a3b8;
    margin: 0;
    padding-left: 34px;
  }
}

/* 分页 */
.pagination-section {
  display: flex;
  justify-content: center;
}

/* 详情弹窗 */
.detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.detail-content {
  background: white;
  border-radius: 16px;
  max-width: 800px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  padding: 36px;
  position: relative;

  .close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 36px;
    height: 36px;
    border: none;
    background: #f1f5f9;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.3rem;
    color: #64748b;
    transition: all 0.2s;

    &:hover {
      background: #e2e8f0;
      color: #1e293b;
    }
  }

  .detail-title {
    font-size: 1.5rem;
    font-weight: 500;
    color: #1a1a2e;
    margin-bottom: 12px;
    line-height: 1.4;
  }

  .detail-meta {
    font-size: 0.85rem;
    color: #94a3b8;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e2e8f0;

    .divider {
      margin: 0 6px;
    }
  }

  .detail-body {
    line-height: 1.7;
    color: #334155;
    font-size: 0.95rem;
  }
}

/* 动画 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}

/* 响应式 */
@media (max-width: 900px) {
  .main-layout {
    flex-direction: column;
  }

  .stacked-container {
    height: 320px;
  }

  .stack-card {
    height: 280px;
  }

  .stack-overlay {
    padding: 20px;

    .stack-title {
      font-size: 1.1rem;
    }
  }
}

@media (max-width: 768px) {
  .announcements-elegant {
    padding: 20px;
  }

  .header-section {
    .section-title {
      font-size: 1.4rem;

      .title-line {
        width: 30px;
      }
    }
  }

  .detail-content {
    padding: 24px;
    margin: 20px;
  }
}
</style>
