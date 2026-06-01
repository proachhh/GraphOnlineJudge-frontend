<template>
  <div class="container">
    <div>
      <SideMenu ref="sideMenu"></SideMenu>
    </div>
    <div id="header">
      <span class="hamburger-btn" @click="toggleSideMenu">
        <i class="el-icon-menu"></i>
      </span>
      <i class="el-icon-fa-font katex-editor" @click="katexVisible=true" ></i>
      <screen-full :width="14" :height="14" class="screen-full"></screen-full>
      <el-dropdown @command="handleCommand">
        <span>{{user.username}}<i class="el-icon-caret-bottom el-icon--right"></i></span>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item command="logout">Logout</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
    <div class="content-app">
      <transition name="fadeInUp" mode="out-in">
        <router-view></router-view>
      </transition>
    </div>
    <div class="footer">
      <div v-html="websiteFooter"></div>
      <span>Build Version: {{ version }}</span>
    </div>

    <el-dialog :title="$t('m.Latex_Editor')" :visible.sync="katexVisible">
      <KatexEditor></KatexEditor>
    </el-dialog>
  </div>
</template>

<script>
  import { types } from '@/store'
  import { mapGetters } from 'vuex'
  import SideMenu from '../components/SideMenu.vue'
  import ScreenFull from '@admin/components/ScreenFull.vue'
  import KatexEditor from '@admin/components/KatexEditor.vue'
  import api from '../api'

  export default {
    name: 'app',
    data () {
      return {
        version: process.env.VERSION,
        websiteFooter: '',
        katexVisible: false
      }
    },
    mounted () {
      api.getWebsiteConfig().then(res => {
        this.websiteFooter = res.data.data.website_footer || ''
      }).catch(() => {})
    },
    components: {
      SideMenu,
      KatexEditor,
      ScreenFull
    },
    beforeRouteEnter (to, from, next) {
      api.getProfile().then(res => {
        if (!res.data.data) {
          // not login
          next({name: 'login'})
        } else {
          next(vm => {
            vm.$store.commit(types.CHANGE_PROFILE, {profile: res.data.data})
          })
        }
      })
    },
    methods: {
      toggleSideMenu () {
        if (this.$refs.sideMenu) {
          this.$refs.sideMenu.toggleMenu()
        }
      },
      handleCommand (command) {
        if (command === 'logout') {
          api.logout().then(() => {
            this.$router.push({name: 'login'})
          })
        }
      }
    },
    computed: {
      ...mapGetters(['user'])
    }
  }
</script>

<style lang="less">
  a {
    background-color: transparent;
  }

  a:active, a:hover {
    outline-width: 0
  }

  img {
    border-style: none
  }

  .container {
    overflow: auto;
    font-weight: 400;
    height: 100%;
    -webkit-font-smoothing: antialiased;
    background: linear-gradient(180deg, #f0f4f8 0%, #f8fafc 100%);
    overflow-y: scroll;
  }

  * {
    box-sizing: border-box;
  }

  #header {
    text-align: right;
    padding-left: 210px;
    padding-right: 30px;
    line-height: 50px;
    height: 50px;
    background: linear-gradient(90deg, #f8fafc 0%, #ffffff 100%);
    box-shadow: 0 2px 8px rgba(30, 58, 138, 0.06);
    border-bottom: 1px solid #e2e8f0;

    .hamburger-btn {
      display: none;
      float: left;
      margin-left: 12px;
      cursor: pointer;
      font-size: 20px;
      color: #1e3a8a;
      transition: color 0.2s;

      &:hover {
        color: #667eea;
      }
    }
    
    .screen-full {
      margin-right: 8px;
    }
  }

  .content-app {
    padding-top: 20px;
    padding-right: 10px;
    padding-left: 210px;
  }

  // ========== 移动端适配 ==========

  // 平板及以下
  @media screen and (max-width: 1024px) {
    .container {
      min-width: auto;
    }

    #header {
      padding-left: 10px;

      .hamburger-btn {
        display: inline-block;
      }
    }

    .content-app {
      padding-left: 10px;
    }
  }

  // 小屏手机
  @media screen and (max-width: 480px) {
    #header {
      padding-right: 12px;
      line-height: 44px;
      height: 44px;

      .hamburger-btn {
        font-size: 18px;
        margin-left: 8px;
      }
    }

    .content-app {
      padding-top: 12px;
      padding-right: 4px;
    }

    .footer {
      font-size: 11px;
    }
  }

  .footer {
    margin-top: 40px;
    padding: 20px 30px 18px;
    background: #f5f7fa;
    border-top: 1px solid #e2e8f0;
    text-align: center;
    font-size: 13px;
    color: #94a3b8;
    line-height: 1.8;

    a {
      color: #64748b;
      text-decoration: none;
      transition: color 0.2s;

      &:hover {
        color: #1e3a8a;
      }
    }

    span {
      display: block;
      margin-top: 6px;
      color: #94a3b8;
    }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translate(0, 30px);
    }

    to {
      opacity: 1;
      transform: none;
    }
  }

  .fadeInUp-enter-active {
    animation: fadeInUp .8s;
  }

  .katex-editor {
    margin-right: 5px;
    cursor: pointer;
    transition: color 0.2s ease;
    
    &:hover {
      color: #1e3a8a;
    }
  }
</style>
