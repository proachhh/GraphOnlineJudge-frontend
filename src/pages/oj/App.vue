<template>
  <div>
    <NavBar></NavBar>
    <GlobalSidebar></GlobalSidebar>
    <div class="mobile-top-bar" v-if="isMobile && !isTabPage">
      <div class="mobile-back-btn" @click="$router.back()">
        <Icon type="ios-arrow-back" size="22" />
      </div>
      <span class="mobile-page-title">{{ pageTitle }}</span>
      <div class="mobile-back-placeholder"></div>
    </div>
    <div class="content-app" :class="{ 'home-page': isHomePage, 'chat-page': isChatPage, 'mobile-nav': isMobile, 'mobile-has-top-bar': isMobile && !isTabPage, 'full-screen-page': isFullWidthPage }">
      <router-view></router-view>
    </div>
    <div class="global-footer" :class="{ 'home-page': isHomePage, 'chat-page': isChatPage, 'problem-page': isProblemPage, 'hide-footer': isFullWidthPage }">
      <p v-html="website.website_footer"></p>
      <p>Powered by <a href="https://github.com/proachhh/GraphOnlineJudge-backend" target="_blank" rel="noopener noreferrer">GraphOnlineJudge</a>
        <span v-if="version">&nbsp; Version: {{ version }}</span>
      </p>
    </div>
    <MobileBottomNav v-if="isMobile" />
    <BackTop></BackTop>
  </div>
</template>

<script>
  import { mapActions, mapState } from 'vuex'
  import NavBar from '@oj/components/NavBar.vue'
  import GlobalSidebar from '@oj/components/GlobalSidebar.vue'
  import MobileBottomNav from '@oj/components/MobileBottomNav.vue'

  export default {
    name: 'app',
    components: {
      NavBar,
      GlobalSidebar,
      MobileBottomNav
    },
    data () {
      return {
        version: process.env.VERSION,
        isMobile: false
      }
    },
    created () {
      this.isMobile = window.innerWidth <= 768
      try {
        document.body.removeChild(document.getElementById('app-loader'))
      } catch (e) {
      }
    },
    mounted () {
      this.getWebsiteConfig()
      this.toggleHomeBackground()
      this.checkMobile()
      window.addEventListener('resize', this.checkMobile)
    },
    beforeDestroy () {
      window.removeEventListener('resize', this.checkMobile)
    },
    methods: {
      ...mapActions(['getWebsiteConfig', 'changeDomTitle']),
      checkMobile () {
        this.isMobile = window.innerWidth <= 768
      },
      toggleHomeBackground () {
        const homeBg = document.getElementById('home-bg')
        if (homeBg) {
          if (this.isHomePage) {
            homeBg.classList.remove('hide')
          } else {
            homeBg.classList.add('hide')
          }
        }
      }
    },
    computed: {
      ...mapState(['website', 'sidebarCollapsed']),
      isTabPage () {
        return ['problem-list', 'contest-list', 'lesson-plan-list', 'immersion-practice', 'mobile-personal'].includes(this.$route.name)
      },
      pageTitle () {
        return this.$route.meta && this.$route.meta.title ? this.$route.meta.title : ''
      },
      isHomePage () {
        return this.$route.path === '/' || this.$route.path === '/home' || this.$route.path === '/learning-path'
      },
      isChatPage () {
        return this.$route.path === '/ai-chat-fullscreen'
      },
      isProblemPage () {
        return this.$route.name === 'problem-details' || this.$route.name === 'contest-problem-details'
      },
      isFullWidthPage () {
        return this.$route.name === 'immersion-practice'
      }
    },
    watch: {
      'website' () {
        this.changeDomTitle()
      },
      '$route' () {
        this.changeDomTitle()
        this.toggleHomeBackground()
      }
    }
  }
</script>

<style lang="less">

  * {
    -webkit-box-sizing: border-box;
    -moz-box-sizing: border-box;
    box-sizing: border-box;
  }

  a {
    text-decoration: none;
    background-color: transparent;
    &:active, &:hover {
      outline-width: 0;
    }
  }


  .content-app {
  min-height: 100vh;
  margin-top: 80px;
  padding: 0 2%;
}

.content-app.home-page {
  margin-top: 0;
  padding: 0;
}

.content-app.full-screen-page {
  margin-top: 0;
  padding: 0;
  min-height: auto;
  overflow: hidden;
}

.mobile-top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 8px;
  background: #fff;
  border-bottom: 1px solid #e8eaec;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);

  .mobile-back-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1e3a8a;
    cursor: pointer;
    flex-shrink: 0;
    -webkit-tap-highlight-color: transparent;
  }

  .mobile-page-title {
    flex: 1;
    text-align: center;
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mobile-back-placeholder {
    width: 36px;
    flex-shrink: 0;
  }
}

.global-footer {
  position: relative;
  z-index: 1;
  padding: 14px 2% 18px;
  text-align: center;
  font-size: 13px;
  background: #f5f7fa;
  border-top: 1px solid #e8eaec;
  color: #515a6e;

  a { color: #2d8cf0; text-decoration: none; }

  &.home-page {
    background: rgba(0, 0, 0, 0.6);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.7);
    z-index: 1;

    a { color: rgba(255, 255, 255, 0.85); }
  }

  &.chat-page {
    display: none;
  }

  &.hide-footer {
    display: none;
  }

  &.problem-page {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 30;
    padding: 10px 2% 14px;
    background: #f5f7fa;
    border-top: 1px solid #e8eaec;
  }
}



</style>
