<template>
  <div class="home-container">
    <section class="content-section" :style="{ opacity: heroOpacity }">
      <KnowledgeGraphSection />
      <div class="hero-text">
        <h1 class="hero-title">{{ $t('m.Home_Hero_Title') }}</h1>
        <p class="hero-subtitle">{{ $t('m.Home_Hero_Subtitle') }}</p>
      </div>
    </section>

    <div class="scroll-spacer"></div>

    <section class="announcement-section">
      <div class="section-header animate-on-scroll" data-animation="fade-up">
        <h2 class="section-title">{{ $t('m.Home_Announcements') }}</h2>
      </div>
      <div class="animate-on-scroll" data-animation="fade-up">
        <Announcements />
      </div>
    </section>

    <section class="features-section">
      <div class="section-header animate-on-scroll" data-animation="fade-up">
        <h2 class="section-title">{{ $t('m.Home_Features_Title') }}</h2>
        <p class="section-subtitle">{{ $t('m.Home_Features_Subtitle') }}</p>
      </div>
      <div class="feature-row" v-for="(feature, index) in features" :key="index" :class="{ 'reverse': index % 2 === 1, 'animate-on-scroll': true }" :data-animation="index % 2 === 0 ? 'slide-left' : 'slide-right'">
        <div class="feature-info">
          <div class="feature-icon-large" :style="{ background: feature.color }">
            <Icon :type="feature.icon" size="36" color="#fff" />
          </div>
          <h3 class="feature-title">{{ feature.title }}</h3>
          <p class="feature-desc">{{ feature.desc }}</p>
          <Button
            v-if="feature.btnText"
            type="primary"
            class="feature-action-btn"
            @click="handleFeatureAction(feature.key)"
          >
            <Icon :type="feature.btnIcon" /> {{ feature.btnText }}
          </Button>
        </div>
        <div class="feature-screenshot">
          <img :src="feature.screenshot" :alt="feature.title" />
        </div>
      </div>
    </section>

    <section class="stats-section">
      <div class="stats-container">
        <div class="stat-item animate-on-scroll" v-for="(stat, index) in stats" :key="index" :data-animation="'fade-up'" :style="{ transitionDelay: (index * 0.15) + 's' }">
          <div class="stat-number">{{ stat.number }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </section>

    <section class="cta-section">
      <div class="cta-content animate-on-scroll" data-animation="fade-up">
        <h2 class="cta-title">{{ $t('m.Home_CTA_Title') }}</h2>
        <p class="cta-subtitle">{{ $t('m.Home_CTA_Subtitle') }}</p>
        <div class="cta-buttons">
          <Button type="primary" size="large" class="cta-btn" @click="goToProfileOnboarding">
            <Icon type="ios-rocket" /> 开始
          </Button>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import KnowledgeGraphSection from './KnowledgeGraphSection.vue'
import Announcements from './Announcements.vue'

export default {
  name: 'home',
  components: { KnowledgeGraphSection, Announcements },
  data() {
    return {
      heroOpacity: 1,
      featureKeys: [
        {
          icon: 'md-globe',
          titleKey: 'm.Feature_Knowledge_Universe',
          descKey: 'm.Feature_Knowledge_Universe_Desc',
          key: 'universe',
          btnText: '进入知识宇宙',
          btnIcon: 'ios-navigate',
          color: '#0d1b3e',
          screenshot: '/static/pictures/graph.png'
        },
        {
          icon: 'ios-analytics',
          titleKey: 'm.Feature_Knowledge_Graph',
          descKey: 'm.Feature_Knowledge_Graph_Desc',
          key: 'knowledge-graph',
          btnText: '查看知识路径',
          btnIcon: 'ios-navigate',
          color: '#1e3a8a',
          screenshot: '/static/pictures/graph.png'
        },
        {
          icon: 'flash',
          titleKey: 'm.Feature_Recommendation',
          descKey: 'm.Feature_Recommendation_Desc',
          key: 'recommendation',
          btnText: '去刷题',
          btnIcon: 'ios-keypad',
          color: '#1e3a8a',
          screenshot: '/static/pictures/recommend.png'
        },
        {
          icon: 'ios-speedometer',
          titleKey: 'm.Feature_Evaluation',
          descKey: 'm.Feature_Evaluation_Desc',
          key: 'evaluation',
          btnText: '查看题目',
          btnIcon: 'ios-list',
          color: '#1e3a8a',
          screenshot: '/static/pictures/languages.png'
        },
        {
          icon: 'ios-cog',
          titleKey: 'm.Feature_AI_Gen',
          descKey: 'm.Feature_AI_Gen_Desc',
          color: '#1e3a8a',
          screenshot: '/static/pictures/AI4problem.png'
        },
        {
          icon: 'ios-people',
          titleKey: 'm.Feature_AI_Agent',
          descKey: 'm.Feature_AI_Agent_Desc',
          key: 'agent',
          btnText: '构建画像',
          btnIcon: 'ios-person',
          color: '#1e3a8a',
          screenshot: '/static/pictures/agents.png'
        }
      ],
      statKeys: [
        { number: '1000+', labelKey: 'm.Stat_Selected_Problems' },
        { number: '50+', labelKey: 'm.Stat_Active_Users' },
        { number: '500+', labelKey: 'm.Stat_Total_Submissions' },
        { number: '99.9%', labelKey: 'm.Stat_System_Stability' }
      ]
    }
  },
  computed: {
    features() {
      return this.featureKeys.map(f => ({
        ...f,
        title: this.$t(f.titleKey),
        desc: this.$t(f.descKey)
      }))
    },
    stats() {
      return this.statKeys.map(s => ({
        ...s,
        label: this.$t(s.labelKey)
      }))
    }
  },
  methods: {
    goToProblems() {
      this.$router.push({ name: 'problem-list' })
    },
    goToLearningPath() {
      this.$router.push({ name: 'knowledge-universe' })
    },
    goToProfileOnboarding() {
      this.$router.push({ name: 'profile-onboarding' })
    },
    handleFeatureAction(key) {
      const routeMap = {
        'universe': 'knowledge-universe',
        'knowledge-graph': 'knowledge-universe',
        'recommendation': 'problem-list',
        'evaluation': 'problem-list',
        'agent': 'profile-onboarding'
      }
      const routeName = routeMap[key]
      if (routeName) {
        this.$router.push({ name: routeName })
      }
    },
    initScrollAnimations() {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in-view')
            } else {
              entry.target.classList.remove('in-view')
            }
          })
        },
        { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
      )
      this.$nextTick(() => {
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
          observer.observe(el)
        })
      })
    },
    onHeroScroll() {
      const scrollY = window.scrollY || window.pageYOffset
      const vh = window.innerHeight
      if (scrollY >= vh) {
        this.heroOpacity = 0
      } else {
        this.heroOpacity = Math.max(0, 1 - scrollY / (vh * 0.7))
      }
    }
  },
  mounted() {
    this.initScrollAnimations()
    window.addEventListener('scroll', this.onHeroScroll, { passive: true })
  },
  beforeDestroy() {
    window.removeEventListener('scroll', this.onHeroScroll)
  }
}
</script>

<style lang="less" scoped>
.home-container {
  width: 100vw;
  min-height: 200vh;
  position: relative;
  overflow-x: hidden;
}

/* 固定全屏背景区域 - 透明背景，让 index.html 的背景图显示 */
.content-section {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1;
  background: transparent;
  pointer-events: none;

  .hero-text {
    position: absolute;
    left: 100px;
    top: 50%;
    transform: translateY(-50%);
    color: white;
    z-index: 10;
    animation: fadeInUp 0.9s ease-out both;
    max-width: 420px;
    pointer-events: auto;

    .hero-title {
      font-size: 3.5rem;
      font-weight: 700;
      margin: 0 0 20px;
      line-height: 1.15;
      letter-spacing: -0.02em;
      text-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
    }

    .hero-subtitle {
      font-size: 1.2rem;
      font-weight: 300;
      margin: 0;
      opacity: 0.85;
      line-height: 1.7;
    }
  }
}

/* 让页面可以滚动，推开公告区域 */
.scroll-spacer {
  height: 100vh;
  position: relative;
  z-index: 2;
  pointer-events: none;
}

/* 公告区域在滚动后出现 */
.announcement-section {
  position: relative;
  z-index: 2;
  padding: 80px 20px 100px;
  background: #f5f7fa;

  .section-header {
    text-align: center;
    margin-bottom: 60px;

    .section-title {
      font-size: 2.5rem;
      font-weight: 600;
      color: #17233d;
      margin: 0 0 20px;
    }

    .section-divider {
      width: 80px;
      height: 4px;
      background: linear-gradient(90deg, #1e3a8a, #0ea5e9);
      margin: 0 auto;
      border-radius: 2px;
    }
  }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(-50%) translateY(30px); }
  to   { opacity: 1; transform: translateY(-50%) translateY(0); }
}

/* 特色功能区域 */
.features-section {
  position: relative;
  z-index: 2;
  padding: 100px 60px;
  background: white;

  .section-header {
    text-align: center;
    margin-bottom: 80px;

    .section-title {
      font-size: 2.5rem;
      font-weight: 600;
      color: #17233d;
      margin: 0 0 12px;
    }

    .section-subtitle {
      font-size: 1.1rem;
      color: #64748b;
      margin: 0;
    }
  }

  .feature-row {
    max-width: 1200px;
    margin: 0 auto 80px;
    display: flex;
    align-items: center;
    gap: 60px;

    &:last-child {
      margin-bottom: 0;
    }

    &.reverse {
      flex-direction: row-reverse;
    }

    .feature-info {
      flex: 1;
      min-width: 0;

      .feature-icon-large {
        width: 64px;
        height: 64px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 24px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      }

      .feature-title {
        font-size: 1.75rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 16px;
      }

      .feature-desc {
        font-size: 1.05rem;
        color: #64748b;
        line-height: 1.8;
        margin: 0;
      }

      .feature-action-btn {
        margin-top: 18px;
        padding: 0 24px;
        height: 40px;
        border-radius: 10px;
        font-size: 0.95rem;
      }
    }

    .feature-screenshot {
      flex: 1;
      min-width: 0;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
      border: 1px solid #e2e8f0;

      img {
        width: 100%;
        display: block;
        border-radius: 16px;
      }
    }
  }
}

/* 滚动动画 */
.animate-on-scroll {
  opacity: 0;
  transition: opacity 0.7s ease, transform 0.7s ease;

  &[data-animation="fade-up"] {
    transform: translateY(40px);
  }

  &[data-animation="slide-left"] {
    transform: translateX(-80px);
  }

  &[data-animation="slide-right"] {
    transform: translateX(80px);
  }

  &[data-animation="scale-up"] {
    transform: scale(0.9);
  }

  &.in-view {
    opacity: 1;
    transform: translate(0, 0) scale(1);
  }
}

/* 数据统计区域 */
.stats-section {
  position: relative;
  z-index: 2;
  padding: 80px 40px;
  background: linear-gradient(135deg, #1e3a8a 0%, #0ea5e9 100%);

  .stats-container {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 40px;
  }

  .stat-item {
    text-align: center;
    color: white;

    .stat-number {
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: 8px;
      text-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .stat-label {
      font-size: 1rem;
      opacity: 0.85;
      letter-spacing: 0.05em;
    }
  }
}

/* CTA 区域 */
.cta-section {
  position: relative;
  z-index: 2;
  padding: 100px 40px;
  background: #f8fafc;
  text-align: center;

  .cta-content {
    max-width: 600px;
    margin: 0 auto;

    .cta-title {
      font-size: 2.5rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 16px;
    }

    .cta-subtitle {
      font-size: 1.1rem;
      color: #64748b;
      margin: 0 0 40px;
    }

    .cta-buttons {
      display: flex;
      gap: 16px;
      justify-content: center;

      .cta-btn {
        padding: 0 32px;
        height: 48px;
        font-size: 1rem;
        border-radius: 12px;
      }

      .cta-btn-outline {
        padding: 0 32px;
        height: 48px;
        font-size: 1rem;
        border-radius: 12px;
        border: 2px solid #1e3a8a;
        color: #1e3a8a;

        &:hover {
          background: #1e3a8a;
          color: white;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .content-section .hero-text {
    left: 24px;
    right: 24px;
    .hero-title { font-size: 2.2rem; }
  }

  .features-section {
    padding: 60px 24px;

    .feature-row {
      flex-direction: column;
      gap: 32px;

      &.reverse {
        flex-direction: column;
      }
    }
  }

  .stats-section .stats-container {
    grid-template-columns: repeat(2, 1fr);
    gap: 32px;
  }

  .cta-section .cta-buttons {
    flex-direction: column;
    align-items: center;
  }
}
</style>