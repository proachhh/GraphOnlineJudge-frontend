import { createApp } from 'vue'
import App from './App.vue'
import store from '@/store'
import i18n from '@/i18n'
import router from './router'
import axios from 'axios'
import ElementPlus from 'element-plus'
import * as ElementPlusNS from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { ElMessage } from 'element-plus'
import 'element-plus/dist/index.css'

import filters from '@/utils/filters'
import katex from '@/plugins/katex'
import elementIcons from '@/plugins/elementIcons.js'

import Panel from './components/Panel.vue'
import IconBtn from './components/btn/IconBtn.vue'
import Save from './components/btn/Save.vue'
import Cancel from './components/btn/Cancel.vue'
import './style.less'

// @vue/compat 全局 MODE 2 下，原生 Vue 3 的 element-plus 需要组件级 MODE 3
const forceVue3Compat = (mod) => {
  Object.values(mod).forEach((c) => {
    if (c && (typeof c === 'object' || typeof c === 'function') && (c.name || c.install)) {
      c.compatConfig = Object.assign({}, c.compatConfig, { MODE: 3 })
    }
  })
}
forceVue3Compat(ElementPlusNS)

const app = createApp(App)

app.use(store)
app.use(i18n)
app.use(router)
app.use(ElementPlus, {locale: zhCn})
app.use(katex)
app.use(elementIcons)

app.component(IconBtn.name, IconBtn)
app.component(Panel.name, Panel)
app.component(Save.name, Save)
app.component(Cancel.name, Cancel)

// Vue 3 移除了模板 filter 管道语法，模板中统一改为 $filters.xxx(value) 调用
app.config.globalProperties.$filters = filters

// 全局 filter 注册（Vue 2 时代的 Vue.filter(key, fn) 等价物）：
// @vue/compat 下模板 filter 管道通过组件 options.filters 解析，
// 用 global mixin 注入即可让所有旧模板的 | localtime 等管道正常工作
app.mixin({ filters })

// 全局消息提示（兼容旧版 $message/$error/$warning/$success 用法）
app.config.globalProperties.$message = ElMessage
app.config.globalProperties.$error = (msg) => {
  ElMessage({'message': msg, 'type': 'error'})
}
app.config.globalProperties.$warning = (msg) => {
  ElMessage({'message': msg, 'type': 'warning'})
}
app.config.globalProperties.$success = (msg) => {
  if (!msg) {
    ElMessage({'message': 'Succeeded', 'type': 'success'})
  } else {
    ElMessage({'message': msg, 'type': 'success'})
  }
}
app.config.globalProperties.$http = axios


app.mount('#app')
