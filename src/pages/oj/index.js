import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import App from './App.vue'

// 确保 CodeMirror 核心 + addons 在入口加载（补全等全局功能依赖 window.CodeMirror）
import CodeMirror from 'codemirror'
import 'codemirror/addon/hint/show-hint.js'
window.CodeMirror = CodeMirror

import router from './router'
import store from '@/store'
import i18n from '@/i18n'
import axios from 'axios'
import ViewUIPlus from 'view-ui-plus'
import * as ViewUIPlusNS from 'view-ui-plus'
import 'view-ui-plus/dist/styles/viewuiplus.css'
import * as ElementPlusNS from 'element-plus'
import { Message } from 'view-ui-plus'

import Panel from '@oj/components/Panel.vue'
import VerticalMenu from '@oj/components/verticalMenu/verticalMenu.vue'
import VerticalMenuItem from '@oj/components/verticalMenu/verticalMenu-item.vue'
import '@/styles/index.less'

import highlight from '@/plugins/highlight'
import katex from '@/plugins/katex'
import elementIcons from '@/plugins/elementIcons.js'
import filters from '@/utils/filters.js'

// 自研轻量封装（替代仅支持 Vue 2 的 vue-echarts / vue-codemirror-lite）
import EChart from '@/components/EChart.vue'
import Codemirror from '@/components/Codemirror.vue'

// @vue/compat 全局运行在 MODE 2（Vue 2 语义，供旧代码使用），
// 但 element-plus / view-ui-plus 是原生 Vue 3 库（内部使用函数式 $slots 等），
// 必须给它们的组件注入组件级 compatConfig MODE 3，否则渲染报
// "this.$slots.default is not a function" 导致整页白屏
const forceVue3Compat = (mod) => {
  Object.values(mod).forEach((c) => {
    if (c && (typeof c === 'object' || typeof c === 'function') && (c.name || c.install)) {
      c.compatConfig = Object.assign({}, c.compatConfig, { MODE: 3 })
    }
  })
}
forceVue3Compat(ViewUIPlusNS)
forceVue3Compat(ViewUIPlus)
forceVue3Compat(ElementPlusNS)

const app = createApp(App)

app.use(store)
app.use(i18n)
app.use(router)
app.use(ElementPlus, {locale: zhCn})
app.use(highlight)
app.use(katex)
app.use(elementIcons)
app.use(ViewUIPlus, {
  i18n: (key, value) => i18n.global.t(key, value)
})

// 全局组件
app.component('ECharts', EChart)
app.component('codemirror', Codemirror)
app.component(VerticalMenu.name, VerticalMenu)
app.component(VerticalMenuItem.name, VerticalMenuItem)
app.component(Panel.name, Panel)

// Vue 3 移除了模板 filter 管道语法，模板中统一改为 $filters.xxx(value) 调用
app.config.globalProperties.$filters = filters

// 全局 filter 注册（Vue 2 时代的 Vue.filter(key, fn) 等价物）：
// @vue/compat 下模板 filter 管道通过组件 options.filters 解析，
// 用 global mixin 注入即可让所有旧模板的 | localtime 等管道正常工作
app.mixin({ filters })

// 全局消息提示（兼容旧版 $Message/$error/$info/$success 用法）
Message.config({
  duration: 2
})
app.config.globalProperties.$Message = Message
app.config.globalProperties.$error = (s) => Message.error(s)
app.config.globalProperties.$info = (s) => Message.info(s)
app.config.globalProperties.$success = (s) => Message.success(s)
app.config.globalProperties.$http = axios


app.mount('#app')
