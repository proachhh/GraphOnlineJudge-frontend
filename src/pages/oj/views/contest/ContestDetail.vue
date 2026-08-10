<template>
  <div class="contest-detail-elegant">
    <!--children-->
    <transition name="fadeInUp">
      <router-view></router-view>
    </transition>
    <!--children end-->

    <div v-if="route_name === 'contest-details'">
      <!-- 比赛概览卡片 -->
      <div class="overview-panel">
        <div class="panel-header">
          <h1 class="contest-title">{{ contest.title }}</h1>
          <Tag type="dot" :color="countdownColor" class="countdown-tag">
            <span id="countdown">{{ countdown }}</span>
          </Tag>
        </div>

        <div class="panel-meta">
          <span class="meta-item">
            <Icon type="ios-calendar" size="14" />
            {{ contest.start_time | localtime }} ~ {{ contest.end_time | localtime }}
          </span>
          <span class="meta-item">
            <Icon type="ios-flag" size="14" />
            {{ $t('m.' + (contest.rule_type || 'ACM')) }}
          </span>
          <span class="meta-item">
            <Icon type="ios-person" size="14" />
            {{ contest.created_by ? contest.created_by.username : '' }}
          </span>
        </div>

        <div v-if="contest.description" class="panel-body markdown-body" v-html="contest.description"></div>

        <div v-if="passwordFormVisible" class="password-row">
          <Input v-model="contestPassword" type="password"
                 :placeholder="$t('m.Contest_Password')" class="password-input"
                 @on-enter="checkPassword"/>
          <Button type="primary" :loading="btnLoading" @click="checkPassword">Enter</Button>
        </div>
      </div>

      <!-- 题目列表 -->
      <div class="problems-panel">
        <div class="panel-header">
          <h2><Icon type="ios-photos" size="18" /> {{ $t('m.Problems') }}</h2>
          <span class="problem-count">{{ contestProblems.length }} problems</span>
        </div>
        <Table
          v-if="contestProblems.length > 0"
          :columns="problemColumns"
          :data="pagedContestProblems"
          @on-row-click="goContestProblem"
          :no-data-text="$t('m.No_Problems')"
          disabled-hover
          class="problems-table"
        />
        <div v-else class="empty-tip">
          <p>{{ $t('m.No_Problems') }}</p>
        </div>
        <div class="pagination-wrapper" v-if="contestProblems.length > problemPageLimit">
          <Page
            :total="contestProblems.length"
            :page-size="problemPageLimit"
            :current.sync="problemCurrentPage"
            size="small"
            @on-change="onProblemPageChange">
          </Page>
        </div>
      </div>
    </div>

    <!-- 侧边菜单 -->
    <div v-show="showMenu" class="contest-sidebar">
      <VerticalMenu @on-click="handleRoute">
        <VerticalMenu-item :route="{name: 'contest-details', params: {contestID: contestID}}">
          <Icon type="home"></Icon>
          {{ $t('m.Overview') }}
        </VerticalMenu-item>

        <VerticalMenu-item :disabled="contestMenuDisabled"
                           :route="{name: 'contest-announcement-list', params: {contestID: contestID}}">
          <Icon type="chatbubble-working"></Icon>
          {{ $t('m.Announcements') }}
        </VerticalMenu-item>

        <VerticalMenu-item v-if="OIContestRealTimePermission"
                           :disabled="contestMenuDisabled"
                           :route="{name: 'contest-submission-list'}">
          <Icon type="navicon-round"></Icon>
          {{ $t('m.Submissions') }}
        </VerticalMenu-item>

        <VerticalMenu-item v-if="OIContestRealTimePermission"
                           :disabled="contestMenuDisabled"
                           :route="{name: 'contest-rank', params: {contestID: contestID}}">
          <Icon type="stats-bars"></Icon>
          {{ $t('m.Rankings') }}
        </VerticalMenu-item>

        <VerticalMenu-item v-if="showAdminHelper"
                           :route="{name: 'acm-helper', params: {contestID: contestID}}">
          <Icon type="ios-paw"></Icon>
          {{ $t('m.Admin_Helper') }}
        </VerticalMenu-item>
      </VerticalMenu>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import api from '@oj/api'
import { mapState, mapGetters, mapActions } from 'vuex'
import { types } from '@/store'
import { CONTEST_STATUS_REVERSE, CONTEST_STATUS } from '@/utils/constants'
import { ProblemMixin } from '@oj/components/mixins'

export default {
  name: 'ContestDetail',
  mixins: [ProblemMixin],
  data () {
    return {
      CONTEST_STATUS: CONTEST_STATUS,
      route_name: '',
      btnLoading: false,
      contestID: '',
      contestPassword: '',
      acmProblemColumns: [
        {
          title: '#',
          key: '_id',
          minWidth: 80,
          align: 'center',
          sortType: 'asc',
          render: (h, p) => h('span', {
            style: { fontWeight: 600, color: '#1e3a8a', whiteSpace: 'nowrap' }
          }, p.row._id)
        },
        {
          title: this.$i18n.t('m.Title'),
          key: 'title',
          minWidth: 260,
          render: (h, p) => h('span', {
            style: { fontWeight: 500, color: '#1e3a8a' }
          }, p.row.title)
        },
        {
          title: this.$i18n.t('m.Total'),
          key: 'submission_number',
          minWidth: 100,
          align: 'center'
        },
        {
          title: this.$i18n.t('m.AC_Rate'),
          minWidth: 120,
          align: 'center',
          render: (h, p) => {
            return h('span', this.getACRate(p.row.accepted_number, p.row.submission_number))
          }
        }
      ],
      oiProblemColumns: [
        {
          title: '#',
          key: '_id',
          minWidth: 80,
          align: 'center',
          render: (h, p) => h('span', {
            style: { fontWeight: 600, color: '#1e3a8a', whiteSpace: 'nowrap' }
          }, p.row._id)
        },
        {
          title: this.$i18n.t('m.Title'),
          key: 'title',
          minWidth: 260,
          render: (h, p) => h('span', {
            style: { fontWeight: 500, color: '#1e3a8a' }
          }, p.row.title)
        }
      ],
      problemCurrentPage: 1,
      problemPageLimit: 10
    }
  },
  mounted () {
    this.contestID = this.$route.params.contestID
    this.route_name = this.$route.name
    this.$store.dispatch('getContest').then(res => {
      this.changeDomTitle({title: res.data.data.title})
      let data = res.data.data
      let endTime = moment(data.end_time)
      if (endTime.isAfter(moment(data.now))) {
        this.timer = setInterval(() => {
          this.$store.commit(types.NOW_ADD_1S)
        }, 1000)
      }
      this.fetchProblems()
    })
  },
  methods: {
    ...mapActions(['changeDomTitle']),
    handleRoute (route) {
      this.$router.push(route)
    },
    checkPassword () {
      if (this.contestPassword === '') {
        this.$error('Password can\'t be empty')
        return
      }
      this.btnLoading = true
      api.checkContestPassword(this.contestID, this.contestPassword).then((res) => {
        this.$success('Succeeded')
        this.$store.commit(types.CONTEST_ACCESS, {access: true})
        this.btnLoading = false
        this.fetchProblems()
      }, (res) => {
        this.btnLoading = false
      })
    },
    fetchProblems () {
      this.$store.dispatch('getContestProblems').then(res => {
        if (this.isAuthenticated) {
          if (this.contestRuleType === 'ACM') {
            this.addStatusColumn(this.acmProblemColumns, res.data.data)
          } else if (this.OIContestRealTimePermission) {
            this.addStatusColumn(this.acmProblemColumns, res.data.data)
          }
          // addStatusColumn 添加的列带固定 width，会导致 table-layout: fixed
          // 将所有 width 转为 minWidth，保持 auto 布局，防止 ID 被截断
          const cols = this.acmProblemColumns
          for (let i = 0; i < cols.length; i++) {
            if (cols[i].width) {
              this.$set(cols[i], 'minWidth', cols[i].width)
              this.$delete(cols[i], 'width')
            }
          }
        }
      })
    },
    onProblemPageChange () {},
    goContestProblem (row) {
      this.$router.push({
        name: 'contest-problem-details',
        params: {
          contestID: this.$route.params.contestID,
          problemID: row._id
        }
      })
    }
  },
  computed: {
    ...mapState({
      showMenu: state => state.contest.itemVisible.menu,
      contest: state => state.contest.contest,
      contestProblems: state => state.contest.contestProblems,
      now: state => state.contest.now
    }),
    ...mapGetters(
      ['contestMenuDisabled', 'contestRuleType', 'contestStatus', 'countdown', 'isContestAdmin',
        'OIContestRealTimePermission', 'passwordFormVisible', 'isAuthenticated']
    ),
    problemColumns () {
      if (this.contestRuleType === 'ACM' || this.OIContestRealTimePermission) {
        return this.acmProblemColumns
      }
      return this.oiProblemColumns
    },
    pagedContestProblems () {
      const start = (this.problemCurrentPage - 1) * this.problemPageLimit
      return (this.contestProblems || []).slice(start, start + this.problemPageLimit)
    },
    countdownColor () {
      if (this.contestStatus) {
        return CONTEST_STATUS_REVERSE[this.contestStatus].color
      }
    },
    showAdminHelper () {
      return this.isContestAdmin && this.contestRuleType === 'ACM'
    }
  },
  watch: {
    '$route' (newVal) {
      this.route_name = newVal.name
      this.contestID = newVal.params.contestID
      this.changeDomTitle({title: this.contest.title})
      if (newVal.name === 'contest-details') {
        this.fetchProblems()
      }
    }
  },
  beforeDestroy () {
    clearInterval(this.timer)
    this.$store.commit(types.CLEAR_CONTEST)
  }
}
</script>

<style scoped lang="less">
.contest-detail-elegant {
  max-width: 1250px;
  margin: 0 auto;
  padding: 24px 20px;
  min-height: calc(100vh - 60px);
}

.overview-panel {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 12px rgba(30, 58, 138, 0.05);
  overflow: hidden;
  margin-bottom: 20px;

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 24px;
    border-bottom: 1px solid #f1f5f9;

    .contest-title {
      font-size: 1.3rem;
      font-weight: 700;
      color: #1e3a8a;
      margin: 0;
    }

    .countdown-tag {
      flex-shrink: 0;
      font-size: 14px;
    }
  }

  .panel-meta {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 12px 24px;
    border-bottom: 1px solid #f1f5f9;
    background: #fafbfc;

    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #64748b;
    }
  }

  .panel-body {
    padding: 20px 24px;
    line-height: 1.8;
    color: #334155;

    /deep/ img { max-width: 100%; border-radius: 6px; }
    /deep/ table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      th { background: #f8fafc; padding: 8px 12px; border: 1px solid #e2e8f0; text-align: left; }
      td { padding: 8px 12px; border: 1px solid #e2e8f0; }
    }
  }

  .password-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 24px;
    background: #fafbfc;
    border-top: 1px solid #f1f5f9;

    .password-input {
      max-width: 260px;
    }
  }
}

.problems-panel {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 12px rgba(30, 58, 138, 0.05);
  overflow: hidden;
  margin-bottom: 40px;

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid #f1f5f9;

    h2 {
      font-size: 1rem;
      font-weight: 600;
      color: #1e3a8a;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .problem-count {
      font-size: 13px;
      color: #94a3b8;
    }
  }
}

.problems-table {
  font-size: 14px;

  /deep/ .ivu-table {
    table-layout: auto !important;
  }

  /deep/ .ivu-table-cell {
    white-space: nowrap !important;
    overflow: visible !important;
    text-overflow: clip !important;
  }

  /deep/ .ivu-table-row {
    cursor: pointer;
  }

  /deep/ td {
    padding: 10px 8px;
    font-size: 14px;
  }

  /deep/ th {
    background: #f8fafc;
    font-weight: 600;
    color: #475569;
    border-bottom: 1px solid #e2e8f0;
    padding: 10px 8px;
    font-size: 14px;
  }

  /deep/ .ivu-table-row:hover td {
    background: #f0f9ff;
  }
}

.pagination-wrapper {
  padding: 12px 24px;
  display: flex;
  justify-content: center;
  border-top: 1px solid #f1f5f9;
}

.empty-tip {
  text-align: center;
  padding: 48px 0;
  color: #94a3b8;
  font-size: 14px;
}

.contest-sidebar {
  position: fixed;
  right: calc((100vw - 1250px) / 2 - 260px);
  top: 100px;
  width: 210px;
  z-index: 50;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e9eaec;
  overflow: hidden;

  @media (max-width: 1550px) {
    right: 20px;
  }

  @media (max-width: 1200px) {
    display: none;
  }

  /deep/ li {
    border-radius: 5px;
    margin: 3px 6px;
    border-bottom: none;
    color: #475569;

    &:first-child {
      margin-top: 6px;
    }
    &:last-child {
      margin-bottom: 6px;
    }
  }

  /deep/ li:hover {
    background: #e8f0fe;
    border-left: 2px solid #1e3a8a;
    color: #1e3a8a;
    border-radius: 5px;
  }
}
</style>
