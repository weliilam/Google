// Popup主脚本

let currentTabId = null;
let allRequests = [];
let selectedRequest = null;

// 翻译字典
const translationDict = {
  // 基础字段
  'userId': '用户ID', 'userName': '用户名', 'userEmail': '用户邮箱',
  'productId': '产品ID', 'productName': '产品名称', 'price': '价格',
  'orderId': '订单ID', 'status': '状态', 'createdAt': '创建时间',
  'updatedAt': '更新时间', 'token': '令牌', 'message': '消息',
  'code': '代码', 'data': '数据', 'success': '成功', 'error': '错误',
  'page': '页码', 'pageSize': '每页数量', 'total': '总数',
  'limit': '限制', 'offset': '偏移量', 'sort': '排序', 'filter': '筛选',
  'list': '列表', 'items': '项目', 'records': '记录', 'results': '结果',
  'count': '数量', 'current': '当前', 'next': '下一页', 'prev': '上一页',
  'responseBody': '响应体', 'requestBody': '请求体',
  'headers': '请求头', 'response': '响应', 'request': '请求',
  'url': '地址', 'method': '方法', 'timestamp': '时间戳',
  // 更多字段...
};

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  await loadRequests();
  setupEventListeners();
  startAutoRefresh();
});

// 设置事件监听器
function setupEventListeners() {
  document.getElementById('refreshBtn').addEventListener('click', loadRequests);
  document.getElementById('clearBtn').addEventListener('click', clearRequests);
  document.getElementById('methodFilter').addEventListener('change', filterRequests);
  document.getElementById('typeFilter').addEventListener('change', filterRequests);
  document.getElementById('statusFilter').addEventListener('change', filterRequests);
  document.getElementById('searchFilter').addEventListener('input', filterRequests);
  document.getElementById('closeTranslation').addEventListener('click', closeTranslationPanel);
}

// 加载请求
async function loadRequests() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    
    currentTabId = tab.id;
    
    chrome.runtime.sendMessage(
      { action: 'getRequests', tabId: currentTabId },
      (response) => {
        if (response && response.requests) {
          allRequests = response.requests;
          updateStats();
          renderRequests();
        }
      }
    );
  } catch (error) {
    console.error('加载请求失败:', error);
  }
}

// 更新统计信息
function updateStats() {
  const total = allRequests.length;
  const success = allRequests.filter(r => r.statusCode >= 200 && r.statusCode < 300).length;
  const error = allRequests.filter(r => r.statusCode >= 400).length;
  
  document.getElementById('totalRequests').textContent = total;
  document.getElementById('successRequests').textContent = success;
  document.getElementById('errorRequests').textContent = error;
  
  // 计算总大小（估算）
  let totalSize = 0;
  allRequests.forEach(r => {
    if (r.responseBody) {
      totalSize += r.responseBody.length;
    }
  });
  document.getElementById('totalSize').textContent = formatSize(totalSize);
}

// 格式化大小
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// 过滤请求
function filterRequests() {
  const methodFilter = document.getElementById('methodFilter').value;
  const typeFilter = document.getElementById('typeFilter').value;
  const statusFilter = document.getElementById('statusFilter').value;
  const searchFilter = document.getElementById('searchFilter').value.toLowerCase();
  
  let filtered = allRequests;
  
  // 方法过滤
  if (methodFilter !== 'all') {
    filtered = filtered.filter(r => r.method === methodFilter);
  }
  
  // 类型过滤
  if (typeFilter !== 'all') {
    filtered = filtered.filter(r => r.type === typeFilter);
  }
  
  // 状态过滤
  if (statusFilter !== 'all') {
    if (statusFilter === 'pending') {
      filtered = filtered.filter(r => !r.statusCode);
    } else if (statusFilter === '2xx') {
      filtered = filtered.filter(r => r.statusCode >= 200 && r.statusCode < 300);
    } else if (statusFilter === '3xx') {
      filtered = filtered.filter(r => r.statusCode >= 300 && r.statusCode < 400);
    } else if (statusFilter === '4xx') {
      filtered = filtered.filter(r => r.statusCode >= 400 && r.statusCode < 500);
    } else if (statusFilter === '5xx') {
      filtered = filtered.filter(r => r.statusCode >= 500);
    }
  }
  
  // 搜索过滤
  if (searchFilter) {
    filtered = filtered.filter(r => 
      r.url.toLowerCase().includes(searchFilter)
    );
  }
  
  renderRequests(filtered);
}

// 渲染请求列表
function renderRequests(requests = allRequests) {
  const container = document.getElementById('requestContainer');
  
  if (requests.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>没有检测到请求</p>
        <p class="hint">访问网页后点击刷新按钮</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = requests.map((request, index) => {
    const time = formatTime(request.timestamp);
    const statusClass = getStatusClass(request.statusCode);
    const hasBody = request.responseBody ? '✓' : '';
    
    return `
      <div class="request-item" data-index="${index}" data-request-id="${request.requestId}">
        <div class="request-item-header">
          <span class="request-method method-${request.method}">${request.method}</span>
          <span class="request-url">${truncateUrl(request.url)}</span>
          <span class="request-has-body">${hasBody}</span>
        </div>
        <div class="request-info">
          <span class="request-status ${statusClass}">${request.statusCode || 'PENDING'}</span>
          <span class="request-type">${request.type}</span>
          <span class="request-time">${time}</span>
        </div>
      </div>
    `;
  }).join('');
  
  // 添加点击事件
  container.querySelectorAll('.request-item').forEach(item => {
    item.addEventListener('click', () => {
      const requestId = item.dataset.requestId;
      const request = allRequests.find(r => r.requestId === requestId);
      selectRequest(request);
    });
  });
}

// 选择请求
function selectRequest(request) {
  selectedRequest = request;
  
  document.querySelectorAll('.request-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.requestId === request.requestId) {
      item.classList.add('active');
    }
  });
  
  renderRequestDetails(request);
}

// 渲染请求详情
function renderRequestDetails(request) {
  const container = document.getElementById('requestDetails');
  
  const sections = [];
  
  // 基本信息
  sections.push(`
    <div class="detail-section">
      <div class="detail-header">
        <h3 class="detail-title">基本信息</h3>
      </div>
      <table class="key-value-table">
        <tr><th>请求ID</th><td>${request.requestId}</td></tr>
        <tr><th>方法</th><td>${request.method}</td></tr>
        <tr><th>URL</th><td><a href="${request.url}" target="_blank">${request.url}</a></td></tr>
        <tr><th>状态码</th><td>${request.statusCode || 'PENDING'}</td></tr>
        <tr><th>类型</th><td>${request.type}</td></tr>
        <tr><th>MIME</th><td>${request.mimeType || 'N/A'}</td></tr>
        <tr><th>时间</th><td>${formatTime(request.timestamp, true)}</td></tr>
      </table>
    </div>
  `);
  
  // 请求头
  if (request.requestHeaders && request.requestHeaders.length > 0) {
    sections.push(`
      <div class="detail-section">
        <div class="detail-header">
          <h3 class="detail-title">请求头</h3>
          <div class="detail-actions">
            <button class="detail-btn" onclick="copyToClipboard(JSON.stringify(${JSON.stringify(formatHeaders(request.requestHeaders))}, null, 2))">复制</button>
          </div>
        </div>
        <div class="detail-content">
          <table class="key-value-table">
            ${request.requestHeaders.map(h => `
              <tr>
                <td><span class="json-key">${h.name}</span></td>
                <td>${h.value}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      </div>
    `);
  }
  
  // 响应头
  if (request.responseHeaders && request.responseHeaders.length > 0) {
    sections.push(`
      <div class="detail-section">
        <div class="detail-header">
          <h3 class="detail-title">响应头</h3>
          <div class="detail-actions">
            <button class="detail-btn" onclick="copyToClipboard(JSON.stringify(${JSON.stringify(formatHeaders(request.responseHeaders))}, null, 2))">复制</button>
          </div>
        </div>
        <div class="detail-content">
          <table class="key-value-table">
            ${request.responseHeaders.map(h => `
              <tr>
                <td><span class="json-key">${h.name}</span></td>
                <td>${h.value}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      </div>
    `);
  }
  
  // 响应体
  if (request.responseBody) {
    sections.push(`
      <div class="detail-section">
        <div class="detail-header">
          <h3 class="detail-title">响应体</h3>
          <div class="detail-actions">
            <button class="detail-btn" onclick="showTranslation('responseBody')">翻译</button>
            <button class="detail-btn" onclick="copyToClipboard('${escapeHtml(request.responseBody)}')">复制</button>
          </div>
        </div>
        <div class="detail-content">
          ${formatResponseBody(request.responseBody)}
        </div>
      </div>
    `);
  }
  
  container.innerHTML = sections.join('');
}

// 格式化响应体
function formatResponseBody(body) {
  try {
    if (body.trim().startsWith('{') || body.trim().startsWith('[')) {
      const json = JSON.parse(body);
      return `<div class="json-view">${formatJson(json)}</div>`;
    } else {
      return `<pre style="white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(body)}</pre>`;
    }
  } catch (e) {
    return `<pre style="white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(body)}</pre>`;
  }
}

// 格式化Headers
function formatHeaders(headers) {
  const formatted = {};
  headers.forEach(h => {
    formatted[h.name] = h.value;
  });
  return formatted;
}

// 格式化JSON
function formatJson(obj, indent = 0) {
  if (obj === null || obj === undefined) {
    return '<span class="json-null">null</span>';
  }
  
  if (typeof obj === 'string') {
    return `<span class="json-string">"${escapeHtml(obj)}"</span>`;
  }
  
  if (typeof obj === 'number') {
    return `<span class="json-number">${obj}</span>`;
  }
  
  if (typeof obj === 'boolean') {
    return `<span class="json-boolean">${obj}</span>`;
  }
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    const items = obj.map((item, index) => {
      const comma = index < obj.length - 1 ? ',' : '';
      return `  ${'  '.repeat(indent)}${formatJson(item, indent + 1)}${comma}`;
    }).join('\n');
    return `[\n${items}\n${'  '.repeat(indent - 1)}]`;
  }
  
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';
    const items = keys.map((key, index) => {
      const comma = index < keys.length - 1 ? ',' : '';
      return `  ${'  '.repeat(indent)}<span class="json-key">"${key}"</span>: ${formatJson(obj[key], indent + 1)}${comma}`;
    }).join('\n');
    return `{\n${items}\n${'  '.repeat(indent - 1)}}`;
  }
  
  return String(obj);
}

// 显示翻译面板
function showTranslation(target) {
  if (!selectedRequest) return;
  const data = selectedRequest[target];
  if (!data) return;
  
  try {
    const obj = JSON.parse(data);
    const panel = document.getElementById('translationPanel');
    const content = document.getElementById('translationContent');
    content.innerHTML = generateTranslation(obj);
    panel.style.display = 'flex';
  } catch (e) {
    alert('无法解析JSON数据');
  }
}

// 生成翻译内容
function generateTranslation(obj, prefix = '') {
  let html = '';
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    const translated = translateKey(key);
    
    if (typeof value === 'object' && value !== null) {
      html += `
        <div class="translation-item">
          <div class="translation-key">${fullKey}</div>
          <div class="translation-translated">${translated}</div>
        </div>
      `;
      html += generateTranslation(value, fullKey);
    } else {
      html += `
        <div class="translation-item">
          <div class="translation-key">${fullKey}</div>
          <div class="translation-translated">${translated}</div>
          <div class="translation-value">${JSON.stringify(value)}</div>
        </div>
      `;
    }
  }
  return html;
}

// 翻译键
function translateKey(key) {
  if (translationDict[key]) return translationDict[key];
  return '无翻译';
}

// 关闭翻译面板
function closeTranslationPanel() {
  document.getElementById('translationPanel').style.display = 'none';
}

// 清空请求
function clearRequests() {
  if (confirm('确定要清空所有请求记录吗？')) {
    chrome.runtime.sendMessage(
      { action: 'clearRequests', tabId: currentTabId },
      () => {
        allRequests = [];
        updateStats();
        renderRequests();
        document.getElementById('requestDetails').innerHTML = `
          <div class="details-placeholder">
            <p>选择一个请求查看详情</p>
          </div>
        `;
      }
    );
  }
}

// 自动刷新
function startAutoRefresh() {
  setInterval(() => {
    loadRequests();
  }, 2000); // 每2秒刷新
}

// 工具函数
function formatTime(timestamp, full = false) {
  const date = new Date(timestamp);
  if (full) return date.toLocaleString('zh-CN');
  return date.toLocaleTimeString('zh-CN');
}

function getStatusClass(statusCode) {
  if (!statusCode) return 'status-pending';
  if (statusCode >= 200 && statusCode < 300) return 'status-success';
  if (statusCode >= 400) return 'status-error';
  return 'status-pending';
}

function truncateUrl(url, maxLength = 60) {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength) + '...';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('已复制到剪贴板');
  }).catch(err => {
    console.error('复制失败:', err);
  });
}
