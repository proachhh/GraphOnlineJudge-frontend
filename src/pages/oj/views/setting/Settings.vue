<template>
  <div class="settings-elegant">

    <div class="settings-panel">
      <div class="flex-container">
        <div class="menu">
          <div class="avatar-editor">
            <div class="avatar-container">
              <img class="avatar" :src="profile.avatar"/>
              <div class="avatar-mask">
                <a @click.stop="goRoute({name: 'profile-setting'})">
                  <div class="mask-content">
                    <Icon type="ios-camera" size="30"></Icon>
                    <p class="text">Change Avatar</p>
                  </div>
                </a>
              </div>
            </div>
          </div>

          <Menu accordion @on-select="goRoute" :activeName="activeName" class="settings-menu" width="auto">
            <Menu-item name="/setting/profile">
              <Icon type="ios-person" />
              {{ $t('m.Profile') }}
            </Menu-item>
            <Menu-item name="/setting/account">
              <Icon type="ios-key" />
              {{ $t('m.Account') }}
            </Menu-item>
            <Menu-item name="/setting/security">
              <Icon type="ios-lock" />
              {{ $t('m.Security') }}
            </Menu-item>
          </Menu>
        </div>
        <div class="panel">
          <transition name="fadeInUp">
            <router-view></router-view>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
  import { mapGetters } from 'vuex'

  export default {
    name: 'profile',
    methods: {
      goRoute (routePath) {
        this.$router.push(routePath)
      }
    },
    computed: {
      ...mapGetters(['profile']),
      activeName () {
        return this.$route.path
      }
    }
  }
</script>

<style lang="less" scoped>
.settings-elegant {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: calc(100vh - 60px);
  background: linear-gradient(180deg, #f0f4f8 0%, #f8fafc 100%);
}

/* 页面标题 */
.page-header {
  text-align: center;
  margin-bottom: 40px;
  animation: fadeInDown 0.6s ease-out;

  .page-title {
    font-size: 2.2rem;
    font-weight: 600;
    color: #1e3a8a;
    letter-spacing: 0.1em;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    margin-bottom: 12px;

    .title-line {
      width: 60px;
      height: 2px;
      background: linear-gradient(90deg, transparent, #1e3a8a, #3b82f6, transparent);
      border-radius: 1px;
    }
  }

  .page-subtitle {
    font-size: 1rem;
    color: #64748b;
    letter-spacing: 0.1em;
    font-weight: 400;
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 主面板 */
.settings-panel {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(30, 58, 138, 0.08);
  overflow: hidden;
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 12px 40px rgba(30, 58, 138, 0.12);
  }
}

.flex-container {
  display: flex;
  min-height: 500px;
}

.menu {
  flex: 0 0 250px;
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
  padding: 20px 0;

  .avatar-editor {
    padding: 20px;
    margin-bottom: 20px;
    text-align: center;

    .avatar-container {
      position: relative;
      display: inline-block;
      width: 120px;
      height: 120px;

      &:hover {
        .avatar-mask {
          opacity: .7;
        }
      }

      .avatar {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        object-fit: cover;
      }

      .avatar-mask {
        transition: opacity .2s ease-in;
        z-index: 1;
        border-radius: 50%;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(30, 58, 138, 0.8);
        opacity: 0;
        display: flex;
        align-items: center;
        justify-content: center;

        .mask-content {
          color: #fff;
          font-size: 14px;
          text-align: center;

          .text {
            margin-top: 8px;
            font-size: 12px;
          }
        }
      }
    }
  }

  .settings-menu {
    border-right: none;

    .ivu-menu-item {
      text-align: left;
      padding-left: 30px;
      font-size: 15px;
      color: #475569;

      &:hover {
        background: #e2e8f0;
        color: #1e3a8a;
      }

      &.ivu-menu-item-active {
        background: #1e3a8a;
        color: white;
        border-right: 3px solid #3b82f6;
      }

      .ivu-icon {
        margin-right: 8px;
      }
    }
  }
}

.panel {
  flex: 1;
  padding: 30px;
  background: white;
}
</style>

<style lang="less">
.setting-main {
  position: relative;
  margin: 0;
  padding-bottom: 20px;

  .section-title {
    font-size: 1.2rem;
    font-weight: 600;
    color: #1e3a8a;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid #f1f5f9;
  }

  .mini-container {
    width: 100%;
    max-width: 500px;
  }
}
</style>
