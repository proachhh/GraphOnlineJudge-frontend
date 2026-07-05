<template>
  <div id="header" :class="{ 'header-transparent': isHome && !scrolled, 'header-scrolled': !isHome || scrolled }">
    <div class="header-content">
      <div class="logo">
        <img :src="logoSrc" alt="学校标志" class="logo-img" />
      </div>
      
      <Menu theme="light" mode="horizontal" @on-select="handleRoute" :active-name="activeMenu" class="oj-menu">
        <Menu-item name="/">
          <Icon type="home"></Icon>
          {{$t('m.Home')}}
        </Menu-item>
        <Menu-item name="/problem">
          <Icon type="ios-keypad"></Icon>
          {{$t('m.NavProblems')}}
        </Menu-item>
        <Menu-item name="/contest">
          <Icon type="trophy"></Icon>
          {{$t('m.Contests')}}
        </Menu-item>
        <Menu-item name="/learning-path">
          <Icon type="ios-navigate"></Icon>
          {{$t('m.Learning_Path')}}
        </Menu-item>
        <Menu-item name="/lesson-plan">
          <Icon type="ios-book"></Icon>
          {{$t('m.Lesson_Plans')}}
        </Menu-item>
        <Menu-item name="/immersion">
          <Icon type="flash"></Icon>
          {{$t('m.Immersive_Practice')}}
        </Menu-item>
        <Menu-item name="/forum">
          <Icon type="ios-people"></Icon>
          {{$t('m.Community')}}
        </Menu-item>
        <!-- <Submenu name="rank">
          <template slot="title">
            <Icon type="podium"></Icon>
            {{$t('m.Rank')}}
          </template>
          <Menu-item name="/acm-rank">
            {{$t('m.ACM_Rank')}}
          </Menu-item>
          <Menu-item name="/oi-rank">
            {{$t('m.OI_Rank')}}
          </Menu-item>
        </Submenu> -->
        <!-- <Submenu name="about">
          <template slot="title">
            <Icon type="information-circled"></Icon>
            {{$t('m.About')}}
          </template>
          <Menu-item name="/about">
            {{$t('m.Judger')}}
          </Menu-item>
          <Menu-item name="/FAQ">
            {{$t('m.FAQ')}}
          </Menu-item>
        </Submenu> -->
        
      </Menu>
      
      <div class="auth-menu">
        <template v-if="!isAuthenticated">
          <Button type="ghost"
                  ref="loginBtn"
                  shape="circle"
                  @click="handleBtnClick('login')">{{$t('m.Login')}}
          </Button>
          <Button v-if="website.allow_register"
                  type="ghost"
                  shape="circle"
                  @click="handleBtnClick('register')"
                  style="margin-left: 8px;">{{$t('m.Register')}}
          </Button>
        </template>
        <template v-else>
          <Dropdown class="drop-menu" @on-click="handleRoute" placement="bottom" trigger="hover">
            <div class="user-info">
              <img :src="profile.avatar" class="user-avatar" />
              <span class="user-name">{{ user.username }}</span>
              <Icon type="ios-arrow-down" class="user-arrow" />
            </div>
            <Dropdown-menu slot="list">
              <Dropdown-item name="/user-home"><span class="drop-icon"><Icon type="ios-home" size="18"/></span>{{$t('m.MyHome')}}</Dropdown-item>
              <Dropdown-item name="/learning-report"><span class="drop-icon"><Icon type="ios-pulse-strong" size="18"/></span>{{$t('m.NavStatus')}}</Dropdown-item>
              <Dropdown-item name="/profile-onboarding"><span class="drop-icon"><Icon type="ios-person" size="18"/></span>{{$t('m.Profile_Onboarding')}}</Dropdown-item>
              <Dropdown-item name="/status?myself=1"><span class="drop-icon"><Icon type="ios-paper" size="18"/></span>{{$t('m.MySubmissions')}}</Dropdown-item>
              <Dropdown-item name="/setting/profile"><span class="drop-icon"><Icon type="ios-settings" size="18"/></span>{{$t('m.Settings')}}</Dropdown-item>
              <Dropdown-item v-if="isAdminRole" name="/admin"><span class="drop-icon"><Icon type="ios-cog" size="18"/></span>{{$t('m.Management')}}</Dropdown-item>
              <Dropdown-item divided name="/logout"><span class="drop-icon"><Icon type="ios-log-out" size="18"/></span>{{$t('m.Logout')}}</Dropdown-item>
            </Dropdown-menu>
          </Dropdown>
        </template>
      </div>
    </div>
    
    <Modal v-model="modalVisible" :width="420" class="auth-modal">
      <div slot="header" class="modal-title">{{$t('m.Welcome_to')}} {{website.website_name_shortcut}}</div>
      <component :is="modalStatus.mode" v-if="modalVisible"></component>
      <div slot="footer" style="display: none"></div>
    </Modal>
  </div>
</template>

<script>
  import { mapGetters, mapActions } from 'vuex'
  import login from '@oj/views/user/Login'
  import register from '@oj/views/user/Register'

  export default {
    components: {
      login,
      register
    },
    data () {
      return {
        scrolled: false
      }
    },
    mounted () {
      this.getProfile()
      window.addEventListener('scroll', this.handleScroll)
    },
    beforeDestroy () {
      window.removeEventListener('scroll', this.handleScroll)
    },
    methods: {
      ...mapActions(['getProfile', 'changeModalStatus']),
      handleRoute (route) {
        if (route && route.indexOf('admin') < 0) {
          this.$router.push(route)
        } else {
          window.open('/admin/')
        }
      },
      handleBtnClick (mode) {
        this.changeModalStatus({
          visible: true,
          mode: mode
        })
      },
      handleScroll () {
        // 滚动到公告区域（约100vh）时才变白色背景
        this.scrolled = window.scrollY > window.innerHeight * 0.9
      }
    },
    computed: {
      ...mapGetters(['website', 'modalStatus', 'user', 'profile', 'isAuthenticated', 'isAdminRole']),
      logoSrc () {
        // 首页未滚动时显示 logo.png，学习页面（透明背景）也显示 logo.png，其他情况显示 logo2.png
        const isLearningPath = this.$route.path === '/learning-path'
        return (this.isHome && !this.scrolled) || (isLearningPath && !this.scrolled) ? require('@/assets/logo.png') : require('@/assets/logo2.png')
      },
      activeMenu () {
        const path = this.$route.path
        // 处理各种路由匹配
        if (path === '/' || path.startsWith('/home')) return '/'
        if (path.startsWith('/problem')) return '/problem'
        if (path.startsWith('/contest')) return '/contest'
        if (path.startsWith('/status') && this.$route.query.problemID) return '/problem'
        if (path.startsWith('/learning-path')) return '/learning-path'
        if (path.startsWith('/lesson-plan')) return '/lesson-plan'
        if (path.startsWith('/immersion')) return '/immersion'
        if (path.startsWith('/forum')) return '/forum'
        return '/' + path.split('/')[1]
      },
      isHome () {
        return this.$route.path === '/' || this.$route.path === '/home'
      },
      modalVisible: {
        get () {
          return this.modalStatus.visible
        },
        set (value) {
          this.changeModalStatus({visible: value})
        }
      }
    }
  }
</script>

<style lang="less" scoped>
  #header {
    min-width: 300px;
    position: fixed;
    top: 0;
    left: 0;
    height: 80px;
    width: 100%;
    z-index: 1000;
    transition: all 0.3s ease;
    border: none !important;
    padding-top: 10px;
    
    &.header-transparent {
      background-color: transparent;
      box-shadow: none;
      border: none !important;
      
      &::before, &::after {
        display: none !important;
      }

      .header-content {
        background-color: transparent;
        
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
            background: rgba(255, 255, 255, 0.1);
            
            &:hover {
              background: rgba(255, 255, 255, 0.2);
              box-shadow: 0 2px 12px rgba(255, 255, 255, 0.2);
            }
            
            .user-avatar {
              border-color: rgba(255, 255, 255, 0.9);
            }

            &:hover .user-avatar {
              border-color: #fff;
              box-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
            }
            
            .user-name {
              color: rgba(255, 255, 255, 0.9);
            }

            .user-arrow {
              color: rgba(255, 255, 255, 0.7);
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
    
    &.header-scrolled {
      background-color: #fff;
      box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.08);
      padding-top: 0;
      border: none !important;
      
      &::before, &::after {
        display: none !important;
      }
    }
    
    .header-content {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 20px;
      gap: 30px;
    }

    .logo {
      flex-shrink: 0;
      
      .logo-img {
        height: 46px;
        object-fit: contain;
        vertical-align: middle;
        transition: transform 0.2s ease;
        
        &:hover {
          transform: scale(1.05);
        }
      }
    }

    .oj-menu {
      background: transparent;
      flex: 1;
      max-width: 800px;
      border-bottom: none !important;
      box-shadow: none !important;
      margin-top: 4px;
      
      &::after {
        display: none !important;
      }
      
      .ivu-menu-item, .ivu-menu-submenu-title {
        margin: 0 4px;
        padding: 0 16px;
        height: 40px;
        line-height: 40px;
        border-radius: 20px;
        border: 2px solid #1e3a8a;
        color: #1e3a8a !important;
        font-weight: 600;
        transition: all 0.3s ease;
        
        &:hover {
          background: rgba(30, 58, 138, 0.1) !important;
          box-shadow: 0 0 12px rgba(30, 58, 138, 0.2);
        }
        
        &.ivu-menu-item-active {
          background: #1e3a8a !important;
          color: #fff !important;
          border-color: #1e3a8a;
          box-shadow: 0 4px 12px rgba(30, 58, 138, 0.3);
          
          .ivu-icon {
            color: #fff !important;
          }
        }
        
        .ivu-icon {
          color: #1e3a8a;
          margin-right: 6px;
        }
      }
      
      .ivu-menu-submenu {
        &>.ivu-menu-submenu-title {
          border-radius: 20px;
        }
      }
    }

    .auth-menu {
      flex-shrink: 0;
      
      .user-info {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        padding: 6px 14px;
        border-radius: 24px;
        transition: all 0.3s ease;
        background: rgba(30, 58, 138, 0.06);
        
        &:hover {
          background: rgba(30, 58, 138, 0.12);
          box-shadow: 0 2px 12px rgba(30, 58, 138, 0.15);
          transform: translateY(-1px);
        }
        
        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #1e3a8a;
          transition: all 0.3s ease;
        }

        &:hover .user-avatar {
          border-color: #3b82f6;
          box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
        }

        .user-name {
          font-size: 14px;
          font-weight: 600;
          color: #1e3a8a;
        }

        .user-arrow {
          font-size: 12px;
          color: #1e3a8a;
          transition: transform 0.3s ease;
        }

        &:hover .user-arrow {
          transform: rotate(180deg);
        }
      }
      
      .ivu-btn-ghost {
        border: 2px solid #1e3a8a;
        color: #1e3a8a;
        border-radius: 20px;
        padding: 8px 20px;
        font-weight: 600;
        transition: all 0.3s ease;
        
        &:hover {
          background: rgba(30, 58, 138, 0.1);
          box-shadow: 0 0 12px rgba(30, 58, 138, 0.2);
        }
      }
    }
  }

  .drop-menu {
    /deep/ .ivu-select-dropdown {
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(30, 58, 138, 0.12);
      border: 1px solid #e2e8f0;
      padding: 6px;
      min-width: 140px;
    }

    /deep/ .ivu-dropdown-menu {
      border-radius: 12px;
    }

    .drop-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      margin-right: 8px;
      flex-shrink: 0;
    }

    /deep/ .ivu-dropdown-item {
      padding: 8px 14px;
      border-radius: 8px;
      margin: 1px 0;
      font-size: 18px !important;
      line-height: 1;
      font-weight: 500;
      color: #475569;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        background: linear-gradient(135deg, rgba(30, 58, 138, 0.08), rgba(59, 130, 246, 0.08));
        color: #1e3a8a;
        padding-left: 18px;
        box-shadow: inset 3px 0 0 #1e3a8a;
      }

      .ivu-icon {
        transition: transform 0.25s ease;
      }

      &:hover .ivu-icon {
        transform: translateX(2px);
      }
    }

    /deep/ .ivu-dropdown-item-divided {
      margin-top: 6px;
      padding-top: 10px;
      border-top: 1px solid #f1f5f9;
    }
  }

  .auth-modal {
    /deep/ .ivu-modal {
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 16px 48px rgba(30, 58, 138, 0.12);
    }

    /deep/ .ivu-modal-header {
      border-bottom: 1px solid #f1f5f9;
      padding: 20px 28px 16px;
      background: linear-gradient(135deg, #f8fafc, #fff);
    }

    /deep/ .ivu-modal-body {
      padding: 28px 28px 24px;
    }

    /deep/ .ivu-modal-close .ivu-icon-ios-close {
      color: #94a3b8;
      &:hover { color: #475569; }
    }

    /deep/ .modal-title {
      font-size: 20px;
      font-weight: 600;
      color: #1e3a8a;
    }
  }
  
  @media (max-width: 1200px) {
    #header .header-content {
      gap: 16px;
    }
    
    .oj-menu {
      max-width: 600px;
      
      .ivu-menu-item, .ivu-menu-submenu-title {
        padding: 0 12px;
        font-size: 14px;
      }
    }
  }
  
  @media (max-width: 992px) {
    .oj-menu {
      display: none;
    }
  }

  /* 移除所有可能的边框线 */
  .ivu-menu-horizontal {
    border-bottom: none !important;
    
    &::after {
      display: none !important;
    }
  }
  
  .ivu-menu-light {
    border-bottom: none !important;
  }
</style>

<style lang="less">
/* 用户下拉菜单全局样式（穿透到body层） */
.user-dropdown-menu,
.ivu-select-dropdown {
  .ivu-dropdown-item {
    font-size: 18px !important;
    line-height: 1 !important;
    padding: 8px 14px !important;
  }
}
</style>
