<template>
  <div class="submission-list-elegant">

    <div class="submission-panel">
      <!-- 筛选栏 -->
      <div class="filter-bar">
        <div class="filter-left">
          <Dropdown @on-click="handleResultChange" class="filter-dropdown">
            <div class="filter-btn">
              <Icon type="ios-funnel" />
              <span>{{ status }}</span>
              <Icon type="ios-arrow-down" />
            </div>
            <Dropdown-menu slot="list">
              <Dropdown-item name="">{{ $t('m.All') }}</Dropdown-item>
              <Dropdown-item v-for="status in Object.keys(JUDGE_STATUS)" :key="status" :name="status">
                <Tag :color="JUDGE_STATUS[status].color" size="small">
                  {{ $t('m.' + JUDGE_STATUS[status].name.replace(/ /g, '_')) }}
                </Tag>
              </Dropdown-item>
            </Dropdown-menu>
          </Dropdown>

          <div class="filter-switch">
            <i-switch size="small" v-model="formFilter.myself" @on-change="handleQueryChange">
            </i-switch>
            <span class="switch-label">{{ formFilter.myself ? $t('m.Mine') : $t('m.All') }}</span>
          </div>
        </div>

        <div class="filter-right">
          <div class="search-box">
            <Input v-model="formFilter.username"
                   :placeholder="$t('m.Search_Author')"
                   @on-enter="handleQueryChange"
                   class="search-input">
              <Icon type="ios-search" slot="prefix" />
            </Input>
          </div>
          <Button type="primary" class="refresh-btn" @click="getSubmissions">
            <Icon type="md-refresh" />
          </Button>
        </div>
      </div>

      <!-- 提交列表表格 -->
      <div class="table-container">
        <Table :columns="columns"
               :data="submissions"
               :loading="loadingTable"
               class="submission-table"
               disabled-hover
               @on-row-click="handleRowClick"></Table>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <Pagination :total="total"
                    :page-size="limit"
                    @on-change="changeRoute"
                    :current.sync="page"
                    :show-sizer="false">
        </Pagination>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import api from '@oj/api'
import { JUDGE_STATUS, USER_TYPE } from '@/utils/constants'
import utils from '@/utils/utils'
import time from '@/utils/time'
import Pagination from '@/pages/oj/components/Pagination'

export default {
  name: 'submissionList',
  components: {
    Pagination
  },
  data () {
    return {
      formFilter: {
        myself: false,
        result: '',
        username: ''
      },
      columns: [
        {
          title: this.$i18n.t('m.When'),
          width: 100,
          align: 'center',
          render: (h, params) => {
            return h('span', {
              style: {
                'font-size': '12px',
                'color': '#64748b'
              }
            }, time.utcToLocal(params.row.create_time))
          }
        },
        {
          title: this.$i18n.t('m.ID'),
          width: 90,
          align: 'center',
          render: (h, params) => {
            return h('span', {
              style: {
                'font-family': 'monospace',
                'font-size': '11px',
                'color': '#1e3a8a',
                'font-weight': '500',
                'white-space': 'nowrap'
              }
            }, params.row.id.slice(0, 8))
          }
        },
        {
          title: this.$i18n.t('m.Status'),
          width: 120,
          align: 'center',
          render: (h, params) => {
            return h('Tag', {
              props: {
                color: JUDGE_STATUS[params.row.result].color,
                size: 'small'
              },
              style: {
                'font-size': '11px',
                'font-weight': '500'
              }
            }, this.$i18n.t('m.' + JUDGE_STATUS[params.row.result].name.replace(/ /g, '_')))
          }
        },
        {
          title: this.$i18n.t('m.Problem'),
          width: 80,
          align: 'center',
          render: (h, params) => {
            return h('span', {
              style: {
                'color': '#1e3a8a',
                'cursor': 'pointer',
                'font-weight': '600',
                'font-size': '13px'
              },
              on: {
                click: (e) => {
                  e.stopPropagation()
                  if (this.contestID) {
                    this.$router.push({
                      name: 'contest-problem-details',
                      params: { problemID: params.row.problem, contestID: this.contestID }
                    })
                  } else {
                    this.$router.push({ name: 'problem-details', params: { problemID: params.row.problem } })
                  }
                }
              }
            }, params.row.problem)
          }
        },
        {
          title: this.$i18n.t('m.Time'),
          width: 90,
          align: 'center',
          render: (h, params) => {
            const timeCost = params.row.statistic_info.time_cost
            const color = timeCost > 1000 ? '#e6a23c' : '#67c23a'
            return h('span', {
              style: {
                'font-size': '12px',
                'color': color,
                'font-weight': '500'
              }
            }, utils.submissionTimeFormat(timeCost))
          }
        },
        {
          title: this.$i18n.t('m.Memory'),
          width: 90,
          align: 'center',
          render: (h, params) => {
            return h('span', {
              style: {
                'font-size': '12px',
                'color': '#64748b'
              }
            }, utils.submissionMemoryFormat(params.row.statistic_info.memory_cost))
          }
        },
        {
          title: this.$i18n.t('m.Language'),
          width: 100,
          align: 'center',
          key: 'language',
          render: (h, params) => {
            return h('span', {
              style: {
                'font-size': '11px',
                'color': '#475569',
                'background': '#f1f5f9',
                'padding': '2px 6px',
                'border-radius': '4px',
                'white-space': 'nowrap',
                'display': 'inline-block'
              }
            }, params.row.language)
          }
        },
        {
          title: this.$i18n.t('m.Author'),
          width: 100,
          align: 'center',
          render: (h, params) => {
            return h('a', {
              style: {
                'color': '#1e3a8a',
                'cursor': 'pointer',
                'font-weight': '500',
                'font-size': '12px',
                'white-space': 'nowrap',
                'overflow': 'hidden',
                'text-overflow': 'ellipsis',
                'max-width': '90px',
                'display': 'inline-block'
              },
              on: {
                click: (e) => {
                  e.stopPropagation()
                  this.$router.push({
                    name: 'user-home',
                    query: { username: params.row.username }
                  })
                }
              }
            }, params.row.username)
          }
        }
      ],
      loadingTable: false,
      submissions: [],
      total: 30,
      limit: 12,
      page: 1,
      contestID: '',
      problemID: '',
      routeName: '',
      JUDGE_STATUS: '',
      rejudge_column: false
    }
  },
  mounted () {
    this.init()
    this.JUDGE_STATUS = Object.assign({}, JUDGE_STATUS)
    delete this.JUDGE_STATUS['9']
    delete this.JUDGE_STATUS['2']
  },
  methods: {
    init () {
      this.contestID = this.$route.params.contestID
      let query = this.$route.query
      this.problemID = query.problemID
      this.formFilter.myself = query.myself === '1'
      this.formFilter.result = query.result || ''
      this.formFilter.username = query.username || ''
      this.page = parseInt(query.page) || 1
      if (this.page < 1) {
        this.page = 1
      }
      this.routeName = this.$route.name
      this.getSubmissions()
    },
    buildQuery () {
      return {
        myself: this.formFilter.myself === true ? '1' : '0',
        result: this.formFilter.result,
        username: this.formFilter.username,
        page: this.page
      }
    },
    getSubmissions () {
      let params = this.buildQuery()
      params.contest_id = this.contestID
      params.problem_id = this.problemID
      let offset = (this.page - 1) * this.limit
      let func = this.contestID ? 'getContestSubmissionList' : 'getSubmissionList'
      this.loadingTable = true
      api[func](offset, this.limit, params).then(res => {
        let data = res.data.data
        for (let v of data.results) {
          v.loading = false
          v.show_link = true
        }
        this.adjustRejudgeColumn()
        this.loadingTable = false
        this.submissions = data.results
        this.total = data.total
      }).catch(() => {
        this.loadingTable = false
      })
    },
    handleRowClick (row) {
      this.$router.push('/status/' + row.id)
    },
    changeRoute () {
      let query = utils.filterEmptyValue(this.buildQuery())
      query.contestID = this.contestID
      query.problemID = this.problemID
      let routeName = query.contestID ? 'contest-submission-list' : 'submission-list'
      this.$router.push({
        name: routeName,
        query: utils.filterEmptyValue(query)
      })
    },
    goRoute (route) {
      this.$router.push(route)
    },
    adjustRejudgeColumn () {
      if (!this.rejudgeColumnVisible) {
        // 如果不是管理员，移除rejudge列（如果存在）
        if (this.rejudge_column) {
          this.columns.pop()
          this.rejudge_column = false
        }
        return
      }
      // 如果已经是管理员且列已存在，不再添加
      if (this.rejudge_column) {
        return
      }
      const judgeColumn = {
        title: this.$i18n.t('m.Option'),
        align: 'center',
        width: 85,
        render: (h, params) => {
          return h('Button', {
            props: {
              type: 'primary',
              size: 'small',
              loading: params.row.loading
            },
            style: {
              'font-size': '12px',
              'padding': '0 8px'
            },
            on: {
              click: () => {
                this.handleRejudge(params.row.id, params.index)
              }
            }
          }, this.$i18n.t('m.Rejudge'))
        }
      }
      this.columns.push(judgeColumn)
      this.rejudge_column = true
    },
    handleResultChange (status) {
      this.page = 1
      this.formFilter.result = status
      this.changeRoute()
    },
    handleQueryChange () {
      this.page = 1
      this.changeRoute()
    },
    handleRejudge (id, index) {
      this.submissions[index].loading = true
      api.submissionRejudge(id).then(res => {
        this.submissions[index].loading = false
        this.$success('Succeeded')
        this.getSubmissions()
      }, () => {
        this.submissions[index].loading = false
      })
    }
  },
  computed: {
    ...mapGetters(['isAuthenticated', 'user']),
    title () {
      if (!this.contestID) {
        return this.$i18n.t('m.Status')
      } else if (this.problemID) {
        return this.$i18n.t('m.Problem_Submissions')
      } else {
        return this.$i18n.t('m.Submissions')
      }
    },
    status () {
      return this.formFilter.result === '' ? this.$t('m.Status') : this.$t('m.' + JUDGE_STATUS[this.formFilter.result].name.replace(/ /g, '_'))
    },
    rejudgeColumnVisible () {
      return !this.contestID && this.user.admin_type === USER_TYPE.SUPER_ADMIN
    }
  },
  watch: {
    '$route' (newVal, oldVal) {
      if (newVal !== oldVal) {
        this.init()
      }
    },
    'rejudgeColumnVisible' () {
      this.adjustRejudgeColumn()
    },
    'isAuthenticated' () {
      this.init()
    }
  }
}
</script>

<style scoped lang="less">
.submission-list-elegant {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

/* 页面标题 */
.page-header {
  text-align: center;
  margin-bottom: 30px;

  .page-title {
    font-size: 1.8rem;
    font-weight: 300;
    color: #1a1a2e;
    letter-spacing: 0.15em;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-bottom: 8px;

    .title-line {
      width: 50px;
      height: 1px;
      background: linear-gradient(90deg, transparent, #1e3a8a, transparent);
    }
  }

  .page-subtitle {
    font-size: 0.8rem;
    color: #64748b;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }
}

/* 主面板 */
.submission-panel {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
  background: #fafbfc;
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.filter-dropdown {
  .filter-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 14px;
    color: #334155;

    &:hover {
      border-color: #1e3a8a;
      color: #1e3a8a;
    }

    i {
      font-size: 14px;
    }
  }
}

.filter-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: #f1f5f9;
  }

  .switch-label {
    font-size: 14px;
    color: #334155;
  }
}

.filter-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-box {
  .search-input {
    width: 200px;

    /deep/ .ivu-input {
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      padding-left: 36px;

      &:focus {
        border-color: #1e3a8a;
        box-shadow: 0 0 0 2px rgba(30, 58, 138, 0.1);
      }
    }

    /deep/ .ivu-input-prefix {
      left: 12px;
      color: #94a3b8;
    }
  }
}

.refresh-btn {
  border-radius: 8px;
  background: #f1f5f9;
  border: none;
  color: #64748b;

  &:hover {
    background: #e2e8f0;
    color: #334155;
  }
}

/* 表格容器 */
.table-container {
  padding: 0;
}

.submission-table {
  /deep/ .ivu-table {
    font-size: 14px;
    table-layout: fixed;

    th {
      background: #f8fafc;
      color: #475569;
      font-weight: 600;
      border-bottom: 1px solid #e2e8f0;
      padding: 12px 8px;
      height: 44px;
      white-space: nowrap !important;
    }

    th .ivu-table-cell {
      white-space: nowrap !important;
    }

    td {
      padding: 10px 8px;
      border-bottom: 1px solid #f1f5f9;
      height: 48px;
      vertical-align: middle;
    }

    tr {
      cursor: pointer;
    }

    tr:hover td {
      background: #f8fafc;
    }
  }
}

/* 分页 */
.pagination-wrapper {
  padding: 20px 24px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: center;
}
</style>
