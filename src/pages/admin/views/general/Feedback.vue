<template>
  <div class="feedback-admin">
    <el-card>
      <div slot="header" style="display:flex;justify-content:space-between;align-items:center">
        <span>反馈管理</span>
        <el-select v-model="filter" size="small" @change="load" style="width:140px">
          <el-option label="全部" value="all"/>
          <el-option label="未处理" value="false"/>
          <el-option label="已处理" value="true"/>
        </el-select>
      </div>
      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column prop="username" label="用户" width="100"/>
        <el-table-column prop="title" label="标题" min-width="160"/>
        <el-table-column label="内容" min-width="200">
          <template slot-scope="scope">
            <div v-html="scope.row.content" style="max-height:60px;overflow:hidden"/>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="时间" width="160">
          <template slot-scope="scope">{{ scope.row.create_time | localtime }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template slot-scope="scope">
            <el-tag :type="scope.row.resolved ? 'success' : 'warning'" size="small">
              {{ scope.row.resolved ? '已处理' : '未处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="openDetail(scope.row)">详情</el-button>
            <el-button v-if="!scope.row.resolved" type="text" size="small" @click="markResolved(scope.row)">标记已处理</el-button>
            <el-button type="text" size="small" style="color:#f56c6c" @click="del(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        style="margin-top:16px;text-align:right"
        :page-size="pageSize"
        :total="total"
        :current-page.sync="page"
        @current-change="load"
        layout="prev,pager,next"/>
    </el-card>

    <el-dialog :visible.sync="detailVisible" title="反馈详情" width="600px">
      <div v-if="detail">
        <p><b>用户：</b>{{ detail.username }}</p>
        <p><b>标题：</b>{{ detail.title }}</p>
        <p><b>时间：</b>{{ detail.create_time | localtime }}</p>
        <div style="margin-top:12px"><b>内容：</b></div>
        <div v-html="detail.content" style="background:#f5f5f5;padding:12px;border-radius:4px;margin-top:6px;max-height:300px;overflow:auto"/>
        <div style="margin-top:16px">
          <b>管理员备注：</b>
          <el-input v-model="detail.admin_note" type="textarea" :rows="3" placeholder="添加备注..."/>
        </div>
        <div style="margin-top:8px">
          <el-checkbox v-model="detail.resolved">已处理</el-checkbox>
          <el-button type="primary" size="small" @click="saveDetail" style="float:right">保存</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import api from '@admin/api'

export default {
  data () {
    return {
      list: [],
      loading: false,
      page: 1,
      pageSize: 15,
      total: 0,
      filter: 'all',
      detailVisible: false,
      detail: null
    }
  },
  mounted () {
    this.load()
  },
  methods: {
    load () {
      this.loading = true
      let params = { offset: (this.page - 1) * this.pageSize, limit: this.pageSize }
      if (this.filter !== 'all') params.resolved = this.filter
      api.getFeedbackList(params).then(res => {
        this.list = res.data.data.results
        this.total = res.data.data.total
        this.loading = false
      }).catch(() => { this.loading = false })
    },
    openDetail (row) {
      this.detail = { ...row }
      this.detailVisible = true
    },
    markResolved (row) {
      api.updateFeedback(row.id, { resolved: true }).then(() => {
        row.resolved = true
        this.$message.success('已标记为已处理')
      })
    },
    saveDetail () {
      api.updateFeedback(this.detail.id, {
        resolved: this.detail.resolved,
        admin_note: this.detail.admin_note || ''
      }).then(() => {
        this.detailVisible = false
        this.load()
        this.$message.success('已保存')
      })
    },
    del (row) {
      this.$confirm('确定删除？', '提示', { type: 'warning' }).then(() => {
        api.deleteFeedback(row.id).then(() => {
          this.load()
          this.$message.success('已删除')
        })
      }).catch(() => {})
    }
  }
}
</script>
