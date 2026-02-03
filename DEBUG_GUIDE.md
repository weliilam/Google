# 调试指南

## 问题：侧边栏是空的，没有抓取到任何请求？

### 解决步骤

#### 1. 重新加载扩展

```
1. 访问 chrome://extensions/
2. 找到"网络请求分析器"
3. 点击刷新图标 🔄
4. 或者先移除扩展，然后重新加载
```

#### 2. 检查控制台日志

##### Side Panel 控制台

```
1. 打开侧边栏
2. 按 F12 打开开发者工具
3. 查看 Console 标签页
4. 应该看到以下日志：
   - [Side Panel] Loading...
   - [Side Panel] DOMContentLoaded
   - [Side Panel] Current tab ID: 12345
   - [Side Panel] Requests loaded: 0
```

##### Background 控制台

```
1. 访问 chrome://extensions/
2. 找到"网络请求分析器"
3. 点击"检查视图：service worker"
4. 查看 Console 标签页
5. 应该看到以下日志：
   - [Background] Service Worker loaded
   - [Background] Request captured: { id: 'req_xxx', url: 'xxx', method: 'GET' }
```

##### Content Script 控制台

```
1. 在网页上按 F12
2. 查看 Console 标签页
3. 应该看到以下日志：
   - [Content Script] Network Analyzer loaded
   - [Content Script] Tab ID: 12345
   - [Content Script] Fetch intercepted: GET xxx
   - [Content Script] Response body saved successfully
```

#### 3. 测试页面

打开测试页面 `test-page.html` 并执行以下操作：

1. **点击"获取用户信息"按钮**
   - 应该在 Background 控制台看到：`[Background] Request captured`
   - 应该在 Content Script 控制台看到：`[Content Script] Fetch intercepted`
   - 应该在 Side Panel 看到新的请求

2. **检查 Side Panel**
   - 应该显示请求列表
   - 点击请求查看详情
   - 查看响应体数据

#### 4. 常见问题排查

##### 问题 1: Side Panel 控制台显示 "No active tab"

**原因**: Side Panel 没有获取到当前标签页

**解决**:
1. 刷新当前网页
2. 关闭并重新打开侧边栏
3. 确认不在 chrome:// 开头的系统页面

##### 问题 2: Background 控制台没有看到 "Request captured"

**原因**: 没有触发任何网络请求

**解决**:
1. 刷新当前网页（F5）
2. 在页面上点击按钮、提交表单等
3. 确认页面有 XHR/Fetch 请求

##### 问题 3: Content Script 控制台显示 "No tabId in message"

**原因**: Content Script 无法获取到标签页 ID

**解决**:
1. 重新加载扩展
2. 刷新当前网页
3. 检查 manifest.json 中的 permissions 是否包含 activeTab

##### 问题 4: 看到请求了，但响应体为空

**原因**: 响应体数据没有正确匹配到请求

**解决**:
1. 检查控制台是否有错误
2. 确认请求是 XHR 或 Fetch 类型
3. 检查是否是 CORS 跨域请求

#### 5. 手动测试

在浏览器控制台执行以下代码进行测试：

```javascript
// 测试 Fetch 请求
fetch('https://jsonplaceholder.typicode.com/users/1')
  .then(res => res.json())
  .then(data => console.log('Fetch test result:', data))
  .catch(err => console.error('Fetch test error:', err));

// 测试 XHR 请求
const xhr = new XMLHttpRequest();
xhr.open('GET', 'https://jsonplaceholder.typicode.com/posts/1');
xhr.onload = function() {
  console.log('XHR test result:', xhr.responseText);
};
xhr.send();
```

执行后，检查：
1. Background 控制台是否显示请求
2. Content Script 控制台是否显示响应体
3. Side Panel 是否显示请求和响应体

#### 6. 清除数据重新开始

如果以上步骤都不行，尝试清除所有数据：

```
1. 访问 chrome://extensions/
2. 点击"网络请求分析器"的"清除浏览数据"
3. 或者：
   - 打开侧边栏
   - 点击"清空"按钮
4. 刷新页面
5. 重新测试
```

#### 7. 版本确认

确保使用的是最新版本：

```
访问 chrome://extensions/
查看"网络请求分析器"的版本号
应该是 v5.0.2
```

如果不是最新版本：
1. 重新加载扩展
2. 或者从 GitHub 下载最新代码

### 获取帮助

如果以上步骤都无法解决问题：

1. **收集信息**:
   - Background 控制台的完整日志
   - Content Script 控制台的完整日志
   - Side Panel 控制台的完整日志
   - 使用的 Chrome 版本号

2. **提交 Issue**:
   ```
   https://github.com/weliilam/Google/issues
   ```

3. **提供详细信息**:
   - 问题描述
   - 复现步骤
   - 控制台日志
   - Chrome 版本
   - 操作系统

### 调速技巧

1. **使用 test-page.html**:
   - 它包含了各种类型的请求测试
   - 可以快速验证扩展功能

2. **使用 Chrome DevTools**:
   - 对比 Chrome DevTools Network 面板
   - 确认扩展捕获的请求是否一致

3. **检查网络请求类型**:
   - 确保测试的是 XHR 或 Fetch 请求
   - 普通的页面资源请求（css、js、图片）也会被捕获
   - 但响应体数据可能不会被捕获

### 已知限制

1. **CORS 跨域请求**:
   - 某些跨域请求的响应体可能无法捕获
   - 这是浏览器的安全限制

2. **Service Worker 中的请求**:
   - Service Worker 中的请求不会被捕获
   - 需要额外处理

3. **WebSocket 连接**:
   - WebSocket 连接不会被捕获
   - 需要使用其他方式

4. **系统页面**:
   - chrome:// 开头的页面不会注入 Content Script
   - 无法捕获响应体

### 快速验证清单

- [ ] 扩展已正确加载（版本 v5.0.2）
- [ ] 侧边栏能够正常打开
- [ ] Background 控制台显示 "Service Worker loaded"
- [ ] Content Script 控制台显示 "Network Analyzer loaded"
- [ ] Side Panel 控制台显示 "Current tab ID"
- [ ] 刷新页面后能看到请求
- [ ] 点击请求能看到详情
- [ ] 响应体数据完整显示
