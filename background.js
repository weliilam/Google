// Background Service Worker

// 存储所有请求的数据 - 使用 tabId 作为 key
const tabRequests = new Map();

// 请求计数器，用于生成唯一 ID
let requestCounter = 0;

// 生成唯一请求 ID
function generateRequestId() {
  return `req_${Date.now()}_${++requestCounter}`;
}

// 监听 webRequest 事件
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    // 跳过扩展自己的请求
    if (details.tabId === -1) return;
    
    const requestId = generateRequestId();
    const requestType = getRequestType(details);
    
    // 初始化请求数据
    const requestData = {
      id: requestId,
      webRequestId: details.requestId,
      tabId: details.tabId,
      method: details.method,
      url: details.url,
      type: requestType,
      statusCode: 0,
      duration: 0,
      startTime: Date.now(),
      requestBody: null,
      responseBody: null,
      requestHeaders: {},
      responseHeaders: {}
    };
    
    // 存储请求
    if (!tabRequests.has(details.tabId)) {
      tabRequests.set(details.tabId, []);
    }
    tabRequests.get(details.tabId).push(requestData);
    
    console.log('[Background] Request captured:', {
      id: requestId,
      url: details.url,
      method: details.method,
      type: requestType
    });
  },
  { urls: ['<all_urls>'] },
  ['requestBody']
);

// 监听请求头
chrome.webRequest.onSendHeaders.addListener(
  (details) => {
    if (details.tabId === -1) return;
    
    const tabRequestList = tabRequests.get(details.tabId);
    if (!tabRequestList) return;
    
    // 查找对应的请求（通过 webRequestId）
    const request = tabRequestList.find(r => r.webRequestId === details.requestId);
    if (request) {
      request.requestHeaders = {};
      details.requestHeaders.forEach(header => {
        request.requestHeaders[header.name] = header.value;
      });
      
      // 如果有请求体，尝试解析
      if (details.requestBody) {
        if (details.requestBody.raw && details.requestBody.raw.length > 0) {
          try {
            const decoder = new TextDecoder();
            request.requestBody = decoder.decode(details.requestBody.raw[0].bytes);
          } catch (e) {
            console.error('解析请求体失败:', e);
          }
        } else if (details.requestBody.formData) {
          request.requestBody = JSON.stringify(details.requestBody.formData);
        }
      }
    }
  },
  { urls: ['<all_urls>'] },
  ['requestHeaders', 'requestBody']
);

// 监听响应头
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (details.tabId === -1) return;
    
    const tabRequestList = tabRequests.get(details.tabId);
    if (!tabRequestList) return;
    
    // 查找对应的请求
    const request = tabRequestList.find(r => r.webRequestId === details.requestId);
    if (request) {
      request.statusCode = details.statusCode;
      request.responseHeaders = {};
      details.responseHeaders.forEach(header => {
        request.responseHeaders[header.name] = header.value;
      });
    }
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders']
);

// 监听请求完成
chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (details.tabId === -1) return;
    
    const tabRequestList = tabRequests.get(details.tabId);
    if (!tabRequestList) return;
    
    // 查找对应的请求
    const request = tabRequestList.find(r => r.webRequestId === details.requestId);
    if (request) {
      request.duration = details.timeStamp - request.startTime;
      
      console.log('[Background] Request completed:', {
        id: request.id,
        url: request.url,
        status: request.statusCode,
        duration: request.duration
      });
      
      // 通知 Side Panel 更新
      notifySidePanel(details.tabId);
    }
  },
  { urls: ['<all_urls>'] }
);

// 监听请求错误
chrome.webRequest.onErrorOccurred.addListener(
  (details) => {
    if (details.tabId === -1) return;
    
    const tabRequestList = tabRequests.get(details.tabId);
    if (!tabRequestList) return;
    
    // 查找对应的请求
    const request = tabRequestList.find(r => r.webRequestId === details.requestId);
    if (request) {
      request.statusCode = 0;
      request.error = details.error;
      request.duration = details.timeStamp - request.startTime;
      
      console.log('[Background] Request error:', {
        id: request.id,
        url: request.url,
        error: details.error
      });
      
      // 通知 Side Panel 更新
      notifySidePanel(details.tabId);
    }
  },
  { urls: ['<all_urls>'] }
);

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab?.id;
  if (!tabId) {
    console.log('[Background] No tabId in message');
    sendResponse({ success: false, error: 'No tabId' });
    return;
  }
  
  if (message.action === 'saveResponseBody') {
    const { responseBody, webRequestId } = message;
    
    const tabRequestList = tabRequests.get(tabId);
    if (!tabRequestList) {
      console.log('[Background] No requests for tab:', tabId);
      sendResponse({ success: false, error: 'No requests' });
      return;
    }
    
    // 如果提供了 webRequestId，直接匹配
    if (webRequestId) {
      const request = tabRequestList.find(r => r.webRequestId === webRequestId);
      if (request) {
        request.responseBody = responseBody;
        console.log('[Background] Response body saved (by webRequestId):', {
          id: request.id,
          length: responseBody.length
        });
        
        notifySidePanel(tabId);
        sendResponse({ success: true });
        return;
      }
    }
    
    // 否则，添加到最新的 XHR/Fetch 请求
    const xhrFetchRequests = tabRequestList.filter(r => 
      r.type === 'xhr' || r.type === 'fetch'
    );
    
    if (xhrFetchRequests.length > 0) {
      // 找到最新的且没有响应体的请求
      const latestRequest = [...xhrFetchRequests].reverse().find(r => !r.responseBody);
      if (latestRequest) {
        latestRequest.responseBody = responseBody;
        console.log('[Background] Response body saved (latest):', {
          id: latestRequest.id,
          url: latestRequest.url,
          length: responseBody.length
        });
        
        notifySidePanel(tabId);
        sendResponse({ success: true });
        return;
      }
    }
    
    console.log('[Background] No matching request found');
    sendResponse({ success: false, error: 'No matching request' });
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

// 判断请求类型
function getRequestType(details) {
  // XMLHTTPRequest
  if (details.type === 'xmlhttprequest') {
    return 'xhr';
  }
  
  // 检查请求头判断是否是 AJAX/Fetch
  const url = details.url.toLowerCase();
  const isApi = url.includes('.json') || 
                url.includes('api/') || 
                url.includes('/api') || 
                url.includes('ajax') ||
                url.includes('/v1/') ||
                url.includes('/v2/');
  
  // 检查 Content-Type
  const hasJsonHeader = false; // 需要在 onSendHeaders 中检查
  
  if (isApi) {
    return 'fetch';
  }
  
  // 默认返回 original type
  return details.type; // 'stylesheet', 'script', 'image', 'font', 'other', etc.
}

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

console.log('[Background] Service Worker loaded');
