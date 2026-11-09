import { createRouter, createWebHistory } from 'vue-router'
import { LoadingBar, Message } from 'view-ui-plus'
import routes from './routes'
import storage from '@/utils/storage'
import {STORAGE_KEY} from '@/utils/constants'
import {types, default as store, setAppRouter} from '../../../store'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior (to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return {left: 0, top: 0}
    }
  },
  routes
})

// 全局身份确认
router.beforeEach((to, from, next) => {
  LoadingBar.start()
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!storage.get(STORAGE_KEY.AUTHED)) {
      Message.error('Please login first')
      store.commit(types.CHANGE_MODAL_STATUS, {mode: 'login', visible: true})
      next({
        name: 'home'
      })
    } else {
      next()
    }
  } else {
    next()
  }
})

router.afterEach((to, from, next) => {
  LoadingBar.finish()
})

// 注入 router 实例供 store.changeDomTitle 使用（替代已废弃的 vuex-router-sync）
setAppRouter(router)

export default router
