<template>
  <div class="login-wrap">
    <Form ref="formLogin" :model="formLogin" :rules="ruleLogin">
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
    </Form>
    <div class="login-footer">
      <Button
        type="primary"
        @click="handleLogin"
        class="login-btn" long
        :loading="btnLoginLoading">
        {{$t('m.UserLogin')}}
      </Button>
      <div class="link-row">
        <a v-if="website.allow_register" @click.stop="handleBtnClick('register')">{{$t('m.No_Account')}}</a>
        <a @click.stop="goResetPassword">{{$t('m.Forget_Password')}}</a>
      </div>
    </div>
  </div>
</template>

<script>
  import { mapGetters, mapActions } from 'vuex'
  import api from '@oj/api'
  import { FormMixin } from '@oj/components/mixins'

  export default {
    mixins: [FormMixin],
    data () {
      const CheckRequiredTFA = (rule, value, callback) => {
        if (value !== '') {
          api.tfaRequiredCheck(value).then(res => {
            this.tfaRequired = res.data.data.result
          })
        }
        callback()
      }

      return {
        tfaRequired: false,
        btnLoginLoading: false,
        formLogin: {
          username: '',
          password: '',
          tfa_code: ''
        },
        ruleLogin: {
          username: [
            {required: true, trigger: 'blur'},
            {validator: CheckRequiredTFA, trigger: 'blur'}
          ],
          password: [
            {required: true, trigger: 'change', min: 6, max: 20}
          ]
        }
      }
    },
    methods: {
      ...mapActions(['changeModalStatus', 'getProfile']),
      handleBtnClick (mode) {
        this.changeModalStatus({
          mode,
          visible: true
        })
      },
      handleLogin () {
        this.validateForm('formLogin').then(valid => {
          this.btnLoginLoading = true
          let formData = Object.assign({}, this.formLogin)
          if (!this.tfaRequired) {
            delete formData['tfa_code']
          }
          api.login(formData).then(res => {
            this.btnLoginLoading = false
            this.changeModalStatus({visible: false})
            this.getProfile()
            this.$success(this.$i18n.t('m.Welcome_back'))
          }, _ => {
            this.btnLoginLoading = false
          })
        })
      },
      goResetPassword () {
        this.changeModalStatus({visible: false})
        this.$router.push({name: 'apply-reset-password'})
      }
    },
    computed: {
      ...mapGetters(['website', 'modalStatus']),
      visible: {
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

<style scoped lang="less">
.login-wrap {
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
}

.login-footer {
  margin-top: 8px;

  .login-btn {
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

  .link-row {
    display: flex;
    justify-content: space-between;
    margin-top: 14px;

    a {
      font-size: 13px;
      color: #64748b;
      cursor: pointer;
      transition: color 0.2s;

      &:hover {
        color: #1e3a8a;
      }
    }
  }
}
</style>
