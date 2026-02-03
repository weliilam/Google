// Background Service Worker

// 存储所有请求的数据 - 使用 tabId 作为 key
const tabRequests = new Map();

// 请求计数器，用于生成唯一 ID
let requestCounter = 0;

// 生成唯一请求 ID
function generateRequestId() {
  return `req_${Date.now()}_${++requestCounter}`;
}

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab?.id;
  if (!tabId) {
    console.log('[Background] No tabId in message');
    sendResponse({ success: false, error: 'No tabId' });
    return;
  }
  
  if (message.action === 'captureRequest') {
    const { url, method, type, webRequestId } = message;
    
    const requestId = generateRequestId();
    const requestData = {
      id: requestId,
      webRequestId: webRequestId || requestId,
      tabId: tabId,
      method: method,
      url: url,
      type: type,
      statusCode: 0,
      duration: 0,
      startTime: Date.now(),
      requestBody: null,
      responseBody: null,
      requestHeaders: {},
      responseHeaders: {}
    };
    
    // 存储请求
    if (!tabRequests.has(tabId)) {
      tabRequests.set(tabId, []);
    }
    tabRequests.get(tabId).push(requestData);
    
    console.log('[Background] Request captured:', {
      id: requestId,
      url: url,
      method: method,
      type: type
    });
    
    sendResponse({ success: true, requestId });
    return true;
  }
  
  if (message.action === 'updateRequest') {
    const { requestId, statusCode, duration, responseBody } = message;
    
    const tabRequestList = tabRequests.get(tabId);
    if (!tabRequestList) {
      sendResponse({ success: false, error: 'No requests' });
      return;
    }
    
    const request = tabRequestList.find(r => r.id === requestId || r.webRequestId === requestId);
    if (request) {
      if (statusCode) request.statusCode = statusCode;
      if (duration) request.duration = duration;
      if (responseBody) request.responseBody = responseBody;
      
      console.log('[Background] Request updated:', {
        id: request.id,
        status: request.statusCode,
        duration: request.duration
      });
      
      notifySidePanel(tabId);
    }
    
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'getRequests') {
    const requests = getRequestsByTabId(tabId);
    console.log('[Background] Returning requests:', requests.length);
    sendResponse({ requests });
    return true;
  }
  
  if (message.action === 'clearRequests') {
    clearRequestsByTabId(tabId);
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'refreshRequests') {
    notifySidePanel(tabId);
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'getCurrentTabId') {
    sendResponse({ tabId });
    return true;
  }
});

// 根据 tabId 获取请求列表
function getRequestsByTabId(tabId) {
  const requests = tabRequests.get(tabId) || [];
  
  // 按时间倒序排列
  return requests.sort((a, b) => b.startTime - a.startTime);
}

// 根据 tabId 清空请求列表
function clearRequestsByTabId(tabId) {
  tabRequests.delete(tabId);
}

// 通知 Side Panel 更新
function notifySidePanel(tabId) {
  chrome.runtime.sendMessage({
    action: 'requestUpdated',
    tabId: tabId
  }).catch(() => {
    // 忽略错误（可能没有打开 Side Panel）
  });
}

// 监听标签页关闭，清理对应的数据
chrome.tabs.onRemoved.addListener((tabId) => {
  clearRequestsByTabId(tabId);
  console.log('[Background] Tab closed, requests cleared:', tabId);
});

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    notifySidePanel(tabId);
  }
});

console.log('[Background] Service Worker loaded (v5.0.5 - No webRequest API)');
