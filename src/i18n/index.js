import Vue from 'vue'
import VueI18n from 'vue-i18n'
// ivew UI
import ivenUS from 'iview/dist/locale/en-US'
import ivzhCN from 'iview/dist/locale/zh-CN'
import ivzhTW from 'iview/dist/locale/zh-TW'
// element UI
import elenUS from 'element-ui/lib/locale/lang/en'
import elzhCN from 'element-ui/lib/locale/lang/zh-CN'
import elzhTW from 'element-ui/lib/locale/lang/zh-TW'

Vue.use(VueI18n)

// 语言持久化 key（与后端 profile.language 值一致：en-US / zh-CN / zh-TW）
const LANGUAGE_KEY = 'oj_language'

export function getSavedLanguage () {
  try {
    return window.localStorage.getItem(LANGUAGE_KEY)
  } catch (e) {
    return null
  }
}

export function saveLanguage (locale) {
  try {
    window.localStorage.setItem(LANGUAGE_KEY, locale)
  } catch (e) {
    // localStorage 不可用时忽略
  }
}

const languages = [
  {value: 'en-US', label: 'English', iv: ivenUS, el: elenUS},
  {value: 'zh-CN', label: '简体中文', iv: ivzhCN, el: elzhCN},
  {value: 'zh-TW', label: '繁體中文', iv: ivzhTW, el: elzhTW}
]
const messages = {}

// combine admin and oj
for (let lang of languages) {
  let locale = lang.value
  let m = require(`./oj/${locale}`).m
  Object.assign(m, require(`./admin/${locale}`).m)
  let ui = Object.assign(lang.iv, lang.el)
  messages[locale] = Object.assign({m: m}, ui)
}
// load language packages
const i18n = new VueI18n({
  // 优先使用用户上次选择（含未登录时的本地选择），默认简体中文；
  // 未登录用户不再强制英文，避免与大量中文硬编码页面混杂显示
  locale: getSavedLanguage() || 'zh-CN',
  // 缺失 key 时回退简体中文（如 zh-TW 未覆盖的新增词条），避免界面出现裸 key
  fallbackLocale: 'zh-CN',
  messages: messages
})

// 题目标签的多语言显示名；词条缺失时回退为原始标签名（与旧 m.tag[tag] || tag 行为一致）
export function tagDisplayName (tag) {
  if (!tag) return tag
  const key = 'm.tag.' + tag
  return i18n.te(key) ? i18n.t(key) : tag
}

export default i18n
export {languages}
