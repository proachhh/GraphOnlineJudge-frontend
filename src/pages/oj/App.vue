<template>
  <div>
    <NavBar></NavBar>
    <GlobalSidebar></GlobalSidebar>
    <div class="content-app" :class="{ 'home-page': isHomePage, 'chat-page': isChatPage }">
      <router-view></router-view>
    </div>
    <div class="global-footer" :class="{ 'home-page': isHomePage, 'chat-page': isChatPage, 'problem-page': isProblemPage }">
      <p v-html="website.website_footer"></p>
      <p>Powered by <a href="https://github.com/QingdaoU/OnlineJudge">GraphOnlineJudge</a>
        <span v-if="version">&nbsp; Version: {{ version }}</span>
      </p>
    </div>
    <BackTop></BackTop>
  </div>
</template>

<script>
  import { mapActions, mapState } from 'vuex'
  import NavBar from '@oj/components/NavBar.vue'
  import GlobalSidebar from '@oj/components/GlobalSidebar.vue'

  export default {
    name: 'app',
    components: {
      NavBar,
      GlobalSidebar
    },
    data () {
      return {
        version: process.env.VERSION
      }
    },
    created () {
      try {
        document.body.removeChild(document.getElementById('app-loader'))
      } catch (e) {
      }
    },
    mounted () {
      this.getWebsiteConfig()
      this.toggleHomeBackground()
    },
    methods: {
      ...mapActions(['getWebsiteConfig', 'changeDomTitle']),
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
      isHomePage () {
        return this.$route.path === '/' || this.$route.path === '/home' || this.$route.path === '/learning-path'
      },
      isChatPage () {
        return this.$route.path === '/ai-chat-fullscreen'
      },
      isProblemPage () {
        return this.$route.name === 'problem-details' || this.$route.name === 'contest-problem-details'
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
