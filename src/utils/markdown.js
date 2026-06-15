function escapeHtml (raw) {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * 将 AI 输出的 Markdown 文本转为安全 HTML
 * 支持：标题、粗体、斜体、删除线、行内代码、代码块、引用、列表、链接、图片、表格、分割线
 */
export function renderMarkdown (md) {
  if (!md || typeof md !== 'string') return ''

  let text = md

  // ---- 1. 代码块占位 ----
  const codeBlocks = []
  text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const idx = codeBlocks.length
    codeBlocks.push(
      `<pre class="md-code-block"><code class="language-${lang || 'plaintext'}">${escapeHtml(code.trim())}</code></pre>`
    )
    return `%%CODEBLOCK_${idx}%%`
  })

  // ---- 2. HTML 转义（在代码块提取之后，保护代码块内容）----
  text = escapeHtml(text)

  // ---- 3. 块级元素（在转义后处理，因为它们是纯文本中的标记）----
  // - 标题（已转义，#→#，所以直接匹配）
  text = text.replace(/^#### (.+)$/gm, '<h4>$1</h4>')
  text = text.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  text = text.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  text = text.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // - 分割线
  text = text.replace(/^---+$/gm, '<hr>')

  // - 引用块
  text = text.replace(/^&gt; (.+)$/gm, '<blockquote><p>$1</p></blockquote>')
  text = text.replace(/<\/blockquote>\n<blockquote>/g, '\n')

  // ---- 4. 内联格式 ----
  // 粗体+斜体
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  // 粗体
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  // 斜体
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>')
  // 删除线
  text = text.replace(/~~(.+?)~~/g, '<del>$1</del>')
  // 行内代码
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>')
  // 链接
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
  // 图片
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%" />')

  // ---- 5. 表格 ----
  text = text.replace(/(^\|.+\|\n^\|[-:\s|]+\|\n(?:^\|.+\|\n?)+)/gm, (match) => {
    const lines = match.trim().split('\n')
    const headerCells = lines[0].split('|').filter(c => c.trim()).map(c => `<th>${c.trim()}</th>`)
    let tableHtml = '<table class="md-table"><thead><tr>' + headerCells.join('') + '</tr></thead><tbody>'
    for (let i = 2; i < lines.length; i++) {
      const cells = lines[i].split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`)
      tableHtml += '<tr>' + cells.join('') + '</tr>'
    }
    tableHtml += '</tbody></table>'
    return tableHtml
  })

  // ---- 6. 列表（在处理内联格式之后）----
  // 无序列表
  text = text.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')
  // 有序列表
  text = text.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
  // 将连续的 <li> 包裹在 <ul> 中
  text = text.replace(/((?:<li>[\s\S]*?<\/li>\n?)+)/g, '<ul class="md-ul">$1</ul>')

  // ---- 7. 恢复代码块占位 ----
  text = text.replace(/%%CODEBLOCK_(\d+)%%/g, (_, idx) => codeBlocks[parseInt(idx)] || '')

  // ---- 8. 段落和换行 ----
  // 块级元素之间保持原样，普通文本换行转 <br>
  text = text.replace(/\n(?!\s*<)/g, '<br>')

  // ---- 9. 清理多余标签 ----
  // 移除空 <br> 在块级元素前后
  text = text.replace(/<(h[1-6]|hr|ul|ol|pre|blockquote|table)>(\s*<br>)+/g, '<$1>')
  text = text.replace(/(<br>\s*)+<\/(h[1-6]|ul|ol|pre|blockquote|table)>/g, '</$2>')

  return text
}
