// Background Service Worker

// 存储所有请求的数据
const tabRequests = new Map();

// 监听 webRequest 事件
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    // 跳过扩展自己的请求
    if (details.tabId === -1) return;
    
    const requestId = `${details.requestId}-${details.tabId}`;
    
    // 初始化请求数据
    tabRequests.set(requestId, {
      id: requestId,
      tabId: details.tabId,
      method: details.method,
      url: details.url,
      type: getRequestType(details),
      statusCode: 0,
      duration: 0,
      startTime: Date.now(),
      requestBody: null,
      responseBody: null,
      requestHeaders: {},
      responseHeaders: {}
    });
  },
  { urls: ['<all_urls>'] },
  ['requestBody']
);

// 监听请求头
chrome.webRequest.onSendHeaders.addListener(
  (details) => {
    if (details.tabId === -1) return;
    
    const requestId = `${details.requestId}-${details.tabId}`;
    const request = tabRequests.get(requestId);
    
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
    
    const requestId = `${details.requestId}-${details.tabId}`;
    const request = tabRequests.get(requestId);
    
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
    
    const requestId = `${details.requestId}-${details.tabId}`;
    const request = tabRequests.get(requestId);
    
    if (request) {
      request.duration = details.timeStamp - request.startTime;
      
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
    
    const requestId = `${details.requestId}-${details.tabId}`;
    const request = tabRequests.get(requestId);
    
    if (request) {
      request.statusCode = 0;
      request.error = details.error;
      request.duration = details.timeStamp - request.startTime;
      
      // 通知 Side Panel 更新
      notifySidePanel(details.tabId);
    }
  },
  { urls: ['<all_urls>'] }
);

// 监听来自 content script 的消息（响应体数据）
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getCurrentTabId') {
    const tabId = sender.tab?.id;
    sendResponse({ tabId });
    return true;
  }

  if (message.action === 'saveResponseBody') {
    const { requestId, responseBody } = message;
    
    // 获取发送消息的标签页 ID
    const tabId = sender.tab?.id;
    if (!tabId) {
      sendResponse({ success: false });
      return;
    }
    
    // 查找对应的请求
    for (const [key, request] of tabRequests.entries()) {
      if (request.tabId === tabId) {
        request.responseBody = responseBody;
        
        // 通知 Side Panel 更新
        notifySidePanel(tabId);
        break;
      }
    }
    
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'getRequests') {
    const { tabId } = message;
    const requests = getRequestsByTabId(tabId);
    sendResponse({ requests });
    return true;
  }
  
  if (message.action === 'clearRequests') {
    const { tabId } = message;
    clearRequestsByTabId(tabId);
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'refreshRequests') {
    const { tabId } = message;
    notifySidePanel(tabId);
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'openSidePanel') {
    const { tabId } = message;
    chrome.sidePanel.open({ tabId }).catch(() => {
      // 忽略错误
    });
  }
});

// 判断请求类型
function getRequestType(details) {
  if (details.type === 'xmlhttprequest') {
    return 'xhr';
  }
  
  // 检查是否是 fetch 请求
  const url = details.url.toLowerCase();
  if (url.includes('.json') || url.includes('api/') || 
      url.includes('/api') || url.includes('fetch')) {
    return 'fetch';
  }
  
  return 'other';
}

// 根据 tabId 获取请求列表
function getRequestsByTabId(tabId) {
  const requests = [];
  for (const [key, request] of tabRequests.entries()) {
    if (request.tabId === tabId) {
      requests.push(request);
    }
  }
  
  // 按时间倒序排列
  return requests.sort((a, b) => b.startTime - a.startTime);
}

// 根据 tabId 清空请求列表
function clearRequestsByTabId(tabId) {
  for (const [key, request] of tabRequests.entries()) {
    if (request.tabId === tabId) {
      tabRequests.delete(key);
    }
  }
}

// 通知 Side Panel 更新
function notifySidePanel(tabId) {
  // 发送消息给 Side Panel
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
});

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    notifySidePanel(tabId);
  }
});
