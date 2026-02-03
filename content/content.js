// Content Script - 拦截 Fetch API 和 XMLHttpRequest 以捕获响应体

(function() {
  'use strict';

  console.log('[Content Script] Network Analyzer loaded');

  // 获取当前标签页 ID
  let currentTabId = null;
  
  // 获取 tabId
  chrome.runtime.sendMessage({ action: 'getCurrentTabId' }, (response) => {
    if (response && response.tabId) {
      currentTabId = response.tabId;
      console.log('[Content Script] Tab ID:', currentTabId);
    }
  });

  // 监听来自 background 的消息，获取 webRequestId
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'notifyWebRequest' && message.webRequestId) {
      console.log('[Content Script] Web request ID received:', message.webRequestId);
      // 保存 webRequestId 供后续使用
      window._lastWebRequestId = message.webRequestId;
    }
  });

  // 拦截 Fetch API
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0].url;
    const method = (args[1]?.method || 'GET').toUpperCase();
    
    console.log('[Content Script] Fetch intercepted:', method, url);
    
    try {
      const response = await originalFetch(...args);
      const clonedResponse = response.clone();
      
      // 尝试获取响应体
      try {
        const body = await clonedResponse.text();
        console.log('[Content Script] Fetch response body length:', body.length);
        
        // 发送到 background
        if (currentTabId && body && body.length > 0) {
          chrome.runtime.sendMessage({
            action: 'saveResponseBody',
            tabId: currentTabId,
            webRequestId: window._lastWebRequestId,
            responseBody: body
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('[Content Script] Error sending response body:', chrome.runtime.lastError);
            } else if (!response.success) {
              console.log('[Content Script] Response body not saved:', response.error);
            } else {
              console.log('[Content Script] Response body saved successfully');
            }
          });
        }
      } catch (e) {
        console.error('[Content Script] Failed to read response body:', e);
      }
      
      return response;
    } catch (error) {
      console.error('[Content Script] Fetch error:', error);
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
    
    const originalOnReadyStateChange = xhr.onreadystatechange || function() {};
    
    xhr.onreadystatechange = function() {
      originalOnReadyStateChange.call(xhr);
      
      if (xhr.readyState === 4) {
        try {
          // 获取响应体
          const body = xhr.responseText || xhr.response;
          
          if (body && currentTabId) {
            console.log('[Content Script] XHR response body length:', body.length);
            
            // 发送到 background
            chrome.runtime.sendMessage({
              action: 'saveResponseBody',
              tabId: currentTabId,
              webRequestId: window._lastWebRequestId,
              responseBody: body
            }, (response) => {
              if (chrome.runtime.lastError) {
                console.error('[Content Script] Error sending XHR response body:', chrome.runtime.lastError);
              } else if (!response.success) {
                console.log('[Content Script] XHR response body not saved:', response.error);
              } else {
                console.log('[Content Script] XHR response body saved successfully');
              }
            });
          }
        } catch (e) {
          console.error('[Content Script] Failed to read XHR response:', e);
        }
      }
    };
    
    return originalXHRSend.apply(this, args);
  };

  console.log('[Content Script] Fetch and XMLHttpRequest interceptors installed');
})();
