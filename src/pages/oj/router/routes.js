// all routes here.
import {
  About,
  ACMRank,
  Announcements,
  ApplyResetPassword,
  FAQ,
  Home,
  Logout,
  NotFound,
  OIRank,
  Problem,
  ProblemList,
  ResetPassword,
  SubmissionDetails,
  SubmissionList,
  UserHome
} from '../views'

import * as Contest from '@oj/views/contest'
import * as Setting from '@oj/views/setting'

export default [
  {
    name: 'home',
    path: '/',
    meta: {title: 'Home'},
    component: Home
  },
  {
    name: 'login',
    path: '/login',
    meta: {title: 'Login'},
    component: () => import('@oj/views/user/AuthPage.vue')
  },
  {
    name: 'register',
    path: '/register',
    meta: {title: 'Register'},
    component: () => import('@oj/views/user/AuthPage.vue')
  },
  {
    name: 'logout',
    path: '/logout',
    meta: {title: 'Logout'},
    component: Logout
  },
  {
    name: 'apply-reset-password',
    path: '/apply-reset-password',
    meta: {title: 'Apply Reset Password'},
    component: ApplyResetPassword
  },
  {
    name: 'reset-password',
    path: '/reset-password/:token',
    meta: {title: 'Reset Password'},
    component: ResetPassword
  },
  {
    name: 'problem-list',
    path: '/problem',
    meta: {title: 'Problem List'},
    component: ProblemList
  },
  {
    name: 'problem-details',
    path: '/problem/:problemID',
    meta: {title: 'Problem Details'},
    component: Problem
  },
  {
    name: 'submission-list',
    path: '/status',
    meta: {title: 'Submission List'},
    component: SubmissionList
  },
  {
    name: 'submission-details',
    path: '/status/:id/',
    meta: {title: 'Submission Details'},
    component: SubmissionDetails
  },
  {
    name: 'contest-list',
    path: '/contest',
    meta: {title: 'Contest List'},
    component: Contest.ContestList
  },
  {
    name: 'contest-details',
    path: '/contest/:contestID/',
    component: Contest.ContestDetails,
    meta: {title: 'Contest Details'},
    children: [
      {
        name: 'contest-submission-list',
        path: 'submissions',
        component: SubmissionList
      },
      {
        name: 'contest-problem-list',
        path: 'problems',
        component: Contest.ContestProblemList
      },
      {
        name: 'contest-problem-details',
        path: 'problem/:problemID/',
        component: Problem
      },
      {
        name: 'contest-announcement-list',
        path: 'announcements',
        component: Announcements
      },
      {
        name: 'contest-rank',
        path: 'rank',
        component: Contest.ContestRank
      },
      {
        name: 'acm-helper',
        path: 'helper',
        component: Contest.ACMContestHelper
      }
    ]
  },
  {
    name: 'acm-rank',
    path: '/acm-rank',
    meta: {title: 'ACM Rankings'},
    component: ACMRank
  },
  {
    name: 'oi-rank',
    path: '/oi-rank',
    meta: {title: 'OI Rankings'},
    component: OIRank
  },
  {
    name: 'user-home',
    path: '/user-home',
    component: UserHome,
    meta: {requiresAuth: true, title: 'User Home'}
  },
  {
    path: '/setting',
    component: Setting.Settings,
    children: [
      {
        name: 'default-setting',
        path: '',
        meta: {requiresAuth: true, title: 'Default Settings'},
        component: Setting.ProfileSetting
      },
      {
        name: 'profile-setting',
        path: 'profile',
        meta: {requiresAuth: true, title: 'Profile Settings'},
        component: Setting.ProfileSetting
      },
      {
        name: 'account-setting',
        path: 'account',
        meta: {requiresAuth: true, title: 'Account Settings'},
        component: Setting.AccountSetting
      },
      {
        name: 'security-setting',
        path: 'security',
        meta: {requiresAuth: true, title: 'Security Settings'},
        component: Setting.SecuritySetting
      }
    ]
  },
  {
    path: '/about',
    name: 'about',
    meta: {title: 'About'},
    component: About
  },
  {
    path: '/faq',
    name: 'faq',
    meta: {title: 'FAQ'},
    component: FAQ
  },
  {
    path: '*',
    meta: {title: '404'},
    component: NotFound
  },

  // recommend
  {
    path: '/learning-report',
    name: 'learning-report',
    meta: {title: 'Learning Report'},
    component: () => import('../views/recommend/LearningReport.vue')
  },

  // learning path
  {
    path: '/learning-path',
    name: 'LearningPath',
    component: () => import('@/pages/oj/views/recommend/LearningPath.vue')
  },

  // knowledge universe
  {
    path: '/knowledge-universe',
    name: 'knowledge-universe',
    meta: { title: 'Knowledge Universe' },
    component: () => import('@/pages/oj/views/recommend/KnowledgeUniverse.vue')
  },

  // learning pod
  {
    path: '/learn/topic/:topic',
    name: 'learning-pod',
    meta: { title: 'Learning Pod' },
    component: () => import('@/pages/oj/views/recommend/LearningPod.vue')
  },

  // exercise sets (student)
  {
    path: '/exercise',
    name: 'exercise-list',
    meta: { requiresAuth: true, title: '题集' },
    component: () => import('@/pages/oj/views/recommend/ExerciseSets.vue')
  },
  {
    path: '/exercise/:id',
    name: 'exercise-detail',
    meta: { requiresAuth: true, title: '试题练习' },
    component: () => import('@/pages/oj/views/recommend/ExerciseDetail.vue')
  },
  // boss exams
  {
    path: '/boss-exam',
    name: 'boss-exam-list',
    meta: { requiresAuth: true, title: 'Boss 挑战' },
    component: () => import('@/pages/oj/views/recommend/BossExams.vue')
  },
  {
    path: '/boss-exam/:id',
    name: 'boss-exam-detail',
    meta: { requiresAuth: true, title: 'Boss 战' },
    component: () => import('@/pages/oj/views/recommend/BossExamDetail.vue')
  },
  // teacher dashboard
  {
    path: '/teacher',
    name: 'teacher-dashboard',
    meta: { requiresAuth: true, title: '教师管理' },
    component: () => import('@/pages/oj/views/recommend/TeacherDashboard.vue')
  },

  // immersion practice
  {
    path: '/immersion',
    name: 'immersion-practice',
    meta: {requiresAuth: true, title: 'Immersive Practice'},
    component: () => import('@/pages/oj/views/recommend/ImmersionPractice.vue')
  },

  // profile onboarding
  {
    path: '/profile-onboarding',
    name: 'profile-onboarding',
    meta: {requiresAuth: true, title: 'Profile Onboarding'},
    component: () => import('@/pages/oj/views/recommend/ProfileOnboarding.vue')
  },

  // lesson plans
  {
    path: '/lesson-plan',
    name: 'lesson-plan-list',
    meta: {title: 'Lesson Plans'},
    component: () => import('@oj/views/lesson/LessonPlanList.vue')
  },
  {
    path: '/lesson-plan/:id',
    name: 'lesson-plan-details',
    meta: {title: 'Lesson Plan Study'},
    component: () => import('@oj/views/lesson/LessonPlanStudy.vue')
  },

  // fullscreen pages
  {
    path: '/ai-chat-fullscreen',
    name: 'ai-chat-fullscreen',
    meta: {title: 'AI Chat'},
    component: () => import('@oj/views/chat/AIChatFullscreen.vue')
  },
  {
    path: '/code-editor-fullscreen',
    name: 'code-editor-fullscreen',
    meta: {title: '代码编辑器'},
    component: () => import('@oj/views/editor/CodeEditorFullscreen.vue')
  },

  // 论坛
  {
    path: '/forum',
    name: 'forum',
    meta: {title: '论坛'},
    component: () => import('@/pages/oj/views/forum/ForumList.vue')
  },
  // 算法可视化实验室
  {
    path: '/algorithm-viz',
    name: 'algorithm-viz',
    meta: {title: '算法可视化实验室'},
    component: () => import('@/pages/oj/views/algorithm/AlgorithmVisualizer.vue')
  },
  // 代码执行可视化
  {
    path: '/code-visualizer',
    name: 'code-visualizer',
    meta: {title: '代码执行可视化'},
    component: () => import('@/pages/oj/views/code/CodeVisualizer.vue')
  },
  // AI 代码审查报告
  {
    path: '/code-review',
    name: 'code-review',
    meta: {title: 'AI 代码审查'},
    component: () => import('@/pages/oj/views/code/CodeReviewReport.vue')
  },
  {
    path: '/agreement',
    name: 'agreement',
    meta: {title: '用户协议'},
    component: () => import('@/pages/oj/views/Agreement.vue')
  }
]
