import types from '../types'
import api from '@oj/api'
import storage from '@/utils/storage'
import i18n, {saveLanguage} from '@/i18n'
import { STORAGE_KEY, USER_TYPE, PROBLEM_PERMISSION } from '@/utils/constants'

const state = {
  profile: {}
}

const getters = {
  user: state => state.profile.user || {},
  profile: state => state.profile,
  isAuthenticated: (state, getters) => {
    return !!getters.user.id
  },
  isTeacher: (state, getters) => {
    return getters.user.admin_type === USER_TYPE.TEACHER
  },
  isAdminRole: (state, getters) => {
    return getters.user.admin_type === USER_TYPE.ADMIN ||
      getters.user.admin_type === USER_TYPE.SUPER_ADMIN
  },
  isSuperAdmin: (state, getters) => {
    return getters.user.admin_type === USER_TYPE.SUPER_ADMIN
  },
  hasProblemPermission: (state, getters) => {
    return getters.user.problem_permission !== PROBLEM_PERMISSION.NONE
  }
}

const mutations = {
  [types.CHANGE_PROFILE] (state, {profile}) {
    state.profile = profile
    if (profile.language) {
      i18n.locale = profile.language
      // 同步本地记忆，退出登录后未登录状态也能保持所选语言
      saveLanguage(profile.language)
    }
    storage.set(STORAGE_KEY.AUTHED, !!profile.user)
  }
}

const actions = {
  getProfile ({commit}) {
    api.getUserInfo().then(res => {
      commit(types.CHANGE_PROFILE, {
        profile: res.data.data || {}
      })
    })
  },
  clearProfile ({commit}) {
    commit(types.CHANGE_PROFILE, {
      profile: {}
    })
    storage.clear()
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
