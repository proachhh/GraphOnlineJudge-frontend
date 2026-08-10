<template>
  <div class="admin-dashboard">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <div class="banner-content">
        <div class="banner-left">
          <h1 class="banner-title">管理控制台</h1>
          <p class="banner-subtitle">系统运行状态一览</p>
        </div>
        <div class="banner-right">
          <img class="banner-avatar" :src="profile.avatar" v-if="profile.avatar" />
          <div class="banner-user">
            <span class="banner-username">{{ user.username }}</span>
            <span class="banner-role">{{ user.admin_type }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card stat-blue">
        <div class="stat-icon"><i class="el-icon-user"></i></div>
        <div class="stat-body">
          <span class="stat-value">{{ infoData.user_count }}</span>
          <span class="stat-label">总用户数</span>
        </div>
      </div>
      <div class="stat-card stat-green">
        <div class="stat-icon"><i class="el-icon-document"></i></div>
        <div class="stat-body">
          <span class="stat-value">{{ infoData.today_submission_count }}</span>
          <span class="stat-label">今日提交</span>
        </div>
      </div>
      <div class="stat-card stat-orange">
        <div class="stat-icon"><i class="el-icon-trophy"></i></div>
        <div class="stat-body">
          <span class="stat-value">{{ infoData.recent_contest_count }}</span>
          <span class="stat-label">近期竞赛</span>
        </div>
      </div>
      <div class="stat-card stat-purple" v-if="isSuperAdmin">
        <div class="stat-icon"><i class="el-icon-cpu"></i></div>
        <div class="stat-body">
          <span class="stat-value">{{ infoData.judge_server_count }}</span>
          <span class="stat-label">评测机</span>
        </div>
      </div>
    </div>

    <!-- 信息区域 -->
    <div class="info-row">
      <!-- 登录信息 -->
      <div class="info-card-wrap">
        <div class="card-header">
          <i class="el-icon-time"></i>
          <span>最近登录</span>
        </div>
        <div class="login-info">
          <div class="login-item">
            <span class="login-label">时间</span>
            <span class="login-value">{{ session.last_activity | localtime }}</span>
          </div>
          <div class="login-item">
            <span class="login-label">IP</span>
            <span class="login-value">{{ session.ip || '—' }}</span>
          </div>
          <div class="login-item">
            <span class="login-label">系统</span>
            <span class="login-value">{{ os }}</span>
          </div>
          <div class="login-item">
            <span class="login-label">浏览器</span>
            <span class="login-value">{{ browser }}</span>
          </div>
        </div>
      </div>

      <!-- 系统状态 -->
      <div class="info-card-wrap" v-if="isSuperAdmin">
        <div class="card-header">
          <i class="el-icon-setting"></i>
          <span>系统状态</span>
        </div>
        <div class="system-status">
          <div class="status-item">
            <span class="status-label">评测服务器</span>
            <el-tag size="small" :type="infoData.judge_server_count > 0 ? 'success' : 'danger'">{{ infoData.judge_server_count }} 台</el-tag>
          </div>
          <div class="status-item">
            <span class="status-label">HTTPS</span>
            <el-tag size="small" :type="https ? 'success' : 'danger'">{{ https ? '已启用' : '未启用' }}</el-tag>
          </div>
          <div class="status-item">
            <span class="status-label">强制 HTTPS</span>
            <el-tag size="small" :type="forceHttps ? 'success' : 'danger'">{{ forceHttps ? '已启用' : '未启用' }}</el-tag>
          </div>
          <div class="status-item">
            <span class="status-label">CDN</span>
            <el-tag size="small" :type="cdn ? 'success' : 'warning'">{{ cdn ? cdn : '未使用' }}</el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 更新日志 -->
    <div class="release-card" v-if="isSuperAdmin">
      <div class="card-header">
        <i class="el-icon-bell"></i>
        <span>版本更新</span>
        <el-tooltip content="升级到最新版本以享受新功能" placement="right">
          <i class="el-icon-question release-help"></i>
        </el-tooltip>
      </div>
      <div class="release-body" v-loading="loadingReleases">
        <el-collapse v-model="activeNames" v-for="(release, index) of releases" :key="'release' + index">
          <el-collapse-item :name="index + 1">
            <template slot="title">
              <span class="release-title">{{ release.title }}</span>
              <el-tag size="mini" type="success" v-if="release.new_version">新版本</el-tag>
            </template>
            <div class="release-detail">
              <p class="release-level">级别: {{ release.level }}</p>
              <ul class="release-list">
                <li v-for="detail in release.details" :key="detail" v-html="detail"></li>
              </ul>
            </div>
          </el-collapse-item>
        </el-collapse>
        <div v-if="!loadingReleases && releases.length === 0" class="release-empty">已是最新版本</div>
      </div>
    </div>
  </div>
</template>

<script>
  import { mapGetters } from 'vuex'
  import browserDetector from 'browser-detect'
  import api from '@admin/api'

  export default {
    name: 'dashboard',
    data () {
      return {
        infoData: {
          user_count: 0,
          recent_contest_count: 0,
          today_submission_count: 0,
          judge_server_count: 0,
          env: {}
        },
        activeNames: [1],
        session: {},
        loadingReleases: true,
        releases: []
      }
    },
    mounted () {
      api.getDashboardInfo().then(resp => {
        this.infoData = resp.data.data
      }, () => {})
      api.getSessions().then(resp => {
        this.parseSession(resp.data.data)
      }, () => {})
      api.getReleaseNotes().then(resp => {
        this.loadingReleases = false
        let data = resp.data.data
        if (!data) return
        let currentVersion = data.local_version
        data.update.forEach(release => {
          if (release.version > currentVersion) {
            release.new_version = true
          }
        })
        this.releases = data.update
      }, () => {
        this.loadingReleases = false
      })
    },
    methods: {
      parseSession (sessions) {
        let session = sessions[0]
        if (sessions.length > 1) {
          session = sessions.filter(s => !s.current_session).sort((a, b) => {
            return a.last_activity < b.last_activity
          })[0]
        }
        this.session = session
      }
    },
    computed: {
      ...mapGetters(['profile', 'user', 'isSuperAdmin']),
      cdn () {
        return this.infoData.env.STATIC_CDN_HOST
      },
      https () {
        return document.URL.slice(0, 5) === 'https'
      },
      forceHttps () {
        return this.infoData.env.FORCE_HTTPS
      },
      browser () {
        let b = browserDetector(this.session.user_agent)
        if (b.name && b.version) {
          return b.name + ' ' + b.version
        }
        return 'Unknown'
      },
      os () {
        let b = browserDetector(this.session.user_agent)
        return b.os ? b.os : 'Unknown'
      }
    }
  }
</script>

<style lang="less" scoped>
.admin-dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

/* ============ 欢迎横幅 ============ */
.welcome-banner {
  background: linear-gradient(135deg, #1e3a8a 0%, #2950b3 50%, #1e3a8a 100%);
  border-radius: 14px;
  padding: 28px 32px;
  margin-bottom: 20px;
  box-shadow: 0 8px 32px rgba(30, 58, 138, 0.15);
}
.banner-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.banner-title {
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 6px 0;
}
.banner-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.75);
  margin: 0;
}
.banner-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.banner-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.4);
  object-fit: cover;
}
.banner-user {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.banner-username {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}
.banner-role {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  text-transform: capitalize;
}

/* ============ 统计卡片 ============ */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 22px 24px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }
}
.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  i {
    font-size: 24px;
    color: #fff;
  }

  .stat-blue & { background: linear-gradient(135deg, #3b82f6, #1e3a8a); }
  .stat-green & { background: linear-gradient(135deg, #34d399, #059669); }
  .stat-orange & { background: linear-gradient(135deg, #fbbf24, #d97706); }
  .stat-purple & { background: linear-gradient(135deg, #a78bfa, #7c3aed); }
}
.stat-body {
  display: flex;
  flex-direction: column;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}
.stat-label {
  font-size: 13px;
  color: #64748b;
  margin-top: 2px;
}

/* ============ 信息区域 ============ */
.info-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}
.info-card-wrap,
.release-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  font-size: 15px;
  font-weight: 600;
  color: #1e3a8a;
  border-bottom: 1px solid #f5f5f5;
  background: #fafbfc;

  i {
    font-size: 17px;
  }
}
.release-help {
  margin-left: 4px;
  color: #c0c4cc;
  cursor: pointer;
  font-size: 14px;
}

/* ============ 登录信息 ============ */
.login-info {
  padding: 16px 20px;
}
.login-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f8f8f8;

  &:last-child {
    border-bottom: none;
  }
}
.login-label {
  font-size: 13px;
  color: #909399;
  font-weight: 500;
}
.login-value {
  font-size: 14px;
  color: #303133;
}

/* ============ 系统状态 ============ */
.system-status {
  padding: 16px 20px;
}
.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f8f8f8;

  &:last-child {
    border-bottom: none;
  }
}
.status-label {
  font-size: 13px;
  color: #909399;
  font-weight: 500;
}

/* ============ 更新日志 ============ */
.release-card {
  margin-bottom: 20px;
}
.release-body {
  padding: 8px 20px 16px;
}
.release-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-right: 8px;
}
.release-detail {
  padding: 8px 0;
}
.release-level {
  font-size: 13px;
  color: #909399;
  margin: 4px 0;
}
.release-list {
  margin: 8px 0 0 0;
  padding-left: 20px;

  li {
    font-size: 13px;
    color: #606266;
    line-height: 1.8;
  }
}
.release-empty {
  text-align: center;
  padding: 20px;
  color: #c0c4cc;
  font-size: 14px;
}
</style>
