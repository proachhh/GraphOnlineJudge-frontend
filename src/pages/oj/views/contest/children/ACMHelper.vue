<template>
  <div class="acm-helper-elegant">
    <!-- 页面标题区 -->
    <div class="page-header">
      <h1 class="page-title">
        <span class="title-line"></span>
        {{ $t('m.ACM_Helper') }}
        <span class="title-line"></span>
      </h1>
      <p class="page-subtitle">ACM Contest Helper</p>
    </div>

    <!-- 控制面板 -->
    <div class="control-panel">
      <div class="control-left">
        <ul class="filter">
          <li>
            {{ $t('m.Auto_Refresh') }} (10s)
            <i-switch style="margin-left: 5px;" @on-change="handleAutoRefresh"></i-switch>
          </li>
        </ul>
      </div>
      <div class="control-right">
        <Button type="info" @click="getACInfo">{{ $t('m.Refresh') }}</Button>
      </div>
    </div>

    <!-- 主面板 -->
    <div class="helper-panel">
      <Table :data="pagedAcInfo" :columns="columns" :loading="loadingTable" disabled-hover class="helper-table"></Table>
      <div class="pagination-wrapper">
        <pagination :total="total"
                    :page-size.sync="limit"
                    :current.sync="page"
                    @on-change="handlePage"
                    @on-page-size-change="handlePage(1)"
                    show-sizer></pagination>
      </div>
    </div>
  </div>
</template>
<script>
import { Tag, Button } from 'view-ui-plus'
  import { mapState, mapActions } from 'vuex'
  import { types } from '../../../../../store'
  import moment from 'moment'
  import Pagination from '@oj/components/Pagination.vue'
  import api from '@oj/api'

  export default {
    name: 'acm-helper',
    components: {
      Pagination
    },
    data () {
      return {
        page: 1,
        total: 0,
        loadingTable: false,
        columns: [
          {
            title: this.$i18n.t('m.AC_Time'),
            key: 'ac_time'
          },
          {
            title: this.$i18n.t('m.ProblemID'),
            align: 'center',
            key: 'problem_display_id'
          },
          {
            title: this.$i18n.t('m.First_Blood'),
            align: 'center',
            render: (h, {row}) => {
              if (row.ac_info.is_first_ac) {
                return h(Tag, {
                  color: 'red'
                }, this.$i18n.t('m.First_Blood'))
              } else {
                return h('span', '----')
              }
            }
          },
          {
            title: this.$i18n.t('m.Username'),
            align: 'center',
            render: (h, {row}) => {
              return h('a', {
                style: {
                  display: 'inline-block',
                  'max-width': '150px'
                },
                onClick: () => {
                  this.$router.push({
                    name: 'contest-submission-list',
                    query: {username: row.username}
                  })
                }
              }, row.username)
            }
          },
          {
            title: this.$i18n.t('m.RealName'),
            align: 'center',
            render: (h, {row}) => {
              return h('span', {
                style: {
                  display: 'inline-block',
                  'max-width': '150px'
                }
              }, row.real_name)
            }
          },
          {
            title: this.$i18n.t('m.Status'),
            align: 'center',
            render: (h, {row}) => {
              return h(Tag, {
                color: row.checked ? 'green' : 'yellow'
              }, row.checked ? this.$i18n.t('m.Checked') : this.$i18n.t('m.Not_Checked'))
            }
          },
          {
            title: this.$i18n.t('m.Option'),
            fixed: 'right',
            align: 'center',
            width: 100,
            render: (h, {row}) => {
              return h(Button, {
                type: 'ghost',
                size: 'small',
                icon: 'ios-checkmark',
                disabled: row.checked,
                onClick: () => {
                  this.updateCheckedStatus(row)
                }
              }, this.$i18n.t('m.Check_It'))
            }
          }
        ],
        acInfo: [],
        pagedAcInfo: [],
        problemsMap: []
      }
    },
    mounted () {
      this.contestID = this.$route.params.contestID
      if (this.contestProblems.length === 0) {
        this.getContestProblems().then((res) => {
          this.mapProblemDisplayID()
          this.getACInfo()
        })
      } else {
        this.mapProblemDisplayID()
        this.getACInfo()
      }
    },
    methods: {
      ...mapActions(['getContestProblems']),
      mapProblemDisplayID () {
        let problemsMap = {}
        this.contestProblems.forEach(ele => {
          problemsMap[ele.id] = ele._id
        })
        this.problemsMap = problemsMap
      },
      getACInfo (page = 1) {
        this.loadingTable = true
        let params = {
          contest_id: this.$route.params.contestID
        }
        api.getACMACInfo(params).then(res => {
          this.loadingTable = false
          let data = res.data.data
          this.total = data.length
          this.acInfo = data
          this.handlePage()
        }).catch(() => {
          this.loadingTable = false
        })
      },
      updateCheckedStatus (row) {
        let data = {
          rank_id: row.id,
          contest_id: this.contestID,
          problem_id: row.problem_id,
          checked: true
        }
        api.updateACInfoCheckedStatus(data).then(res => {
          this.$success('Succeeded')
          this.getACInfo()
        }).catch(() => {
        })
      },
      handleAutoRefresh (value) {
        if (value) {
          this.refreshFunc = setInterval(() => {
            this.page = 1
            this.getACInfo()
          }, 10000)
        } else {
          clearInterval(this.refreshFunc)
        }
      },
      handlePage (page = 1) {
        if (page !== 1) {
          this.loadingTable = true
        }
        let pageInfo = this.acInfo.slice((this.page - 1) * this.limit, this.page * this.limit)
        for (let v of pageInfo) {
          if (v.init) {
            continue
          } else {
            v.init = true
            v.problem_display_id = this.problemsMap[v.problem_id]
            v.ac_time = moment(this.contest.start_time).add(v.ac_info.ac_time, 'seconds').local().format('YYYY-M-D  HH:mm:ss')
          }
        }
        this.pagedAcInfo = pageInfo
        this.loadingTable = false
      }
    },
    computed: {
      ...mapState({
        'contest': state => state.contest.contest,
        'contestProblems': state => state.contest.contestProblems
      }),
      limit: {
        get () {
          return this.$store.state.contest.rankLimit
        },
        set (value) {
          this.$store.commit(types.CHANGE_CONTEST_RANK_LIMIT, {rankLimit: value})
        }
      }
    },
    beforeUnmount () {
      clearInterval(this.refreshFunc)
    }
  }
</script>
<style lang="less" scoped>
.acm-helper-elegant {
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

/* 控制面板 */
.control-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  .control-left {
    .filter {
      list-style: none;
      margin: 0;
      padding: 0;
      
      li {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: #64748b;
      }
    }
  }
}

/* 主面板 */
.helper-panel {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(30, 58, 138, 0.08);
  overflow: hidden;
  padding: 32px;
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 12px 40px rgba(30, 58, 138, 0.12);
  }

  .helper-table {
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 24px;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
  }
}
</style>
