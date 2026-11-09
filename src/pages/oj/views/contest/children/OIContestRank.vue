<template>
  <div class="oi-contest-rank-elegant">

    <!-- 控制面板 -->
    <div class="control-panel">
      <div class="control-left">
        <screen-full :height="18" :width="18" class="screen-full"></screen-full>
      </div>
      <div class="control-right">
        <Poptip trigger="hover" placement="left-start">
          <Button type="default" size="small" icon="ios-settings">
            {{$t('m.Settings')}}
          </Button>
          <template #content><div id="switches">
            <p>
              <span>{{$t('m.Menu')}}</span>
              <i-switch v-model="showMenu"></i-switch>
              <span>{{$t('m.Chart')}}</span>
              <i-switch v-model="showChart"></i-switch>
            </p>
            <p>
              <span>{{$t('m.Auto_Refresh')}}(10s)</span>
              <i-switch :disabled="refreshDisabled" @on-change="handleAutoRefresh"></i-switch>
            </p>
            <p v-if="isContestAdmin">
              <span>{{$t('m.RealName')}}</span>
              <i-switch v-model="showRealName"></i-switch>
            </p>
            <p>
              <Button type="primary" size="small" @click="downloadRankCSV">{{$t('m.download_csv')}}</Button>
            </p>
          </div></template>
        </Poptip>
      </div>
    </div>

    <!-- 主面板 -->
    <div class="rank-panel">
      <div v-show="showChart" class="echarts">
        <ECharts :options="options" ref="chart" auto-resize></ECharts>
      </div>
      <Table ref="tableRank" class="rank-table" :columns="columns" :data="dataRank" disabled-hover></Table>
      <div class="pagination-wrapper">
        <Pagination :total="total"
                    :page-size.sync="limit"
                    :current.sync="page"
                    @on-change="getContestRankData"
                    @on-page-size-change="getContestRankData(1)"
                    show-sizer></Pagination>
      </div>
    </div>
  </div>
</template>
<script>
  import { mapActions } from 'vuex'

  import Pagination from '@oj/components/Pagination'
  import ContestRankMixin from './contestRankMixin'
  import utils from '@/utils/utils'

  export default {
    name: 'acm-contest-rank',
    components: {
      Pagination
    },
    mixins: [ContestRankMixin],
    data () {
      return {
        total: 0,
        page: 1,
        contestID: '',
        columns: [
          {
            align: 'center',
            width: 60,
            render: (h, params) => {
              return h('span', {}, params.index + (this.page - 1) * this.limit + 1)
            }
          },
          {
            title: this.$i18n.t('m.User_User'),
            align: 'center',
            render: (h, params) => {
              return h('a', {
                style: {
                  display: 'inline-block',
                  'max-width': '150px'
                },
                on: {
                  click: () => {
                    this.$router.push(
                      {
                        name: 'user-home',
                        query: {username: params.row.user.username}
                      })
                  }
                }
              }, params.row.user.username)
            }
          },
          {
            title: this.$i18n.t('m.Total_Score'),
            align: 'center',
            render: (h, params) => {
              return h('a', {
                on: {
                  click: () => {
                    this.$router.push({
                      name: 'contest-submission-list',
                      query: {username: params.row.user.username}
                    })
                  }
                }
              }, params.row.total_score)
            }
          }
        ],
        dataRank: [],
        options: {
          title: {
            text: this.$i18n.t('m.Top_10_Teams'),
            left: 'center'
          },
          tooltip: {
            trigger: 'axis'
          },
          toolbox: {
            show: true,
            feature: {
              dataView: {show: true, readOnly: true},
              magicType: {show: true, type: ['line', 'bar']},
              saveAsImage: {show: true}
            },
            right: '10%'
          },
          calculable: true,
          xAxis: [
            {
              type: 'category',
              data: ['root'],
              boundaryGap: true,
              axisLabel: {
                interval: 0,
                showMinLabel: true,
                showMaxLabel: true,
                align: 'center',
                formatter: (value, index) => {
                  return utils.breakLongWords(value, 14)
                }
              },
              axisTick: {
                alignWithLabel: true
              }
            }
          ],
          yAxis: [
            {
              type: 'value'
            }
          ],
          series: [
            {
              name: this.$i18n.t('m.Score'),
              type: 'bar',
              barMaxWidth: '80',
              data: [0],
              markPoint: {
                data: [
                  {type: 'max', name: 'max'}
                ]
              }
            }
          ]
        }
      }
    },
    mounted () {
      this.contestID = this.$route.params.contestID
      this.getContestRankData(1)
      if (this.contestProblems.length === 0) {
        this.getContestProblems().then((res) => {
          this.addTableColumns(res.data.data)
        })
      } else {
        this.addTableColumns(this.contestProblems)
      }
    },
    methods: {
      ...mapActions(['getContestProblems']),
      applyToChart (rankData) {
        let [usernames, scores] = [[], []]
        rankData.forEach(ele => {
          usernames.push(ele.user.username)
          scores.push(ele.total_score)
        })
        this.options.xAxis[0].data = usernames
        this.options.series[0].data = scores
      },
      applyToTable (data) {
        // deepcopy
        let dataRank = JSON.parse(JSON.stringify(data))
        // 从submission_info中取出相应的problem_id 放入到父object中,这么做主要是为了适应iview table的data格式
        // 见https://www.iviewui.com/components/table
        dataRank.forEach((rank, i) => {
          let info = rank.submission_info
          Object.keys(info).forEach(problemID => {
            dataRank[i][problemID] = info[problemID]
          })
        })
        this.dataRank = dataRank
      },
      addTableColumns (problems) {
        problems.forEach(problem => {
          this.columns.push({
            align: 'center',
            key: problem.id,
            renderHeader: (h, params) => {
              return h('a', {
                'class': {
                  'emphasis': true
                },
                on: {
                  click: () => {
                    this.$router.push({
                      name: 'contest-problem-details',
                      params: {
                        contestID: this.contestID,
                        problemID: problem._id
                      }
                    })
                  }
                }
              }, problem._id)
            },
            render: (h, params) => {
              return h('span', params.row[problem.id])
            }
          })
        })
      },
      downloadRankCSV () {
        utils.downloadFile(`contest_rank?download_csv=1&contest_id=${this.$route.params.contestID}&force_refrash=${this.forceUpdate ? '1' : '0'}`)
      }
    }
  }
</script>
<style scoped lang="less">
.oi-contest-rank-elegant {
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
    .screen-full {
      cursor: pointer;
    }
  }
}

/* 主面板 */
.rank-panel {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(30, 58, 138, 0.08);
  overflow: hidden;
  padding: 32px;
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 12px 40px rgba(30, 58, 138, 0.12);
  }

  .echarts {
    margin-bottom: 24px;
    height: 400px;
    width: 100%;
  }

  .rank-table {
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 24px;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
  }
}

#switches {
  p {
    margin-top: 8px;
    &:first-child {
      margin-top: 0;
    }
    span {
      margin-left: 8px;
    }
  }
}
</style>
