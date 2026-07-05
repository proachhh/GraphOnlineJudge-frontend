<template>
  <div class="view forum-report-manage">
    <Panel title="举报处理">
      <div class="filter-tabs">
        <el-radio-group v-model="filterStatus" @change="currentChange(1)" size="small">
          <el-radio-button label="pending">待处理</el-radio-button>
          <el-radio-button label="resolved">已处理</el-radio-button>
          <el-radio-button label="dismissed">已驳回</el-radio-button>
        </el-radio-group>
      </div>

      <el-table
        v-loading="loading"
        element-loading-text="加载中..."
        :data="reportList"
        style="width: 100%; margin-top: 10px;">
        <el-table-column prop="reporter" label="举报人" width="120"></el-table-column>
        <el-table-column label="目标类型" width="100">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.target_type === 'post'" size="small">帖子</el-tag>
            <el-tag v-else-if="scope.row.target_type === 'comment'" type="info" size="small">评论</el-tag>
            <el-tag v-else type="warning" size="small">{{ scope.row.target_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="target_id" label="目标ID" width="90"></el-table-column>
        <el-table-column prop="reason" label="举报原因" min-width="120">
          <template slot-scope="scope">{{ scope.row.reason }}</template>
        </el-table-column>
        <el-table-column label="被举报内容" min-width="200">
          <template slot-scope="scope">
            <div v-html="scope.row.target_content" style="max-height:60px;overflow:hidden;font-size:12px;color:#666;cursor:pointer" @click="previewVisible=true;previewHtml=scope.row.target_content"></div>
          </template>
        </el-table-column>
        <el-table-column prop="detail" label="详细说明" min-width="160">
          <template slot-scope="scope">
            <el-tooltip :content="scope.row.detail" placement="top" :disabled="!scope.row.detail || scope.row.detail.length < 30">
              <span class="text-ellipsis">{{ scope.row.detail || '—' }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.status === 'pending'" type="warning" size="small">待处理</el-tag>
            <el-tag v-else-if="scope.row.status === 'resolved'" type="success" size="small">已处理</el-tag>
            <el-tag v-else-if="scope.row.status === 'dismissed'" type="info" size="small">已驳回</el-tag>
            <el-tag v-else size="small">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="举报时间" width="170">
          <template slot-scope="scope">
            {{ scope.row.create_time | localtime }}
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="100" align="center">
          <template slot-scope="{row}">
            <el-button v-if="row.status === 'pending'" type="primary" size="mini"
                       icon="el-icon-edit" @click="openHandleDialog(row)">处理</el-button>
            <span v-else>—</span>
          </template>
        </el-table-column>
      </el-table>

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

    <!-- 处理举报对话框 -->
    <el-dialog :title="'处理举报'" :visible.sync="showHandleDialog"
               :close-on-click-modal="false" width="520px">
      <el-form label-width="80px" label-position="left">
        <el-form-item label="举报人">
          <span>{{ handleTarget.reporter_name }}</span>
        </el-form-item>
        <el-form-item label="举报原因">
          <span>{{ handleTarget.reason }}</span>
        </el-form-item>
        <el-form-item label="详细说明" v-if="handleTarget.detail">
          <span>{{ handleTarget.detail }}</span>
        </el-form-item>
        <el-form-item label="处理方式" required>
          <el-radio-group v-model="handleForm.action">
            <el-radio label="resolve">通过（确认违规）</el-radio>
            <el-radio label="dismiss">驳回（不构成违规）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理备注">
          <el-input v-model="handleForm.note" type="textarea" :rows="3"
                    placeholder="可选填写处理备注..."></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <cancel @click.native="showHandleDialog = false">取消</cancel>
        <save @click.native="confirmHandle" :loading="handling">确认处理</save>
      </span>
    </el-dialog>
    <el-dialog title="内容预览" :visible.sync="previewVisible" width="750px" top="5vh">
      <div v-html="previewHtml" style="max-height:70vh;overflow-y:auto"></div>
    </el-dialog>
  </div>
</template>

<script>
  import api from '@admin/api'

  export default {
    name: 'ForumReportManage',
    data () {
      return {
        pageSize: 15,
        total: 0,
        reportList: [],
        filterStatus: 'pending',
        loading: false,
        currentPage: 1,
        showHandleDialog: false,
        handling: false,
        handleTarget: {},
        handleForm: {
          action: 'resolve',
          note: ''
        },
        previewVisible: false,
        previewHtml: ''
      }
    },
    mounted () {
      this.getReportList(1)
    },
    methods: {
      currentChange (page) {
        this.currentPage = page
        this.getReportList(page)
      },
      getReportList (page) {
        this.loading = true
        let params = {
          offset: (page - 1) * this.pageSize,
          limit: this.pageSize,
          status: this.filterStatus
        }
        api.getAdminForumReports(params).then(res => {
          this.loading = false
          this.total = res.data.data.total
          this.reportList = res.data.data.results
        }).catch(() => {
          this.loading = false
        })
      },
      openHandleDialog (row) {
        this.handleTarget = row
        this.handleForm.action = 'resolve'
        this.handleForm.note = ''
        this.showHandleDialog = true
      },
      confirmHandle () {
        this.handling = true
        api.handleAdminForumReport({
          report_id: this.handleTarget.id,
          action: this.handleForm.action,
          note: this.handleForm.note
        }).then(() => {
          this.handling = false
          this.showHandleDialog = false
          this.getReportList(this.currentPage)
        }).catch(() => {
          this.handling = false
        })
      }
    }
  }
</script>

<style scoped lang="less">
  .forum-report-manage {
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

  .filter-tabs {
    margin-bottom: 0;
  }

  .text-ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 200px;
    display: inline-block;
  }
</style>
