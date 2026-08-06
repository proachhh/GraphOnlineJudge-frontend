<template>
  <div>
    <div class="menu-overlay" :class="{ 'is-visible': menuOpen }" @click="closeMenu"></div>
    <aside class="vertical_menu" :class="{ 'is-open': menuOpen }">
      <div class="menu-mobile-close" @click="closeMenu">
        <i class="el-icon-close"></i>
      </div>
      <div class="logo">
        <img src="../../../assets/logo3.png" alt="oj admin"/>
      </div>
      <div class="sidebar-title">
        <i class="el-icon-s-platform"></i>
        <span>管理后台</span>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-item" v-if="isAdminRole" :class="{ active: currentPath === '/data-dashboard' }" @click="go('/data-dashboard')">
          <i class="el-icon-fa-bar-chart"></i><span>数据看板</span>
        </div>
        <div class="nav-item" v-if="isAdminRole" :class="{ active: currentPath === '/announcement' }" @click="go('/announcement')">
          <i class="el-icon-fa-bullhorn"></i><span>{{$t('m.Announcement')}}</span>
        </div>

        <!-- 常规 -->
        <div v-if="isSuperAdmin" class="nav-group-title">常规</div>
        <template v-if="isSuperAdmin">
          <div class="nav-item" :class="{ active: currentPath === '/user' }" @click="go('/user')">
            <i class="el-icon-fa-users"></i><span>{{$t('m.User')}}</span>
          </div>
          <div class="nav-item" :class="{ active: currentPath === '/conf' }" @click="go('/conf')">
            <i class="el-icon-fa-cog"></i><span>{{$t('m.System_Config')}}</span>
          </div>
          <div class="nav-item" :class="{ active: currentPath === '/judge-server' }" @click="go('/judge-server')">
            <i class="el-icon-fa-server"></i><span>{{$t('m.Judge_Server')}}</span>
          </div>
          <div class="nav-item" :class="{ active: currentPath === '/feedback' }" @click="go('/feedback')">
            <i class="el-icon-fa-comment"></i><span>{{$t('m.Feedback')}}</span>
          </div>
        </template>

        <!-- 题目 -->
        <div v-if="hasProblemPermission" class="nav-group-title">题目</div>
        <template v-if="hasProblemPermission">
          <div class="nav-item" :class="{ active: currentPath === '/problems' }" @click="go('/problems')">
            <i class="el-icon-fa-bars"></i><span>{{$t('m.Problem_List')}}</span>
          </div>
          <div class="nav-item" :class="{ active: currentPath === '/problem/create' }" @click="go('/problem/create')">
            <i class="el-icon-plus"></i><span>{{$t('m.Create_Problem')}}</span>
          </div>
          <div class="nav-item" :class="{ active: currentPath === '/problem/batch_ops' }" @click="go('/problem/batch_ops')">
            <i class="el-icon-fa-exchange"></i><span>{{$t('m.Export_Import_Problem')}}</span>
          </div>
        </template>

        <!-- 竞赛 -->
        <div class="nav-group-title">竞赛</div>
        <div class="nav-item" :class="{ active: currentPath === '/contest' }" @click="go('/contest')">
          <i class="el-icon-fa-trophy"></i><span>{{$t('m.Contest_List')}}</span>
        </div>
        <div class="nav-item" :class="{ active: currentPath === '/contest/create' }" @click="go('/contest/create')">
          <i class="el-icon-plus"></i><span>{{$t('m.Create_Contest')}}</span>
        </div>

        <!-- 教案 -->
        <template v-if="isAdminRole">
          <div class="nav-group-title">教学</div>
          <div class="nav-item" :class="{ active: currentPath === '/lesson-plan' }" @click="go('/lesson-plan')">
            <i class="el-icon-fa-book"></i><span>{{$t('m.Lesson_Plan_Management')}}</span>
          </div>
        </template>

        <!-- 论坛 -->
        <template v-if="isAdminRole">
          <div class="nav-group-title">论坛</div>
          <div class="nav-item" :class="{ active: currentPath === '/forum/posts' }" @click="go('/forum/posts')">
            <i class="el-icon-document"></i><span>帖子管理</span>
          </div>
          <div class="nav-item" :class="{ active: currentPath === '/forum/users' }" @click="go('/forum/users')">
            <i class="el-icon-fa-user"></i><span>用户管理</span>
          </div>
          <div class="nav-item" :class="{ active: currentPath === '/forum/reports' }" @click="go('/forum/reports')">
            <i class="el-icon-warning"></i><span>举报处理</span>
          </div>
        </template>
      </nav>
    </aside>
  </div>
</template>

<script>
  import {mapGetters} from 'vuex'

  export default {
    name: 'SideMenu',
    data () {
      return {
        currentPath: '',
        menuOpen: false
      }
    },
    mounted () {
      this.currentPath = this.$route.path
    },
    methods: {
      toggleMenu () {
        this.menuOpen = !this.menuOpen
      },
      closeMenu () {
        this.menuOpen = false
      },
      go (path) {
        this.currentPath = path
        this.$router.push(path)
        this.closeMenu()
      }
    },
    computed: {
      ...mapGetters(['user', 'isSuperAdmin', 'isAdminRole', 'hasProblemPermission'])
    },
    watch: {
      '$route' () {
        this.currentPath = this.$route.path
        this.closeMenu()
      }
    }
  }
</script>

<style scoped lang="less">
  .menu-overlay {
    display: none;
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 99;
    opacity: 0;
    transition: opacity 0.3s ease;

    &.is-visible {
      opacity: 1;
    }
  }

  .vertical_menu {
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none;  /* Firefox */
    -ms-overflow-style: none;  /* IE10+ */
    width: 220px;
    height: 100%;
    position: fixed !important;
    z-index: 100;
    top: 0;
    bottom: 0;
    left: 0;
    background: #1e3a8a;
    color: #fff;
    display: flex;
    flex-direction: column;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
    &::-webkit-scrollbar { display: none; }  /* Chrome/Safari */

    .logo {
      margin: 18px 0 8px;
      text-align: center;
      img {
        background-color: #fff;
        border-radius: 50%;
        border: 3px solid rgba(255, 255, 255, 0.9);
        width: 64px;
        height: 64px;
      }
    }

    .sidebar-title {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 22px;
      font-size: 18px;
      font-weight: 600;
      color: #fff;
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
      margin-bottom: 8px;
    }
    .sidebar-title i { font-size: 22px; }

    .sidebar-nav {
      padding: 4px 0 24px;
      display: flex;
      flex-direction: column;
    }

    .nav-group-title {
      padding: 12px 22px 4px;
      font-size: 11px;
      letter-spacing: 1px;
      color: rgba(255, 255, 255, 0.45);
      text-transform: uppercase;
      font-weight: 600;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 11px 22px;
      color: rgba(255, 255, 255, 0.9);
      font-size: 14px;
      cursor: pointer;
      position: relative;
      transition: background 0.2s;
    }
    .nav-item i { font-size: 16px; min-width: 18px; }
    .nav-item:hover {
      background: rgba(255, 255, 255, 0.08);
    }
    .nav-item.active {
      background: rgba(255, 255, 255, 0.18);
      color: #fff;
      font-weight: 600;
    }
    .nav-item.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: #fff;
    }

    .menu-mobile-close {
      display: none;
    }
  }

  // ========== 移动端适配 ==========

  // 平板及以下
  @media screen and (max-width: 1024px) {
    .menu-overlay {
      display: block;
    }

    .vertical_menu {
      transform: translateX(-100%);
      transition: transform 0.3s ease;
      box-shadow: none;

      &.is-open {
        transform: translateX(0);
        box-shadow: 4px 0 24px rgba(0, 0, 0, 0.3);
      }

      .menu-mobile-close {
        display: flex;
        align-items: center;
        justify-content: center;
        position: absolute;
        top: 12px;
        right: 12px;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.1);
        cursor: pointer;
        z-index: 10;
        transition: background 0.2s;

        &:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        i {
          font-size: 16px;
          color: #fff;
        }
      }
    }
  }
</style>
