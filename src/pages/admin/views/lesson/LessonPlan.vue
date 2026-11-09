<template>
  <div class="lesson-plan-management">
    <Panel :title="$t('m.Lesson_Plan_Management')">
      <div class="list">
        <el-table
          v-loading="loading"
          :element-loading-text="$t('m.Loading')"
          ref="table"
          :data="lessonPlanList"
          style="width: 100%">
          <el-table-column
            width="80"
            prop="id"
            :label="$t('m.ID')">
          </el-table-column>
          <el-table-column
            prop="title"
            :label="$t('m.Title_Col')"
            min-width="200">
          </el-table-column>
          <el-table-column
            prop="description"
            :label="$t('m.Description_Col')"
            width="130">
            <template #default="scope">
              <span class="description-text" :title="scope.row.description">{{ shortDesc(scope.row.description) }}</span>
            </template>
          </el-table-column>
          <el-table-column
            width="100"
            prop="problems_count"
            :label="$t('m.Problems')">
          </el-table-column>
          <el-table-column
            width="160"
            prop="create_time"
            :label="$t('m.CreateTime')">
            <template #default="scope">
              {{ scope.row.create_time | localtime }}
            </template>
          </el-table-column>
          <el-table-column
            width="120"
            prop="created_by_username"
            :label="$t('m.Author')">
          </el-table-column>
          <el-table-column
            width="100"
            prop="visible"
            :label="$t('m.Visibility')">
            <template #default="scope">
              <el-switch v-model="scope.row.visible"
                         active-text=""
                         inactive-text=""
                         @change="handleVisibleSwitch(scope.row)">
              </el-switch>
            </template>
          </el-table-column>
          <el-table-column
            fixed="right"
            :label="$t('m.Option')"
            width="200">
            <div slot-scope="scope">
              <icon-btn :name="$t('m.Edit')" icon="ios-create" @click.native="openLessonPlanDialog(scope.row.id)"></icon-btn>
              <icon-btn :name="$t('m.Delete')" icon="ios-trash" @click.native="deleteLessonPlan(scope.row.id)"></icon-btn>
            </div>
          </el-table-column>
        </el-table>
        <div class="panel-options">
          <div class="left-actions">
            <el-button type="primary" size="small" @click="openLessonPlanDialog(null)" icon="el-icon-plus">{{ $t('m.Create') }}</el-button>
            <el-button type="success" size="small" @click="openBatchImport" icon="el-icon-upload2">{{ $t('m.Batch_Import_Lesson') }}</el-button>
          </div>
          <el-pagination
            class="page"
            layout="prev, pager, next"
            @current-change="currentChange"
            :page-size="pageSize"
            :total="total">
          </el-pagination>
        </div>
      </div>
    </Panel>

    <!-- 批量导入 Markdown 文件对话框 -->
    <el-dialog :title="$t('m.Batch_Import_MD_Title')" :visible.sync="showBatchImport"
               :close-on-click-modal="false" width="60%" @close="resetBatchImport">
      <p class="batch-import-desc">{{ $t('m.Batch_Import_Desc_MD') }}</p>
      <div class="batch-upload-area">
        <input
          ref="batchFileInput"
          type="file"
          multiple
          :key="fileInputKey"
          accept=".md,.markdown,text/markdown"
          style="display:none"
          @change="handleBatchFilesSelected"
        />
        <el-button size="small" type="primary" icon="el-icon-upload2" @click="$refs.batchFileInput.click()">{{ $t('m.Batch_Upload_MD_Files') }}</el-button>
        <div v-if="batchFileCount > 0" class="batch-file-count">
          {{ batchFileCount }} 个文件已选择
        </div>
      </div>
      <div v-if="batchPreview.length > 0" class="batch-preview">
        <div class="batch-preview-header">{{ $t('m.Import_Preview') }} ({{ batchPreview.length }} {{ $t('m.Files') }})</div>
        <div class="batch-preview-list">
          <div v-for="(item, idx) in batchPreview" :key="idx" class="batch-preview-item">
            <span class="batch-idx">{{ idx + 1 }}.</span>
            <span class="batch-title">{{ item.title }}</span>
            <span class="batch-desc">{{ item.description }}</span>
          </div>
        </div>
        <div class="batch-preview-hint">{{ $t('m.Auto_Fill_From_MD') }}</div>
      </div>
      <template #footer><span class="dialog-footer">
        <el-button @click="showBatchImport = false; resetBatchImport()">{{ $t('m.Cancel') }}</el-button>
        <el-button type="primary" @click="submitBatchImport" :disabled="batchPreview.length === 0">{{ $t('m.Import_All_Files') }}</el-button>
      </span></template>
    </el-dialog>

    <!-- 教案编辑对话框 -->
    <el-dialog :title="lessonPlanDialogTitle" :visible.sync="showEditDialog"
               :close-on-click-modal="false" width="80%">
      <el-form label-position="top" :model="lessonPlan" ref="form">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('m.Lesson_Plan_Title')" required>
              <el-input v-model="lessonPlan.title" :placeholder="$t('m.Lesson_Plan_Title')"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('m.Brief_Description')" required>
              <el-input v-model="lessonPlan.description" :placeholder="$t('m.Brief_Description')"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item :label="$t('m.Content')" required>
          <div class="content-type-switch">
            <el-radio-group v-model="lessonPlan.content_type" size="small">
              <el-radio-button label="html">{{ $t('m.Rich_Editor_Label') }}</el-radio-button>
              <el-radio-button label="markdown">{{ $t('m.Markdown_File_Label') }}</el-radio-button>
            </el-radio-group>
          </div>
          <div v-show="lessonPlan.content_type === 'html'">
            <Simditor ref="simditor" v-model="lessonPlan.content"></Simditor>
          </div>
          <div v-show="lessonPlan.content_type === 'markdown'">
            <div class="md-upload-area">
              <el-upload
                class="md-upload"
                action=""
                :auto-upload="false"
                :show-file-list="false"
                :on-change="handleMdFileChange"
                accept=".md,.markdown,text/markdown">
                <el-button size="small" type="primary" icon="el-icon-upload">{{ $t('m.Upload_MD_File') }}</el-button>
              </el-upload>
              <div v-if="mdFileName" class="md-file-info">
                <el-icon-document/>
                <span>{{ mdFileName }}</span>
                <el-button type="text" size="mini" @click="clearMdFile" icon="el-icon-delete">{{ $t('m.Remove') }}</el-button>
              </div>
              <div v-if="mdContent" class="md-preview">
                <div class="md-preview-header">{{ $t('m.Preview') }}:</div>
                <div class="md-preview-content" v-html="renderMarkdown(mdContent)"></div>
              </div>
            </div>
          </div>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('m.Cover_Image')">
              <el-upload
                class="upload-demo"
                action="/api/admin/upload_file/"
                :show-file-list="false"
                :on-success="handleCoverUpload"
                :before-upload="beforeUpload">
                <el-button size="small" type="primary" icon="el-icon-upload">{{ $t('m.Upload_Cover_Image') }}</el-button>
              </el-upload>
              <div v-if="lessonPlan.cover_image" class="preview-image">
                <img :src="lessonPlan.cover_image" alt="Cover" />
                <el-button type="text" @click="lessonPlan.cover_image = ''" icon="el-icon-delete">{{ $t('m.Remove') }}</el-button>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('m.PDF_File')">
              <el-upload
                class="upload-demo"
                action="/api/admin/upload_file/"
                :show-file-list="false"
                :on-success="handlePdfUpload"
                :before-upload="beforePdfUpload">
                <el-button size="small" type="primary" icon="el-icon-upload">{{ $t('m.Upload_PDF') }}</el-button>
              </el-upload>
              <div v-if="lessonPlan.pdf_file" class="pdf-file-info">
                <div class="pdf-file-row">
                  <el-icon-document/>
                  <span class="pdf-file-name">{{ pdfFileName }}</span>
                  <el-button type="text" size="mini" @click="previewPdf" icon="el-icon-view">{{ $t('m.Preview') }}</el-button>
                  <el-button type="text" size="mini" @click="lessonPlan.pdf_file = ''" icon="el-icon-delete">{{ $t('m.Remove') }}</el-button>
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-dialog :title="$t('m.PDF_Preview')" :visible.sync="showPdfPreview" width="80%">
          <embed :src="lessonPlan.pdf_file" type="application/pdf" width="100%" height="700px" />
        </el-dialog>

        <el-form-item :label="$t('m.Related_Problems')">
          <div class="problem-selector">
            <el-input
              v-model="problemSearchKeyword"
              :placeholder="$t('m.Search_Problems')"
              @input="searchProblems"
              clearable>
              <template #append><el-button icon="el-icon-search" @click="searchProblems"></el-button></template>
            </el-input>
            <div class="selected-problems-actions" v-if="searchResults.length > 0">
              <el-button type="text" size="mini" @click="selectAllProblems">{{ $t('m.Select_All_Problems') }}</el-button>
            </div>
            <div class="selected-problems" v-if="selectedProblems.length > 0">
              <el-tag
                v-for="problem in selectedProblems"
                :key="problem.id"
                closable
                @close="removeProblem(problem.id)"
                type="success">
                {{ problem._id }} - {{ problem.title }}
              </el-tag>
            </div>
            <div class="search-results" v-if="searchResults.length > 0">
              <div
                v-for="problem in searchResults"
                :key="problem.id"
                class="search-result-item"
                @click="addProblem(problem)"
                :class="{ 'selected': isProblemSelected(problem.id) }">
                <span>{{ problem._id }}</span>
                <span>{{ problem.title }}</span>
                <el-tag size="mini" :type="getDifficultyType(problem.difficulty)">{{ problem.difficulty }}</el-tag>
              </div>
            </div>
          </div>
        </el-form-item>

        <el-form-item :label="$t('m.Visibility')">
          <el-switch
            v-model="lessonPlan.visible"
            active-text=""
            inactive-text="">
          </el-switch>
        </el-form-item>
      </el-form>
      <template #footer><span class="dialog-footer">
        <el-button @click="showEditDialog = false">{{ $t('m.Cancel') }}</el-button>
        <el-button type="primary" @click="submitLessonPlan">{{ $t('m.Save') }}</el-button>
      </span></template>
    </el-dialog>
  </div>
</template>

<script>
import Simditor from '../../components/Simditor.vue'
import api from '../../api.js'
import { renderMarkdown } from '@/utils/markdown'

export default {
  name: 'LessonPlanManagement',
  components: {
    Simditor
  },
  data () {
    return {
      lessonPlanList: [],
      loading: false,
      total: 0,
      pageSize: 15,
      currentPage: 1,
      showEditDialog: false,
      showBatchImport: false,
      batchFileList: [],
      batchFileCount: 0,
      batchPreview: [],
      fileInputKey: 0,
      currentLessonPlanId: null,
      mode: 'create',
      showPdfPreview: false,
      pdfFileName: '',
      mdFileName: '',
      mdContent: '',
      lessonPlan: {
        title: '',
        description: '',
        content: '',
        content_type: 'html',
        pdf_file: '',
        cover_image: '',
        visible: true,
        problem_ids: []
      },
      lessonPlanDialogTitle: '',
      problemSearchKeyword: '',
      searchResults: [],
      selectedProblems: []
    }
  },
  mounted () {
    this.lessonPlanDialogTitle = this.$t('m.Create_Lesson_Plan')
    this.getLessonPlanList()
  },
  methods: {
    currentChange (page) {
      this.currentPage = page
      this.getLessonPlanList(page)
    },
    getLessonPlanList (page = 1) {
      this.loading = true
      api.getLessonPlanList({
        offset: (page - 1) * this.pageSize,
        limit: this.pageSize
      }).then(res => {
        this.loading = false
        const data = res.data.data
        console.log('LP admin getList total:', data.total, 'results:', (data.results || []).length)
        this.total = Number(data.total) || 0
        this.lessonPlanList = data.results || []
      }, res => {
        this.loading = false
        this.lessonPlanList = []
        this.total = 0
      })
    },
    openLessonPlanDialog (id) {
      if (id) {
        this.mode = 'edit'
        this.currentLessonPlanId = id
        this.lessonPlanDialogTitle = this.$t('m.Edit_Lesson_Plan')
        this.loadLessonPlanDetail(id)
      } else {
        this.mode = 'create'
        this.currentLessonPlanId = null
        this.lessonPlanDialogTitle = this.$t('m.Create_Lesson_Plan')
        this.resetForm()
      }
      this.showEditDialog = true
    },
    loadLessonPlanDetail (id) {
      api.getLessonPlanDetail(id).then(res => {
        const data = res.data.data
        const isMarkdown = (data.content || '').startsWith('[MD]')
        this.lessonPlan = {
          id: data.id,
          title: data.title,
          description: data.description,
          content: isMarkdown ? '' : (data.content || ''),
          content_type: isMarkdown ? 'markdown' : 'html',
          pdf_file: data.pdf_file || '',
          cover_image: data.cover_image || '',
          visible: data.visible,
          problem_ids: data.problems ? data.problems.map(p => p.id) : []
        }
        this.mdContent = isMarkdown ? data.content.replace(/^\[MD\]\n?/, '') : ''
        this.mdFileName = isMarkdown ? (data.title + '.md') : ''
        this.selectedProblems = data.problems || []
      }).catch(() => {
        this.$error(this.$t('m.Load_Detail_Failed'))
      })
    },
    resetForm () {
      this.lessonPlan = {
        title: '',
        description: '',
        content: '',
        content_type: 'html',
        pdf_file: '',
        cover_image: '',
        visible: true,
        problem_ids: []
      }
      this.selectedProblems = []
      this.searchResults = []
      this.problemSearchKeyword = ''
      this.mdFileName = ''
      this.mdContent = ''
    },
    submitLessonPlan () {
      const hasContent = this.lessonPlan.content_type === 'markdown'
        ? this.mdContent
        : this.lessonPlan.content
      if (!this.lessonPlan.title || !hasContent) {
        this.$error(this.$t('m.Fill_Required'))
        return
      }
      const problemIds = this.selectedProblems.map(p => p.id)
      const finalContent = this.lessonPlan.content_type === 'markdown'
        ? '[MD]\n' + this.mdContent
        : this.lessonPlan.content
      const data = {
        title: this.lessonPlan.title,
        description: this.lessonPlan.description || '',
        content: finalContent,
        visible: this.lessonPlan.visible
      }
      if (this.lessonPlan.pdf_file) {
        data.pdf_file = this.lessonPlan.pdf_file
      }
      if (this.lessonPlan.cover_image) {
        data.cover_image = this.lessonPlan.cover_image
      }
      if (problemIds.length > 0) {
        data.problem_ids = problemIds
      }
      let funcName = ''
      if (this.mode === 'create') {
        funcName = 'createLessonPlan'
      } else {
        funcName = 'updateLessonPlan'
        data.id = this.currentLessonPlanId
      }
      api[funcName](data).then(() => {
        this.$success(this.mode === 'create' ? this.$t('m.Create_Success') : this.$t('m.Update_Success'))
        this.showEditDialog = false
        this.getLessonPlanList(this.currentPage)
      }).catch(err => {
        console.error('Lesson plan submit error:', err)
        let errorMsg = this.$t('m.Update_Failed')
        if (err && err.data && err.data.data) {
          errorMsg = err.data.data
        } else if (err && err.data && typeof err.data === 'string') {
          errorMsg = err.data
        }
        this.$error(errorMsg)
      })
    },
    deleteLessonPlan (id) {
      this.$confirm(this.$t('m.Confirm_Delete_Content'), this.$t('m.Confirm_Delete_Title'), {
        confirmButtonText: this.$t('m.Delete'),
        cancelButtonText: this.$t('m.Cancel'),
        type: 'warning'
      }).then(() => {
        api.deleteLessonPlan(id).then(() => {
          this.$success(this.$t('m.Delete_Success'))
          this.getLessonPlanList(this.currentPage)
        }).catch(() => {
          this.$error(this.$t('m.Delete_Failed'))
        })
      }).catch(() => {})
    },
    handleVisibleSwitch (row) {
      api.updateLessonPlan({
        id: row.id,
        visible: row.visible
      }).then(() => {
        this.$success(this.$t('m.Visibility_Updated'))
      }).catch(() => {
        row.visible = !row.visible
        this.$error(this.$t('m.Update_Failed'))
      })
    },
    handleCoverUpload (response) {
      if (response.success || response.error === null || response.error === undefined) {
        this.lessonPlan.cover_image = response.file_path || response.url || ''
        this.$success(this.$t('m.Cover_Upload_Success'))
      } else {
        this.$error(this.$t('m.Upload_Failed') + ': ' + (response.msg || ''))
      }
    },
    handlePdfUpload (response, file) {
      if (response.success || response.error === null || response.error === undefined) {
        let filePath = response.file_path || response.url || ''
        filePath = filePath.replace(/^\/+/, '')
        this.lessonPlan.pdf_file = '/' + filePath
        this.pdfFileName = response.file_name || file.name
        this.$success(this.$t('m.PDF_Upload_Success'))
      } else {
        this.$error(this.$t('m.Upload_Failed') + ': ' + (response.msg || ''))
      }
    },
    previewPdf () {
      this.showPdfPreview = true
    },
    handleMdFileChange (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        this.mdContent = e.target.result
        this.mdFileName = file.name

        const rawName = file.name.replace(/\.(md|markdown)$/i, '')
        let title = rawName
        if (/^\s*#+\s*/.test(title)) {
          title = title.replace(/^\s*#+\s*/, '')
        }
        title = title.trim()
        if (title && !this.lessonPlan.title) {
          this.lessonPlan.title = title
        }
        if (title && !this.lessonPlan.description) {
          this.lessonPlan.description = '关于「' + title + '」的教学内容。'
        }
      }
      reader.readAsText(file.raw)
    },
    clearMdFile () {
      this.mdContent = ''
      this.mdFileName = ''
    },
    renderMarkdown (md) {
      return renderMarkdown(md)
    },
    beforeUpload (file) {
      const isImage = file.type.startsWith('image/')
      if (!isImage) {
        this.$error(this.$t('m.Image_Only'))
      }
      return isImage
    },
    beforePdfUpload (file) {
      const isPdf = file.type === 'application/pdf'
      if (!isPdf) {
        this.$error(this.$t('m.PDF_Only'))
      }
      return isPdf
    },

    openBatchImport () {
      this.resetBatchImport()
      this.showBatchImport = true
    },
    handleBatchFilesSelected (e) {
      const files = Array.from(e.target.files)
      if (!files.length) return

      const newFiles = files.filter(f => {
        const rawName = f.name.replace(/\.(md|markdown)$/i, '')
        let title = rawName.replace(/^\s*#+\s*/, '').trim()
        return !this.batchPreview.some(p => p.title === title)
      })
      if (files.length !== newFiles.length) {
        this.$message.info(files.length - newFiles.length + ' 个文件已存在，跳过')
      }
      if (!newFiles.length) {
        this.fileInputKey++
        return
      }

      this.batchFileCount += newFiles.length

      let loaded = 0
      newFiles.forEach((file) => {
        const rawName = file.name.replace(/\.(md|markdown)$/i, '')
        let title = rawName
        if (/^\s*#+\s*/.test(title)) {
          title = title.replace(/^\s*#+\s*/, '')
        }
        title = title.trim()
        const description = '关于「' + title + '」的教学内容。'

        const reader = new FileReader()
        reader.onload = (ev) => {
          loaded++
          this.batchPreview.push({
            title, description,
            content: ev.target.result,
            fileName: file.name
          })
          if (loaded === newFiles.length) {
            this.batchPreview.sort((a, b) => a.title.localeCompare(b.title, 'zh-Hans-CN'))
            this.fileInputKey++
          }
        }
        reader.onerror = () => { loaded++ }
        reader.readAsText(file)
      })
    },
    resetBatchImport () {
      this.batchFileList = []
      this.batchFileCount = 0
      this.batchPreview = []
      this.fileInputKey++
    },
    async submitBatchImport () {
      if (this.batchPreview.length === 0) return
      this.loading = true
      let successCount = 0
      let failCount = 0
      const total = this.batchPreview.length

      for (let i = 0; i < total; i++) {
        const item = this.batchPreview[i]
        try {
          await api.createLessonPlan({
            title: item.title,
            description: item.description,
            content: '[MD]\n' + item.content,
            visible: true,
            problem_ids: []
          })
          successCount++
        } catch (err) {
          console.error('Batch import error for ' + item.title + ':', err)
          failCount++
        }
      }

      this.loading = false
      if (failCount === 0) {
        this.$success(this.$t('m.Import_Success') + ' (' + successCount + ')，可继续添加文件')
      } else {
        this.$warning(this.$t('m.Import_Success') + ': ' + successCount + ', ' + this.$t('m.Import_Failed') + ': ' + failCount)
      }
      this.resetBatchImport()
      this.currentPage = 1
      this.getLessonPlanList(1)
    },

    searchProblems () {
      if (!this.problemSearchKeyword) {
        this.searchResults = []
        return
      }
      this.$http.get('/admin/problem', {
        params: {
          keyword: this.problemSearchKeyword,
          offset: 0,
          limit: 50
        }
      }).then(res => {
        this.searchResults = res.data.data.results || []
      })
    },
    selectAllProblems () {
      this.searchResults.forEach(p => {
        if (!this.isProblemSelected(p.id)) {
          this.selectedProblems.push(p)
        }
      })
    },
    addProblem (problem) {
      if (!this.isProblemSelected(problem.id)) {
        this.selectedProblems.push(problem)
      }
    },
    removeProblem (id) {
      this.selectedProblems = this.selectedProblems.filter(p => p.id !== id)
    },
    isProblemSelected (id) {
      return this.selectedProblems.some(p => p.id === id)
    },
    getDifficultyType (difficulty) {
      const types = {
        'Low': 'success',
        'Mid': '',
        'High': 'danger'
      }
      return types[difficulty] || ''
    },
    shortDesc (desc) {
      if (!desc) return ''
      return desc.length > 10 ? desc.slice(0, 10) + '…' : desc
    }
  }
}
</script>

<style lang="less" scoped>
.lesson-plan-management {
  .list {
    .description-text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: inline-block;
      max-width: 100%;
    }

    :deep(.el-table){
      th, td {
        word-break: normal !important;
      }

      .cell {
        word-break: normal !important;
        white-space: nowrap !important;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }

  .panel-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
    position: relative;
    z-index: 1;

    .left-actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }

    :deep(.el-pagination){
      flex-shrink: 0;
      white-space: nowrap;
      margin-left: 16px;
    }

    :deep(.el-pager li),
    :deep(.btn-prev),
    :deep(.btn-next){
      pointer-events: auto !important;
      cursor: pointer !important;
    }
  }

  .batch-import-desc {
    color: #64748b;
    font-size: 14px;
    margin-bottom: 16px;
  }

  .batch-upload-area {
    border: 2px dashed #dce1e8;
    border-radius: 8px;
    padding: 24px;
    text-align: center;
    margin-bottom: 16px;

    .batch-file-count {
      margin-top: 10px;
      font-size: 13px;
      color: #1e3a8a;
      font-weight: 500;
    }
  }

  .batch-preview {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;

    .batch-preview-header {
      padding: 8px 12px;
      background: #f8fafc;
      font-size: 13px;
      font-weight: 600;
      color: #1e3a8a;
      border-bottom: 1px solid #e2e8f0;
    }

    .batch-preview-list {
      max-height: 300px;
      overflow-y: auto;
    }

    .batch-preview-item {
      padding: 8px 12px;
      display: flex;
      gap: 10px;
      align-items: center;
      border-bottom: 1px solid #f1f5f9;
      font-size: 14px;

      .batch-idx {
        color: #94a3b8;
        min-width: 28px;
      }

      .batch-title {
        font-weight: 600;
        color: #1e3a8a;
        min-width: 160px;
      }

      .batch-desc {
        color: #64748b;
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .batch-preview-hint {
      padding: 6px 12px;
      font-size: 12px;
      color: #94a3b8;
      background: #fefce8;
    }
  }

  .preview-image {
    margin-top: 10px;
    img {
      max-width: 200px;
      max-height: 150px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
  }

  .file-info {
    margin-top: 10px;
    padding: 8px 12px;
    background: #f8fafc;
    border-radius: 8px;
    font-size: 0.85rem;
    color: #64748b;
  }

  .pdf-file-info {
    margin-top: 10px;

    .pdf-file-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #f0f9ff;
      border-radius: 6px;

      .el-icon-document {
        font-size: 18px;
        color: #0284c7;
      }

      .pdf-file-name {
        flex: 1;
        color: #0c4a6e;
        font-weight: 500;
        font-size: 14px;
      }
    }
  }

  .problem-selector {
    .selected-problems-actions {
      margin-top: 6px;
    }

    .selected-problems {
      margin-top: 10px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .el-tag {
        margin: 0;
      }
    }

    .search-results {
      margin-top: 10px;
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid #e2e8f0;
      border-radius: 8px;

      .search-result-item {
        padding: 10px 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        transition: background 0.2s ease;
        border-bottom: 1px solid #f1f5f9;

        &:last-child {
          border-bottom: none;
        }

        &:hover {
          background: #f8fafc;
        }

        &.selected {
          background: #e8f5e9;
          cursor: default;
        }

        span:first-child {
          font-weight: 600;
          color: #1e3a8a;
          margin-right: 12px;
        }

        span:nth-child(2) {
          flex: 1;
          color: #334155;
        }
      }
    }
  }

  .content-type-switch {
    margin-bottom: 12px;
  }

  .md-upload-area {
    border: 2px dashed #dce1e8;
    border-radius: 8px;
    padding: 16px;
    text-align: center;

    .md-file-info {
      margin-top: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 8px 12px;
      background: #e8f5e9;
      border-radius: 6px;
      font-size: 14px;
      color: #2e7d32;

      i { color: #2e7d32; }
    }

    .md-preview {
      margin-top: 16px;
      text-align: left;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;

      .md-preview-header {
        padding: 8px 12px;
        background: #f8fafc;
        font-size: 13px;
        font-weight: 600;
        color: #64748b;
        border-bottom: 1px solid #e2e8f0;
      }

      .md-preview-content {
        padding: 12px 16px;
        max-height: 400px;
        overflow-y: auto;
        font-size: 14px;
        line-height: 1.7;
        color: #334155;

        h1, h2, h3, h4 { margin: 12px 0 8px; color: #1e3a8a; }
        h1 { font-size: 1.5em; }
        h2 { font-size: 1.3em; }
        h3 { font-size: 1.15em; }
        h4 { font-size: 1.05em; }
        p { margin: 4px 0; }
        code {
          background: #f1f5f9;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 0.9em;
          color: #e040fb;
        }
        pre {
          background: #1e293b;
          color: #e2e8f0;
          padding: 12px 16px;
          border-radius: 6px;
          overflow-x: auto;
          font-size: 13px;
          line-height: 1.5;

          code { background: transparent; color: inherit; padding: 0; }
        }
        ul, ol { padding-left: 24px; margin: 4px 0; }
        li { margin: 2px 0; }
        a { color: #2563eb; text-decoration: underline; }
        blockquote {
          border-left: 3px solid #94a3b8;
          margin: 8px 0;
          padding: 4px 12px;
          color: #64748b;
          background: #f8fafc;
        }
        hr { border: none; border-top: 1px solid #e2e8f0; margin: 12px 0; }
        img { max-width: 100%; border-radius: 4px; }
      }
    }
  }
}
</style>
