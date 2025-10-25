# N8N 工作流程配置详细指南

## 完整工作流程概览

```
Google Sheets Trigger → Edit Fields → AI Agent → Code in JavaScript → HTTP Request
```

## 第一步：Google Sheets Trigger 配置

### 1.1 添加 Google Sheets 节点
- 在 N8N 中搜索 "Google Sheets"
- 选择 "Google Sheets Trigger" 节点

### 1.2 认证配置
- 点击 "Add Account" 添加 Google 账户
- 按照 OAuth2 流程授权
- 选择要监听的 Google Sheets 文件

### 1.3 触发器设置
- **Spreadsheet**: 选择包含关键词的表格文件
- **Sheet Name**: 选择具体的工作表
- **Trigger On**: 选择触发条件（如新行添加）

### 1.4 输出示例
```json
{
  "SEO": "free invoice generator online",
  "其他字段": "..."
}
```

## 第二步：Edit Fields 配置

### 2.1 添加 Edit Fields 节点
- 搜索 "Edit Fields" 节点
- 连接到 Google Sheets 节点

### 2.2 字段提取设置
- **Mode**: "Manually Map Fields"
- 添加字段映射：
  - **Source Field**: `SEO`
  - **Destination Field**: `SEO`

### 2.3 输出示例
```json
{
  "SEO": "free invoice generator online"
}
```

## 第三步：AI Agent + DeepSeek Chat Model 配置

### 3.1 添加 AI Agent 节点
- 搜索 "AI Agent" 节点
- 连接到 Edit Fields 节点

### 3.2 AI 提示词配置
**System Prompt**:
```
您是一个专业的SEO内容创作助手。请根据提供的关键词创作高质量的SEO优化文章。
```

**User Prompt**:
```
请为我针对以下关键词写一篇SEO文章。
关键词：{{$json.SEO}}

请严格按照以下JSON格式返回，不要在JSON代码块之外添加任何其他说明文字或注释：
{
  "title": "这里是文章标题",
  "content": "这里是文章正文"
}
```

### 3.3 DeepSeek 模型配置
- **Model**: DeepSeek Chat Model
- **Temperature**: 0.7 (适度的创造性)
- **Max Tokens**: 2000

### 3.4 输出示例
```json
{
  "title": "Free Online Invoice Generator: Create Professional Invoices Instantly",
  "content": "Creating professional invoices has never been easier with our free online invoice generator...\n\nOur platform offers a wide range of features including...\n\nStart using our free invoice generator today to streamline your business operations."
}
```

## 第四步：Code in JavaScript 配置

### 4.1 添加 Code 节点
- 搜索 "Code" 节点
- 选择 "JavaScript" 类型
- 连接到 AI Agent 节点

### 4.2 JavaScript 代码
```javascript
// 从AI响应中提取title和content
const aiResponse = $input.first().json;

// 确保响应是有效的JSON对象
if (typeof aiResponse === 'string') {
  try {
    var parsedResponse = JSON.parse(aiResponse);
  } catch (e) {
    throw new Error('AI响应不是有效的JSON格式: ' + e.message);
  }
} else {
  var parsedResponse = aiResponse;
}

// 验证必需字段
if (!parsedResponse.title || !parsedResponse.content) {
  throw new Error('AI响应缺少title或content字段');
}

// 返回标准化的数据
return {
  json: {
    title: parsedResponse.title.trim(),
    content: parsedResponse.content.trim()
  }
};
```

### 4.3 输出示例
```json
{
  "title": "Free Online Invoice Generator: Create Professional Invoices Instantly",
  "content": "Creating professional invoices has never been easier with our free online invoice generator..."
}
```

## 第五步：HTTP Request 配置

### 5.1 添加 HTTP Request 节点
- 搜索 "HTTP Request" 节点
- 连接到 Code 节点

### 5.2 基本设置
- **Method**: POST
- **URL**: `https://freeonlineinvoice.org/api/supabase-blog`

### 5.3 认证设置
- **Authentication**: 无（留空）
- **Send Headers**: 无（留空）

### 5.4 Body 设置
- **Body Content Type**: JSON
- **Specify Body**: Using Fields Below

### 5.5 Body Parameters 表格
| Name | Value |
|------|-------|
| `title` | `{{ $json.title }}` |
| `content` | `{{ $json.content }}` |

### 5.6 完整配置截图
```
HTTP Request节点配置：
├── Method: POST
├── URL: https://freeonlineinvoice.org/api/supabase-blog
├── Authentication: (留空)
├── Send Headers: (留空)
├── Body Content Type: JSON
├── Specify Body: Using Fields Below
└── Body Parameters:
    ├── Name: title, Value: {{ $json.title }}
    └── Name: content, Value: {{ $json.content }}
```

## 第六步：错误处理和调试

### 6.1 错误处理节点
- 在每个关键节点后添加错误处理
- 使用 "IF" 节点检查响应状态

### 6.2 调试技巧
1. **测试单个节点**: 使用 "Execute Node" 功能测试每个节点
2. **查看数据流**: 点击节点查看输入/输出数据
3. **日志记录**: 在 Vercel 控制台查看 API 日志

### 6.3 常见问题解决

**问题1**: HTTP Request 返回 400 错误
- 检查 Body Parameters 表格设置
- 确保字段名称正确（title, content）
- 验证前一个节点的输出格式

**问题2**: AI 响应格式错误
- 检查 AI 提示词中的 JSON 格式要求
- 在 Code 节点中添加格式验证

**问题3**: 认证失败
- 重新配置 Google Sheets OAuth2
- 检查 API 密钥有效期

## 第七步：工作流优化建议

### 7.1 性能优化
- 设置适当的请求间隔
- 使用批量处理减少 API 调用
- 添加重试机制

### 7.2 SEO 优化
- 在 AI 提示词中强调 SEO 最佳实践
- 要求文章长度 800-1200 字
- 包含相关关键词和内部链接

### 7.3 监控和维护
- 定期检查工作流执行状态
- 监控 API 响应时间和成功率
- 更新关键词列表保持内容新鲜度

## 完整工作流测试

### 测试数据示例
```json
{
  "SEO": "how to create professional invoice"
}
```

### 预期输出
```json
{
  "success": true,
  "message": "Blog post saved successfully to database with advanced SEO optimization",
  "data": {
    "id": 123,
    "title": "How to Create Professional Invoices: A Complete Guide",
    "slug": "how-to-create-professional-invoices",
    "seo_score": 85,
    "word_count": 950,
    "reading_time": 5
  }
}
```

## 部署和运行

1. **保存工作流**: 点击 "Save" 保存配置
2. **激活工作流**: 切换工作流为激活状态
3. **测试执行**: 手动触发测试运行
4. **监控执行**: 在工作流页面查看执行历史

现在您的 N8N 工作流已完全配置，可以自动从 Google Sheets 获取关键词，通过 AI 生成 SEO 优化的文章，并自动发布到您的网站。
