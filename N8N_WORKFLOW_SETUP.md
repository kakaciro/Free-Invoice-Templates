# N8N 工作流完整配置指南

## 当前工作流节点
```
Google Sheets Trigger → Edit Fields → AI Agent
```

## 需要添加的后续节点

### 节点 1：Code 节点（JavaScript）- 数据格式化

**位置**：在 AI Agent 节点之后

**功能**：格式化 AI 响应数据，确保符合 GitHub API 要求

**JavaScript 代码**：
```javascript
// 从AI响应中提取title和content，并格式化数据
const aiResponse = $input.first().json;

// 确保响应是有效的JSON对象
let parsedResponse;
if (typeof aiResponse === 'string') {
  try {
    parsedResponse = JSON.parse(aiResponse);
  } catch (e) {
    throw new Error('AI响应不是有效的JSON格式: ' + e.message);
  }
} else {
  parsedResponse = aiResponse;
}

// 验证必需字段
if (!parsedResponse.title || !parsedResponse.content) {
  throw new Error('AI响应缺少title或content字段');
}

// 返回标准化的数据，包含所有GitHub API需要的字段
return {
  json: {
    title: parsedResponse.title.trim(),
    content: parsedResponse.content.trim(),
    category: 'business', // 默认分类
    author: 'FreeOnlineInvoice.org', // 默认作者
    tags: ['invoice', 'business', 'seo'], // 默认标签
    // 可选字段 - 可以留空，API会自动生成
    slug: '', // 自动从标题生成
    meta_description: '', // 自动从内容生成
    keywords: '' // 自动从内容提取
  }
};
```

### 节点 2：HTTP Request 节点 - 发布到 GitHub

**位置**：在 Code 节点之后

**配置**：
```
Method: POST
URL: https://freeonlineinvoice.org/api/github-direct-publish
Authentication: None
Send Headers: Yes
```

**Headers 配置**：
```
Content-Type: application/json
```

**Body 配置**：
- **Body Content Type**: JSON
- **Specify Body**: Using Fields Below

**Body Parameters 表格**：
| Name | Value |
|------|-------|
| `title` | `{{ $json.title }}` |
| `content` | `{{ $json.content }}` |
| `category` | `{{ $json.category }}` |
| `author` | `{{ $json.author }}` |
| `tags` | `{{ $json.tags }}` |

### 节点 3：Error Trigger 节点（可选）- 错误处理

**位置**：在 HTTP Request 节点之后

**功能**：捕获发布失败的错误并发送通知

## 完整工作流节点顺序

```
Google Sheets Trigger
       ↓
   Edit Fields
       ↓
    AI Agent
       ↓
   Code (JavaScript) - 数据格式化
       ↓
 HTTP Request - 发布到GitHub
       ↓
  Error Trigger (可选)
```

## N8N 工作流配置截图

### Code 节点配置
- **Mode**: Run Once for Each Item
- **Language**: JavaScript
- **Code**: 使用上面的JavaScript代码

### HTTP Request 节点配置
```
├── Method: POST
├── URL: https://freeonlineinvoice.org/api/github-direct-publish
├── Authentication: None
├── Send Headers: Yes
├── Headers:
│   └── Content-Type: application/json
├── Body Content Type: JSON
├── Specify Body: Using Fields Below
└── Body Parameters:
    ├── title: {{ $json.title }}
    ├── content: {{ $json.content }}
    ├── category: {{ $json.category }}
    ├── author: {{ $json.author }}
    └── tags: {{ $json.tags }}
```

## 测试工作流

### 测试数据示例
在 Google Sheets 中添加测试行：
```
SEO: free invoice generator online
```

### 预期输出
成功发布后，HTTP Request 节点应该返回：
```json
{
  "success": true,
  "message": "Article published directly to GitHub repository",
  "data": {
    "title": "Free Online Invoice Generator: Create Professional Invoices Instantly",
    "slug": "free-online-invoice-generator-create-professional-invoices-instantly",
    "category": "business",
    "author": "FreeOnlineInvoice.org",
    "published_at": "2025-10-25",
    "github_commit": "abc123def456...",
    "github_url": "https://github.com/kakawebai/Free-Online-Invoice/blob/main/articles/articles.json"
  }
}
```

## 验证发布结果

### 1. 检查 GitHub 仓库
访问：https://github.com/kakawebai/Free-Online-Invoice

检查：
- `articles/articles.json` 文件是否更新
- 最新的 Git 提交信息

### 2. 检查网站更新
访问：https://freeonlineinvoice.org/blog.html

检查：
- 新文章是否出现在博客首页
- 文章链接是否能正常访问

### 3. 检查 SEO 优化
- 查看文章页面的源代码
- 验证 meta 标签和结构化数据

## 故障排除

### 常见问题 1：HTTP Request 返回 401 错误
**原因**：GitHub Token 未配置或无效
**解决**：
1. 检查 Vercel 环境变量 `GITHUB_PERSONAL_ACCESS_TOKEN`
2. 重新生成 GitHub Token

### 常见问题 2：HTTP Request 返回 400 错误
**原因**：数据格式不正确
**解决**：
1. 检查 Code 节点的输出格式
2. 确保 title 和 content 字段不为空

### 常见问题 3：文章未出现在网站上
**原因**：构建过程未自动触发
**解决**：
1. 手动运行构建命令：`npm run build:articles`
2. 检查构建日志

## 自动化构建（可选）

如果您希望自动构建网站，可以在 HTTP Request 节点后添加：

### 节点 4：HTTP Request - 触发构建
```
Method: POST
URL: https://api.vercel.com/v1/integrations/deploy/... (您的Vercel部署hook)
```

## 总结

现在您的 N8N 工作流完整配置为：
```
Google Sheets → Edit Fields → AI Agent → Code → HTTP Request (GitHub)
```

每次在 Google Sheets 中添加新的 SEO 关键词，N8N 就会：
1. 通过 AI 生成 SEO 优化文章
2. 格式化数据
3. 直接发布到 GitHub 仓库的 `articles/` 文件夹
4. 自动更新网站内容

所有文章现在都统一存储在 GitHub 项目中，便于 SEO 优化和管理！
