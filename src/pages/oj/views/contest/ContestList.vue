<template>
  <div class="contest-list-elegant">

    <div class="contest-panel">
      <!-- 筛选栏 -->
      <div class="filter-bar">
        <div class="filter-left">
          <Dropdown @on-click="onRuleChange" class="filter-dropdown">
            <div class="filter-btn">
              <Icon type="ios-funnel" />
              <span>{{ query.rule_type === '' ? $t('m.Rule') : query.rule_type }}</span>
              <Icon type="ios-arrow-down" />
            </div>
            <Dropdown-menu slot="list">
              <Dropdown-item name="">{{ $t('m.All') }}</Dropdown-item>
              <Dropdown-item name="OI">
                <Tag color="blue" size="small">OI</Tag>
              </Dropdown-item>
              <Dropdown-item name="ACM">
                <Tag color="green" size="small">ACM</Tag>
              </Dropdown-item>
            </Dropdown-menu>
          </Dropdown>

          <Dropdown @on-click="onStatusChange" class="filter-dropdown">
            <div class="filter-btn">
              <Icon type="ios-time" />
              <span>{{ query.status === '' ? $t('m.Status') : $t('m.' + CONTEST_STATUS_REVERSE[query.status].name.replace(/ /g, '_')) }}</span>
              <Icon type="ios-arrow-down" />
            </div>
            <Dropdown-menu slot="list">
              <Dropdown-item name="">{{ $t('m.All') }}</Dropdown-item>
              <Dropdown-item name="0">
                <Tag color="green" size="small">{{ $t('m.Underway') }}</Tag>
              </Dropdown-item>
              <Dropdown-item name="1">
                <Tag color="blue" size="small">{{ $t('m.Not_Started') }}</Tag>
              </Dropdown-item>
              <Dropdown-item name="-1">
                <Tag color="default" size="small">{{ $t('m.Ended') }}</Tag>
              </Dropdown-item>
            </Dropdown-menu>
          </Dropdown>
        </div>

        <div class="filter-right">
          <RadioGroup v-model="viewMode" type="button" size="small" class="view-toggle">
            <Radio label="card">
              <Icon type="ios-apps" size="14" />
            </Radio>
            <Radio label="list">
              <Icon type="ios-list" size="14" />
            </Radio>
          </RadioGroup>
          <div class="search-box">
            <Input v-model="query.keyword"
                   @on-enter="changeRoute"
                   :placeholder="$t('m.Search')"
                   class="search-input">
              <Icon type="ios-search" slot="prefix" />
            </Input>
          </div>
        </div>
      </div>

      <!-- 比赛列表 -->
      <div class="contest-list-container">
        <div v-if="contests.length === 0" class="no-contest">
          <Icon type="ios-infinite" size="48" style="color: #cbd5e1; margin-bottom: 16px;" />
          <p>{{ $t('m.No_contest') }}</p>
        </div>

        <div v-else-if="viewMode === 'card'" class="contest-cards">
          <div v-for="contest in contests" :key="contest.id" class="contest-card-item" @click="goContest(contest)">
            <div class="card-cover" v-if="getCoverImage(contest)">
              <img :src="getCoverImage(contest)" :alt="contest.title" />
              <div class="cover-status">
                <Tag :color="CONTEST_STATUS_REVERSE[contest.status].color" size="small">
                  {{ $t('m.' + CONTEST_STATUS_REVERSE[contest.status].name.replace(/ /g, '_')) }}
                </Tag>
              </div>
            </div>
            <div class="card-body">
              <div class="card-top">
                <span class="card-title">{{ contest.title }}</span>
                <Tag v-if="!getCoverImage(contest)" :color="CONTEST_STATUS_REVERSE[contest.status].color" size="small">
                  {{ $t('m.' + CONTEST_STATUS_REVERSE[contest.status].name.replace(/ /g, '_')) }}
                </Tag>
              </div>
              <div class="card-tags">
                <span class="rule-badge" :class="contest.rule_type.toLowerCase()">{{ contest.rule_type }}</span>
                <Tag v-if="contest.contest_type !== 'Public'" color="warning" size="small">
                  <Icon type="ios-lock" size="12" /> 密码保护
                </Tag>
              </div>
              <div class="card-meta">
                <span class="meta-item"><Icon type="ios-calendar" /> {{ contest.start_time | localtime('YYYY-M-D HH:mm') }}</span>
                <span class="meta-item"><Icon type="ios-time" /> {{ getDuration(contest.start_time, contest.end_time) }}</span>
              </div>
              <div class="card-action">
                <span class="enter-btn">{{ $t('m.Enter') }} <Icon type="ios-arrow-forward" /></span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="table-wrap">
          <Table :data="contests" :columns="listColumns" class="contest-table" disabled-hover
            @on-row-click="(row) => goContest(row)">
          </Table>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <Pagination
          :total="total"
          :page-size.sync="limit"
          @on-change="changeRoute"
          :current.sync="page"
          :show-sizer="true"
          @on-page-size-change="changeRoute">
        </Pagination>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@oj/api'
import { mapGetters } from 'vuex'
import utils from '@/utils/utils'
import Pagination from '@/pages/oj/components/Pagination'
import time from '@/utils/time'
import { CONTEST_STATUS_REVERSE, CONTEST_TYPE } from '@/utils/constants'

const limit = 10

export default {
  name: 'contest-list',
  components: {
    Pagination
  },
  data () {
    return {
      page: 1,
      query: {
        status: '',
        keyword: '',
        rule_type: ''
      },
      limit: limit,
      total: 0,
      contests: [],
      viewMode: 'card',
      CONTEST_STATUS_REVERSE: CONTEST_STATUS_REVERSE
    }
  },
  beforeRouteEnter (to, from, next) {
    api.getContestList(0, limit).then((res) => {
      next((vm) => {
        vm.contests = res.data.data.results
        vm.total = res.data.data.total
      })
    }, (res) => {
      next()
    })
  },
  methods: {
    init () {
      let route = this.$route.query
      this.query.status = route.status || ''
      this.query.rule_type = route.rule_type || ''
      this.query.keyword = route.keyword || ''
      this.page = parseInt(route.page) || 1
      this.limit = parseInt(route.limit) || 10
      this.getContestList(this.page)
    },
    getContestList (page = 1) {
      let offset = (page - 1) * this.limit
      api.getContestList(offset, this.limit, this.query).then((res) => {
        this.contests = res.data.data.results
        this.total = res.data.data.total
      })
    },
    changeRoute () {
      let query = Object.assign({}, this.query)
      query.page = this.page
      query.limit = this.limit

      this.$router.push({
        name: 'contest-list',
        query: utils.filterEmptyValue(query)
      })
    },
    onRuleChange (rule) {
      this.query.rule_type = rule
      this.page = 1
      this.changeRoute()
    },
    onStatusChange (status) {
      this.query.status = status
      this.page = 1
      this.changeRoute()
    },
    goContest (contest) {
      if (contest.contest_type !== CONTEST_TYPE.PUBLIC && !this.isAuthenticated) {
        this.$error(this.$i18n.t('m.Please_login_first'))
        this.$router.push('/login')
      } else {
        this.$router.push({ name: 'contest-details', params: { contestID: contest.id } })
      }
    },
    getDuration (startTime, endTime) {
      return time.duration(startTime, endTime)
    },
    getCoverImage (contest) {
      if (contest.cover_image) return contest.cover_image
      const desc = contest.description || ''
      const match = desc.match(/<img[^>]+src="([^"]+)"/)
      return match ? match[1] : null
    },
    stripDescription (desc) {
      if (!desc) return '暂无描述'
      const text = desc.replace(/<[^>]+>/g, '').trim()
      return text || '暂无描述'
    }
  },
  computed: {
    ...mapGetters(['isAuthenticated', 'user']),
    listColumns () {
      return [
        {
          title: '#',
          key: '_index',
          width: 60,
          align: 'center',
          render: (h, p) => h('span', { style: { color: '#94a3b8' } }, p.index + 1)
        },
        {
          title: '标题',
          key: 'title',
          width: 240,
          ellipsis: true,
          render: (h, p) => h('span', { style: { fontWeight: '600', color: '#1e3a8a', fontSize: '14px', whiteSpace: 'nowrap' } }, p.row.title)
        },
        {
          title: '赛制',
          key: 'rule_type',
          width: 70,
          align: 'center',
          render: (h, p) => {
            const r = p.row.rule_type
            return h('Tag', { props: { color: r === 'ACM' ? 'green' : 'blue', size: 'small' } }, r)
          }
        },
        {
          title: '状态',
          key: 'status',
          width: 100,
          align: 'center',
          render: (h, p) => {
            const s = CONTEST_STATUS_REVERSE[p.row.status]
            return h('Tag', { props: { color: s ? s.color : 'default', size: 'small' } }, s ? this.$t('m.' + s.name.replace(/ /g, '_')) : '-')
          }
        },
        {
          title: '开始时间',
          key: 'start_time',
          width: 110,
          align: 'center',
          render: (h, p) => h('span', { style: { whiteSpace: 'nowrap' } }, p.row.start_time ? new Date(p.row.start_time).toLocaleDateString('zh-CN') : '-')
        },
        {
          title: '时长',
          key: 'duration',
          width: 80,
          align: 'center',
          render: (h, p) => h('span', {}, this.getDuration(p.row.start_time, p.row.end_time))
        },
        {
          title: '类型',
          key: 'contest_type',
          width: 60,
          align: 'center',
          render: (h, p) => {
            if (p.row.contest_type !== 'Public') {
              return h('Icon', { props: { type: 'ios-lock', color: '#e6a23c', size: 16 } })
            }
            return h('span', { style: { color: '#94a3b8' } }, '-')
          }
        }
      ]
    }
  },
  watch: {
    '$route' (newVal, oldVal) {
      if (newVal !== oldVal) {
        this.init()
      }
    }
  }
}
</script>

<style lang="less" scoped>
.contest-list-elegant {
  max-width: 1200px;
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
.contest-panel {
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

.filter-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.view-toggle {
  flex-shrink: 0;
}

.search-box {
  .search-input {
    width: 240px;

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

/* 比赛列表容器 */
.contest-list-container {
  padding: 24px;
  min-height: 400px;
}

.no-contest {
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;

  p {
    font-size: 16px;
  }
}

/* 比赛卡片网格 */
.contest-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

.contest-card-item {
  background: white;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(30, 58, 138, 0.15);
    border-color: #1e3a8a;
  }
}

.card-cover {
  position: relative;
  width: 100%;
  height: 120px;
  overflow: hidden;
  border-bottom: 1px solid #f0f0f0;

  > img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .cover-status {
    position: absolute;
    top: 8px;
    right: 8px;
  }
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 10px;
}

.card-body {
  padding: 18px;
}

.card-title {
  font-size: 17px;
  font-weight: 600;
  color: #1e3a8a;
  line-height: 1.4;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-desc {
  font-size: 13px;
  color: #909399;
  line-height: 1.6;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 42px;
}

.card-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;

  .rule-badge {
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    flex-shrink: 0;

    &.oi {
      background: rgba(64, 158, 255, 0.1);
      color: #409eff;
    }

    &.acm {
      background: rgba(103, 194, 58, 0.1);
      color: #67c23a;
    }
  }
}

.card-meta {
  display: flex;
  gap: 14px;
  font-size: 13px;
  color: #606266;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
  flex-wrap: wrap;

  .meta-item {
    display: flex;
    align-items: center;
    gap: 4px;

    i {
      color: #1e3a8a;
      font-size: 13px;
    }
  }
}

.card-action {
  margin-top: 12px;

  .enter-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 14px;
    font-size: 13px;
    color: #1e3a8a;
    background: rgba(30, 58, 138, 0.08);
    border: 1px solid rgba(30, 58, 138, 0.3);
    border-radius: 6px;
    transition: all 0.2s;

    i {
      font-size: 12px;
    }
  }
}

.contest-card-item:hover .enter-btn {
  background: #1e3a8a;
  color: #fff;
}

.table-wrap {
  .contest-table {
    /deep/ .ivu-table-row { cursor: pointer; }
    /deep/ td { padding: 10px 8px; font-size: 14px; white-space: nowrap; }
    /deep/ th {
      background: #f8fafc;
      font-weight: 600;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
      padding: 10px 8px;
      font-size: 14px;
      white-space: nowrap;
    }
    /deep/ .ivu-table-row:hover td {
      background: #f0f9ff;
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
