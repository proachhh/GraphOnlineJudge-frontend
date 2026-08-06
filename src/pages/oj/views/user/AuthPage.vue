<template>
  <div class="auth-page">
    <!-- 左侧品牌展示区 -->
    <div class="brand-side">
      <div class="brand-bg"></div>
      <div class="brand-content">
        <img :src="logoSrc" alt="logo" class="brand-logo" />
        <h1 class="brand-title">{{ website.website_name_shortcut || 'OJ' }}</h1>
        <p class="brand-subtitle">{{ website.website_name || '在线评测系统' }}</p>
        <ul class="brand-features">
          <li><i class="el-icon-check"></i> 智能推荐学习路径</li>
          <li><i class="el-icon-check"></i> AI 题目批改与分析</li>
          <li><i class="el-icon-check"></i> 个性化学习报告</li>
          <li><i class="el-icon-check"></i> 知识图谱可视化</li>
        </ul>
      </div>
      <div class="brand-footer">
        <span>© {{ year }} {{ website.website_name_shortcut || 'OJ' }}</span>
      </div>
    </div>

    <!-- 右侧表单区 -->
    <div class="form-side">
      <div class="form-wrapper">
        <div class="form-header">
          <h2 class="form-title">{{ mode === 'register' ? '创建账号' : '欢迎回来' }}</h2>
          <p class="form-subtitle">
            {{ mode === 'register' ? '注册后即可开始你的学习之旅' : '登录以继续你的学习之旅' }}
          </p>
        </div>

        <!-- 登录表单 -->
        <Form v-if="mode === 'login'" ref="formLogin" :model="formLogin" :rules="ruleLogin" class="auth-form">
          <FormItem prop="username">
            <Input type="text" v-model="formLogin.username" :placeholder="$t('m.LoginUsername')" size="large" @on-enter="handleLogin">
              <Icon type="ios-person-outline" slot="prepend"></Icon>
            </Input>
          </FormItem>
          <FormItem prop="password">
            <Input type="password" v-model="formLogin.password" :placeholder="$t('m.LoginPassword')" size="large" @on-enter="handleLogin">
              <Icon type="ios-locked-outline" slot="prepend"></Icon>
            </Input>
          </FormItem>
          <FormItem prop="tfa_code" v-if="tfaRequired">
            <Input v-model="formLogin.tfa_code" :placeholder="$t('m.TFA_Code')" size="large">
              <Icon type="ios-lightbulb-outline" slot="prepend"></Icon>
            </Input>
          </FormItem>
          <Button type="primary" @click="handleLogin" class="submit-btn" long :loading="btnLoginLoading">
            {{$t('m.UserLogin')}}
          </Button>
          <div class="link-row">
            <a v-if="website.allow_register" @click="goRegister">{{$t('m.No_Account')}}</a>
            <a @click="goResetPassword">{{$t('m.Forget_Password')}}</a>
          </div>
        </Form>

        <!-- 注册表单 -->
        <Form v-else ref="formRegister" :model="formRegister" :rules="ruleRegister" class="auth-form">
          <FormItem prop="username">
            <Input type="text" v-model="formRegister.username" :placeholder="$t('m.RegisterUsername')" size="large" @on-enter="handleRegister">
              <Icon type="ios-person-outline" slot="prepend"></Icon>
            </Input>
          </FormItem>
          <FormItem prop="email">
            <Input v-model="formRegister.email" :placeholder="$t('m.Email_Address')" size="large" @on-enter="handleRegister">
              <Icon type="ios-email-outline" slot="prepend"></Icon>
            </Input>
          </FormItem>
          <FormItem prop="password">
            <Input type="password" v-model="formRegister.password" :placeholder="$t('m.RegisterPassword')" size="large" @on-enter="handleRegister">
              <Icon type="ios-locked-outline" slot="prepend"></Icon>
            </Input>
          </FormItem>
          <FormItem prop="passwordAgain">
            <Input type="password" v-model="formRegister.passwordAgain" :placeholder="$t('m.Password_Again')" size="large" @on-enter="handleRegister">
              <Icon type="ios-locked-outline" slot="prepend"></Icon>
            </Input>
          </FormItem>
          <FormItem prop="captcha" style="margin-bottom:10px">
            <div class="oj-captcha">
              <div class="oj-captcha-code">
                <Input v-model="formRegister.captcha" :placeholder="$t('m.Captcha')" size="large" @on-enter="handleRegister">
                  <Icon type="ios-lightbulb-outline" slot="prepend"></Icon>
                </Input>
              </div>
              <div class="oj-captcha-img">
                <Tooltip content="Click to refresh" placement="top">
                  <img :src="captchaSrc" @click="getCaptchaSrc"/>
                </Tooltip>
              </div>
            </div>
          </FormItem>
          <div class="agreement-row">
            <Checkbox v-model="agreed" size="small"></Checkbox>
            <span>我已阅读并同意 <a @click="agreementVisible = true">《用户协议与隐私政策》</a></span>
          </div>
          <Button type="primary" @click="handleRegister" :disabled="!agreed" class="submit-btn" long :loading="btnRegisterLoading">
            {{$t('m.UserRegister')}}
          </Button>
          <div class="link-row">
            <a @click="goLogin">{{$t('m.Already_Registed')}}</a>
          </div>
        </Form>

        <!-- 返回首页 -->
        <div class="back-home">
          <a @click="$router.push('/')"><i class="el-icon-back"></i> 返回首页</a>
        </div>
      </div>
    </div>

    <Modal v-model="agreementVisible" title="用户协议与隐私政策" :width="700" footer-hide>
      <AgreementContent />
    </Modal>
  </div>
</template>

<script>
  import { mapGetters, mapActions } from 'vuex'
  import api from '@oj/api'
  import { FormMixin } from '@oj/components/mixins'
  import AgreementContent from '@oj/components/AgreementContent'

  export default {
    mixins: [FormMixin],
    components: { AgreementContent },
    data () {
      const CheckRequiredTFA = (rule, value, callback) => {
        if (value !== '') {
          api.tfaRequiredCheck(value).then(res => {
            this.tfaRequired = res.data.data.result
          })
        }
        callback()
      }
      const CheckUsernameNotExist = (rule, value, callback) => {
        api.checkUsernameOrEmail(value, undefined).then(res => {
          if (res.data.data.username === true) {
            callback(new Error(this.$i18n.t('m.The_username_already_exists')))
          } else { callback() }
        }, _ => callback())
      }
      const CheckEmailNotExist = (rule, value, callback) => {
        api.checkUsernameOrEmail(undefined, value).then(res => {
          if (res.data.data.email === true) {
            callback(new Error(this.$i18n.t('m.The_email_already_exists')))
          } else { callback() }
        }, _ => callback())
      }
      const CheckPassword = (rule, value, callback) => {
        if (this.formRegister.password !== '') {
          this.$refs.formRegister.validateField('passwordAgain')
        }
        callback()
      }
      const CheckAgainPassword = (rule, value, callback) => {
        if (value !== this.formRegister.password) {
          callback(new Error(this.$i18n.t('m.password_does_not_match')))
        }
        callback()
      }
      return {
        tfaRequired: false,
        btnLoginLoading: false,
        btnRegisterLoading: false,
        agreed: false,
        agreementVisible: false,
        captchaSrc: '',
        formLogin: { username: '', password: '', tfa_code: '' },
        formRegister: { username: '', password: '', passwordAgain: '', email: '', captcha: '' },
        ruleLogin: {
          username: [
            { required: true, trigger: 'blur' },
            { validator: CheckRequiredTFA, trigger: 'blur' }
          ],
          password: [{ required: true, trigger: 'change', min: 6, max: 20 }]
        },
        ruleRegister: {
          username: [
            { required: true, trigger: 'blur' },
            { validator: CheckUsernameNotExist, trigger: 'blur' }
          ],
          email: [
            { required: true, type: 'email', trigger: 'blur' },
            { validator: CheckEmailNotExist, trigger: 'blur' }
          ],
          password: [
            { required: true, trigger: 'blur', min: 6, max: 20 },
            { validator: CheckPassword, trigger: 'blur' }
          ],
          passwordAgain: [{ required: true, validator: CheckAgainPassword, trigger: 'change' }],
          captcha: [{ required: true, trigger: 'blur', min: 1, max: 10 }]
        }
      }
    },
    computed: {
      ...mapGetters(['website', 'modalStatus']),
      mode () {
        return this.$route.name === 'register' ? 'register' : 'login'
      },
      logoSrc () {
        return require('@/assets/logo3.png')
      },
      year () {
        return new Date().getFullYear()
      }
    },
    mounted () {
      if (this.mode === 'register') this.getCaptchaSrc()
    },
    methods: {
      ...mapActions(['changeModalStatus', 'getProfile']),
      getCaptchaSrc () {
        api.getCaptcha().then(res => {
          this.captchaSrc = res.data.data
        })
      },
      goLogin () { this.$router.push('/login') },
      goRegister () { this.$router.push('/register') },
      goResetPassword () { this.$router.push({ name: 'apply-reset-password' }) },
      handleLogin () {
        this.validateForm('formLogin').then(valid => {
          this.btnLoginLoading = true
          let formData = Object.assign({}, this.formLogin)
          if (!this.tfaRequired) delete formData['tfa_code']
          api.login(formData).then(res => {
            this.btnLoginLoading = false
            this.changeModalStatus({ visible: false })
            this.getProfile()
            this.$router.push('/')
            this.$success(this.$i18n.t('m.Welcome_back'))
          }, _ => { this.btnLoginLoading = false })
        })
      },
      handleRegister () {
        this.validateForm('formRegister').then(valid => {
          let formData = Object.assign({}, this.formRegister)
          delete formData['passwordAgain']
          this.btnRegisterLoading = true
          api.register(formData).then(res => {
            this.$success(this.$i18n.t('m.Thanks_for_registering'))
            this.btnRegisterLoading = false
            this.$router.push('/login')
          }, _ => {
            this.getCaptchaSrc()
            this.formRegister.captcha = ''
            this.btnRegisterLoading = false
          })
        })
      }
    }
  }
</script>

<style scoped lang="less">
  .auth-page {
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
    background: url('/static/pictures/image.jpg') center center / cover no-repeat;
  }
  .brand-bg::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(30, 58, 138, 0.55) 0%, rgba(30, 58, 138, 0.35) 50%, rgba(15, 23, 42, 0.55) 100%);
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
  .form-header { margin-bottom: 28px; }
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

  .auth-form /deep/ .ivu-input-large {
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
  .auth-form /deep/ .ivu-input-group-prepend {
    border-radius: 10px 0 0 10px;
    border: 2px solid #e5e7eb;
    border-right: none;
    background: #f3f4f6;
    .ivu-icon { color: #6b7280; }
  }
  .auth-form /deep/ .ivu-form-item { margin-bottom: 18px; }
  .auth-form /deep/ .ivu-form-item-error .ivu-input { border-color: #ed4014; }

  .oj-captcha {
    display: flex;
    gap: 10px;
    align-items: center;
    .oj-captcha-code { flex: 1; }
    .oj-captcha-img img {
      height: 46px;
      border-radius: 10px;
      cursor: pointer;
      border: 2px solid #e5e7eb;
      transition: all 0.25s ease;
      &:hover {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
    }
  }

  .agreement-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 16px;
    font-size: 13px;
    color: #6b7280;
    a { color: #1e3a8a; cursor: pointer; text-decoration: underline; }
  }

  .submit-btn {
    height: 46px;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.05em;
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

  .link-row {
    display: flex;
    justify-content: space-between;
    margin-top: 16px;
    a {
      font-size: 13px;
      color: #6b7280;
      cursor: pointer;
      transition: color 0.2s;
      &:hover { color: #1e3a8a; }
    }
  }

  .back-home {
    margin-top: 28px;
    text-align: center;
    a {
      font-size: 13px;
      color: #9ca3af;
      cursor: pointer;
      transition: color 0.2s;
      &:hover { color: #1e3a8a; }
      i { margin-right: 4px; }
    }
  }

  /* 响应式：窄屏隐藏左侧品牌区 */
  @media screen and (max-width: 960px) {
    .brand-side { display: none; }
    .form-side { width: 100%; }
  }

  @media screen and (max-width: 480px) {
    .form-wrapper { padding: 32px 20px; }
    .form-title { font-size: 22px; }
  }
</style>
