# Service Worker 错误修复指南

## 🔴 错误信息

```
Service worker registration failed. Status code: 15
```

## 📋 错误原因

**Status code: 15** 通常表示：

1. **权限配置错误**
   - 权限过多或冲突
   - 不兼容的权限组合

2. **Chrome 版本问题**
   - Chrome 版本太旧
   - 不支持某些权限

3. **Service Worker 代码错误**
   - background.js 语法错误
   - 运行时错误

4. **扩展配置问题**
   - manifest.json 格式错误
   - 字段配置不当

## ✅ 已修复内容

### v5.0.4 修复

我已经简化了 manifest.json 的权限配置：

**修改前（v5.0.3）：**
```json
{
  "permissions": [
    "webRequest",
    "webNavigation",      // ← 移除
    "storage",            // ← 移除
    "activeTab",          // ← 移除
    "sidePanel"
  ],
  "host_permissions": [
    "<all_urls>"
  ]
}
```

**修改后（v5.0.4）：**
```json
{
  "permissions": [
    "webRequest",
    "sidePanel"
  ],
  "host_permissions": [
    "<all_urls>"
  ]
}
```

**原因：**
- `webNavigation` 不必要，可能导致冲突
- `storage` 暂时不需要，移除减少权限
- `activeTab` 已经通过 `host_permissions` 实现

## 🔧 修复步骤

### 步骤 1：下载 v5.0.4

1. **访问 GitHub**
   ```
   https://github.com/weliilam/Google
   ```

2. **下载最新代码**
   - 点击 "Code" → "Download ZIP"
   - 等待下载完成

3. **解压并重命名**
   - 解压 `Google-main.zip`
   - 重命名为 `Google`

4. **验证版本号**
   - 打开 `manifest.json`
   - 确认版本号为 `5.0.4`

### 步骤 2：重新加载扩展

1. **移除旧扩展**
   - 访问：chrome://extensions/
   - 找到"网络请求分析器"
   - 点击"移除"按钮

2. **加载新扩展**
   - 点击"加载已解压的扩展程序"
   - 选择新的 `Google` 文件夹
   - 点击"选择文件夹"

3. **验证加载**
   - 检查是否还有错误
   - 版本号应该显示为 `5.0.4`
   - 状态应该是"已启用"

### 步骤 3：检查 Chrome 版本

1. **查看 Chrome 版本**
   - 访问：chrome://settings/help
   - 或：chrome://version

2. **确认版本要求**
   - **最低要求**：Chrome 88+（Manifest V3）
   - **Side Panel 要求**：Chrome 114+
   - **推荐版本**：Chrome 120+

3. **如果版本太旧**
   - 更新 Chrome 到最新版本
   - 重启浏览器
   - 重新加载扩展

### 步骤 4：清除浏览器数据

如果还有问题，尝试清除数据：

1. **清除扩展数据**
   - 访问：chrome://extensions/
   - 找到"网络请求分析器"
   - 点击"详细信息"
   - 找到"清除浏览数据"
   - 选择"最近一小时"
   - 点击"清除"

2. **重启 Chrome**
   - 完全关闭 Chrome
   - 重新打开

3. **重新加载扩展**
   - 访问：chrome://extensions/
   - 点击扩展的刷新图标 🔄

## 🔍 详细诊断

### 检查 1：查看详细错误

1. **访问扩展管理页面**
   ```
   chrome://extensions/
   ```

2. **找到"网络请求分析器"**

3. **点击"错误"按钮**（如果有）
   - 查看详细错误信息
   - 截图或复制错误

### 检查 2：检查 Background Script

1. **点击"检查视图：service worker"**

2. **查看 Console 标签页**
   - 是否有错误？
   - 是否显示 `[Background] Service Worker loaded`？

3. **查看错误详情**
   - 如果有错误，查看堆栈信息
   - 截图或复制错误

### 检查 3：检查 Chrome 日志

1. **访问 Chrome 日志**
   ```
   chrome://background
   ```

2. **查找相关错误**
   - 搜索 "Service worker"
   - 搜索 "registration"
   - 搜索 "network"

3. **复制错误信息**

## 🚨 如果还是失败

### 方案 1：禁用其他扩展

1. **访问扩展管理页面**
   ```
   chrome://extensions/
   ```

2. **禁用所有其他扩展**
   - 关闭其他扩展的开关
   - 只保留"网络请求分析器"

3. **重新加载扩展**
   - 点击"网络请求分析器"的刷新图标
   - 查看是否还有错误

4. **如果成功**
   - 逐个启用其他扩展
   - 找出冲突的扩展

### 方案 2：使用无痕模式测试

1. **打开无痕窗口**
   - Ctrl+Shift+N（Windows/Linux）
   - Cmd+Shift+N（Mac）

2. **在无痕模式中加载扩展**
   - 访问：chrome://extensions/
   - 启用"在无痕模式下运行"
   - 刷新页面

3. **测试扩展**
   - 打开 simple-test.html
   - 查看是否正常工作

### 方案 3：创建新的 Chrome 配置文件

1. **添加新用户**
   - 访问：chrome://settings/people
   - 点击"添加"
   - 创建新的配置文件

2. **在新配置文件中加载扩展**
   - 切换到新用户
   - 访问：chrome://extensions/
   - 加载扩展

3. **测试扩展**
   - 在新配置文件中测试
   - 查看是否正常工作

## 📞 获取帮助

### 收集信息

如果以上方案都无法解决问题，请收集：

1. **Chrome 版本**
   - 访问：chrome://version
   - 复制版本号

2. **操作系统版本**
   - Windows 10/11
   - macOS 版本
   - Linux 发行版

3. **扩展错误截图**
   - chrome://extensions/ 中的错误
   - Service Worker 控制台错误

4. **Chrome 日志**
   - chrome://background 中的相关日志

5. **操作步骤**
   - 你做了什么
   - 期望看到什么
   - 实际看到了什么

### 提交 Issue

在 GitHub 提交 Issue：

```
https://github.com/weliilam/Google/issues
```

**Issue 标题：**
```
[BUG] Service worker registration failed (Status code: 15)
```

**Issue 内容：**

```markdown
## 环境信息
- Chrome 版本：
- 操作系统：
- 扩展版本：5.0.4

## 问题描述
[详细描述问题]

## 错误信息
```
Service worker registration failed. Status code: 15
```

## 尝试的解决方案
- [ ] 重新下载最新代码
- [ ] 重新加载扩展
- [ ] 清除浏览器数据
- [ ] 禁用其他扩展
- [ ] 使用无痕模式测试

## 截图
[粘贴错误截图]
```

## 📚 参考资料

- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Service Worker Lifecycle](https://developer.chrome.com/docs/extensions/mv3/service_workers/)
- [Chrome Extension Permissions](https://developer.chrome.com/docs/extensions/mv3/declare_permissions/)

---

**版本**: v5.0.4
**更新日期**: 2024-02-03
