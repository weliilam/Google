// Content Script - 拦截 Fetch API 和 XMLHttpRequest 以捕获响应体

(function() {
  'use strict';

  console.log('Network Analyzer Content Script loaded');

  // 生成唯一请求 ID
  function generateRequestId(url, method) {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${method}-${url.length}`;
  }

  // 拦截 Fetch API
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0].url;
    const method = (args[1]?.method || 'GET').toUpperCase();
    
    const requestId = generateRequestId(url, method);
    
    try {
      const response = await originalFetch(...args);
      const clonedResponse = response.clone();
      
      // 尝试获取响应体
      try {
        const body = await clonedResponse.text();
        
        // 发送到 background
        chrome.runtime.sendMessage({
          action: 'saveResponseBody',
          requestId: requestId,
          tabId: chrome?.tabs?.getCurrent ? chrome.tabs.getCurrent().then(tab => tab.id) : null,
          responseBody: body
        }).catch(() => {
          // 忽略错误（可能是 background 未准备好）
        });
      } catch (e) {
        console.error('Failed to read response body:', e);
      }
      
      return response;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  };

  // 拦截 XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  const originalXHROpen_orig = XMLHttpRequest.prototype.open;
  const originalXHRSend_orig = XMLHttpRequest.prototype.send;
  const originalXHRSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._requestId = generateRequestId(url, method);
    this._requestMethod = method;
    this._requestUrl = url;
    return originalXHROpen.apply(this, [method, url, ...args]);
  };

  XMLHttpRequest.prototype.setRequestHeader = function(name, value) {
    if (!this._requestHeaders) {
      this._requestHeaders = {};
    }
    this._requestHeaders[name] = value;
    return originalXHRSetRequestHeader.apply(this, [name, value]);
  };

  XMLHttpRequest.prototype.send = function(...args) {
    const xhr = this;
    const requestId = this._requestId;
    
    const originalOnReadyStateChange = xhr.onreadystatechange || function() {};
    
    xhr.onreadystatechange = function() {
      originalOnReadyStateChange.call(xhr);
      
      if (xhr.readyState === 4) {
        try {
          // 获取响应体
          const body = xhr.responseText || xhr.response;
          
          if (body) {
            // 发送到 background
            chrome.runtime.sendMessage({
              action: 'saveResponseBody',
              requestId: requestId,
              tabId: null, // XHR 可能无法获取 tabId
              responseBody: body
            }).catch(() => {
              // 忽略错误
            });
          }
        } catch (e) {
          console.error('Failed to read XHR response:', e);
        }
      }
    };
    
    return originalXHRSend.apply(this, args);
  };

  console.log('Network Analyzer: Fetch and XMLHttpRequest interceptors installed');
})();
