<template>
<div class="register-wrap">
    <Form ref="formRegister" :model="formRegister" :rules="ruleRegister">
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
    </Form>
    <div class="agreement-row">
      <Checkbox v-model="agreed" size="small"></Checkbox>
      <span>我已阅读并同意 <a @click="agreementVisible = true">《用户协议与隐私政策》</a></span>
    </div>
    <div class="register-footer">
      <Button
        type="primary"
        @click="handleRegister"
        :disabled="!agreed"
        class="register-btn" long
        :loading="btnRegisterLoading">
        {{$t('m.UserRegister')}}
      </Button>
      <Button
        type="default"
        @click="switchMode('login')"
        class="switch-btn" long>
        {{$t('m.Already_Registed')}}
      </Button>
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
    mounted () {
      this.getCaptchaSrc()
    },
    data () {
      const CheckUsernameNotExist = (rule, value, callback) => {
        api.checkUsernameOrEmail(value, undefined).then(res => {
          if (res.data.data.username === true) {
            callback(new Error(this.$i18n.t('m.The_username_already_exists')))
          } else {
            callback()
          }
        }, _ => callback())
      }
      const CheckEmailNotExist = (rule, value, callback) => {
        api.checkUsernameOrEmail(undefined, value).then(res => {
          if (res.data.data.email === true) {
            callback(new Error(this.$i18n.t('m.The_email_already_exists')))
          } else {
            callback()
          }
        }, _ => callback())
      }
      const CheckPassword = (rule, value, callback) => {
        if (this.formRegister.password !== '') {
          // 对第二个密码框再次验证
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
        btnRegisterLoading: false,
        agreed: false,
        agreementVisible: false,
        formRegister: {
          username: '',
          password: '',
          passwordAgain: '',
          email: '',
          captcha: ''
        },
        ruleRegister: {
          username: [
            {required: true, trigger: 'blur'},
            {validator: CheckUsernameNotExist, trigger: 'blur'}
          ],
          email: [
            {required: true, type: 'email', trigger: 'blur'},
            {validator: CheckEmailNotExist, trigger: 'blur'}
          ],
          password: [
            {required: true, trigger: 'blur', min: 6, max: 20},
            {validator: CheckPassword, trigger: 'blur'}
          ],
          passwordAgain: [
            {required: true, validator: CheckAgainPassword, trigger: 'change'}
          ],
          captcha: [
            {required: true, trigger: 'blur', min: 1, max: 10}
          ]
        }
      }
    },
    methods: {
      ...mapActions(['changeModalStatus', 'getProfile']),
      switchMode (mode) {
        this.changeModalStatus({
          mode,
          visible: true
        })
      },
      handleRegister () {
        this.validateForm('formRegister').then(valid => {
          let formData = Object.assign({}, this.formRegister)
          delete formData['passwordAgain']
          this.btnRegisterLoading = true
          api.register(formData).then(res => {
            this.$success(this.$i18n.t('m.Thanks_for_registering'))
            this.switchMode('login')
            this.btnRegisterLoading = false
          }, _ => {
            this.getCaptchaSrc()
            this.formRegister.captcha = ''
            this.btnRegisterLoading = false
          })
        })
      }
    },
    computed: {
      ...mapGetters(['website', 'modalStatus'])

    }
  }
</script>

<style scoped lang="less">
.register-wrap {
  padding: 4px 0 0;

  /deep/ .ivu-input-large {
    height: 44px;
    border-radius: 10px;
    border: 2px solid #e2e8f0;
    font-size: 15px;
    transition: all 0.3s ease;
    background: #f8fafc;

    &:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      background: #fff;
    }
  }

  /deep/ .ivu-input-group-prepend {
    border-radius: 10px 0 0 10px;
    border: 2px solid #e2e8f0;
    border-right: none;
    background: #f1f5f9;

    .ivu-icon {
      color: #64748b;
    }
  }

  /deep/ .ivu-form-item {
    margin-bottom: 18px;
  }

  /deep/ .ivu-form-item-error .ivu-input {
    border-color: #ed4014;
  }

  .oj-captcha {
    display: flex;
    gap: 12px;
    height: auto;
    align-items: center;

    .oj-captcha-code {
      flex: 1;
    }

    .oj-captcha-img {
      flex-shrink: 0;

      img {
        height: 44px;
        border-radius: 10px;
        cursor: pointer;
        border: 2px solid #e2e8f0;
        transition: all 0.3s ease;

        &:hover {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      }
    }
  }
}

.agreement-row {
  display: flex; align-items: center; gap: 6px; margin: 0 0 8px; font-size: 13px; color: #64748b;
  a { color: #1e3a8a; cursor: pointer; text-decoration: underline; }
}

.register-footer {
  margin-top: 8px;

  .register-btn {
    height: 44px;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.05em;
    background: linear-gradient(135deg, #1e3a8a, #3b82f6);
    border: none;
    box-shadow: 0 4px 14px rgba(30, 58, 138, 0.3);
    transition: all 0.3s ease;

    &:hover {
      background: linear-gradient(135deg, #1e40af, #2563eb);
      box-shadow: 0 6px 20px rgba(30, 58, 138, 0.4);
      transform: translateY(-1px);
    }
  }

  .switch-btn {
    height: 42px;
    border-radius: 10px;
    font-size: 15px;
    margin-top: 10px;
    border: 2px solid #e2e8f0;
    color: #64748b;
    transition: all 0.3s ease;

    &:hover {
      border-color: #3b82f6;
      color: #1e3a8a;
      background: rgba(30, 58, 138, 0.04);
    }
  }
}
</style>
