<template>
  <div class="view forum-user-manage">
    <Panel title="用户管理">
      <div slot="header">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-input v-model="keyword" prefix-icon="el-icon-search"
                      placeholder="搜索用户名" @keyup.enter.native="currentChange(1)">
            </el-input>
          </el-col>
        </el-row>
      </div>

      <el-table
        v-loading="loading"
        element-loading-text="加载中..."
        :data="userList"
        style="width: 100%">
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="username" label="用户名" width="150"></el-table-column>
        <el-table-column label="禁言状态" width="120">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.is_muted" type="danger" size="small">已禁言</el-tag>
            <el-tag v-else type="success" size="small">正常</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="mute_duration" label="禁言时长" width="130">
          <template slot-scope="scope">
            <span v-if="scope.row.is_muted">{{ scope.row.mute_duration || '—' }}</span>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column prop="mute_reason" label="禁言原因" min-width="180">
          <template slot-scope="scope">
            <span v-if="scope.row.is_muted">{{ scope.row.mute_reason || '—' }}</span>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column prop="mute_time" label="禁言时间" width="170">
          <template slot-scope="scope">
            <span v-if="scope.row.is_muted && scope.row.mute_time">
              {{ scope.row.mute_time | localtime }}
            </span>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="160" align="center">
          <template slot-scope="{row}">
            <el-button v-if="!row.is_muted" type="warning" size="mini"
                       icon="el-icon-fa-ban" @click="openMuteDialog(row)">禁言</el-button>
            <el-button v-else type="success" size="mini"
                       icon="el-icon-fa-unlock" @click="unmuteUser(row)">解除禁言</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="!loading && userList.length === 0" style="text-align:center;padding:40px;color:#999">
        暂无用户数据
      </div>

      <div class="panel-options">
        <el-pagination
          class="page"
          layout="prev, pager, next"
          @current-change="currentChange"
          :page-size="pageSize"
          :total="total">
        </el-pagination>
      </div>
    </Panel>

    <!-- 禁言对话框 -->
    <el-dialog :title="'禁言用户: ' + muteTarget.username" :visible.sync="showMuteDialog"
               :close-on-click-modal="false" width="480px">
      <el-form :model="muteForm" label-width="80px" label-position="left">
        <el-form-item label="禁言时长" required>
          <el-select v-model="muteForm.duration" placeholder="请选择禁言时长" style="width: 100%">
            <el-option label="1小时" value="1"></el-option>
            <el-option label="24小时" value="24"></el-option>
            <el-option label="7天" value="168"></el-option>
            <el-option label="30天" value="720"></el-option>
            <el-option label="永久" value="forever"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="禁言原因">
          <el-input v-model="muteForm.reason" type="textarea" :rows="3"
                    placeholder="请输入禁言原因（可选）"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <cancel @click.native="showMuteDialog = false">取消</cancel>
        <save @click.native="confirmMute" :loading="muting">确定禁言</save>
      </span>
    </el-dialog>
  </div>
</template>

<script>
  import api from '@admin/api'

  export default {
    name: 'ForumUserManage',
    data () {
      return {
        pageSize: 15,
        total: 0,
        userList: [],
        keyword: '',
        loading: false,
        currentPage: 1,
        showMuteDialog: false,
        muting: false,
        muteTarget: {},
        muteForm: {
          duration: '1',
          reason: ''
        }
      }
    },
    mounted () {
      this.getUserList(1)
    },
    methods: {
      currentChange (page) {
        this.currentPage = page
        this.getUserList(page)
      },
      getUserList (page) {
        this.loading = true
        let params = {
          offset: (page - 1) * this.pageSize,
          limit: this.pageSize
        }
        if (this.keyword) {
          params.keyword = this.keyword
        }
        api.getAdminForumUsers(params).then(res => {
          this.loading = false
          this.total = res.data.data.total || 0
          this.userList = res.data.data.results || []
        }).catch(err => {
          this.loading = false
          this.userList = []
          this.total = 0
          this.$error('加载用户列表失败')
        })
      },
      openMuteDialog (row) {
        this.muteTarget = row
        this.muteForm.duration = '1'
        this.muteForm.reason = ''
        this.showMuteDialog = true
      },
      confirmMute () {
        if (!this.muteForm.duration) {
          this.$message.warning('请选择禁言时长')
          return
        }
        this.muting = true
        api.muteAdminForumUser({
          user_id: this.muteTarget.id,
          duration: this.muteForm.duration,
          reason: this.muteForm.reason
        }).then(() => {
          this.muting = false
          this.showMuteDialog = false
          this.getUserList(this.currentPage)
        }).catch(() => {
          this.muting = false
        })
      },
      unmuteUser (row) {
        this.$confirm(`确定要解除对用户 "${row.username}" 的禁言吗？`, '确认解除禁言', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          api.unmuteAdminForumUser(row.id).then(() => {
            this.getUserList(this.currentPage)
          })
        }).catch(() => {})
      }
    },
    watch: {
      'keyword' () {
        this.currentChange(1)
      }
    }
  }
</script>

<style scoped lang="less">
  .forum-user-manage {
    padding: 20px;
    min-height: calc(100vh - 60px);
    background: linear-gradient(180deg, #f0f4f8 0%, #f8fafc 100%);
    animation: fadeInDown 0.6s ease-out;
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
</style>
