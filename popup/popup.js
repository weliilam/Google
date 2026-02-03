// Popup 脚本 - 用于打开 Side Panel

document.addEventListener('DOMContentLoaded', async () => {
  // 获取当前标签页
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  
  // 自动打开 Side Panel
  openSidePanel(tab.id);
  
  // 绑定按钮事件
  document.getElementById('openSidePanel').addEventListener('click', () => {
    openSidePanel(tab.id);
  });
  
  document.getElementById('refreshRequests').addEventListener('click', async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'refreshRequests',
        tabId: tab.id
      });
      
      if (response && response.success) {
        showNotification('请求列表已刷新');
      }
    } catch (error) {
      console.error('刷新失败:', error);
    }
  });
});

// 打开 Side Panel
async function openSidePanel(tabId) {
  try {
    // 检查 Side Panel 是否已启用
    const panel = await chrome.sidePanel.getOptions({ tabId }).catch(() => null);
    
    // 打开 Side Panel
    await chrome.sidePanel.open({ tabId });
    
    showNotification('侧边栏已打开');
  } catch (error) {
    console.error('打开侧边栏失败:', error);
    showNotification('打开侧边栏失败，请重试', 'error');
  }
}

// 显示通知
function showNotification(message, type = 'success') {
  // 创建通知元素
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#4caf50' : '#f44336'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
  `;
  notification.textContent = message;
  
  // 添加动画样式
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(notification);
  
  // 3秒后自动消失
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}
