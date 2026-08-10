<template>
  <div class="contest-problem-list-elegant">

    <!-- 问题列表面板 -->
    <div class="problem-panel">
      <Table v-if="contestRuleType == 'ACM' || OIContestRealTimePermission"
             :columns="ACMTableColumns"
             :data="pagedProblems"
             @on-row-click="goContestProblem"
             :no-data-text="$t('m.No_Problems')"
             class="problem-table"></Table>
      <Table v-else
             :data="pagedProblems"
             :columns="OITableColumns"
             @on-row-click="goContestProblem"
             :no-data-text="$t('m.No_Problems')"
             class="problem-table"></Table>
    </div>

    <div class="pagination-wrapper" v-if="problems && problems.length > 0">
      <Pagination
        :total="problems.length"
        :page-size.sync="limit"
        :current.sync="page"
        :show-sizer="true"
        :page-size-opts="[5, 10, 20, 50]"
        @on-change="onPageChange"
        @on-page-size-change="onPageSizeChange">
      </Pagination>
    </div>
  </div>
</template>

<script>
  import {mapState, mapGetters} from 'vuex'
  import {ProblemMixin} from '@oj/components/mixins'
  import Pagination from '@oj/components/Pagination'

  export default {
    name: 'ContestProblemList',
    mixins: [ProblemMixin],
    components: { Pagination },
    data () {
      return {
        page: 1,
        limit: 5,
        ACMTableColumns: [
          {
            title: '#',
            key: '_id',
            sortType: 'asc',
            minWidth: 150,
            ellipsis: false,
            render: (h, params) => {
              return h('span', {
                style: { 'white-space': 'nowrap', 'font-weight': '600', 'color': '#1e3a8a' }
              }, params.row._id)
            }
          },
          {
            title: this.$i18n.t('m.Title'),
            render: (h, params) => {
              return h('span', {
                style: { 'white-space': 'nowrap', 'overflow': 'hidden', 'text-overflow': 'ellipsis', 'display': 'inline-block', 'max-width': '100%' },
                attrs: { title: this.cleanTitle(params.row.title) }
              }, this.cleanTitle(params.row.title))
            }
          },
          {
            title: this.$i18n.t('m.Total'),
            key: 'submission_number'
          },
          {
            title: this.$i18n.t('m.AC_Rate'),
            render: (h, params) => {
              return h('span', this.getACRate(params.row.accepted_number, params.row.submission_number))
            }
          }
        ],
        OITableColumns: [
          {
            title: '#',
            key: '_id',
            minWidth: 150,
            ellipsis: false,
            render: (h, params) => {
              return h('span', {
                style: { 'white-space': 'nowrap', 'font-weight': '600', 'color': '#1e3a8a' }
              }, params.row._id)
            }
          },
          {
            title: this.$i18n.t('m.Title'),
            render: (h, params) => {
              return h('span', {
                style: { 'white-space': 'nowrap', 'overflow': 'hidden', 'text-overflow': 'ellipsis', 'display': 'inline-block', 'max-width': '100%' },
                attrs: { title: this.cleanTitle(params.row.title) }
              }, this.cleanTitle(params.row.title))
            }
          }
        ]
      }
    },
    mounted () {
      this.getContestProblems()
    },
    computed: {
      ...mapState({
        problems: state => state.contest.contestProblems
      }),
      ...mapGetters(['isAuthenticated', 'contestRuleType', 'OIContestRealTimePermission']),
      pagedProblems () {
        const start = (this.page - 1) * this.limit
        return (this.problems || []).slice(start, start + this.limit)
      }
    },
    methods: {
      cleanTitle (title) {
        if (!title) return title
        return title.replace(/^「[^」]*」\s*/, '')
      },
      getContestProblems () {
        this.$store.dispatch('getContestProblems').then(res => {
          if (this.isAuthenticated) {
            if (this.contestRuleType === 'ACM') {
              this.addStatusColumn(this.ACMTableColumns, res.data.data)
            } else if (this.OIContestRealTimePermission) {
              this.addStatusColumn(this.ACMTableColumns, res.data.data)
            }
            // addStatusColumn 添加的列带固定 width，会强制 table-layout: fixed 导致 ID 被截断
            // 将 width 转为 minWidth，保持 auto 布局
            const cols = this.ACMTableColumns
            for (let i = 0; i < cols.length; i++) {
              if (cols[i].width) {
                this.$set(cols[i], 'minWidth', cols[i].width)
                this.$delete(cols[i], 'width')
              }
            }
          }
        })
      },
      goContestProblem (row) {
        this.$router.push({
          name: 'contest-problem-details',
          params: {
            contestID: this.$route.params.contestID,
            problemID: row._id
          }
        })
      },
      onPageChange () {},
      onPageSizeChange () {
        this.page = 1
      }
    }
  }
</script>

<style scoped lang="less">
.contest-problem-list-elegant {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: calc(100vh - 60px);
  background: linear-gradient(180deg, #f0f4f8 0%, #f8fafc 100%);
}

/* 页面标题 */
.page-header {
  text-align: center;
  margin-bottom: 40px;
  animation: fadeInDown 0.6s ease-out;

  .page-title {
    font-size: 2.2rem;
    font-weight: 600;
    color: #1e3a8a;
    letter-spacing: 0.1em;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    margin-bottom: 12px;

    .title-line {
      width: 60px;
      height: 2px;
      background: linear-gradient(90deg, transparent, #1e3a8a, #3b82f6, transparent);
      border-radius: 1px;
    }
  }

  .page-subtitle {
    font-size: 1rem;
    color: #64748b;
    letter-spacing: 0.1em;
    font-weight: 400;
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 主面板 */
.problem-panel {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(30, 58, 138, 0.08);
  overflow: hidden;
  padding: 32px;
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 12px 40px rgba(30, 58, 138, 0.12);
  }

  .problem-table {
    border-radius: 8px;
    overflow: hidden;

    ::v-deep .ivu-table {
      table-layout: auto !important;
    }

    ::v-deep .ivu-table-cell {
      white-space: nowrap !important;
      overflow: visible !important;
      text-overflow: clip !important;
    }
  }
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
