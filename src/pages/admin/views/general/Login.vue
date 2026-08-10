<template>
  <div class="admin-login-page">
    <!-- 左侧品牌展示区 -->
    <div class="brand-side">
      <div class="brand-bg"></div>
      <div class="brand-content">
        <img src="../../../../assets/logo3.png" alt="logo" class="brand-logo" />
        <h1 class="brand-title">管理后台</h1>
        <p class="brand-subtitle">在线评测系统 · 管理控制台</p>
        <ul class="brand-features">
          <li><i class="el-icon-data-board"></i> 数据看板与学情统计</li>
          <li><i class="el-icon-document"></i> 题目与竞赛管理</li>
          <li><i class="el-icon-chat-dot-round"></i> 公告与论坛管理</li>
          <li><i class="el-icon-setting"></i> 系统配置与用户管理</li>
        </ul>
      </div>
      <div class="brand-footer">
        <span>© {{ year }} OJ Admin</span>
      </div>
    </div>

    <!-- 右侧表单区 -->
    <div class="form-side">
      <div class="form-wrapper">
        <div class="form-header">
          <h2 class="form-title">管理员登录</h2>
          <p class="form-subtitle">请输入管理员账号以进入后台</p>
        </div>

        <el-form :model="loginForm" :rules="loginRules" ref="loginForm" class="login-form" @submit.native.prevent="handleLogin">
          <el-form-item prop="account">
            <el-input
              v-model="loginForm.account"
              placeholder="用户名"
              prefix-icon="el-icon-user"
              size="medium"
              @keyup.enter.native="handleLogin">
            </el-input>
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="密码"
              prefix-icon="el-icon-lock"
              size="medium"
              @keyup.enter.native="handleLogin">
            </el-input>
          </el-form-item>
          <el-button
            type="primary"
            @click="handleLogin"
            class="submit-btn"
            :loading="logining">
            登 录
          </el-button>
        </el-form>

        <div class="back-home">
          <a href="/"><i class="el-icon-back"></i> 返回前台首页</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import api from '../../api'

  export default {
    data () {
      return {
        logining: false,
        loginForm: {
          account: '',
          password: ''
        },
        loginRules: {
          account: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
          password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
        }
      }
    },
    computed: {
      year () {
        return new Date().getFullYear()
      }
    },
    methods: {
      handleLogin () {
        this.$refs.loginForm.validate(valid => {
          if (!valid) return
          this.logining = true
          api.login(this.loginForm.account, this.loginForm.password).then(() => {
            this.logining = false
            this.$router.push({ name: 'dashboard' })
          }, () => {
            this.logining = false
          })
        })
      }
    }
  }
</script>

<style scoped lang="less">
  .admin-login-page {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    display: flex;
    background: #fff;
    overflow: hidden;
  }

  /* 左侧品牌区 */
  .brand-side {
    flex: 1;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
    color: #fff;
  }
  .brand-bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 40%, #0f172a 100%);
  }
  .brand-bg::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.25) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.2) 0%, transparent 50%);
  }
  .brand-content {
    position: relative;
    z-index: 1;
    padding: 60px 80px;
    max-width: 560px;
  }
  .brand-logo {
    width: 64px;
    height: 64px;
    background: #fff;
    border-radius: 50%;
    border: 3px solid rgba(255, 255, 255, 0.9);
    padding: 6px;
    margin-bottom: 24px;
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.25);
  }
  .brand-title {
    font-size: 36px;
    font-weight: 700;
    margin-bottom: 8px;
    letter-spacing: 1px;
  }
  .brand-subtitle {
    font-size: 16px;
    opacity: 0.85;
    margin-bottom: 40px;
  }
  .brand-features {
    list-style: none;
    padding: 0;
    margin: 0;
    li {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 0;
      font-size: 15px;
      opacity: 0.95;

      i {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        font-size: 13px;
      }
    }
  }
  .brand-footer {
    position: absolute;
    bottom: 24px;
    left: 80px;
    right: 80px;
    z-index: 1;
    font-size: 13px;
    opacity: 0.7;
  }

  /* 右侧表单区 */
  .form-side {
    width: 480px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    overflow-y: auto;
  }
  .form-wrapper {
    width: 100%;
    max-width: 360px;
    padding: 40px 24px;
  }
  .form-header {
    margin-bottom: 28px;
  }
  .form-title {
    font-size: 26px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 6px;
  }
  .form-subtitle {
    font-size: 14px;
    color: #6b7280;
  }

  .login-form /deep/ .el-input__inner {
    height: 46px;
    border-radius: 10px;
    border: 2px solid #e5e7eb;
    font-size: 15px;
    transition: all 0.25s ease;
    background: #f9fafb;

    &:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      background: #fff;
    }
  }
  .login-form /deep/ .el-input__prefix {
    left: 10px;
    .el-input__icon {
      font-size: 18px;
      color: #6b7280;
      line-height: 46px;
    }
  }
  .login-form /deep/ .el-input--prefix .el-input__inner {
    padding-left: 38px;
  }
  .login-form /deep/ .el-form-item {
    margin-bottom: 18px;
  }

  .submit-btn {
    width: 100%;
    height: 46px;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.1em;
    background: linear-gradient(135deg, #1e3a8a, #3b82f6);
    border: none;
    box-shadow: 0 4px 14px rgba(30, 58, 138, 0.28);
    transition: all 0.25s ease;

    &:hover {
      background: linear-gradient(135deg, #1e40af, #2563eb);
      box-shadow: 0 6px 20px rgba(30, 58, 138, 0.38);
      transform: translateY(-1px);
    }
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
  }

  .back-home {
    margin-top: 28px;
    text-align: center;
    a {
      font-size: 13px;
      color: #9ca3af;
      cursor: pointer;
      text-decoration: none;
      transition: color 0.2s;
      &:hover { color: #1e3a8a; }
      i { margin-right: 4px; }
    }
  }

  /* 响应式 */
  @media screen and (max-width: 960px) {
    .brand-side { display: none; }
    .form-side { width: 100%; }
  }
  @media screen and (max-width: 480px) {
    .form-wrapper { padding: 32px 20px; }
    .form-title { font-size: 22px; }
  }
</style>
