import Vue from 'vue'
import store from '@/store'
import axios from 'axios'

Vue.prototype.$http = axios
axios.defaults.baseURL = '/api'
axios.defaults.xsrfHeaderName = 'X-CSRFToken'
axios.defaults.xsrfCookieName = 'csrftoken'

export default {
  getWebsiteConf (params) {
    return ajax('website', 'get', {
      params
    })
  },
  getAnnouncementList (offset, limit) {
    let params = {
      offset: offset,
      limit: limit
    }
    return ajax('announcement', 'get', {
      params
    })
  },
  login (data) {
    return ajax('login', 'post', {
      data
    })
  },
  checkUsernameOrEmail (username, email) {
    return ajax('check_username_or_email', 'post', {
      data: {
        username,
        email
      }
    })
  },
  // 注册
  register (data) {
    return ajax('register', 'post', {
      data
    })
  },
  logout () {
    return ajax('logout', 'get')
  },
  getCaptcha () {
    return ajax('captcha', 'get')
  },
  getUserInfo (username = undefined) {
    return ajax('profile', 'get', {
      params: {
        username
      }
    })
  },
  updateProfile (profile) {
    return ajax('profile', 'put', {
      data: profile
    })
  },
  freshDisplayID (userID) {
    return ajax('profile/fresh_display_id', 'get', {
      params: {
        user_id: userID
      }
    })
  },
  twoFactorAuth (method, data) {
    return ajax('two_factor_auth', method, {
      data
    })
  },
  tfaRequiredCheck (username) {
    return ajax('tfa_required', 'post', {
      data: {
        username
      }
    })
  },
  getSessions () {
    return ajax('sessions', 'get')
  },
  deleteSession (sessionKey) {
    return ajax('sessions', 'delete', {
      params: {
        session_key: sessionKey
      }
    })
  },
  applyResetPassword (data) {
    return ajax('apply_reset_password', 'post', {
      data
    })
  },
  resetPassword (data) {
    return ajax('reset_password', 'post', {
      data
    })
  },
  changePassword (data) {
    return ajax('change_password', 'post', {
      data
    })
  },
  changeEmail (data) {
    return ajax('change_email', 'post', {
      data
    })
  },
  getLanguages () {
    return ajax('languages', 'get')
  },
  getProblemTagList () {
    return ajax('problem/tags', 'get')
  },
  getProblemList (offset, limit, searchParams) {
    let params = {
      paging: true,
      offset,
      limit
    }
    Object.keys(searchParams).forEach((element) => {
      if (searchParams[element]) {
        params[element] = searchParams[element]
      }
    })
    return ajax('problem', 'get', {
      params: params
    })
  },
  pickone () {
    return ajax('pickone', 'get')
  },
  getProblem (problemID) {
    return ajax('problem', 'get', {
      params: {
        problem_id: problemID
      }
    })
  },
  getContestList (offset, limit, searchParams) {
    let params = {
      offset,
      limit
    }
    if (searchParams !== undefined) {
      Object.keys(searchParams).forEach((element) => {
        if (searchParams[element]) {
          params[element] = searchParams[element]
        }
      })
    }
    return ajax('contests', 'get', {
      params
    })
  },
  getContest (id) {
    return ajax('contest', 'get', {
      params: {
        id
      }
    })
  },
  getContestAccess (contestID) {
    return ajax('contest/access', 'get', {
      params: {
        contest_id: contestID
      }
    })
  },
  checkContestPassword (contestID, password) {
    return ajax('contest/password', 'post', {
      data: {
        contest_id: contestID,
        password
      }
    })
  },
  getContestAnnouncementList (contestId) {
    return ajax('contest/announcement', 'get', {
      params: {
        contest_id: contestId
      }
    })
  },
  getContestProblemList (contestId) {
    return ajax('contest/problem', 'get', {
      params: {
        contest_id: contestId
      }
    })
  },
  getContestProblem (problemID, contestID) {
    return ajax('contest/problem', 'get', {
      params: {
        contest_id: contestID,
        problem_id: problemID
      }
    })
  },
  submitCode (data) {
    return ajax('submission', 'post', {
      data
    })
  },
  selfTest (data) {
    return ajax('self_test', 'post', {
      data
    })
  },
  getSubmissionList (offset, limit, params) {
    params.limit = limit
    params.offset = offset
    return ajax('submissions', 'get', {
      params
    })
  },
  getContestSubmissionList (offset, limit, params) {
    params.limit = limit
    params.offset = offset
    return ajax('contest_submissions', 'get', {
      params
    })
  },
  getSubmission (id) {
    return ajax('submission', 'get', {
      params: {
        id
      }
    })
  },
  submissionExists (problemID) {
    return ajax('submission_exists', 'get', {
      params: {
        problem_id: problemID
      }
    })
  },
  submissionRejudge (id) {
    return ajax('admin/submission/rejudge', 'get', {
      params: {
        id
      }
    })
  },
  updateSubmission (data) {
    return ajax('submission', 'put', {
      data
    })
  },
  getUserRank (offset, limit, rule = 'acm') {
    let params = {
      offset,
      limit,
      rule
    }
    return ajax('user_rank', 'get', {
      params
    })
  },
  getContestRank (params) {
    return ajax('contest_rank', 'get', {
      params
    })
  },
  getACMACInfo (params) {
    return ajax('admin/contest/acm_helper', 'get', {
      params
    })
  },
  updateACInfoCheckedStatus (data) {
    return ajax('admin/contest/acm_helper', 'put', {
      data
    })
  },
  getLearningPath (params) {
    return ajax('agent/learning-path/', 'get', { params })
  },
  getLearningStats () {
    return ajax('learning-stats', 'get')
  },
  getKnowledgeGraph () {
    return ajax('knowledge-graph', 'get')
  },
  getKnowledgeUniverse () {
    return ajax('knowledge-universe', 'get')
  },
  getTopicProblems (params) {
    return ajax('topic-problems', 'get', { params })
  },
  getTopicNeighbors (params) {
    return ajax('topic-neighbors', 'get', { params })
  },
  // Exercise Set (student)
  getExerciseSets (params) {
    return ajax('exercise/sets/', 'get', { params })
  },
  getExerciseTopics () {
    return ajax('exercise/topics/', 'get')
  },
  getExerciseSetDetail (id) {
    return ajax(`exercise/sets/${id}/`, 'get')
  },
  startExercise (id) {
    return ajax(`exercise/sets/${id}/start/`, 'post')
  },
  submitExercise (id, data) {
    return ajax(`exercise/sets/${id}/submit/`, 'post', { data })
  },
  getExerciseReport (subId) {
    return ajax(`exercise/submissions/${subId}/report/`, 'get')
  },
  getExerciseRanking (setId) {
    return ajax(`exercise/sets/${setId}/ranking/`, 'get')
  },
  // Boss Exam (student)
  getBossExams (params) {
    return ajax('exercise/boss/', 'get', { params })
  },
  getBossExamDetail (id) {
    return ajax(`exercise/boss/${id}/`, 'get')
  },
  startBossExam (id) {
    return ajax(`exercise/boss/${id}/start/`, 'post')
  },
  submitBossExam (id, data) {
    return ajax(`exercise/boss/${id}/submit/`, 'post', { data })
  },
  getBossExamReport (subId) {
    return ajax(`exercise/boss/submissions/${subId}/report/`, 'get')
  },
  // Teacher - Exercise Sets
  getTeacherExerciseSets (params) {
    return ajax('exercise/teacher/sets/', 'get', { params })
  },
  createExerciseSet (data) {
    return ajax('exercise/teacher/sets/create/', 'post', { data })
  },
  updateExerciseSet (id, data) {
    return ajax(`exercise/teacher/sets/${id}/update/`, 'put', { data })
  },
  deleteExerciseSet (id) {
    return ajax(`exercise/teacher/sets/${id}/delete/`, 'delete')
  },
  publishExerciseSet (id) {
    return ajax(`exercise/teacher/sets/${id}/publish/`, 'post')
  },
  getExerciseSubmissions (setId) {
    return ajax(`exercise/teacher/sets/${setId}/submissions/`, 'get')
  },
  aiGenerateQuestions (data) {
    return ajax('exercise/teacher/ai/generate-questions/', 'post', { data })
  },
  // Teacher - Boss Exams
  getTeacherBossExams (params) {
    return ajax('exercise/teacher/boss/', 'get', { params })
  },
  createBossExam (data) {
    return ajax('exercise/teacher/boss/create/', 'post', { data })
  },
  updateBossExam (id, data) {
    return ajax(`exercise/teacher/boss/${id}/update/`, 'put', { data })
  },
  deleteBossExam (id) {
    return ajax(`exercise/teacher/boss/${id}/delete/`, 'delete')
  },
  publishBossExam (id) {
    return ajax(`exercise/teacher/boss/${id}/publish/`, 'post')
  },
  // Teacher - Students
  getTeacherStudents () {
    return ajax('exercise/teacher/students/', 'get')
  },
  getTeacherStudentReport (userId) {
    return ajax(`exercise/teacher/students/${userId}/report/`, 'get')
  },
  getTeacherStudentAiAnalysis (userId) {
    return ajax(`exercise/teacher/students/${userId}/ai-analysis/`, 'post')
  },
  getTeacherTopics () {
    return ajax('exercise/teacher/topics/', 'get')
  },
  askAI (data) {
    return ajax('spark/chat/', 'post', { data })
  },
  getLessonPlanList (params) {
    return ajax('lesson_plan', 'get', { params })
  },
  getLessonPlanDetail (id) {
    return ajax('lesson_plan', 'get', { params: { id } })
  },
  analyzeError (data) {
    return ajax('agent/chat/', 'post', { data })
  },
  getProblemHint (data) {
    return ajax('agent/chat/', 'post', { data: { ...data, agent_type: 'HintAgent' } })
  },
  getLearningAdvice () {
    return ajax('spark/learning-advice/', 'get')
  },
  codeReview (data) {
    return ajax('spark/code-review/', 'post', { data })
  },
  getTopicSummary (data) {
    return ajax('spark/topic-summary/', 'post', { data })
  },
  getImmersionRecommendations (params = {}) {
    return ajax('agent/immersion/', 'get', { params })
  },
  getRecommendations (params = {}) {
    return ajax('agent/recommend/', 'get', { params })
  },
  getProfile () {
    return ajax('agent/profile/', 'get')
  },
  // 论坛
  getForumCategories () {
    return ajax('forum/categories/', 'get')
  },
  getForumPosts (params) {
    return ajax('forum/posts/', 'get', { params })
  },
  getForumPostDetail (postId) {
    return ajax(`forum/post/${postId}/`, 'get')
  },
  createForumPost (data) {
    return ajax('forum/posts/', 'post', { data })
  },
  createForumComment (data) {
    return ajax('forum/comments/', 'post', { data })
  },
  deleteForumComment (data) {
    return ajax('forum/comments/', 'delete', { data })
  },
  editForumPost (postId, data) {
    return ajax(`forum/post/${postId}/`, 'put', { data })
  },
  deleteForumPost (postId) {
    return ajax(`forum/post/${postId}/`, 'delete')
  },
  forumLike (postId) {
    return ajax('forum/like/', 'post', { data: { post_id: postId } })
  },
  forumBookmark (postId) {
    return ajax('forum/bookmark/', 'post', { data: { post_id: postId } })
  },
  getForumComments (params) {
    return ajax('forum/comment_list/', 'get', { params })
  },
  forumCommentLike (commentId) {
    return ajax('forum/comment_like/', 'post', { data: { comment_id: commentId } })
  },
  forumReport (data) {
    return ajax('forum/report/', 'post', { data })
  },
  getMuteStatus () {
    return ajax('forum/mute_status/', 'get')
  }
}

/**
 * @param url
 * @param method get|post|put|delete...
 * @param params like queryString. if a url is index?a=1&b=2, params = {a: '1', b: '2'}
 * @param data post data, use for method put|post
 * @returns {Promise}
 */
function ajax (url, method, options) {
  if (options !== undefined) {
    var {params = {}, data = {}} = options
  } else {
    params = data = {}
  }
  return new Promise((resolve, reject) => {
    axios({
      url,
      method,
      params,
      data
    }).then(res => {
      // 只有当响应数据中明确存在 error 字段且不为 null/undefined 时，才视为业务错误
      if (res.data.hasOwnProperty('error') && res.data.error !== null && res.data.error !== undefined) {
        let errorMsg = '操作失败'
        if (res.data.data && typeof res.data.data === 'string') {
          errorMsg = res.data.data
        } else if (typeof res.data.error === 'string') {
          errorMsg = res.data.error
        }
        Vue.prototype.$error(errorMsg)
        reject(res)
        if (errorMsg.includes('Please login') || errorMsg.includes('登录')) {
          // 跳转到独立登录页（仅当当前不在登录/注册页时）
          const currentPath = window.location.pathname
          if (currentPath !== '/login' && currentPath !== '/register') {
            window.location.href = '/login'
          }
        }
      } else {
        // 无错误，正常返回
        resolve(res)
      }
    }, res => {
      // 网络错误或 HTTP 状态码非 20x
      reject(res)
      let errorMsg = '网络错误，请稍后重试'
      const resp = res.response || res
      if (resp && resp.data) {
        if (typeof resp.data === 'string') {
          errorMsg = resp.data
        } else if (resp.data.data && typeof resp.data.data === 'string') {
          errorMsg = resp.data.data
        } else if (resp.data.error) {
          errorMsg = resp.data.error
        }
      } else if (res.statusText) {
        errorMsg = res.statusText
      }
      Vue.prototype.$error(errorMsg)
    })
  })
}
