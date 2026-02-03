// Content Script - 完整捕获所有网络请求

(function() {
  'use strict';

  console.log('[Content Script] Network Analyzer loaded (v5.0.5)');

  // 获取当前标签页 ID
  let currentTabId = null;
  let capturedRequests = new Map();
  
  // 获取 tabId
  chrome.runtime.sendMessage({ action: 'getCurrentTabId' }, (response) => {
    if (response && response.tabId) {
      currentTabId = response.tabId;
      console.log('[Content Script] Tab ID:', currentTabId);
    }
  });

  // 判断请求类型
  function getRequestType(url, options = {}) {
    const lowerUrl = url.toLowerCase();
    
    // 检查选项
    if (options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE') {
      if (lowerUrl.includes('.json') || lowerUrl.includes('api/')) {
        return 'fetch';
      }
    }
    
    // 检查 URL
    if (lowerUrl.includes('.json') || 
        lowerUrl.includes('api/') || 
        lowerUrl.includes('/api') || 
        lowerUrl.includes('ajax')) {
      return 'fetch';
    }
    
    // 检查 Content-Type
    if (options.headers) {
      const contentType = Object.keys(options.headers).find(key => 
        key.toLowerCase() === 'content-type'
      );
      if (contentType && options.headers[contentType].includes('application/json')) {
        return 'fetch';
      }
    }
    
    // 默认类型
    return 'other';
  }

  // 捕获请求
  function captureRequest(url, method, type, startTime) {
    const requestId = `req_${startTime}_${Math.random().toString(36).substr(2, 9)}`;
    capturedRequests.set(requestId, {
      requestId,
      url,
      method,
      type,
      startTime
    });
    
    // 通知 background
    chrome.runtime.sendMessage({
      action: 'captureRequest',
      tabId: currentTabId,
      requestId,
      url,
      method,
      type,
      webRequestId: requestId
    }).catch(() => {
      // 忽略错误
    });
    
    return requestId;
  }

  // 更新请求
  function updateRequest(requestId, statusCode, duration, responseBody) {
    // 通知 background
    chrome.runtime.sendMessage({
      action: 'updateRequest',
      tabId: currentTabId,
      requestId,
      statusCode,
      duration,
      responseBody
    }).catch(() => {
      // 忽略错误
    });
    
    // 清理
    capturedRequests.delete(requestId);
  }

  // 拦截 Fetch API
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0].url;
    const method = (args[1]?.method || 'GET').toUpperCase();
    const options = args[1] || {};
    const type = getRequestType(url, options);
    const startTime = Date.now();
    
    console.log('[Content Script] Fetch intercepted:', method, url, type);
    
    const requestId = captureRequest(url, method, type, startTime);
    
    try {
      const response = await originalFetch(...args);
      const clonedResponse = response.clone();
      const duration = Date.now() - startTime;
      
      // 尝试获取响应体
      try {
        const body = await clonedResponse.text();
        console.log('[Content Script] Fetch response body length:', body.length);
        
        updateRequest(requestId, response.status, duration, body);
      } catch (e) {
        console.error('[Content Script] Failed to read response body:', e);
        updateRequest(requestId, response.status, duration, null);
      }
      
      return response;
    } catch (error) {
      console.error('[Content Script] Fetch error:', error);
      updateRequest(requestId, 0, Date.now() - startTime, null);
      throw error;
    }
  };

  // 拦截 XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  const originalXHRSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._requestUrl = url;
    this._requestMethod = method;
    this._requestHeaders = {};
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
    const url = xhr._requestUrl;
    const method = xhr._requestMethod;
    const type = 'xhr';
    const startTime = Date.now();
    
    console.log('[Content Script] XHR intercepted:', method, url);
    
    const requestId = captureRequest(url, method, type, startTime);
    
    const originalOnReadyStateChange = xhr.onreadystatechange || function() {};
    
    xhr.onreadystatechange = function() {
      originalOnReadyStateChange.call(xhr);
      
      if (xhr.readyState === 4) {
        const duration = Date.now() - startTime;
        
        try {
          const body = xhr.responseText || xhr.response;
          console.log('[Content Script] XHR response body length:', body ? body.length : 0);
          
          updateRequest(requestId, xhr.status, duration, body || null);
        } catch (e) {
          console.error('[Content Script] Failed to read XHR response:', e);
          updateRequest(requestId, xhr.status, duration, null);
        }
      }
    };
    
    return originalXHRSend.apply(this, args);
  };

  console.log('[Content Script] Fetch and XMLHttpRequest interceptors installed');
})();
