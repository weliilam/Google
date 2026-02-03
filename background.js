// 背景脚本：拦截和存储HTTP请求

// 存储当前标签页的请求
let requestStore = new Map();
let maxRequestsPerTab = 100; // 每个标签页最多存储100个请求

// 请求类型分类
function classifyRequest(details) {
  const method = details.method.toUpperCase();
  const url = new URL(details.url);
  
  // 根据方法分类
  const typeMap = {
    'GET': '读取',
    'POST': '创建',
    'PUT': '更新',
    'PATCH': '部分更新',
    'DELETE': '删除',
    'HEAD': '头部',
    'OPTIONS': '选项'
  };
  
  return {
    type: typeMap[method] || method,
    method: method,
    isApi: url.pathname.match(/^\/api\//) || 
           url.pathname.match(/\.(json|xml)$/) ||
           url.searchParams.has('callback')
  };
}

// 格式化请求头
function formatHeaders(headers) {
  const formatted = {};
  headers.forEach(header => {
    formatted[header.name] = header.value;
  });
  return formatted;
}

// 获取请求参数
function getRequestParams(details) {
  try {
    const url = new URL(details.url);
    const params = {};
    
    // URL参数
    if (details.method === 'GET') {
      url.searchParams.forEach((value, key) => {
        params[key] = value;
      });
    }
    
    // 如果有请求体（注意：webRequest API在某些情况下无法获取完整body）
    if (details.requestBody && details.requestBody.formData) {
      Object.keys(details.requestBody.formData).forEach(key => {
        params[key] = details.requestBody.formData[key][0];
      });
    }
    
    return Object.keys(params).length > 0 ? params : null;
  } catch (e) {
    return null;
  }
}

// 存储请求
function storeRequest(tabId, requestData) {
  if (!requestStore.has(tabId)) {
    requestStore.set(tabId, []);
  }
  
  const requests = requestStore.get(tabId);
  
  // 检查是否已存在相同请求
  const existsIndex = requests.findIndex(r => 
    r.requestId === requestData.requestId
  );
  
  if (existsIndex >= 0) {
    // 更新现有请求
    requests[existsIndex] = { ...requests[existsIndex], ...requestData };
  } else {
    // 添加新请求
    requests.unshift(requestData);
    
    // 限制数量
    if (requests.length > maxRequestsPerTab) {
      requests.pop();
    }
  }
  
  // 同步到storage
  chrome.storage.local.set({
    [`requests_${tabId}`]: requests
  });
}

// 监听请求发送前
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.tabId <= 0) return; // 忽略非标签页请求
    
    const classification = classifyRequest(details);
    const params = getRequestParams(details);
    
    const requestData = {
      requestId: details.requestId,
      url: details.url,
      method: details.method,
      type: classification.type,
      isApi: classification.isApi,
      timestamp: Date.now(),
      requestHeaders: null,
      requestBody: params,
      responseHeaders: null,
      statusCode: null,
      responseBody: null
    };
    
    storeRequest(details.tabId, requestData);
  },
  { urls: ['<all_urls>'] },
  ['requestBody']
);

// 监听请求头
chrome.webRequest.onSendHeaders.addListener(
  (details) => {
    if (details.tabId <= 0) return;
    
    const tabRequests = requestStore.get(details.tabId);
    if (!tabRequests) return;
    
    const request = tabRequests.find(r => r.requestId === details.requestId);
    if (request) {
      request.requestHeaders = formatHeaders(details.requestHeaders);
      storeRequest(details.tabId, request);
    }
  },
  { urls: ['<all_urls>'] },
  ['requestHeaders']
);

// 监听响应头
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (details.tabId <= 0) return;
    
    const tabRequests = requestStore.get(details.tabId);
    if (!tabRequests) return;
    
    const request = tabRequests.find(r => r.requestId === details.requestId);
    if (request) {
      request.statusCode = details.statusCode;
      request.responseHeaders = formatHeaders(details.responseHeaders);
      request.contentType = details.responseHeaders?.find(
        h => h.name.toLowerCase() === 'content-type'
      )?.value || '';
      
      storeRequest(details.tabId, request);
    }
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders']
);

// 清理关闭标签页的数据
chrome.tabs.onRemoved.addListener((tabId) => {
  requestStore.delete(tabId);
  chrome.storage.local.remove([`requests_${tabId}`]);
});

// 监听消息（从popup）
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getRequests') {
    const tabId = request.tabId;
    const requests = requestStore.get(tabId) || [];
    sendResponse({ requests: requests });
  } else if (request.action === 'clearRequests') {
    const tabId = request.tabId;
    requestStore.set(tabId, []);
    chrome.storage.local.set({ [`requests_${tabId}`]: [] });
    sendResponse({ success: true });
  }
  return true; // 保持消息通道开放
});

// 获取当前活动标签页
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}
