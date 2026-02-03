// Content Script - 完整捕获所有网络请求

(function() {
  'use strict';

  console.log('[Content Script] Network Analyzer loaded (v5.0.5)');

  // 获取当前标签页 ID
  let currentTabId = null;
  let capturedRequests = new Map();
  let requestCounter = 0;
  
  // 异步获取 tabId
  async function getTabId() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getCurrentTabId' });
      if (response && response.tabId) {
        currentTabId = response.tabId;
        console.log('[Content Script] Tab ID obtained:', currentTabId);
      }
    } catch (error) {
      console.error('[Content Script] Failed to get tab ID:', error);
    }
  }
  
  // 立即获取 tabId
  getTabId();

  // 生成唯一请求 ID
  function generateRequestId() {
    return `req_${Date.now()}_${++requestCounter}`;
  }

  // 判断请求类型
  function getRequestType(url, options = {}) {
    const lowerUrl = url.toLowerCase();
    
    // 检查 URL
    if (lowerUrl.includes('.json') || 
        lowerUrl.includes('api/') || 
        lowerUrl.includes('/api') || 
        lowerUrl.includes('ajax')) {
      return 'fetch';
    }
    
    // 默认类型
    return 'other';
  }

  // 捕获请求
  function captureRequest(url, method, type, startTime) {
    const requestId = generateRequestId();
    capturedRequests.set(requestId, {
      requestId,
      url,
      method,
      type,
      startTime
    });
    
    // 通知 background
    if (currentTabId) {
      chrome.runtime.sendMessage({
        action: 'captureRequest',
        tabId: currentTabId,
        requestId,
        url,
        method,
        type,
        webRequestId: requestId
      }).catch((error) => {
        console.log('[Content Script] Failed to send captureRequest:', error);
      });
    } else {
      console.log('[Content Script] Tab ID not ready, caching request:', requestId);
    }
    
    return requestId;
  }

  // 更新请求
  function updateRequest(requestId, statusCode, duration, responseBody) {
    if (!currentTabId) {
      console.log('[Content Script] Tab ID not ready, cannot update request');
      return;
    }
    
    // 通知 background
    chrome.runtime.sendMessage({
      action: 'updateRequest',
      tabId: currentTabId,
      requestId,
      statusCode,
      duration,
      responseBody
    }).catch((error) => {
      console.log('[Content Script] Failed to send updateRequest:', error);
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
    console.log('[Content Script] XHR open:', method, url);
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
    const method = xhr._requestMethod || 'GET';
    const type = 'xhr';
    const startTime = Date.now();
    
    console.log('[Content Script] XHR send:', method, url);
    
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
