# Chrome 网络请求分析器

一个强大的 Chrome 浏览器扩展，用于捕获、分析和格式化网页的 HTTP 请求，支持响应体完整显示和字段翻译功能。

## 功能特性

- 实时网络请求监控
- 请求分类（XHR/Fetch/Other）
- JSON 数据格式化和语法高亮
- 字段翻译（内置100+常见字段的中英文翻译）
- 响应体完整显示
- 请求和响应头查看
- 多种 HTTP 方法支持（GET/POST/PUT/DELETE/PATCH 等）
- 请求过滤和搜索
- 大尺寸窗口（1400px x 900px）优化显示体验
- 键盘快捷键支持
- 数据导出功能

## 技术实现

### 核心架构

- **Manifest V3**: 使用最新的 Chrome 扩展规范
- **Background Service Worker**: 处理 webRequest 事件和消息通信
- **Content Scripts**: 拦截 Fetch API 和 XMLHttpRequest 以捕获响应体
- **Popup**: 用户界面，展示请求列表和详情

### 响应体捕获方案

采用混合捕获方案：

1. **基本信息捕获**（Background Service Worker + webRequest API）:
   - 捕获请求 URL、方法、状态码
   - 捕获请求和响应头信息
   - 请求分类（XHR/Fetch/Other）
   - 请求时间统计

2. **响应体捕获**（Content Script）:
   - 重写 Fetch API
   - 重写 XMLHttpRequest
   - 拦截并克隆响应流
   - 提取响应体数据
   - 通过 chrome.runtime.sendMessage 发送到 Background

3. **数据聚合与展示**（Popup）:
   - 合并基本信息和响应体
   - 格式化 JSON 数据
   - 提供字段翻译功能
   - 渲染响应视图

## 安装方法

### 方式一：直接使用

1. 下载本项目所有文件
2. 打开 Chrome 浏览器，访问 `chrome://extensions/`
3. 启用"开发者模式"（右上角开关）
4. 点击"加载已解压的扩展程序"
5. 选择本项目文件夹
6. 扩展安装完成！

### 方式二：从 GitHub 克隆

```bash
git clone https://github.com/weliilam/Google.git
cd Google
```

然后按照方式一的步骤2-6进行安装。

## 使用说明

### 基本使用流程

1. **打开扩展**: 点击浏览器工具栏中的扩展图标
2. **查看请求**: 扩展会自动显示当前标签页的 HTTP 请求
3. **过滤请求**: 使用顶部的过滤器筛选特定请求
4. **查看详情**: 点击列表中的任意请求查看详细信息
5. **查看响应体**: 切换到"响应"选项卡查看完整的响应数据
6. **字段翻译**: 点击"翻译字段"按钮查看字段含义

### 功能详解

#### 请求列表

- **请求方法**: 显示 HTTP 方法（GET/POST/PUT/DELETE/PATCH 等）
- **请求 URL**: 显示请求地址（支持悬停查看完整 URL）
- **请求状态**: 
  - 绿色：成功（2xx）
  - 红色：错误（4xx/5xx）
  - 黄色：进行中
- **请求类型**: XHR、Fetch、Other
- **请求时间**: 请求耗时
- **响应体标识**: 带有响应体的请求会显示绿色标识

#### 请求详情

**基本信息**:
- 请求方法
- 请求 URL
- 状态码
- 请求类型
- 请求时间
- 响应大小

**请求头**:
- 以键值对表格形式展示
- 支持复制功能
- 响应头支持查看

**请求参数**:
- GET 请求的查询参数
- POST 请求的表单数据
- JSON 格式化显示

**响应体**:
- 完整的响应数据展示
- JSON 自动格式化和语法高亮
- 支持展开/折叠嵌套对象
- 响应体数据完整性保证

**翻译字段**:
- 内置 100+ 常见字段翻译
- 点击"翻译字段"按钮开启
- 自动识别并翻译字段名
- 显示字段的中文名称和含义

#### 过滤器功能

- **请求方法**: 筛选特定 HTTP 方法
- **请求类型**: 筛选 XHR/Fetch/Other
- **状态**: 筛选成功/失败请求
- **关键词搜索**: 在 URL 中搜索特定内容

### 快捷键

- `Ctrl/Cmd + F`: 聚焦搜索框
- `Esc`: 关闭详情面板
- `Delete`: 清空所有请求
- `R`: 刷新请求列表

### 数据导出

- 点击"导出数据"按钮
- 选择导出格式（JSON/CSV）
- 保存到本地文件

## 测试页面

项目包含一个完整的测试页面 `test-page.html`，用于测试扩展的各项功能：

### 测试场景

1. **GET 请求测试**: 测试 JSON 数据获取
2. **POST 请求测试**: 测试 JSON 和表单数据提交
3. **其他方法测试**: 测试 PUT/PATCH/DELETE 方法
4. **字段翻译测试**: 测试中英文字段翻译功能
5. **批量请求测试**: 测试并发请求处理
6. **响应体完整性测试**: 测试大响应体和嵌套 JSON

### 使用测试页面

1. 在浏览器中打开 `test-page.html`
2. 打开开发者工具（F12）
3. 点击页面上的各个测试按钮
4. 打开扩展插件，查看捕获的请求详情

## 文件结构

```
Google/
├── manifest.json           # 扩展配置文件
├── background.js          # 后台服务工作者
├── popup/
│   ├── popup.html        # 弹窗界面
│   ├── popup.css         # 样式文件
│   └── popup.js          # 弹窗逻辑
├── content/
│   └── content.js        # 内容脚本（拦截器）
├── icons/
│   ├── icon16.png        # 16x16 图标
│   ├── icon48.png        # 48x48 图标
│   └── icon128.png       # 128x128 图标
├── test-page.html        # 测试页面
└── README.md             # 项目文档
```

## 核心文件说明

### manifest.json

定义扩展的基本配置：
- Manifest V3 规范
- 权限声明（webRequest、tabs、storage）
- Content Scripts 注入
- Background Service Worker

### background.js

后台服务工作者，负责：
- 处理 webRequest 事件
- 捕获请求基本信息
- 接收 Content Script 发送的响应体
- 数据聚合和存储

### popup.js

弹窗界面逻辑，负责：
- UI 渲染和交互
- 请求列表展示
- 请求详情展示
- JSON 格式化
- 字段翻译功能
- 数据导出

### content.js

内容脚本，负责：
- 重写 Fetch API
- 重写 XMLHttpRequest
- 拦截响应体
- 发送数据到 Background

## 字段翻译字典

内置 100+ 常见字段的中英文翻译：

| 英文字段 | 中文翻译 |
|---------|---------|
| userId | 用户ID |
| userName | 用户名 |
| userEmail | 用户邮箱 |
| userPhone | 用户电话 |
| userStatus | 用户状态 |
| userRole | 用户角色 |
| ... | ... |

完整翻译列表见 `popup.js` 中的 `translationMap`。

## 技术栈

- **Chrome Extension APIs**: webRequest, tabs, storage, runtime
- **JavaScript**: ES6+
- **HTML5**: 语义化标签
- **CSS3**: Flexbox 布局，动画效果
- **Fetch API**: 现代网络请求
- **XMLHttpRequest**: 传统网络请求

## 浏览器兼容性

- Chrome 88+
- Edge 88+
- 其他基于 Chromium 的浏览器

## 开发计划

- [ ] 添加请求拦截功能
- [ ] 支持请求编辑和重放
- [ ] 添加更多过滤条件
- [ ] 支持自定义翻译字典
- [ ] 添加请求历史记录
- [ ] 支持导出为 HAR 格式

## 常见问题

### Q: 为什么某些请求没有响应体？

A: 
1. 确认 Content Script 已正确注入到页面
2. 检查请求是否为 XHR/Fetch 类型
3. 某些跨域请求可能无法捕获响应体
4. 检查是否在无痕模式或隐私浏览模式

### Q: 如何提高响应体捕获的成功率？

A:
1. 确保扩展在页面加载前已注入
2. 刷新页面后重新尝试
3. 检查是否在 CSP（内容安全策略）限制的页面
4. 确认页面的 JavaScript 已启用

### Q: 字段翻译不完整怎么办？

A:
1. 可以在 `popup.js` 中的 `translationMap` 添加自定义翻译
2. 点击"导出数据"查看未翻译的字段
3. 反馈给开发者以添加更多翻译

### Q: 如何清除缓存的请求数据？

A:
1. 点击"清空列表"按钮
2. 或者在设置中启用自动清除选项

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

MIT License

## 联系方式

- GitHub: https://github.com/weliilam/Google
- Issues: https://github.com/weliilam/Google/issues

## 更新日志

### v1.1.0 (2024-01-15)
- 优化页面尺寸：1400px x 900px
- 增强响应体完整性
- 改进字段翻译功能
- 修复权限问题

### v1.0.0 (2024-01-01)
- 初始版本发布
- 基本网络请求捕获
- JSON 格式化显示
- 字段翻译功能

## 致谢

- FeHelper - 灵感来源
- Chrome DevTools Network Panel - 功能参考
