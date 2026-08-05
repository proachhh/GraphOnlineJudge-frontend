<template>
  <div>
    <div style="padding-bottom: 10px;">
    </div>
    <panel title="Export Problems (beta)">
      <div slot="header">
        <el-input
          v-model="keyword"
          prefix-icon="el-icon-search"
          placeholder="Keywords">
        </el-input>
      </div>
      <el-table :data="problems"
                v-loading="loadingProblems" @selection-change="handleSelectionChange">
        <el-table-column
          type="selection"
          width="60">
        </el-table-column>
        <el-table-column
          label="ID"
          width="100"
          prop="id">
        </el-table-column>
        <el-table-column
          label="DisplayID"
          width="200"
          prop="_id">
        </el-table-column>
        <el-table-column
          label="Title"
          prop="title">
        </el-table-column>
        <el-table-column
          prop="created_by.username"
          label="Author">
        </el-table-column>
        <el-table-column
          prop="create_time"
          label="Create Time">
          <template slot-scope="scope">
            {{scope.row.create_time | localtime }}
          </template>
        </el-table-column>
      </el-table>

      <div class="panel-options">
        <el-button type="primary" size="small" v-show="selected_problems.length"
                   @click="exportProblems" icon="el-icon-fa-arrow-down">Export
        </el-button>
        <el-pagination
          class="page"
          layout="prev, pager, next"
          @current-change="getProblems"
          :page-size="limit"
          :total="total">
        </el-pagination>
      </div>
    </panel>
    <panel title="Import QDUOJ Problems (beta)">
      <el-upload
        ref="QDU"
        action="/api/admin/import_problem"
        name="file"
        :file-list="fileList1"
        :show-file-list="true"
        :with-credentials="true"
        :limit="3"
        :on-change="onFile1Change"
        :auto-upload="false"
        :on-success="uploadSucceeded"
        :on-error="uploadFailed">
        <el-button size="small" type="primary" icon="el-icon-fa-upload" slot="trigger">Choose File</el-button>
        <el-button style="margin-left: 10px;" size="small" type="success" @click="submitUpload('QDU')">Upload</el-button>
      </el-upload>
    </panel>

    <panel title="Import FPS Problems (beta)">
      <el-upload
        ref="FPS"
        action="/api/admin/import_fps"
        name="file"
        :file-list="fileList2"
        :show-file-list="true"
        :with-credentials="true"
        :limit="3"
        :on-change="onFile2Change"
        :auto-upload="false"
        :on-success="uploadSucceeded"
        :on-error="uploadFailed">
        <el-button size="small" type="primary" icon="el-icon-fa-upload" slot="trigger">Choose File</el-button>
        <el-button style="margin-left: 10px;" size="small" type="success" @click="submitUpload('FPS')">Upload</el-button>
      </el-upload>
    </panel>

    <panel title="从 LibreOJ 导入题目">
      <div style="margin-bottom: 15px;">
        <span style="color: #909399; font-size: 13px;">
          输入 LibreOJ 题目编号（如 1），服务器将自动获取题目数据并导入。
        </span>
      </div>
      <div style="display: flex; margin-bottom: 15px;">
        <el-input v-model="lojUrl" placeholder="输入 LOJ 题目编号，如 1" @keyup.enter.native="fetchLojProblem" :disabled="lojFetching">
          <el-button slot="append" icon="el-icon-fa-download" @click="fetchLojProblem" :loading="lojFetching">获取题目</el-button>
        </el-input>
      </div>

      <div v-if="lojFetching" style="text-align:center;padding:20px;color:#909399;">
        <i class="el-icon-loading"></i> 正在从 LOJ 获取题目数据...
      </div>

      <div v-if="lojError" class="loj-error-msg">
        <i class="el-icon-warning"></i> {{ lojError }}
      </div>

      <div v-if="lojPreview" class="loj-preview">
        <el-card shadow="never">
          <div slot="header" style="display:flex;align-items:center;justify-content:space-between;">
            <span style="font-weight:bold;">题目预览</span>
            <div>
              <el-button type="primary" size="small" @click="importLojProblem" :loading="lojImporting">
                确认导入
              </el-button>
              <el-button size="small" @click="resetLojPanel">取消</el-button>
            </div>
          </div>
          <div style="padding: 10px 0;">
            <p><strong>标题：</strong>{{ lojPreview.title }}</p>
            <p><strong>时间限制：</strong>{{ lojPreview.time_limit }} ms</p>
            <p><strong>内存限制：</strong>{{ lojPreview.memory_limit }} MB</p>
            <p><strong>难度：</strong>{{ lojPreview.difficulty }}</p>
            <p v-if="lojPreview.tags && lojPreview.tags.length">
              <strong>标签：</strong>
              <el-tag v-for="tag in lojPreview.tags" :key="tag" size="mini" style="margin-right:5px;">{{ tag }}</el-tag>
            </p>
            <p v-if="lojPreview.samples && lojPreview.samples.length">
              <strong>样例数：</strong>{{ lojPreview.samples.length }}
            </p>
          </div>
        </el-card>
      </div>

      <div v-if="lojImportResult" class="loj-import-success">
        <i class="el-icon-success"></i>
        题目导入成功！ID: {{ lojImportResult._id }}，标题: {{ lojImportResult.title }}
        <span v-if="lojImportResult.testcase_count">，测试点: {{ lojImportResult.testcase_count }} 组</span>
        <el-button type="text" @click="resetLojPanel">继续导入下一题</el-button>
      </div>
    </panel>
  </div>
</template>
<script>
  import api from '@admin/api'
  import utils from '@/utils/utils'

  export default {
    name: 'import_and_export',
    data () {
      return {
        fileList1: [],
        fileList2: [],
        page: 1,
        limit: 10,
        total: 0,
        loadingProblems: false,
        loadingImporting: false,
        keyword: '',
        problems: [],
        selected_problems: [],
        lojUrl: '',
        lojFetching: false,
        lojImporting: false,
        lojPreview: null,
        lojError: '',
        lojImportResult: null
      }
    },
    mounted () {
      this.getProblems()
    },
    methods: {
      handleSelectionChange (val) {
        this.selected_problems = val
      },
      getProblems (page = 1) {
        let params = {
          keyword: this.keyword,
          offset: (page - 1) * this.limit,
          limit: this.limit
        }
        this.loadingProblems = true
        api.getProblemList(params).then(res => {
          this.problems = res.data.data.results
          this.total = res.data.data.total
          this.loadingProblems = false
        })
      },
      exportProblems () {
        let params = []
        for (let p of this.selected_problems) {
          params.push('problem_id=' + p.id)
        }
        let url = '/admin/export_problem?' + params.join('&')
        utils.downloadFile(url)
      },
      submitUpload (ref) {
        this.$refs[ref].submit()
      },
      onFile1Change (file, fileList) {
        this.fileList1 = fileList.slice(-1)
      },
      onFile2Change (file, fileList) {
        this.fileList2 = fileList.slice(-1)
      },
      uploadSucceeded (response) {
        if (response.error) {
          this.$error(response.data)
        } else {
          this.$success('Successfully imported ' + response.data.import_count + ' problems')
          this.getProblems()
        }
      },
      uploadFailed () {
        this.$error('Upload failed')
      },
      fetchLojProblem () {
        if (!this.lojUrl.trim()) {
          this.$error('请输入 LOJ 题目编号')
          return
        }
        this.lojFetching = true
        this.lojError = ''
        this.lojPreview = null
        this.lojImportResult = null
        api.fetchLojProblem({ url: this.lojUrl.trim() }).then(res => {
          this.lojPreview = res.data.data
          this.lojFetching = false
        }).catch(err => {
          this.lojFetching = false
          let errData = err.response && err.response.data
          this.lojError = (errData && errData.data) || '获取题目失败，请检查链接或网络'
        })
      },
      importLojProblem () {
        if (!this.lojUrl.trim()) return
        this.lojImporting = true
        this.lojError = ''
        api.importLojProblem({ url: this.lojUrl.trim() }).then(res => {
          this.lojImporting = false
          this.lojPreview = null
          this.lojImportResult = res.data.data
          this.$success('题目导入成功')
          this.getProblems()
        }).catch(err => {
          this.lojImporting = false
          let errData = err.response && err.response.data
          this.lojError = (errData && errData.data) || '导入失败'
        })
      },
      resetLojPanel () {
        this.lojUrl = ''
        this.lojPreview = null
        this.lojError = ''
        this.lojImportResult = null
      }
    },
    watch: {
      'keyword' () {
        this.getProblems()
      }
    }
  }
</script>

<style scoped lang="less">
.view {
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

.loj-error-msg {
  color: #f56c6c;
  padding: 10px 0;
  font-size: 14px;
}

.loj-error-msg i {
  margin-right: 5px;
}

.loj-preview {
  margin-top: 10px;
}

.loj-import-success {
  color: #67c23a;
  padding: 15px 0;
  font-size: 14px;
}

.loj-import-success i {
  margin-right: 5px;
}
</style>
