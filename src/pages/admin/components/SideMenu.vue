<template>
  <div>
    <div class="menu-overlay" :class="{ 'is-visible': menuOpen }" @click="closeMenu"></div>
    <el-menu class="vertical_menu" :class="{ 'is-open': menuOpen }"
             :router="true" :default-active="currentPath">
      <div class="menu-mobile-close" @click="closeMenu">
        <i class="el-icon-close"></i>
      </div>
      <div class="logo">
        <img src="../../../assets/logo3.png" alt="oj admin"/>
      </div>
      <el-menu-item index="/"><i class="el-icon-fa-dashboard"></i>{{$t('m.Dashboard')}}</el-menu-item>
      <el-menu-item index="/data-dashboard" v-if="isAdminRole"><i class="el-icon-fa-bar-chart"></i>数据看板</el-menu-item>
      <el-submenu v-if="isSuperAdmin" index="general">
        <template slot="title"><i class="el-icon-menu"></i>{{$t('m.General')}}</template>
        <el-menu-item index="/user">{{$t('m.User')}}</el-menu-item>
        <el-menu-item index="/announcement">{{$t('m.Announcement')}}</el-menu-item>
        <el-menu-item index="/conf">{{$t('m.System_Config')}}</el-menu-item>
        <el-menu-item index="/judge-server">{{$t('m.Judge_Server')}}</el-menu-item>
        <el-menu-item index="/prune-test-case">{{$t('m.Prune_Test_Case')}}</el-menu-item>
        <el-menu-item index="/feedback">{{$t('m.Feedback')}}</el-menu-item>
      </el-submenu>
      <el-submenu index="problem" v-if="hasProblemPermission">
        <template slot="title"><i class="el-icon-fa-bars"></i>{{$t('m.Problem')}}</template>
        <el-menu-item index="/problems">{{$t('m.Problem_List')}}</el-menu-item>
        <el-menu-item index="/problem/create">{{$t('m.Create_Problem')}}</el-menu-item>
        <el-menu-item index="/problem/batch_ops">{{$t('m.Export_Import_Problem')}}</el-menu-item>
      </el-submenu>
      <el-submenu index="contest">
        <template slot="title"><i class="el-icon-fa-trophy"></i>{{$t('m.Contest')}}</template>
        <el-menu-item index="/contest">{{$t('m.Contest_List')}}</el-menu-item>
        <el-menu-item index="/contest/create">{{$t('m.Create_Contest')}}</el-menu-item>
      </el-submenu>
      <el-submenu v-if="isAdminRole" index="lesson-plan">
        <template slot="title"><i class="el-icon-fa-book"></i>{{$t('m.Lesson_Plan')}}</template>
        <el-menu-item index="lesson-plan">{{$t('m.Lesson_Plan_Management')}}</el-menu-item>
      </el-submenu>
      <el-submenu v-if="isAdminRole" index="forum">
        <template slot="title"><i class="el-icon-fa-comments"></i>论坛管理</template>
        <el-menu-item index="/forum/posts">帖子管理</el-menu-item>
        <el-menu-item index="/forum/users">用户管理</el-menu-item>
        <el-menu-item index="/forum/reports">举报处理</el-menu-item>
      </el-submenu>
    </el-menu>
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
    overflow: auto;
    width: 205px;
    height: 100%;
    position: fixed !important;
    z-index: 100;
    top: 0;
    bottom: 0;
    left: 0;
    .logo {
      margin: 20px 0;
      text-align: center;
      img {
        background-color: #fff;
        border-radius: 50%;
        border: 3px solid #fff;
        width: 75px;
        height: 75px;
      }
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
        background: rgba(0, 0, 0, 0.1);
        cursor: pointer;
        z-index: 10;
        transition: background 0.2s;

        &:hover {
          background: rgba(0, 0, 0, 0.2);
        }

        i {
          font-size: 16px;
          color: #606266;
        }
      }
    }
  }
</style>
