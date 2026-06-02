<template>
  <div class="data-dashboard" v-loading="loading">
    <div class="page-header">
      <div class="header-left">
        <h2>数据看板</h2>
        <p>Data Dashboard</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" icon="el-icon-full-screen" @click="goImmersion" class="immersion-btn">
          沉浸式观看
        </el-button>
      </div>
    </div>

    <div class="overview-cards">
      <div class="card overview-card">
        <div class="card-icon" style="background: linear-gradient(135deg, #1e3a8a, #3b82f6);">
          <i class="el-icon-fa-users"></i>
        </div>
        <div class="card-content">
          <div class="card-value">{{ overview.total_users || 0 }}</div>
          <div class="card-label">总用户数</div>
        </div>
      </div>
      <div class="card overview-card">
        <div class="card-icon" style="background: linear-gradient(135deg, #1e40af, #6366f1);">
          <i class="el-icon-fa-file-text"></i>
        </div>
        <div class="card-content">
          <div class="card-value">{{ overview.total_problems || 0 }}</div>
          <div class="card-label">总题目数</div>
        </div>
      </div>
      <div class="card overview-card">
        <div class="card-icon" style="background: linear-gradient(135deg, #1e3a8a, #2563eb);">
          <i class="el-icon-fa-paper-plane"></i>
        </div>
        <div class="card-content">
          <div class="card-value">{{ overview.total_submissions || 0 }}</div>
          <div class="card-label">总提交数</div>
        </div>
      </div>
      <div class="card overview-card">
        <div class="card-icon" style="background: linear-gradient(135deg, #1e40af, #3b82f6);">
          <i class="el-icon-fa-trophy"></i>
        </div>
        <div class="card-content">
          <div class="card-value">{{ overview.total_contests || 0 }}</div>
          <div class="card-label">总比赛数</div>
        </div>
      </div>
    </div>

    <div class="activity-stats">
      <div class="stat-group">
        <h3>活跃统计</h3>
        <div class="stat-items">
          <div class="stat-item">
            <span class="stat-label">今日提交</span>
            <span class="stat-value">{{ overview.today_submissions || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">本周提交</span>
            <span class="stat-value">{{ overview.week_submissions || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">本月提交</span>
            <span class="stat-value">{{ overview.month_submissions || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">今日活跃用户</span>
            <span class="stat-value">{{ overview.today_active_users || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">本周活跃用户</span>
            <span class="stat-value">{{ overview.week_active_users || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">进行中比赛</span>
            <span class="stat-value">{{ overview.active_contests || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">未开始比赛</span>
            <span class="stat-value">{{ overview.upcoming_contests || 0 }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="charts-row">
      <div class="chart-panel">
        <h3>难度分布</h3>
        <div id="difficulty-chart" class="chart-container"></div>
      </div>
      <div class="chart-panel">
        <h3>提交结果分布</h3>
        <div id="result-chart" class="chart-container"></div>
      </div>
    </div>

    <div class="charts-row">
      <div class="chart-panel">
        <h3>语言分布</h3>
        <div id="language-chart" class="chart-container"></div>
      </div>
      <div class="chart-panel">
        <h3>标签分布 Top 10</h3>
        <div id="tag-chart" class="chart-container"></div>
      </div>
    </div>

    <div class="daily-chart-panel">
      <h3>每日提交趋势（最近7天）</h3>
      <div ref="dailyChart" class="chart-container-wide"></div>
    </div>

    <div class="tables-row">
      <div class="table-panel">
        <h3>完成率最高题目 Top 10</h3>
        <el-table :data="mostCompleted" :key="'t1-'+tableKey" size="small" stripe>
          <el-table-column prop="_id" label="ID" width="80"></el-table-column>
          <el-table-column prop="title" label="题目标题" show-overflow-tooltip></el-table-column>
          <el-table-column label="难度" width="80">
            <template slot-scope="scope">
              <el-tag :type="diffTagType(scope.row.difficulty)" size="small">{{ diffLabel(scope.row.difficulty) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="submission_count" label="提交数" width="80"></el-table-column>
          <el-table-column prop="accepted_count" label="通过数" width="80"></el-table-column>
          <el-table-column label="通过率" width="100">
            <template slot-scope="scope">
              <span>{{ (scope.row.pass_rate || 0).toFixed(1) }}%</span>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="!mostCompleted.length" class="no-data">暂无数据</div>
      </div>
      <div class="table-panel">
        <h3>完成率最低题目 Top 10</h3>
        <el-table :data="leastCompleted" :key="'t2-'+tableKey" size="small" stripe>
          <el-table-column prop="_id" label="ID" width="80"></el-table-column>
          <el-table-column prop="title" label="题目标题" show-overflow-tooltip></el-table-column>
          <el-table-column label="难度" width="80">
            <template slot-scope="scope">
              <el-tag :type="diffTagType(scope.row.difficulty)" size="small">{{ diffLabel(scope.row.difficulty) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="submission_count" label="提交数" width="80"></el-table-column>
          <el-table-column prop="accepted_count" label="通过数" width="80"></el-table-column>
          <el-table-column label="通过率" width="100">
            <template slot-scope="scope">
              <span>{{ (scope.row.pass_rate || 0).toFixed(1) }}%</span>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="!leastCompleted.length" class="no-data">暂无数据</div>
      </div>
    </div>

    <div class="tables-row">
      <div class="table-panel">
        <h3>用户排名 Top 20</h3>
        <el-table :data="userRanking" :key="'t3-'+tableKey" size="small" stripe>
          <el-table-column prop="rank" label="排名" width="60"></el-table-column>
          <el-table-column prop="username" label="用户名" width="120"></el-table-column>
          <el-table-column label="真实姓名" width="120">
            <template slot-scope="scope">{{ scope.row.real_name || '-' }}</template>
          </el-table-column>
          <el-table-column prop="accepted_count" label="通过数" width="80"></el-table-column>
          <el-table-column prop="submission_count" label="提交数" width="80"></el-table-column>
          <el-table-column label="AC率" width="80">
            <template slot-scope="scope">
              <span>{{ (typeof scope.row.ac_rate === 'number' ? scope.row.ac_rate.toFixed(1) : scope.row.ac_rate || 0) }}%</span>
            </template>
          </el-table-column>
          <el-table-column prop="total_score" label="OI总分" width="100"></el-table-column>
        </el-table>
        <div v-if="!userRanking.length" class="no-data">暂无数据</div>
      </div>
    </div>

    <div class="tables-row">
      <div class="table-panel">
        <h3>历史提交最多用户</h3>
        <el-table :data="topSubmittersAllTime" :key="'t4-'+tableKey" size="small" stripe>
          <el-table-column prop="username" label="用户名" width="120"></el-table-column>
          <el-table-column label="真实姓名" width="120">
            <template slot-scope="scope">{{ scope.row.real_name || '-' }}</template>
          </el-table-column>
          <el-table-column prop="submission_count" label="提交数" width="100"></el-table-column>
          <el-table-column prop="accepted_count" label="通过数" width="100"></el-table-column>
          <el-table-column prop="total_score" label="OI总分" width="100"></el-table-column>
        </el-table>
        <div v-if="!topSubmittersAllTime.length" class="no-data">暂无数据</div>
      </div>
      <div class="table-panel">
        <h3>本周提交最多用户</h3>
        <el-table :data="topSubmittersWeek" :key="'t5-'+tableKey" size="small" stripe>
          <el-table-column prop="username" label="用户名" width="120"></el-table-column>
          <el-table-column label="真实姓名" width="120">
            <template slot-scope="scope">{{ scope.row.real_name || '-' }}</template>
          </el-table-column>
          <el-table-column prop="submission_count" label="本周提交" width="100"></el-table-column>
          <el-table-column prop="accepted_count" label="本周通过" width="100"></el-table-column>
        </el-table>
        <div v-if="!topSubmittersWeek.length" class="no-data">暂无数据</div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import api from '@admin/api'

export default {
  name: 'data-dashboard',
  data () {
    return {
      loading: false,
      tableKey: 0,
      overview: {},
      problemStats: {},
      difficultyDistribution: [],
      problemCompletion: {},
      topSubmitters: {},
      userRanking: [],
      submissionStats: {},
      mostCompleted: [],
      leastCompleted: [],
      topSubmittersAllTime: [],
      topSubmittersWeek: []
    }
  },
  mounted () {
    this.fetchData()
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    diffTagType (difficulty) {
      if (difficulty === 'Low') return 'success'
      if (difficulty === 'Mid') return 'warning'
      return 'danger'
    },
    diffLabel (difficulty) {
      const map = { Low: '简单', Mid: '中等', High: '困难' }
      return map[difficulty] || difficulty
    },
    translateSubmissionResult (status) {
      const keyMap = {
        'Pending': 'Submission_Result_Pending',
        'Judging': 'Submission_Result_Judging',
        'Accepted': 'Submission_Result_Accepted',
        'Wrong Answer': 'Submission_Result_Wrong_Answer',
        'CPU Time Limit Exceeded': 'Submission_Result_CPU_Time_Limit_Exceeded',
        'Real Time Limit Exceeded': 'Submission_Result_Real_Time_Limit_Exceeded',
        'Memory Limit Exceeded': 'Submission_Result_Memory_Limit_Exceeded',
        'Runtime Error': 'Submission_Result_Runtime_Error',
        'Compile Error': 'Submission_Result_Compile_Error',
        'System Error': 'Submission_Result_System_Error',
        'Partially Accepted': 'Submission_Result_Partially_Accepted',
      }
      const key = keyMap[status]
      return key ? this.$t('m.' + key) : status
    },
    goImmersion () {
      this.$router.push({ name: 'immersion-dashboard' })
    },
    fetchData () {
      this.loading = true
      api.getDataDashboard().then(res => {
        const data = res.data.data || res.data
        this.overview = data.overview || {}
        this.problemStats = data.problem_stats || {}
        this.difficultyDistribution = data.difficulty_distribution || []
        this.problemCompletion = data.problem_completion || {}
        this.topSubmitters = data.top_submitters || {}
        this.userRanking = data.user_ranking || []
        this.submissionStats = data.submission_stats || {}
        this.mostCompleted = (this.problemCompletion.most_completed || []).map(item => ({ ...item }))
        this.leastCompleted = (this.problemCompletion.least_completed || []).map(item => ({ ...item }))
        this.topSubmittersAllTime = (this.topSubmitters.all_time || []).map(item => ({ ...item }))
        this.topSubmittersWeek = (this.topSubmitters.this_week || []).map(item => ({ ...item }))
        this.userRanking = (data.user_ranking || []).map(item => ({ ...item }))
        this.loading = false
        this.tableKey = Date.now()
        this.$forceUpdate()
        this.$nextTick(() => {
          setTimeout(() => {
            this.drawDifficultyChart()
            this.drawResultChart()
            this.drawLanguageChart()
            this.drawTagChart()
            this.drawDailyChart()
          }, 100)
        })
      }).catch((err) => {
        console.error('Dashboard fetch error:', err)
        this.loading = false
      })
    },
    drawDifficultyChart () {
      const chartDom = document.getElementById('difficulty-chart')
      if (!chartDom) return
      const existingChart = echarts.getInstanceByDom(chartDom)
      if (existingChart) existingChart.dispose()
      const chart = echarts.init(chartDom)
      const labelMap = { Low: '简单', Mid: '中等', High: '困难' }
      const colorMap = { Low: '#67c23a', Mid: '#e6a23c', High: '#f56c6c' }
      chart.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: {c}题' },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
          label: { show: true, formatter: '{b}: {c}题', fontSize: 14 },
          data: this.difficultyDistribution.map(item => ({
            name: labelMap[item.name] || item.name,
            value: item.count,
            itemStyle: { color: colorMap[item.name] || '#409eff' }
          }))
        }]
      })
    },
    drawResultChart () {
      const chartDom = document.getElementById('result-chart')
      if (!chartDom) return
      const existingChart = echarts.getInstanceByDom(chartDom)
      if (existingChart) existingChart.dispose()
      const chart = echarts.init(chartDom)
      const resultDistribution = this.submissionStats.result_distribution || []
      chart.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: {c}次 ({d}%)' },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
          label: { show: true, formatter: '{b}: {c}次', fontSize: 13 },
          data: resultDistribution.map(item => ({
            name: this.translateSubmissionResult(item.status),
            value: item.count
          }))
        }]
      })
    },
    drawLanguageChart () {
      const chartDom = document.getElementById('language-chart')
      if (!chartDom) return
      const existingChart = echarts.getInstanceByDom(chartDom)
      if (existingChart) existingChart.dispose()
      const chart = echarts.init(chartDom)
      const languageDistribution = this.submissionStats.language_distribution || []
      chart.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: {c}次 ({d}%)' },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
          label: { show: true, formatter: '{b}: {c}次', fontSize: 13 },
          data: languageDistribution.map(item => ({
            name: item.language,
            value: item.count
          }))
        }]
      })
    },
    drawTagChart () {
      const chartDom = document.getElementById('tag-chart')
      if (!chartDom) return
      const existingChart = echarts.getInstanceByDom(chartDom)
      if (existingChart) existingChart.dispose()
      const chart = echarts.init(chartDom)
      const tagsDistribution = this.problemStats.tags_distribution || []
      chart.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '15%', right: '5%', bottom: '3%', containLabel: true },
        xAxis: { type: 'value' },
        yAxis: {
          type: 'category',
          data: tagsDistribution.map(item => item.name).reverse(),
          axisLabel: { interval: 0 }
        },
        series: [{
          type: 'bar',
          data: tagsDistribution.map(item => item.count).reverse(),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#83bff6' },
              { offset: 0.5, color: '#188df0' },
              { offset: 1, color: '#188df0' }
            ])
          },
          barWidth: '60%'
        }]
      })
    },
    drawDailyChart () {
      const chartDom = this.$refs.dailyChart
      if (!chartDom) return
      const existingChart = echarts.getInstanceByDom(chartDom)
      if (existingChart) existingChart.dispose()
      const chart = echarts.init(chartDom)
      const dailySubmissions = this.submissionStats.daily_submissions || []
      chart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['总提交', '通过'], left: 'center', textStyle: { fontSize: 14 } },
        grid: { left: '70px', right: '50px', bottom: '45px', top: '60px', containLabel: true },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: dailySubmissions.map(item => item.date),
          axisLabel: { rotate: 0, interval: 0, fontSize: 13 }
        },
        yAxis: { type: 'value' },
        series: [
          {
            name: '总提交',
            type: 'line',
            smooth: true,
            data: dailySubmissions.map(item => item.total),
            areaStyle: { opacity: 0.3 },
            itemStyle: { color: '#409eff' }
          },
          {
            name: '通过',
            type: 'line',
            smooth: true,
            data: dailySubmissions.map(item => item.accepted),
            areaStyle: { opacity: 0.3 },
            itemStyle: { color: '#67c23a' }
          }
        ]
      })
      setTimeout(() => chart.resize(), 300)
    },
    handleResize () {
      const ids = ['difficulty-chart', 'result-chart', 'language-chart', 'tag-chart', 'daily-chart']
      ids.forEach(id => {
        const chartDom = document.getElementById(id)
        if (chartDom) {
          const chart = echarts.getInstanceByDom(chartDom)
          if (chart) chart.resize()
        }
      })
    }
  }
}
</script>

<style lang="less" scoped>
.data-dashboard {
  padding: 20px;
  min-height: 100vh;
  background: #f5f7fa;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  margin-bottom: 30px;

  .header-left {
    h2 { font-size: 32px; font-weight: 700; color: #1e3a8a; margin: 0 0 6px 0; }
    p { font-size: 16px; color: #94a3b8; margin: 0; letter-spacing: 2px; }
  }

  .header-actions {
    .immersion-btn {
      background: linear-gradient(135deg, #1e3a8a, #3b82f6);
      border: none;
      border-radius: 12px;
      padding: 12px 28px;
      font-size: 17px;
      font-weight: 600;
      letter-spacing: 1px;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
      &:hover { transform: translateY(-2px); box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6); }
    }
  }
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.card {
  background: #fff;
  border-radius: 16px;
  padding: 28px;
  display: flex;
  align-items: center;
  gap: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  &:hover { transform: translateY(-4px); box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1); }
}

.card-icon {
  width: 72px; height: 72px; border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  i, span { font-size: 36px; color: #fff; line-height: 1; }
}

.card-content {
  flex: 1;
  .card-value { font-size: 40px; font-weight: 700; color: #1e3a8a; margin-bottom: 4px; }
  .card-label { font-size: 17px; color: #64748b; }
}

.activity-stats {
  background: #fff;
  border-radius: 16px;
  padding: 28px;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);

  .stat-group {
    h3 { font-size: 20px; font-weight: 600; color: #1e3a8a; margin: 0 0 20px; }
    .stat-items {
      display: flex; flex-wrap: wrap; gap: 16px;
      .stat-item {
        flex: 1; min-width: 150px; padding: 16px 20px;
        background: #f8fafc; border-radius: 12px; text-align: center;
        .stat-label { display: block; font-size: 15px; color: #64748b; margin-bottom: 8px; }
        .stat-value { font-size: 28px; font-weight: 700; color: #1e3a8a; }
      }
    }
  }
}

.charts-row {
  display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;
}

.chart-panel, .daily-chart-panel {
  background: #fff; border-radius: 16px; padding: 28px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  h3 { font-size: 18px; font-weight: 600; color: #1e3a8a; margin: 0 0 16px; }
}

.chart-container { height: 380px; }
.chart-container-wide { height: 420px; }
.daily-chart-panel { margin-bottom: 30px; }

.tables-row {
  display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;
}

.table-panel {
  background: #fff; border-radius: 16px; padding: 28px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  h3 { font-size: 18px; font-weight: 600; color: #1e3a8a; margin: 0 0 16px; }

  /deep/ .el-table { font-size: 15px; }
  /deep/ .el-table th { font-size: 15px; padding: 10px 0; }
  /deep/ .el-table td { font-size: 15px; padding: 8px 0; }
}

.no-data {
  text-align: center; color: #94a3b8; font-size: 14px; padding: 30px 0;
}
</style>
