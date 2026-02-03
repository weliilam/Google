// Side Panel 主脚本

let currentTabId = null;
let allRequests = [];
let selectedRequest = null;
let autoRefreshInterval = null;

console.log('[Side Panel] Loading...');

// 翻译字典
const translationDict = {
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
  'userPhone': '用户电话', 'userRole': '用户角色', 'userAge': '用户年龄',
  'userAddress': '用户地址', 'userAvatar': '用户头像',
  'userName': '用户名', 'userStatus': '用户状态', 'userProfile': '用户资料',
  'orderInfo': '订单信息', 'orderTotal': '订单总额', 'orderItems': '订单项',
  'orderStatus': '订单状态', 'orderDate': '订单日期', 'orderNumber': '订单号',
  'productId': '产品ID', 'productName': '产品名称', 'productPrice': '产品价格',
  'productImage': '产品图片', 'productCategory': '产品分类',
  'isActive': '是否激活', 'isDeleted': '是否删除', 'isVerified': '是否验证',
  'isEnabled': '是否启用', 'isVisible': '是否可见', 'isPublic': '是否公开',
  'loginName': '登录名', 'loginTime': '登录时间', 'logoutTime': '登出时间',
  'sessionToken': '会话令牌', 'accessToken': '访问令牌', 'refreshToken': '刷新令牌',
  'apiVersion': 'API版本', 'apiStatus': 'API状态', 'apiError': 'API错误',
  'responseTime': '响应时间', 'requestTime': '请求时间', 'duration': '持续时间',
  'contentLength': '内容长度', 'contentType': '内容类型', 'contentEncoding': '内容编码',
  'serverTime': '服务器时间', 'clientTime': '客户端时间', 'timezone': '时区',
  'latitude': '纬度', 'longitude': '经度', 'location': '位置',
  'deviceType': '设备类型', 'deviceModel': '设备型号', 'deviceOS': '设备系统',
  'browserType': '浏览器类型', 'browserVersion': '浏览器版本',
  'networkType': '网络类型', 'networkSpeed': '网络速度', 'ipAddress': 'IP地址',
  'errorCode': '错误代码', 'errorMessage': '错误消息', 'errorDetail': '错误详情',
  'warningMessage': '警告消息', 'infoMessage': '信息消息',
  'attachment': '附件', 'fileName': '文件名', 'fileSize': '文件大小',
  'fileType': '文件类型', 'downloadUrl': '下载地址', 'uploadUrl': '上传地址',
  'thumbnail': '缩略图', 'previewUrl': '预览地址', 'fullImageUrl': '完整图片地址',
  'authorName': '作者姓名', 'authorEmail': '作者邮箱', 'authorId': '作者ID',
  'editorName': '编辑姓名', 'editorId': '编辑ID',
  'tagName': '标签名称', 'tagId': '标签ID', 'categoryName': '分类名称',
  'comment': '评论', 'rating': '评分', 'likeCount': '点赞数',
  'shareCount': '分享数', 'viewCount': '浏览数', 'clickCount': '点击数',
  'favorite': '收藏', 'follow': '关注', 'subscribe': '订阅',
  'notification': '通知', 'reminder': '提醒', 'schedule': '计划',
  'startDate': '开始日期', 'endDate': '结束日期', 'dueDate': '到期日期',
  'priority': '优先级', 'status': '状态', 'progress': '进度',
  'percentage': '百分比', 'ratio': '比率', 'rate': '速率',
  'minValue': '最小值', 'maxValue': '最大值', 'avgValue': '平均值',
  'sumValue': '总和', 'countValue': '计数值',
  'source': '来源', 'destination': '目的地', 'path': '路径',
  'route': '路由', 'gateway': '网关', 'endpoint': '端点',
  'configuration': '配置', 'setting': '设置', 'option': '选项',
  'parameter': '参数', 'argument': '参数', 'variable': '变量',
  'constant': '常量', 'function': '函数', 'method': '方法',
  'class': '类', 'object': '对象', 'array': '数组', 'string': '字符串',
  'number': '数字', 'boolean': '布尔值', 'null': '空值',
  'undefined': '未定义', 'any': '任意', 'void': '无返回',
  'interface': '接口', 'type': '类型', 'enum': '枚举',
  'namespace': '命名空间', 'module': '模块', 'package': '包',
  'library': '库', 'framework': '框架', 'tool': '工具',
  'plugin': '插件', 'extension': '扩展', 'component': '组件',
  'service': '服务', 'controller': '控制器', 'model': '模型',
  'view': '视图', 'template': '模板', 'style': '样式',
  'script': '脚本', 'asset': '资源', 'resource': '资源',
  'environment': '环境', 'production': '生产环境', 'development': '开发环境',
  'testing': '测试环境', 'staging': '预发布环境',
  'version': '版本', 'release': '发布', 'build': '构建',
  'deploy': '部署', 'install': '安装', 'update': '更新',
  'upgrade': '升级', 'rollback': '回滚', 'migrate': '迁移',
  'backup': '备份', 'restore': '恢复', 'archive': '归档',
  'delete': '删除', 'create': '创建', 'read': '读取',
  'update': '更新', 'list': '列表', 'search': '搜索',
  'filter': '过滤', 'sort': '排序', 'paginate': '分页'
};

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Side Panel] DOMContentLoaded');
  await loadRequests();
  setupEventListeners();
  startAutoRefresh();
});

// 设置事件监听器
function setupEventListeners() {
  document.getElementById('refreshBtn').addEventListener('click', loadRequests);
  document.getElementById('clearBtn').addEventListener('click', clearRequests);
  document.getElementById('exportBtn').addEventListener('click', exportRequests);
  document.getElementById('methodFilter').addEventListener('change', filterRequests);
  document.getElementById('typeFilter').addEventListener('change', filterRequests);
  document.getElementById('statusFilter').addEventListener('change', filterRequests);
  document.getElementById('searchFilter').addEventListener('input', filterRequests);
}

// 加载请求
async function loadRequests() {
  console.log('[Side Panel] Loading requests...');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      console.log('[Side Panel] No active tab');
      return;
    }
    
    currentTabId = tab.id;
    console.log('[Side Panel] Current tab ID:', currentTabId);
    
    chrome.runtime.sendMessage(
      { action: 'getRequests', tabId: currentTabId },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('[Side Panel] Error loading requests:', chrome.runtime.lastError);
          return;
        }
        
        if (response && response.requests) {
          allRequests = response.requests;
          console.log('[Side Panel] Requests loaded:', allRequests.length);
          console.log('[Side Panel] Requests:', allRequests);
          updateStats();
          renderRequests();
        }
      }
    );
  } catch (error) {
    console.error('[Side Panel] Load requests failed:', error);
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
  
  // 计算总大小
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
  
  if (methodFilter !== 'all') {
    filtered = filtered.filter(r => r.method === methodFilter);
  }
  
  if (typeFilter !== 'all') {
    filtered = filtered.filter(r => r.type === typeFilter);
  }
  
  if (statusFilter === 'success') {
    filtered = filtered.filter(r => r.statusCode >= 200 && r.statusCode < 300);
  } else if (statusFilter === 'error') {
    filtered = filtered.filter(r => r.statusCode >= 400);
  } else if (statusFilter === 'pending') {
    filtered = filtered.filter(r => r.statusCode === 0);
  }
  
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
        <p>暂无请求</p>
        <p class="hint">刷新页面或执行操作后开始捕获</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = requests.map(req => `
    <div class="request-item ${selectedRequest && selectedRequest.id === req.id ? 'active' : ''}" 
         data-id="${req.id}"
         onclick="selectRequest('${req.id}')">
      <div class="request-item-header">
        <span class="request-method method-${req.method}">${req.method}</span>
        <span class="request-url" title="${req.url}">${req.url}</span>
        ${req.responseBody ? '<span class="request-has-body">✓</span>' : ''}
      </div>
      <div class="request-info">
        <span class="request-status ${req.statusCode >= 200 && req.statusCode < 300 ? 'status-success' : req.statusCode >= 400 ? 'status-error' : 'status-pending'}">
          ${req.statusCode || 'Pending'}
        </span>
        <span class="request-type">${req.type}</span>
        <span class="request-time">${formatDuration(req.duration)}</span>
      </div>
    </div>
  `).join('');
}

// 选择请求
window.selectRequest = function(id) {
  selectedRequest = allRequests.find(r => r.id === id);
  renderRequests();
  renderDetails();
};

// 渲染请求详情
function renderDetails() {
  if (!selectedRequest) return;
  
  const container = document.getElementById('detailsContent');
  
  const hasResponseBody = selectedRequest.responseBody && selectedRequest.responseBody.trim() !== '';
  
  container.innerHTML = `
    <div class="detail-section">
      <div class="detail-header">
        <span class="detail-title">基本信息</span>
      </div>
      <table class="key-value-table">
        <tr><th>请求方法</th><td>${selectedRequest.method}</td></tr>
        <tr><th>请求URL</th><td>${selectedRequest.url}</td></tr>
        <tr><th>状态码</th><td>${selectedRequest.statusCode}</td></tr>
        <tr><th>请求类型</th><td>${selectedRequest.type}</td></tr>
        <tr><th>耗时</th><td>${formatDuration(selectedRequest.duration)}</td></tr>
        <tr><th>响应大小</th><td>${formatSize(selectedRequest.responseBody ? selectedRequest.responseBody.length : 0)}</td></tr>
        <tr><th>请求ID</th><td>${selectedRequest.id}</td></tr>
        <tr><th>Web Request ID</th><td>${selectedRequest.webRequestId}</td></tr>
      </table>
    </div>
    
    <div class="detail-section">
      <div class="detail-header">
        <span class="detail-title">响应体</span>
        <div class="detail-actions">
          <button class="detail-btn" onclick="copyResponseBody()">复制</button>
          ${hasResponseBody ? '<button class="detail-btn" onclick="translateFields()">翻译字段</button>' : ''}
        </div>
      </div>
      <div class="detail-content">
        ${hasResponseBody ? renderResponseBody(selectedRequest.responseBody) : '<p style="color: #999;">无响应体数据</p>'}
      </div>
    </div>
  `;
}

// 渲染响应体
function renderResponseBody(body) {
  try {
    // 尝试解析为 JSON
    const json = JSON.parse(body);
    return `<div class="json-view">${formatJSON(json)}</div>`;
  } catch (e) {
    // 不是 JSON，显示原始文本
    return `<pre style="white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(body)}</pre>`;
  }
}

// 格式化 JSON
function formatJSON(obj, indent = 0) {
  const spaces = '  '.repeat(indent);
  
  if (obj === null) {
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
    const items = obj.map(item => `${spaces}  ${formatJSON(item, indent + 1)}`);
    return `[\n${items.join(',\n')}\n${spaces}]`;
  }
  
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';
    const items = keys.map(key => {
      const value = formatJSON(obj[key], indent + 1);
      return `${spaces}  <span class="json-key">"${escapeHtml(key)}"</span>: ${value}`;
    });
    return `{\n${items.join(',\n')}\n${spaces}}`;
  }
  
  return String(obj);
}

// HTML 转义
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 复制响应体
window.copyResponseBody = function() {
  if (!selectedRequest || !selectedRequest.responseBody) return;
  
  navigator.clipboard.writeText(selectedRequest.responseBody).then(() => {
    alert('已复制到剪贴板');
  });
};

// 翻译字段
window.translateFields = function() {
  if (!selectedRequest || !selectedRequest.responseBody) return;
  
  try {
    const json = JSON.parse(selectedRequest.responseBody);
    const translated = translateObject(json);
    
    const container = document.getElementById('detailsContent');
    const section = container.querySelectorAll('.detail-section')[1];
    const content = section.querySelector('.detail-content');
    
    content.innerHTML = `<div class="json-view">${formatJSON(translated)}</div>`;
  } catch (e) {
    alert('翻译失败：响应体不是有效的 JSON 格式');
  }
};

// 递归翻译对象
function translateObject(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(translateObject);
  }
  
  const translated = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const translatedKey = translationDict[key] || key;
      translated[`${key} (${translatedKey})`] = translateObject(obj[key]);
    }
  }
  
  return translated;
}

// 格式化耗时
function formatDuration(ms) {
  if (!ms) return '-';
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
}

// 清空请求
function clearRequests() {
  if (!confirm('确定要清空所有请求吗？')) return;
  
  chrome.runtime.sendMessage(
    { action: 'clearRequests', tabId: currentTabId },
    () => {
      allRequests = [];
      selectedRequest = null;
      updateStats();
      renderRequests();
      document.getElementById('detailsContent').innerHTML = `
        <div class="details-placeholder">
          <p>点击请求查看详情</p>
        </div>
      `;
    }
  );
}

// 导出请求
function exportRequests() {
  const data = JSON.stringify(allRequests, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `requests_${new Date().toISOString()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// 开始自动刷新
function startAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }
  
  autoRefreshInterval = setInterval(() => {
    console.log('[Side Panel] Auto-refreshing...');
    loadRequests();
  }, 2000); // 每2秒刷新一次
}

// 监听来自 background 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'requestUpdated') {
    console.log('[Side Panel] Request updated, refreshing...');
    loadRequests();
  }
});

// 页面卸载时清除定时器
window.addEventListener('beforeunload', () => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }
});

console.log('[Side Panel] Loaded successfully');
