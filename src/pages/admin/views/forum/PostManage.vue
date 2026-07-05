<template>
  <div class="view forum-post-manage">
    <Panel title="帖子管理">
      <div slot="header">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-button v-show="selectedPosts.length"
                       type="danger" icon="el-icon-delete"
                       @click="batchDelete">批量删除
            </el-button>
          </el-col>
          <el-col :span="selectedPosts.length ? 18 : 24">
            <el-input v-model="keyword" prefix-icon="el-icon-search"
                      placeholder="搜索帖子标题或内容" @keyup.enter.native="currentChange(1)">
            </el-input>
          </el-col>
        </el-row>
      </div>

      <el-table
        v-loading="loading"
        element-loading-text="加载中..."
        @selection-change="handleSelectionChange"
        ref="table"
        :data="postList"
        style="width: 100%">
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="title" label="标题" min-width="180">
          <template slot-scope="scope">
            <el-tooltip :content="scope.row.title" placement="top">
              <span class="post-title">{{ scope.row.title }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="author" label="作者" width="120"></el-table-column>
        <el-table-column label="内容" min-width="200">
          <template slot-scope="scope">
            <div class="post-preview" v-html="scope.row.content" @click="previewHtml=scope.row.content; previewVisible=true" style="max-height:80px;overflow:hidden;cursor:pointer"></div>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="发布时间" width="170"></el-table-column>
        <el-table-column prop="comment_count" label="评论数" width="80" align="center"></el-table-column>
        <el-table-column prop="view_count" label="浏览数" width="80" align="center"></el-table-column>
        <el-table-column fixed="right" label="操作" width="100" align="center">
          <template slot-scope="{row}">
            <icon-btn name="删除" icon="trash" @click.native="deletePost(row.id)"></icon-btn>
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
    <el-dialog title="帖子内容预览" :visible.sync="previewVisible" width="800px" top="5vh">
      <div v-html="previewHtml" style="max-height:70vh;overflow-y:auto"></div>
    </el-dialog>
  </div>
</template>

<script>
  import api from '@admin/api'

  export default {
    name: 'ForumPostManage',
    data () {
      return {
        pageSize: 15,
        total: 0,
        postList: [],
        keyword: '',
        loading: false,
        currentPage: 1,
        selectedPosts: [],
        previewVisible: false,
        previewHtml: ''
      }
    },
    mounted () {
      this.getPostList(1)
    },
    methods: {
      currentChange (page) {
        this.currentPage = page
        this.getPostList(page)
      },
      getPostList (page) {
        this.loading = true
        let params = {
          offset: (page - 1) * this.pageSize,
          limit: this.pageSize
        }
        if (this.keyword) {
          params.keyword = this.keyword
        }
        api.getAdminForumPosts(params).then(res => {
          this.loading = false
          this.total = res.data.data.total
          this.postList = res.data.data.results
        }).catch(() => {
          this.loading = false
        })
      },
      deletePost (postId) {
        this.$confirm('确定要删除该帖子吗？删除后不可恢复。', '确认删除', {
          confirmButtonText: '删除',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          api.deleteAdminForumPosts([postId]).then(() => {
            this.getPostList(this.currentPage)
          })
        }).catch(() => {})
      },
      batchDelete () {
        if (this.selectedPosts.length === 0) {
          this.$message.warning('请先选择要删除的帖子')
          return
        }
        this.$confirm(`确定要删除选中的 ${this.selectedPosts.length} 篇帖子吗？删除后不可恢复。`, '批量删除确认', {
          confirmButtonText: '删除',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          api.deleteAdminForumPosts(this.selectedPostIDs).then(() => {
            this.getPostList(this.currentPage)
          })
        }).catch(() => {})
      },
      handleSelectionChange (val) {
        this.selectedPosts = val
      }
    },
    computed: {
      selectedPostIDs () {
        return this.selectedPosts.map(item => item.id)
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
  .forum-post-manage {
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

  .post-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 300px;
    display: inline-block;
  }
</style>
