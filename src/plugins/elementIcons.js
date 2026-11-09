import 'font-awesome/css/font-awesome.min.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { ElIcon } from 'element-plus'
import { defineComponent, h } from 'vue'

// Element Plus 移除了 el-icon-* CSS 类图标，改为 SVG 组件。
// 此插件把全部图标以多种命名注册为全局组件：
//   1. el-icon-xxx（kebab-case，兼容旧代码的 icon="el-icon-xxx" 属性用法
//      与 <i class="el-icon-xxx"> 改写后的 <el-icon-xxx/> 用法）
//   2. 官方 PascalCase 原名（供 <el-icon><Search/></el-icon> 用法）
//   3. el-icon-fa-xxx（旧 element-ui 的 font-awesome 系列图标，改为 fa 字体渲染）
function toKebab (name) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

// 旧代码中使用的 el-icon-fa-* 图标（对应 font-awesome 4.7 类名）
const faIcons = ['arrow-down', 'ban', 'bar-chart', 'bars', 'book', 'bookmark', 'bullhorn',
  'code', 'cog', 'comment', 'download', 'exchange', 'file-text', 'font', 'globe',
  'paper-plane', 'plus', 'question-circle', 'random', 'server', 'sitemap', 'stethoscope',
  'trash', 'trophy', 'undo', 'unlock', 'upload', 'user', 'users']

function faIconComponent (faName) {
  return defineComponent({
    name: 'ElIconFa' + faName.replace(/(^|-)([a-z])/g, (m, p, c) => c.toUpperCase()),
    render () {
      return h('i', {class: 'fa fa-' + faName})
    }
  })
}

// @element-plus/icons-vue 的图标只渲染 <svg viewBox="0 0 1024 1024">（不带 width/height），
// 裸用（不在 <el-icon> 内）时会回落到 SVG 默认尺寸 300x150，导致"图标巨大"。
// 统一用 element-plus 的 <el-icon>（渲染 <i class="el-icon">，CSS 把宽高约束为 1em）
// 包装后，图标随上下文 font-size 缩放，旧 CSS 里针对 i 的选择器也能重新生效。
function wrappedIcon (component) {
  return defineComponent({
    name: 'Wrapped' + (component.name || 'Icon'),
    render () {
      // class/style/事件等 attrs 自动透传到 ElIcon 的根元素 <i>
      return h(ElIcon, null, { default: () => h(component) })
    }
  })
}

export default {
  install (app) {
    for (const [name, component] of Object.entries(ElementPlusIconsVue)) {
      // 原名直接注册（外层一般已有 <el-icon> 包裹，无需再包一层）
      app.component(name, component)
      app.component('el-icon-' + toKebab(name), wrappedIcon(component))
    }
    for (const fa of faIcons) {
      app.component('el-icon-fa-' + fa, faIconComponent(fa))
    }
  }
}
