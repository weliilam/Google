# 完整安装指南

## 🔧 安装步骤

### 步骤 1：下载最新代码

#### 方法 1：从 GitHub 下载（推荐）

1. **访问仓库**
   ```
   https://github.com/weliilam/Google
   ```

2. **下载 ZIP**
   - 点击绿色的 "Code" 按钮
   - 选择 "Download ZIP"
   - 等待下载完成

3. **解压文件**
   - 找到下载的 `Google-main.zip`
   - 解压到任意位置（如桌面）
   - 解压后的文件夹重命名为 `Google`

#### 方法 2：使用 Git 克隆

```bash
git clone https://github.com/weliilam/Google.git
cd Google
```

### 步骤 2：验证文件

确保解压后的文件夹包含以下文件：

```
Google/
├── manifest.json              # ✅ 必须存在
├── background.js              # ✅ 必须存在
├── popup/
│   ├── popup.html            # ✅ 必须存在
│   ├── popup.css             # ✅ 必须存在
│   └── popup.js              # ✅ 必须存在
├── sidepanel/
│   ├── sidepanel.html        # ✅ 必须存在
│   ├── sidepanel.css         # ✅ 必须存在
│   └── sidepanel.js          # ✅ 必须存在
├── content/
│   └── content.js            # ✅ 必须存在
├── icons/
│   ├── icon16.png            # ✅ 必须存在
│   ├── icon48.png            # ✅ 必须存在
│   └── icon128.png           # ✅ 必须存在
├── simple-test.html          # ✅ 推荐测试
└── test-page.html           # ✅ 完整测试
```

### 步骤 3：验证 manifest.json

**重要！** 请检查 `manifest.json` 文件：

1. **打开 manifest.json**
   - 使用文本编辑器（Notepad、VS Code 等）

2. **检查版本号**
   ```json
   {
     "manifest_version": 3,
     "name": "网络请求分析器",
     "version": "5.0.3",  // ← 必须是 5.0.3
     ...
   }
   ```

3. **如果版本号不是 5.0.3**
   - 删除整个 Google 文件夹
   - 重新下载 GitHub 代码
   - 重新检查版本号

### 步骤 4：加载扩展

1. **打开 Chrome 浏览器**

2. **访问扩展管理页面**
   ```
   chrome://extensions/
   ```

3. **启用开发者模式**
   - 找到页面右上角的开关
   - 点击启用"开发者模式"

4. **加载已解压的扩展程序**
   - 点击左上角的"加载已解压的扩展程序"按钮
   - 选择你的 `Google` 文件夹
   - 点击"选择文件夹"

5. **验证扩展**
   - 应该在扩展列表中看到"网络请求分析器"
   - 版本号应该显示为 **5.0.3**
   - 状态应该是"已启用"
   - 没有红色错误提示

### 步骤 5：测试扩展

#### 测试 1：检查 Content Script

1. **打开 simple-test.html**
   ```
   simple-test.html
   ```

2. **按 F12 打开控制台**

3. **查看是否有以下日志：**
   ```
   [Content Script] Network Analyzer loaded
   [Content Script] Tab ID: 12345
   ```

4. **如果没有看到这些日志**
   - 扩展没有正确注入
   - 返回步骤 3 重新检查

#### 测试 2：打开侧边栏

1. **点击浏览器工具栏中的扩展图标**
   - 应该看到一个弹出窗口
   - 包含"打开侧边栏"和"刷新请求列表"按钮

2. **点击"打开侧边栏"按钮**
   - 侧边栏应该在页面右侧打开
   - popup 应该自动关闭

3. **侧边栏控制台**
   - 在侧边栏中按 F12
   - 查看控制台
   - 应该看到：
     ```
     [Side Panel] Loading...
     [Side Panel] DOMContentLoaded
     [Side Panel] Current tab ID: 12345
     [Side Panel] Requests loaded: 0
     ```

#### 测试 3：捕获请求

1. **在 simple-test.html 页面上**
   - 点击"测试 Fetch 1"按钮
   - 等待弹窗提示

2. **查看侧边栏**
   - 侧边栏应该显示请求列表
   - 包含刚刚的 Fetch 请求

3. **点击请求**
   - 点击列表中的请求
   - 查看请求详情
   - 查看响应体数据

### 步骤 6：检查 Background Service Worker

1. **访问扩展管理页面**
   ```
   chrome://extensions/
   ```

2. **找到"网络请求分析器"**

3. **点击"检查视图：service worker"**

4. **查看 Console 标签页**
   - 应该看到：
     ```
     [Background] Service Worker loaded
     ```

5. **如果看到错误**
   - 截图错误信息
   - 返回步骤 3 重新检查

## ❌ 常见问题

### 问题 1：版本号不是 5.0.3

**原因：** 下载的不是最新代码

**解决：**
1. 删除当前的 Google 文件夹
2. 重新从 GitHub 下载最新代码
3. 确保下载的是最新的提交（2746f2a）

### 问题 2：扩展加载失败

**可能原因：**
- manifest.json 格式错误
- 文件路径错误
- Chrome 版本太旧

**解决：**
1. 检查 Chrome 版本（需要 88+）
2. 检查 manifest.json 是否是有效的 JSON
3. 检查所有文件是否存在

### 问题 3：Content Script 没有注入

**可能原因：**
- manifest.json 配置错误
- 文件路径错误
- Chrome 安全限制

**解决：**
1. 检查 content_scripts 配置
2. 检查 content/content.js 是否存在
3. 尝试在 https:// 网站上测试

### 问题 4：侧边栏无法打开

**可能原因：**
- Side Panel API 不支持
- Chrome 版本太旧
- 权限配置错误

**解决：**
1. 检查 Chrome 版本（需要 114+ 才支持 Side Panel）
2. 检查 manifest.json 中的权限配置
3. 尝试禁用其他扩展

## 📋 检查清单

安装完成后，请确认：

- [ ] 从 GitHub 下载了最新代码
- [ ] manifest.json 版本号是 5.0.3
- [ ] 所有必需文件都存在
- [ ] 扩展已成功加载（chrome://extensions/）
- [ ] 版本号显示为 5.0.3
- [ ] 没有红色错误提示
- [ ] simple-test.html 控制台显示 `[Content Script] Network Analyzer loaded`
- [ ] 侧边栏能够打开
- [ ] Background Service Worker 控制台显示 `[Background] Service Worker loaded`
- [ ] 能够捕获请求

## 🆘 获取帮助

如果以上步骤都无法解决问题：

1. **收集信息**
   - Chrome 版本号
   - 扩展管理页面截图
   - 控制台日志
   - 错误信息

2. **查看诊断指南**
   ```
   DIAGNOSTICS.md
   ```

3. **提交 Issue**
   ```
   https://github.com/weliilam/Google/issues
   ```

## ✅ 成功标志

如果所有测试都通过，说明扩展安装成功！

你可以：
- ✅ 在任意网页上查看网络请求
- ✅ 查看请求详情和响应体
- ✅ 使用字段翻译功能
- ✅ 过滤和搜索请求
- ✅ 导出请求数据

## 📞 联系方式

- **GitHub**: https://github.com/weliilam/Google
- **Issues**: https://github.com/weliilam/Google/issues

---

**版本**: v5.0.3
**更新日期**: 2024-02-03
