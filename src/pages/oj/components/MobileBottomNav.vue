<template>
  <div class="mobile-bottom-nav">
    <div
      v-for="item in navItems"
      :key="item.key"
      class="nav-item"
      :class="{ active: isActive(item) }"
      @click="navigate(item)"
    >
      <Icon :type="isActive(item) ? item.iconActive : item.icon" size="22" />
      <span class="nav-label">{{ item.label }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MobileBottomNav',
  computed: {
    navItems () {
      return [
        {
          key: 'problems',
          icon: 'ios-keypad',
          iconActive: 'ios-keypad',
          label: this.$t('m.NavProblems'),
          route: '/problem',
          matchPaths: ['/problem']
        },
        {
          key: 'contests',
          icon: 'trophy',
          iconActive: 'trophy',
          label: this.$t('m.Contests'),
          route: '/contest',
          matchPaths: ['/contest']
        },
        {
          key: 'lessons',
          icon: 'ios-book',
          iconActive: 'ios-book',
          label: this.$t('m.Lesson_Plans'),
          route: '/lesson-plan',
          matchPaths: ['/lesson-plan']
        },
        {
          key: 'practice',
          icon: 'flash',
          iconActive: 'flash',
          label: this.$t('m.Immersive_Practice'),
          route: '/immersion',
          matchPaths: ['/immersion']
        },
        {
          key: 'personal',
          icon: 'ios-person',
          iconActive: 'ios-person',
          label: this.$t('m.MyHome'),
          route: '/mobile/personal',
          matchPaths: ['/mobile/personal', '/user-home', '/setting', '/profile-onboarding',
            '/ai-chat-fullscreen', '/code-editor-fullscreen']
        }
      ]
    }
  },
  methods: {
    isActive (item) {
      return item.matchPaths.some(p => this.$route.path.startsWith(p))
    },
    navigate (item) {
      if (this.$route.path !== item.route) {
        this.$router.push(item.route)
      }
    }
  }
}
</script>

<style lang="less" scoped>
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1001;
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 56px;
  background: #fff;
  border-top: 1px solid #e8eaec;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.06);
  padding-bottom: env(safe-area-inset-bottom, 0);

  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    height: 100%;
    cursor: pointer;
    color: #808695;
    transition: color 0.2s ease;
    user-select: none;
    -webkit-tap-highlight-color: transparent;

    &.active {
      color: #1e3a8a;
    }

    .nav-label {
      font-size: 10px;
      margin-top: 2px;
      line-height: 1;
    }
  }
}
</style>
