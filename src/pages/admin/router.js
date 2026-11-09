import { createRouter, createWebHistory } from 'vue-router'
import { setAppRouter } from '@/store'
// 引入 view 组件
import { Announcement, Conf, Contest, ContestList, Home, JudgeServer, Login,
  Problem, ProblemList, User, PruneTestCase, Dashboard, ProblemImportOrExport, DataDashboard, ImmersionDashboard, Feedback,
  ForumPostManage, ForumUserManage, ForumReportManage } from './views'
const LessonPlan = () => import('./views/lesson/LessonPlan.vue')

const router = createRouter({
  history: createWebHistory('/admin/'),
  scrollBehavior: () => ({left: 0, top: 0}),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '/',
      component: Home,
      children: [
        {
          path: '',
          redirect: '/data-dashboard'
        },
        {
          path: '/data-dashboard',
          name: 'data-dashboard',
          component: DataDashboard
        },
        {
          path: '/announcement',
          name: 'announcement',
          component: Announcement
        },
        {
          path: '/user',
          name: 'user',
          component: User
        },
        {
          path: '/conf',
          name: 'conf',
          component: Conf
        },
        {
          path: '/judge-server',
          name: 'judge-server',
          component: JudgeServer
        },
        {
          path: '/prune-test-case',
          name: 'prune-test-case',
          component: PruneTestCase
        },
        {
          path: '/problems',
          name: 'problem-list',
          component: ProblemList
        },
        {
          path: '/problem/create',
          name: 'create-problem',
          component: Problem
        },
        {
          path: '/problem/edit/:problemId',
          name: 'edit-problem',
          component: Problem
        },
        {
          path: '/problem/batch_ops',
          name: 'problem_batch_ops',
          component: ProblemImportOrExport
        },
        {
          path: '/contest/create',
          name: 'create-contest',
          component: Contest
        },
        {
          path: '/contest',
          name: 'contest-list',
          component: ContestList
        },
        {
          path: '/contest/:contestId/edit',
          name: 'edit-contest',
          component: Contest
        },
        {
          path: '/contest/:contestId/announcement',
          name: 'contest-announcement',
          component: Announcement
        },
        {
          path: '/contest/:contestId/problems',
          name: 'contest-problem-list',
          component: ProblemList
        },
        {
          path: '/contest/:contestId/problem/create',
          name: 'create-contest-problem',
          component: Problem
        },
        {
          path: '/contest/:contestId/problem/:problemId/edit',
          name: 'edit-contest-problem',
          component: Problem
        },
        {
          path: 'lesson-plan',
          name: 'lesson-plan-management',
          component: LessonPlan
        },
        {
          path: 'feedback',
          name: 'feedback',
          component: Feedback
        },
        {
          path: '/forum/posts',
          name: 'forum-posts',
          component: ForumPostManage
        },
        {
          path: '/forum/users',
          name: 'forum-users',
          component: ForumUserManage
        },
        {
          path: '/forum/reports',
          name: 'forum-reports',
          component: ForumReportManage
        }
      ]
    },
    {
      path: '/immersion-dashboard',
      name: 'immersion-dashboard',
      component: ImmersionDashboard
    },
    {
      path: '/:pathMatch(.*)*', redirect: '/login'
    }
  ]
})

// 注入 router 实例供 store.changeDomTitle 使用（替代已废弃的 vuex-router-sync）
setAppRouter(router)

export default router
