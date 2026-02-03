// 内容脚本：拦截和修改页面请求（可选增强功能）

// 这里可以添加页面级别的请求拦截逻辑
// 例如：使用 XMLHttpRequest/Fetch API 的包装器来捕获更详细的请求信息

(function() {
  'use strict';
  
  // 包装 XMLHttpRequest
  const OriginalXHR = window.XMLHttpRequest;
  
  window.XMLHttpRequest = function() {
    const xhr = new OriginalXHR();
    const originalOpen = xhr.open;
    const originalSend = xhr.send;
    
    let requestData = {
      method: null,
      url: null,
      body: null
    };
    
    xhr.open = function(method, url) {
      requestData.method = method.toUpperCase();
      requestData.url = url;
      return originalOpen.apply(xhr, arguments);
    };
    
    xhr.send = function(body) {
      requestData.body = body;
      
      // 发送消息到background
      if (requestData.method && requestData.url) {
        chrome.runtime.sendMessage({
          action: 'xhrRequest',
          data: requestData
        });
      }
      
      return originalSend.apply(xhr, arguments);
    };
    
    return xhr;
  };
  
  // 包装 Fetch API
  const OriginalFetch = window.fetch;
  
  window.fetch = function(input, init) {
    const requestData = {
      method: (init?.method || 'GET').toUpperCase(),
      url: typeof input === 'string' ? input : input.url,
      body: init?.body
    };
    
    // 发送消息到background
    chrome.runtime.sendMessage({
      action: 'fetchRequest',
      data: requestData
    });
    
    return OriginalFetch.apply(window, arguments);
  };
  
  // 监听来自popup的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageInfo') {
      sendResponse({
        url: window.location.href,
        title: document.title,
        timestamp: Date.now()
      });
    }
  });
  
  console.log('网络请求分析器 - Content Script已加载');
})();
