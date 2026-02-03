# 诊断步骤

根据你提供的控制台日志，我发现以下问题：

## 问题分析

### 1. 没有看到我们扩展的日志

**期望看到的日志：**
```
[Content Script] Network Analyzer loaded
[Content Script] Tab ID: 12345
[Background] Service Worker loaded
[Side Panel] Loading...
[Side Panel] Current tab ID: 12345
```

**实际看到的日志：**
```
文本颜色标注插件已加载
content.js:252 默认快捷键：
```

**结论：我们的扩展的 content script 没有注入！**

### 2. 可能的原因

1. **扩展没有正确加载**
   - manifest.json 语法错误
   - 权限配置问题
   - Content script 配置错误

2. **Content script 没有注入**
   - manifest.json 中的 content_scripts 配置错误
   - matches 规则不匹配当前页面
   - run_at 时机问题

3. **浏览器版本问题**
   - Chrome 版本太旧，不支持 Manifest V3
   - Side Panel API 不支持

## 解决步骤

### 步骤 1：检查扩展是否正确加载

1. **访问扩展管理页面**
   ```
   chrome://extensions/
   ```

2. **查找"网络请求分析器"**
   - 是否在列表中？
   - 是否启用（开关是打开的）？
   - 是否有错误提示（红色警告）？
   - 版本号是否显示为 `5.0.3`？

3. **点击"错误"按钮**（如果有错误）
   - 查看错误详情
   - 截图或复制错误信息

### 步骤 2：检查 Content Script 是否注入

1. **在网页上按 F12**
2. **打开 Sources 标签页**
3. **展开 Content scripts**
4. **查找 `content/content.js`**
   - 是否存在？
   - 如果不存在，说明没有注入

### 步骤 3：检查 Background Service Worker

1. **访问 chrome://extensions/**
2. **找到"网络请求分析器"**
3. **点击"检查视图：service worker"**
4. **查看 Console 标签页**
5. **应该看到：**
   ```
   [Background] Service Worker loaded
   ```

### 步骤 4：检查 Side Panel

1. **点击扩展图标**
2. **点击"打开侧边栏"按钮**
3. **侧边栏打开后，按 F12**
4. **查看 Console 标签页**
5. **应该看到：**
   ```
   [Side Panel] Loading...
   [Side Panel] DOMContentLoaded
   [Side Panel] Current tab ID: 12345
   ```

### 步骤 5：重新安装扩展

如果以上步骤都有问题，尝试重新安装：

1. **移除扩展**
   - 在 chrome://extensions/ 中点击"移除"

2. **下载最新代码**
   - 访问 https://github.com/weliilam/Google
   - 点击 "Code" → "Download ZIP"
   - 解压到本地

3. **重新加载扩展**
   - 访问 chrome://extensions/
   - 点击"加载已解压的扩展程序"
   - 选择解压后的文件夹

4. **验证**
   - 查看版本号是否为 `5.0.3`
   - 查看是否有错误提示
   - 在网页上按 F12，查看控制台是否有我们的日志

## 手动测试 Content Script

1. **在网页的控制台执行：**
   ```javascript
   console.log('Test: Content script injected?');
   ```

2. **查找 `chrome.runtime`**
   ```javascript
   console.log('chrome.runtime:', chrome.runtime);
   ```

3. **发送测试消息**
   ```javascript
   chrome.runtime.sendMessage({ action: 'test' }, (response) => {
     console.log('Response:', response);
   });
   ```

## 常见错误

### 错误 1：Uncaught TypeError: Cannot read properties of undefined

**原因**: 扩展的 content script 没有注入，其他扩展的代码出错

**解决**: 移除其他可能有冲突的扩展

### 错误 2：manifest.json: Line X: parsing error

**原因**: manifest.json 格式错误

**解决**: 检查 JSON 格式是否正确

### 错误 3：No active tab

**原因**: Side Panel 无法获取当前标签页

**解决**: 刷新页面，重新打开侧边栏

## 收集诊断信息

请提供以下信息：

1. **Chrome 版本号**
   - 在 chrome://settings/help 查看

2. **扩展管理页面截图**
   - chrome://extensions/
   - 显示"网络请求分析器"的状态

3. **扩展错误详情**
   - 如果有错误按钮，点击并截图

4. **Background Service Worker 控制台**
   - 点击"检查视图：service worker"
   - Console 标签页的完整内容

5. **网页控制台日志**
   - 在你当前测试的网页上按 F12
   - Console 标签页的完整内容（特别是我们扩展的日志）

## 快速测试

1. **打开一个新的标签页**
2. **访问**: `https://jsonplaceholder.typicode.com/`
3. **按 F12**
4. **查看 Console**
5. **应该看到**: `[Content Script] Network Analyzer loaded`

6. **点击扩展图标**
7. **点击"打开侧边栏"**
8. **侧边栏应该显示请求列表**

## 需要帮助？

如果以上步骤都无法解决问题，请：

1. 收集上述诊断信息
2. 在 GitHub 提交 Issue:
   ```
   https://github.com/weliilam/Google/issues
   ```

3. 提供以下信息：
   - Chrome 版本
   - 扩展错误截图
   - 控制台日志
   - 操作步骤
