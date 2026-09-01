<template>
  <div class="forum-page">
    <div class="forum-container">
      <aside class="forum-sidebar">
        <div class="sidebar-title">{{ $t('m.Forum_Category_Nav') }}</div>
        <div class="cat-item" :class="{active: currentCategory === 'all'}" @click="switchCategory('all')">
          <Icon type="ios-list" size="18" />
          <span>{{ $t('m.Forum_All') }}</span>
        </div>
        <div v-for="c in realCategories" :key="c.id" class="cat-item" :class="{active: currentCategory === c.id}" @click="switchCategory(c.id)">
          <Icon :type="c.icon || 'ios-chatbubbles'" size="18" />
          <span>{{ c.name }}</span>
        </div>
      </aside>
      <div class="forum-main">
      <div class="forum-header-bar">
        <div class="header-left">
          <span class="forum-title">{{ $t('m.Forum_Title') }}</span>
          <span class="post-count">{{ $t('m.Forum_Posts_Count', { n: totalPosts }) }}</span>
        </div>
        <div class="header-actions">
          <Input v-model="searchKeyword" :placeholder="$t('m.Forum_Search')" class="search-input" @on-enter="doSearch" search />
          <Button v-if="!muteInfo.muted" type="primary" @click="openCreate"><Icon type="ios-create-outline" size="16"/> {{ $t('m.Forum_New_Post') }}</Button>
          <span v-else class="mute-badge">🔇 {{ $t('m.Forum_Muted') }}{{ muteInfo.remain }}</span>
        </div>
      </div>

      <!-- 筛选标签 -->
      <div class="filter-tabs">
        <span class="f-tab" :class="{ active: currentFilter === 'all' }" @click="switchFilter('all')">{{ $t('m.Forum_All') }}</span>
        <span class="f-tab" :class="{ active: currentFilter === 'mine' }" @click="switchFilter('mine')">{{ $t('m.Forum_Filter_Mine') }}</span>
        <span class="f-tab" :class="{ active: currentFilter === 'bookmark' }" @click="switchFilter('bookmark')">{{ $t('m.Forum_Filter_Bookmark') }}</span>
        <span v-if="currentFilter !== 'all'" class="f-tab clear" @click="switchFilter('all')">{{ $t('m.Forum_Filter_Clear') }}</span>
      </div>

      <div v-if="loading" class="loading-box"><Spin size="large" fix></Spin></div>
      <div v-else-if="posts.length === 0" class="empty-box">{{ $t('m.Forum_Empty') }}</div>
      <div v-else class="post-feed">
        <Card v-for="post in posts" :key="post.id" class="post-card">
          <div class="post-header">
            <img :src="headUrl(post.author)" class="post-avatar" />
            <div class="post-author-info">
              <span class="author-name">{{ post.author ? post.author.username : $t('m.Forum_Unknown_User') }}</span>
              <span class="post-time">{{ post.create_time | timeFormat }}</span>
            </div>
            <div v-if="isOwnPost(post)" class="post-own-actions">
              <a class="own-btn" @click="startEdit(post)">{{ $t('m.Forum_Edit') }}</a>
              <a class="own-btn del-btn" @click="confirmDelete(post)">{{ $t('m.Forum_Delete') }}</a>
            </div>
          </div>
          <h3 v-if="post.title && post.title !== '无标题'" class="post-title">{{ post.title }}</h3>
          <div class="post-body markdown-body" v-katex v-html="renderContent(post.content)"></div>
          <div class="post-actions">
            <span class="action-item comment-toggle" @click="toggleComments(post)">{{ $t('m.Forum_Comment_Count', { n: post.comment_count || 0 }) }}</span>
            <span class="action-item" :class="{ active: likedPosts[post.id] }" @click="toggleLike(post)">
              <Icon :type="likedPosts[post.id] ? 'ios-heart' : 'ios-heart-outline'" size="16"/> {{ post.like_count || 0 }}
            </span>
            <span class="action-item" :class="{ active: bookmarkedPosts[post.id] }" @click="toggleBookmark(post)">
              <Icon :type="bookmarkedPosts[post.id] ? 'ios-star' : 'ios-star-outline'" size="16"/> {{ post.bookmark_count || 0 }}
            </span>
            <span class="action-item report-btn" @click="openReport('post', post.id)">{{ $t('m.Forum_Report') }}</span>
          </div>

          <!-- 评论区 -->
          <div v-if="expandedPost === post.id" class="comment-area">
            <div v-if="post._comments && post._comments.length">
              <div v-for="c in post._comments" :key="c.id" class="comment-item">
                <img :src="headUrl(c.author)" class="comment-avatar" />
                <div class="comment-body">
                  <div class="comment-head">
                    <strong>{{ c.author ? c.author.username : $t('m.Forum_Unknown_User') }}</strong>
                    <span class="comment-time">{{ c.create_time | timeFormat }}</span>
                    <span class="comment-like" :class="{ liked: c._liked }" @click="toggleCommentLike(post, c)">
                      <Icon :type="c._liked ? 'ios-heart' : 'ios-heart-outline'" size="13"/> {{ c.like_count || 0 }}
                    </span>
                    <a class="reply-link" @click="onReplyClick(post, c)"><b>↩</b> {{ $t('m.Forum_Reply') }}</a>
                    <a v-if="isOwnComment(c)" class="del-cmt" @click="deleteComment(post, c.id)"><Icon type="ios-trash" size="13"/></a>
                    <a class="report-cmt" @click="openReport('comment', c.id)">{{ $t('m.Forum_Report') }}</a>
                  </div>
                  <div class="comment-text">{{ c.content }}</div>
                  <div v-if="c.replies && c.replies.length" class="comment-replies">
                    <div v-for="r in c.replies" :key="r.id" class="comment-item sub">
                      <img :src="headUrl(r.author)" class="comment-avatar sm" />
                      <div class="comment-body">
                        <div class="comment-head">
                          <strong>{{ r.author ? r.author.username : $t('m.Forum_Unknown_User') }}</strong>
                          <span class="comment-time">{{ r.create_time | timeFormat }}</span>
                          <span class="comment-like" :class="{ liked: r._liked }" @click="toggleCommentLike(post, r)">
                            <Icon :type="r._liked ? 'ios-heart' : 'ios-heart-outline'" size="13"/> {{ r.like_count || 0 }}
                          </span>
                          <a v-if="isOwnComment(r)" class="del-cmt" @click="deleteComment(post, r.id)"><Icon type="ios-trash" size="13"/></a>
                        </div>
                        <div class="comment-text">{{ r.content }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-comment">{{ $t('m.Forum_No_Replies') }}</div>
            <!-- 评论分页 -->
            <div v-if="post._commentTotal > post._commentLimit" class="cmt-pager">
              <Page simple :total="post._commentTotal" :page-size="post._commentLimit" :current="post._commentPage" @on-change="p => changeCommentPage(post, p)" />
            </div>
            <!-- 回复框 -->
            <div class="reply-box">
              <p v-if="replyTarget && replyPostId === post.id" class="reply-hint">
                {{ $t('m.Forum_Reply_To') }} <strong>{{ replyTarget.author.username }}</strong> <a @click="cancelReply">{{ $t('m.Forum_Cancel') }}</a>
              </p>
              <div class="reply-input-row">
                <Input v-model="replyContents[post.id]" :placeholder="$t('m.Forum_Reply_Placeholder')" @on-enter="submitComment(post)"/>
                <Button type="primary" size="small" @click="submitComment(post)" :loading="submittingMap[post.id]">{{ $t('m.Forum_Reply') }}</Button>
              </div>
            </div>
          </div>
        </Card>
        <Page :total="totalPosts" :page-size="limit" :current="page" @on-change="changePage" class="forum-pagination"/>
      </div>
      </div>
    </div>

    <Modal v-model="showEditor" :title="editingPost ? $t('m.Forum_Edit') : $t('m.Forum_New_Post')" :width="800" :footer-hide="true"
      @on-cancel="showEditor = false" class="forum-editor-modal">
      <Form :label-width="60">
        <FormItem :label="$t('m.Forum_Category')" required v-if="!editingPost">
          <Select v-model="createCategoryId" :placeholder="$t('m.Forum_Select_Category')">
            <Option v-for="c in realCategories" :key="c.id" :value="c.id" :label="c.name"></Option>
          </Select>
        </FormItem>
        <FormItem :label="$t('m.Forum_Title_Label')"><Input v-model="createTitle" :placeholder="$t('m.Forum_Title_Placeholder')" maxlength="256"/></FormItem>
        <FormItem :label="$t('m.Forum_Content')" required><Simditor v-model="createContent"></Simditor></FormItem>
      </Form>
      <div class="modal-footer">
        <Button @click="showEditor = false">{{ $t('m.Forum_Cancel') }}</Button>
        <Button type="primary" :loading="posting" @click.native="submitPost">{{ $t('m.Forum_Publish') }}</Button>
      </div>
    </Modal>

    <!-- 举报 Modal -->
    <Modal v-model="reportVisible" :title="$t('m.Forum_Report')" :width="420" @on-ok="submitReport" :ok-text="$t('m.Forum_Submit')">
      <Form :label-width="80">
        <FormItem :label="$t('m.Forum_Report_Type')">
          <Select v-model="reportReason">
            <Option value="spam">{{ $t('m.Forum_Report_Spam') }}</Option>
            <Option value="attack">{{ $t('m.Forum_Report_Attack') }}</Option>
            <Option value="ad">{{ $t('m.Forum_Report_Ad') }}</Option>
            <Option value="illegal">{{ $t('m.Forum_Report_Illegal') }}</Option>
            <Option value="other">{{ $t('m.Forum_Report_Other') }}</Option>
          </Select>
        </FormItem>
        <FormItem :label="$t('m.Forum_Report_Detail_Label')">
          <Input v-model="reportDetail" type="textarea" :rows="3" :placeholder="$t('m.Forum_Optional')" maxlength="500"/>
        </FormItem>
      </Form>
    </Modal>

    <!-- 图片预览 -->
    <Modal v-model="imgPreviewVisible" :title="$t('m.Forum_Image_Preview')" :width="800" footer-hide>
      <img :src="imgPreviewSrc" style="width:100%;border-radius:8px" />
    </Modal>
  </div>
</template>

<script>
import api from '@oj/api'
import { mapGetters } from 'vuex'
import Simditor from 'tar-simditor'
import 'tar-simditor/styles/simditor.css'
import { renderMarkdown } from '@/utils/markdown'
import hljs from 'highlight.js/lib/highlight'
import cpp from 'highlight.js/lib/languages/cpp'
import java from 'highlight.js/lib/languages/java'
import python from 'highlight.js/lib/languages/python'
hljs.registerLanguage('cpp', cpp); hljs.registerLanguage('java', java); hljs.registerLanguage('python', python)

const ForumSimditor = {
  name: 'Simditor', props: { value: { type: String, default: '' } }, data () { return { editor: null, val: this.value } },
  mounted () {
    const s = this
    this.editor = new Simditor({
      textarea: this.$refs.editor,
      toolbar: ['title', 'bold', 'italic', 'underline', '|', 'ol', 'ul', 'blockquote', 'code', 'table', 'link', 'image', 'hr', '|', 'indent', 'outdent'],
      pasteImage: true, markdown: false,
      upload: { url: '/api/forum/upload_image/', params: null, fileKey: 'image', connectionCount: 3 }
    })
    this.editor.on('valuechanged', () => { s.val = s.editor.getValue() }); this.editor.setValue(this.value)
  },
  watch: {
    value (val) { if (this.val !== val && this.editor) { this.val = val; this.editor.setValue(val) } },
    val (v) { this.$emit('change', v); this.$emit('input', v) }
  },
  render (h) { return h('textarea', { ref: 'editor' }) }
}

export default {
  components: { Simditor: ForumSimditor },
  data () {
    return {
      searchKeyword: '', posts: [], totalPosts: 0, page: 1, limit: 10, loading: false, currentFilter: 'all',
      currentCategory: 'all', createCategoryId: '',
      realCategories: [],
      expandedPost: null, replyContents: {}, replyTarget: null, replyPostId: null, submittingMap: {},
      showEditor: false, editingPost: null, createTitle: '', createContent: '', posting: false,
      reportVisible: false, reportType: '', reportTargetId: '', reportReason: 'other', reportDetail: '',
      imgPreviewVisible: false, imgPreviewSrc: '',
      likedPosts: {}, bookmarkedPosts: {},
      muteInfo: { muted: false, remain: '', reason: '' }
    }
  },
  computed: { ...mapGetters(['user', 'isAuthenticated']) },
  filters: { timeFormat (v) { return v ? v.replace('T',' ').substring(0,19) : '' } },
  mounted () {
    this.fetchData()
    api.getForumCategories().then(res => {
      this.realCategories = res.data.data || []
    }).catch(() => {})
    api.getMuteStatus().then(res => {
      if (res.data.data && res.data.data.muted) {
        this.muteInfo.muted = true
        this.muteInfo.remain = this.$t('m.Forum_Mute_Remain', { n: res.data.data.remain })
        this.muteInfo.reason = res.data.data.reason
      }
    }).catch(() => {})
  },
  methods: {
    headUrl (u) {
      if (!u) return ''
      if (u.avatar && u.avatar.startsWith('http')) return u.avatar
      return u.avatar || '/public/avatar/default.jpg'
    },
    async fetchData () {
      this.loading = true
      const params = { page: this.page, limit: this.limit }
      if (this.currentFilter === 'mine') params.mine = '1'
      if (this.currentFilter === 'bookmark') params.bookmarked = '1'
      if (this.currentCategory !== 'all') params.category_id = this.currentCategory
      const res = await api.getForumPosts(params)
      const d = res.data.data
      this.posts = (d.results || []).map(p => {
        this.$set(this.likedPosts, p.id, !!p.is_liked)
        this.$set(this.bookmarkedPosts, p.id, !!p.is_bookmarked)
        this.$set(p, '_comments', [])
        this.$set(p, '_commentTotal', 0)
        this.$set(p, '_commentPage', 0)
        this.$set(p, '_commentLimit', 10)
        return p
      })
      this.totalPosts = d.total || 0
      this.loading = false
      this.$nextTick(() => {
        this.$el.querySelectorAll('.post-body pre code').forEach(el => { hljs.highlightBlock(el) })
        this.$el.querySelectorAll('.post-body').forEach(body => { this.layoutImages(body) })
        this.$el.querySelectorAll('.post-body img').forEach(img => {
          img.style.cursor = 'pointer'
          img.addEventListener('click', (e) => {
            this.imgPreviewSrc = e.target.src
            this.imgPreviewVisible = true
          })
        })
      })
    },
    layoutImages (body) {
      const imgs = [...body.querySelectorAll('img')]
      if (imgs.length === 0) return
      if (imgs.length === 1) {
          imgs[0].style.cssText = 'max-width:520px;width:100%;height:auto;border-radius:10px;display:block;margin:8px auto;'
          return
        }
      if (imgs[0].parentNode.className && imgs[0].parentNode.className.includes('img-cell')) return
        const cols = imgs.length === 2 ? 2 : 3
        const gap = 8
        const totalW = 520
        const cellSize = Math.floor((totalW - (cols - 1) * gap) / cols)
        const w = document.createElement('div')
      w.style.cssText = `display:grid;grid-template-columns:repeat(${cols},1fr);gap:${gap}px;margin:12px auto;max-width:${cols*cellSize+(cols-1)*gap}px;justify-content:center;`
      imgs.forEach(img => {
        const c = document.createElement('div'); c.style.cssText = 'border-radius:10px;overflow:hidden;aspect-ratio:1;'
        const n = img.cloneNode(true); n.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;border-radius:10px;'
        n.onmouseenter = () => n.style.transform = 'scale(1.03)'; n.onmouseleave = () => n.style.transform = 'scale(1)'
        c.appendChild(n); w.appendChild(c); img.remove()
      })
      body.appendChild(w)
    },
    renderContent (html) {
      if (!html) return ''
      if (/(^|\n)[#]{1,4}\s|\*\*|```|`[^`]+`|^[-*]\s|^\d+\.\s/m.test(html)) {
        return renderMarkdown(html.replace(/<p>|<\/p>|<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''))
      }
      return html
    },
    changePage (p) { this.page = p; this.expandedPost = null; this.fetchData() },
    switchFilter (key) { this.currentFilter = key; this.page = 1; this.fetchData() },
    switchCategory (id) { this.currentCategory = id; this.page = 1; this.expandedPost = null; this.fetchData() },
    async doSearch () {
      this.page = 1; this.loading = true
      const res = await api.getForumPosts({ search: this.searchKeyword, page: 1, limit: this.limit })
      const d = res.data.data; this.posts = (d.results || []).map(p => ({ ...p, _comments: [], _commentTotal: 0, _commentPage: 0, _commentLimit: 10 }))
      this.totalPosts = d.total || 0; this.loading = false
    },
    async toggleComments (post) {
      if (this.expandedPost === post.id) { this.expandedPost = null; return }
      this.expandedPost = post.id
      if (!post._comments.length) {
        await this.loadMoreComments(post, 1)
      }
    },
    async loadMoreComments (post, page) {
      const res = await api.getForumComments({ post_id: post.id, page: page || 1, limit: post._commentLimit })
      const d = res.data.data
      const newComments = (d.results || []).map(c => {
        this.$set(c, '_liked', !!c.is_liked)
        if (c.replies) c.replies.forEach(r => this.$set(r, '_liked', !!r.is_liked))
        return c
      })
      post._comments = newComments
      post._commentTotal = d.total || 0
      post._commentPage = d.page || 1
      post._commentLimit = d.limit || 10
    },
    changeCommentPage (post, page) { this.loadMoreComments(post, page) },
    openCreate () {
      this.editingPost = null; this.createTitle = ''; this.createContent = ''
      this.createCategoryId = this.currentCategory !== 'all' ? this.currentCategory : (this.realCategories[0] && this.realCategories[0].id || '')
      this.showEditor = true
    },
    isOwnPost (post) { return this.user && post.author && this.user.id === post.author.id },
    isOwnComment (c) { return this.user && c.author && this.user.id === c.author.id },
    startEdit (post) { this.editingPost = post; this.createTitle = post.title; this.createContent = post.content; this.createCategoryId = (post.category && post.category.id) || ''; this.showEditor = true },
    async submitPost () {
      const content = this.createContent.trim()
      if (!content) { this.$Message.warning(this.$t('m.Forum_Content_Required')); return }
      this.posting = true
      try {
        if (this.editingPost) {
          await api.editForumPost(this.editingPost.id, { title: this.createTitle.trim() || '无标题', content })
          this.editingPost.title = this.createTitle.trim() || '无标题'; this.editingPost.content = content
          this.$Message.success(this.$t('m.Forum_Edit_Success'))
          this.$nextTick(() => {
            this.$el.querySelectorAll('.post-body').forEach(body => { this.layoutImages(body) })
          })
        } else {
          const catId = this.createCategoryId || (this.realCategories.length ? this.realCategories[0].id : '')
          if (!catId) { this.$Message.warning(this.$t('m.Forum_Category_Required')); this.posting = false; return }
          await api.createForumPost({ title: this.createTitle.trim() || '无标题', content, category_id: catId })
          this.$Message.success(this.$t('m.Forum_Publish_Success')); this.page = 1; this.fetchData()
        }
        this.showEditor = false; this.editingPost = null
      } catch (e) {
        const msg = (e.response && e.response.data && e.response.data.error) || (e.data && e.data.error) || ''
        if (msg.includes('你已被禁言')) {
          this.muteInfo.muted = true
          this.muteInfo.remain = ''
          this.muteInfo.reason = msg.replace('你已被禁言：', '')
        }
      }
      this.posting = false
    },
    confirmDelete (post) {
      this.$Modal.confirm({ title: this.$t('m.Forum_Delete_Confirm_Title'), content: this.$t('m.Forum_Delete_Confirm_Content'), onOk: async () => {
        await api.deleteForumPost(post.id); this.posts = this.posts.filter(p => p.id !== post.id); this.totalPosts--; this.$Message.success(this.$t('m.Forum_Deleted'))
      }})
    },
    async submitComment (post) {
      const content = (this.replyContents[post.id] || '').trim()
      if (!content) return
      this.$set(this.submittingMap, post.id, true)
      await api.createForumComment({ post_id: post.id, content, parent_id: this.replyTarget && this.replyPostId === post.id ? this.replyTarget.id : null })
      this.replyContents[post.id] = ''; this.replyTarget = null; this.replyPostId = null
      this.$set(this.submittingMap, post.id, false)
      this.$Message.success(this.$t('m.Forum_Reply_Success'))
      await this.loadMoreComments(post, 1)
    },
    async deleteComment (post, commentId) {
      await api.deleteForumComment({ comment_id: commentId })
      this.$Message.success(this.$t('m.Forum_Deleted'))
      await this.loadMoreComments(post, post._commentPage)
    },
    async toggleLike (post) {
      const res = await api.forumLike(post.id); const d = res.data.data
      this.$set(this.likedPosts, post.id, d.liked); post.like_count = d.like_count
    },
    async toggleBookmark (post) {
      const res = await api.forumBookmark(post.id); const d = res.data.data
      this.$set(this.bookmarkedPosts, post.id, d.bookmarked); post.bookmark_count = d.bookmark_count
    },
    async toggleCommentLike (post, comment) {
      const res = await api.forumCommentLike(comment.id); const d = res.data.data
      this.$set(comment, '_liked', d.liked); comment.like_count = d.like_count
    },
    onReplyClick (post, comment) { this.replyTarget = comment; this.replyPostId = post.id },
    cancelReply () { this.replyTarget = null; this.replyPostId = null },
    openReport (type, id) { this.reportType = type; this.reportTargetId = id; this.reportReason = 'other'; this.reportDetail = ''; this.reportVisible = true },
    async submitReport () {
      if (!this.reportTargetId) return
      await api.forumReport({ target_type: this.reportType, target_id: this.reportTargetId, reason: this.reportReason, detail: this.reportDetail })
      this.$Message.success(this.$t('m.Forum_Report_Submitted'))
      this.reportVisible = false
    }
  }
}
</script>

<style lang="less" scoped>
.forum-page { min-height: calc(100vh - 80px); background: #f5f7fa; padding: 24px 0; margin-top: 80px; }
.forum-container { max-width: 1080px; margin: 0 auto; padding: 0 20px; display: flex; gap: 20px; align-items: flex-start; }
.forum-sidebar {
  width: 200px; flex-shrink: 0; background: #fff; border-radius: 12px; padding: 10px;
  position: sticky; top: 90px; box-shadow: 0 2px 12px rgba(30,58,138,0.08);
  .sidebar-title { font-size: 12px; color: #808695; padding: 8px 10px 6px; letter-spacing: 1px; }
  .cat-item {
    display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px;
    cursor: pointer; color: #515a6e; transition: all .15s; font-size: 14px; margin-bottom: 2px;
    &:hover { background: #f0f7ff; color: #1e3a8a; }
    &.active { background: linear-gradient(135deg, #1e3a8a, #2d8cf0); color: #fff; box-shadow: 0 3px 10px rgba(45,140,240,0.3); }
  }
}
.forum-main { flex: 1; min-width: 0; }
.forum-header-bar {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;
  .header-left { display: flex; align-items: center; gap: 10px; }
  .forum-title { font-size: 22px; font-weight: 700; color: #1e3a8a; }
  .post-count { font-size: 13px; color: #808695; }
  .header-actions { display: flex; gap: 10px; }
  .search-input { width: 160px; }
  .mute-badge { color: #ed4014; font-size: 13px; font-weight: 500; padding: 4px 10px; border: 1px solid rgba(237,64,20,.25); border-radius: 12px; background: rgba(237,64,20,.06); }
}
.filter-tabs {
  display: flex; gap: 10px; margin-bottom: 16px;
  .f-tab {
    padding: 5px 16px; border-radius: 16px; cursor: pointer; font-size: 13px; color: #515a6e;
    background: #fff; border: 1px solid #e8eaec; transition: all .15s;
    &:hover { border-color: #1e3a8a; color: #1e3a8a; }
    &.active { background: #1e3a8a; color: #fff; border-color: #1e3a8a; }
    &.clear { border-color: transparent; background: transparent; color: #808695; font-size: 12px;
      &:hover { color: #1e3a8a; }
    }
  }
}
.post-feed { display: flex; flex-direction: column; gap: 14px; }
.post-card {
  /deep/ .ivu-card-body { overflow: visible; }
  .post-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .post-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; flex-shrink: 0; background: #e0e5f0; }
  .post-author-info { flex: 1; .author-name { font-weight: 600; font-size: 14px; color: #1e3a8a; display: block; } .post-time { font-size: 12px; color: #808695; } }
  .post-own-actions { display: flex; gap: 6px; flex-shrink: 0; .own-btn { font-size: 12px; cursor: pointer; color: #808695; &:hover { color: #1e3a8a; } } .del-btn:hover { color: #ed4014; } }
  .post-title { font-size: 17px; font-weight: 600; color: #17233d; margin: 6px 0 10px; }
  .post-body { font-size: 15px; line-height: 1.8; color: #333; max-height: 600px; overflow-y: auto; word-break: break-word;
    img { max-width: 100%; height: auto; border-radius: 8px; margin: 4px 0; }
    pre { padding: 12px; background: #f8f8f9; border-radius: 8px; overflow-x: auto; }
    code { background: rgba(27,31,35,.05); padding: 2px 6px; border-radius: 4px; font-size: 90%; }
    blockquote { border-left: 3px solid #ddd; padding: 8px 16px; color: #666; }
  }
  .post-actions { margin-top: 12px; padding-top: 10px; border-top: 1px solid #f0f0f0; display: flex; gap: 28px;
    .action-item { cursor: pointer; color: #808695; font-size: 13px; display: flex; align-items: center; gap: 4px; transition: color .15s;
      &:hover { color: #1e3a8a; } &.active { color: #ed4014; }
    }
  }
}
.comment-area { margin-top: 12px; padding-top: 10px; border-top: 1px solid #f0f0f0; }
.comment-item {
  display: flex; gap: 10px; margin-bottom: 10px; overflow: visible;
  &.sub { margin-left: 36px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #f8f8f8; }
  .comment-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; flex-shrink: 0; margin-top: 2px; background: #e0e5f0;
    &.sm { width: 24px; height: 24px; }
  }
  .comment-body { flex: 1; min-width: 0; overflow: visible; }
  .comment-head { display: flex; align-items: center; gap: 8px; font-size: 13px; margin-bottom: 3px; flex-wrap: wrap; overflow: visible;
    strong { font-size: 13px; }
  }
  .comment-time { color: #bbb; font-size: 11px; }
  .comment-like { cursor: pointer; color: #808695; display: flex; align-items: center; gap: 2px; font-size: 12px; transition: color .15s;
    &:hover { color: #ed4014; } &.liked { color: #ed4014; }
  }
  .reply-link { color: #1e3a8a; cursor: pointer; font-size: 13px; display: inline-flex; align-items: center; gap: 2px; flex-shrink: 0; padding: 2px 6px; background: rgba(30,58,138,0.06); border-radius: 4px;
    &:hover { background: rgba(30,58,138,0.12); }
  }
  .del-cmt { color: #bbb; cursor: pointer; margin-left: auto;
    &:hover { color: #ed4014; }
  }
  .report-btn { margin-left: auto; color: #bbb; }
  .report-cmt { color: #bbb; cursor: pointer; font-size: 11px; margin-left: 4px;
    &:hover { color: #ed4014; }
  }
  .comment-text { font-size: 14px; line-height: 1.6; color: #333; }
  .comment-replies { margin-top: 6px; }
}
.cmt-pager { text-align: center; padding: 8px 0; }
.reply-box { margin-top: 10px; }
.reply-hint { font-size: 12px; margin-bottom: 4px; a { color: #1e3a8a; cursor: pointer; margin-left: 8px; } }
.reply-input-row { display: flex; gap: 8px; align-items: center; }
.empty-comment { color: #bbb; font-size: 13px; padding: 8px 0; }
.loading-box, .empty-box { text-align: center; padding: 80px 0; color: #808695; }
.forum-pagination { margin-top: 20px; text-align: center; }
.modal-footer { text-align: right; padding-top: 12px; border-top: 1px solid #e8eaec; button { margin-left: 8px; } }
.forum-editor-modal /deep/ .simditor .simditor-toolbar { display: flex !important; flex-wrap: wrap; }
@media (max-width: 768px) {
  .forum-container { flex-direction: column; }
  .forum-sidebar {
    width: 100%; position: static; display: flex; gap: 6px; overflow-x: auto; padding: 8px;
    .sidebar-title { display: none; }
    .cat-item { flex-shrink: 0; padding: 6px 14px; margin-bottom: 0; }
  }
}
</style>
