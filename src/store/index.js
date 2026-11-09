import { createStore } from 'vuex'
import user from './modules/user'
import contest from './modules/contest'
import api from '@oj/api'
import types from './types'

const debug = process.env.NODE_ENV !== 'production'

// Vue 3 下移除了 vuex-router-sync（已停止维护），
// 改为各入口初始化后注入自己的 router 实例，供 changeDomTitle 读取当前路由 meta
let appRouter = null
export function setAppRouter (router) {
  appRouter = router
}
// 旧代码（如 contest 模块 action）依赖 vuex-router-sync 注入的 rootState.route，
// 迁移后改为从这里读取当前路由（两个入口 main 都已调用 setAppRouter）
export function getActiveRoute () {
  return appRouter ? appRouter.currentRoute.value : null
}

const rootState = {
  website: {},
  modalStatus: {
    mode: 'login', // or 'register',
    visible: false
  },
  sidebarCollapsed: true
}

const rootGetters = {
  'website' (state) {
    return state.website
  },
  'modalStatus' (state) {
    return state.modalStatus
  },
  'sidebarCollapsed' (state) {
    return state.sidebarCollapsed
  }
}

const rootMutations = {
  [types.UPDATE_WEBSITE_CONF] (state, payload) {
    state.website = payload.websiteConfig
  },
  [types.CHANGE_MODAL_STATUS] (state, {mode, visible}) {
    if (mode !== undefined) {
      state.modalStatus.mode = mode
    }
    if (visible !== undefined) {
      state.modalStatus.visible = visible
    }
  },
  [types.TOGGLE_SIDEBAR] (state, payload) {
    state.sidebarCollapsed = payload.collapsed
  }
}

const rootActions = {
  getWebsiteConfig ({commit}) {
    api.getWebsiteConf().then(res => {
      commit(types.UPDATE_WEBSITE_CONF, {
        websiteConfig: res.data.data
      })
    })
  },
  changeModalStatus ({commit}, payload) {
    commit(types.CHANGE_MODAL_STATUS, payload)
  },
  toggleSidebar ({commit}, payload) {
    commit(types.TOGGLE_SIDEBAR, payload)
  },
  changeDomTitle ({commit, state}, payload) {
    if (payload && payload.title) {
      window.document.title = state.website.website_name_shortcut + ' | ' + payload.title
    } else {
      const routeTitle = appRouter ? appRouter.currentRoute.value.meta.title : ''
      window.document.title = state.website.website_name_shortcut + ' | ' + routeTitle
    }
  }
}

const store = createStore({
  modules: {
    user,
    contest
  },
  state: rootState,
  getters: rootGetters,
  mutations: rootMutations,
  actions: rootActions,
  strict: debug
})

export default store

export { types }
