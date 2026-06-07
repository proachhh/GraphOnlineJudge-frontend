<template>
  <div class="mobile-personal">
    <!-- 用户信息区 -->
    <div class="personal-header" v-if="isAuthenticated">
      <img :src="profile.avatar" class="avatar" />
      <div class="user-info-text">
        <div class="username">{{ user.username }}</div>
        <div class="email" v-if="user.email">{{ user.email }}</div>
      </div>
    </div>
    <div class="personal-header" v-else>
      <div class="avatar-placeholder">
        <Icon type="ios-person" size="32" color="#94a3b8" />
      </div>
      <div class="user-info-text">
        <div class="username">{{ $t('m.Login') }}</div>
        <div class="email">{{ $t('m.Welcome_to_Login') }}</div>
      </div>
    </div>

    <!-- 快捷操作区 -->
    <div class="action-grid" v-if="isAuthenticated">
      <div class="action-item" @click="$router.push('/user-home')">
        <div class="action-icon" style="background: linear-gradient(135deg, #1e3a8a, #3b82f6);">
          <Icon type="ios-home" size="22" color="#fff" />
        </div>
        <span>{{ $t('m.MyHome') }}</span>
      </div>
      <div class="action-item" @click="$router.push('/profile-onboarding')">
        <div class="action-icon" style="background: linear-gradient(135deg, #6366f1, #8b5cf6);">
          <Icon type="ios-person" size="22" color="#fff" />
        </div>
        <span>{{ $t('m.Profile_Onboarding') }}</span>
      </div>
      <div class="action-item" @click="$router.push('/setting/profile')">
        <div class="action-icon" style="background: linear-gradient(135deg, #0ea5e9, #38bdf8);">
          <Icon type="ios-cog" size="22" color="#fff" />
        </div>
        <span>{{ $t('m.Settings') }}</span>
      </div>
      <div class="action-item" @click="$router.push('/ai-chat-fullscreen')">
        <div class="action-icon" style="background: linear-gradient(135deg, #10b981, #34d399);">
          <Icon type="ios-chatbubbles" size="22" color="#fff" />
        </div>
        <span>AI Chat</span>
      </div>
      <div class="action-item" @click="$router.push('/code-editor-fullscreen')">
        <div class="action-icon" style="background: linear-gradient(135deg, #f59e0b, #fbbf24);">
          <Icon type="ios-paper" size="22" color="#fff" />
        </div>
        <span>{{ $t('m.Code_Editor') }}</span>
      </div>
      <div class="action-item" @click="openFeedback">
        <div class="action-icon" style="background: linear-gradient(135deg, #ef4444, #f87171);">
          <Icon type="ios-flag" size="22" color="#fff" />
        </div>
        <span>{{ $t('m.Feedback') }}</span>
      </div>
      <div class="action-item" @click="$router.push('/status?myself=1')">
        <div class="action-icon" style="background: linear-gradient(135deg, #8b5cf6, #a78bfa);">
          <Icon type="ios-list" size="22" color="#fff" />
        </div>
        <span>{{ $t('m.MySubmissions') }}</span>
      </div>
      <div class="action-item" @click="handleLogout">
        <div class="action-icon" style="background: linear-gradient(135deg, #64748b, #94a3b8);">
          <Icon type="ios-log-out" size="22" color="#fff" />
        </div>
        <span>{{ $t('m.Logout') }}</span>
      </div>
    </div>

    <!-- 未登录 -->
    <div class="login-prompt" v-else>
      <Button type="primary" long size="large" @click="openLogin">{{ $t('m.Login') }}</Button>
      <Button v-if="website.allow_register" long size="large" style="margin-top: 12px;" @click="openRegister">{{ $t('m.Register') }}</Button>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { types } from '@/store'

export default {
  name: 'MobilePersonal',
  computed: {
    ...mapGetters(['website', 'user', 'profile', 'isAuthenticated'])
  },
  methods: {
    ...mapActions(['changeModalStatus']),
    openLogin () {
      this.changeModalStatus({ mode: 'login', visible: true })
    },
    openRegister () {
      this.changeModalStatus({ mode: 'register', visible: true })
    },
    openFeedback () {
      // 触发 GlobalSidebar 的反馈功能 - 通过事件
      this.$root.$emit('open-feedback')
    },
    handleLogout () {
      this.$router.push('/logout')
    }
  }
}
</script>

<style lang="less" scoped>
.mobile-personal {
  padding: 20px 16px 80px;
  min-height: 100vh;
  background: #f5f7fa;
}

.personal-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  margin-bottom: 20px;

  .avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #1e3a8a;
  }

  .avatar-placeholder {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .user-info-text {
    .username {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
    }
    .email {
      font-size: 13px;
      color: #94a3b8;
      margin-top: 2px;
    }
  }
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;

  .action-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px 8px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    cursor: pointer;
    transition: transform 0.15s ease;
    user-select: none;
    -webkit-tap-highlight-color: transparent;

    &:active {
      transform: scale(0.96);
    }

    .action-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    span {
      font-size: 12px;
      color: #475569;
      text-align: center;
      line-height: 1.2;
    }
  }
}

.login-prompt {
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
</style>
