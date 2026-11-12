<template>
  <div id="header" :class="{ 'header-transparent': isHome && !scrolled, 'header-scrolled': !isHome || scrolled }">
    <div class="header-content">
      <div class="logo">
        <img :src="logoSrc" alt="学校标志" class="logo-img" />
      </div>
      
      <Menu theme="light" mode="horizontal" @on-select="handleRoute" :active-name="activeMenu" class="oj-menu">
        <Menu-item name="/">
          <Icon type="ios-home"></Icon>
          {{$t('m.Home')}}
        </Menu-item>
        <Menu-item name="/problem">
          <Icon type="ios-keypad"></Icon>
          {{$t('m.NavProblems')}}
        </Menu-item>
        <Menu-item name="/contest">
          <Icon type="ios-trophy"></Icon>
          {{$t('m.Contests')}}
        </Menu-item>
        <Menu-item name="/class">
          <Icon type="ios-school"></Icon>
          班级
        </Menu-item>
        <Menu-item name="/knowledge-universe">
          <Icon type="ios-analytics"></Icon>
          图谱
        </Menu-item>
        <Menu-item name="/algorithm-viz">
          <Icon type="ios-flask"></Icon>
          算法
        </Menu-item>
        <Menu-item name="/exercise">
          <Icon type="ios-copy"></Icon>
          题集
        </Menu-item>
        <Menu-item name="/immersion">
          <Icon type="ios-flash"></Icon>
          {{$t('m.Immersive_Practice')}}
        </Menu-item>
        <Menu-item name="/forum">
          <Icon type="ios-people"></Icon>
          {{$t('m.Community')}}
        </Menu-item>
        <!-- <Submenu name="rank">
          <template #title>
            <Icon type="ios-trophy"></Icon>
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
          <template #title>
            <Icon type="ios-information-circle"></Icon>
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
                  @click="goLogin">{{$t('m.Login')}}
          </Button>
          <Button v-if="website.allow_register"
                  type="ghost"
                  shape="circle"
                  @click="goRegister"
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
            <template #list><Dropdown-menu>
              <Dropdown-item name="/user-home"><span class="drop-icon"><Icon type="ios-home" size="18"/></span>{{$t('m.MyHome')}}</Dropdown-item>
              <Dropdown-item name="/learning-report"><span class="drop-icon"><Icon type="ios-pulse" size="18"/></span>{{$t('m.NavStatus')}}</Dropdown-item>
              <Dropdown-item name="/profile-onboarding"><span class="drop-icon"><Icon type="ios-person" size="18"/></span>{{$t('m.Profile_Onboarding')}}</Dropdown-item>
              <Dropdown-item name="/status?myself=1"><span class="drop-icon"><Icon type="ios-paper" size="18"/></span>{{$t('m.MySubmissions')}}</Dropdown-item>
              <Dropdown-item name="/setting/profile"><span class="drop-icon"><Icon type="ios-settings" size="18"/></span>{{$t('m.Settings')}}</Dropdown-item>
              <Dropdown-item v-if="isTeacher || isAdminRole" name="/teacher"><span class="drop-icon"><Icon type="ios-people" size="18"/></span>教师</Dropdown-item>
              <Dropdown-item v-if="isAdminRole" name="/admin"><span class="drop-icon"><Icon type="ios-cog" size="18"/></span>{{$t('m.Management')}}</Dropdown-item>
              <Dropdown-item divided name="/logout"><span class="drop-icon"><Icon type="ios-log-out" size="18"/></span>{{$t('m.Logout')}}</Dropdown-item>
            </Dropdown-menu></template>
          </Dropdown>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
  import logo1 from '@/assets/logo.png'
  import logo2 from '@/assets/logo2.png'
  import { mapGetters, mapActions } from 'vuex'

  export default {
    data () {
      return {
        scrolled: false
      }
    },
    mounted () {
      this.getProfile()
      window.addEventListener('scroll', this.handleScroll)
    },
    beforeUnmount () {
      window.removeEventListener('scroll', this.handleScroll)
    },
    methods: {
      ...mapActions(['getProfile']),
      handleRoute (route) {
        if (!route) return
        // 教师/管理员点"班级"：提示身份并跳转到教师工作台的班级管理
        if (route === '/class' && (this.isTeacher || this.isAdminRole)) {
          this.$Message.info({
            content: '检测到教师身份，已为你打开教师工作台的班级管理',
            duration: 3
          })
          this.$router.push('/teacher?section=class')
          return
        }
        // 学生点"班级"：默认进入上次浏览的班级（可从班级主页返回列表换班）
        if (route === '/class') {
          const last = localStorage.getItem('last_class_id')
          if (last) {
            this.$router.push({ name: 'class-home', params: { classId: last } })
            return
          }
        }
        if (route.indexOf('admin') >= 0) {
          window.open('/admin/')
        } else if (route === '/teacher') {
          window.open('/teacher/', '_blank')
        } else {
          this.$router.push(route)
        }
      },
      goLogin () {
        this.$router.push('/login')
      },
      goRegister () {
        this.$router.push('/register')
      },
      handleScroll () {
        // 滚动到公告区域（约100vh）时才变白色背景
        this.scrolled = window.scrollY > window.innerHeight * 0.9
      }
    },
    computed: {
      ...mapGetters(['website', 'user', 'profile', 'isAuthenticated', 'isAdminRole', 'isTeacher']),
      logoSrc () {
        // 首页未滚动时显示 logo.png，学习页面（透明背景）也显示 logo.png，其他情况显示 logo2.png
        const isLearningPath = this.$route.path === '/knowledge-universe'
        return (this.isHome && !this.scrolled) || (isLearningPath && !this.scrolled) ? logo1 : logo2
      },
      activeMenu () {
        const path = this.$route.path
        // 处理各种路由匹配
        if (path === '/' || path.startsWith('/home')) return '/'
        if (path.startsWith('/problem')) return '/problem'
        if (path.startsWith('/contest')) return '/contest'
        if (path.startsWith('/status') && this.$route.query.problemID) return '/problem'
        if (path.startsWith('/knowledge-universe')) return '/knowledge-universe'
        if (path.startsWith('/algorithm-viz')) return '/algorithm-viz'
        if (path.startsWith('/exercise')) return '/exercise'
        if (path.startsWith('/immersion')) return '/immersion'
        if (path.startsWith('/forum')) return '/forum'
        return '/' + path.split('/')[1]
      },
      isHome () {
        return this.$route.path === '/' || this.$route.path === '/home' || this.$route.path === '/knowledge-universe'
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
    height: 56px;
    width: 100%;
    z-index: 1000;
    transition: all 0.3s ease;
    border: none !important;
    padding-top: 0;
    
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
      /* 亚克力材质：半透明 + 背景模糊 + 饱和度增强 */
      background-color: rgba(255, 255, 255, 0.58);
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      box-shadow: 0 2px 12px 0 rgba(30, 58, 138, 0.08);
      padding-top: 0;
      border: none !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.4) !important;

      /* 不支持 backdrop-filter 的浏览器回退为近不透明白底 */
      @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
        background-color: rgba(255, 255, 255, 0.95);
      }
      
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
      display: flex;
      align-items: center;

      .logo-img {
        height: 30px;
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
      margin-top: 0;
      /* 容器与按钮等高（32px，同右侧登录/注册），flex 居中 */
      height: 32px;
      line-height: normal;
      display: flex;
      align-items: center;
      flex-wrap: nowrap;
      
      &::after {
        display: none !important;
      }
      
      .ivu-menu-item, .ivu-menu-submenu-title {
        margin: 0 4px;
        padding: 0 14px;
        height: 32px;
        line-height: 1;
        display: flex;
        align-items: center;
        border-radius: 999px;
        border: 2px solid #1e3a8a;
        color: #1e3a8a !important;
        font-size: 14px;
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
          line-height: 1;
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
        padding: 5px 18px;
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
    :deep(.ivu-select-dropdown){
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(30, 58, 138, 0.12);
      border: 1px solid #e2e8f0;
      padding: 6px;
      min-width: 140px;
    }

    :deep(.ivu-dropdown-menu){
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

    :deep(.ivu-dropdown-item){
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

    :deep(.ivu-dropdown-item-divided){
      margin-top: 6px;
      padding-top: 10px;
      border-top: 1px solid #f1f5f9;
    }
  }

  @media (max-width: 1200px) {
    #header .header-content {
      gap: 16px;
    }
    
    .oj-menu {
      max-width: 600px;

      .ivu-menu-item, .ivu-menu-submenu-title {
        padding: 0 10px;
        font-size: 12px;
        margin: 0 3px;
      }
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
