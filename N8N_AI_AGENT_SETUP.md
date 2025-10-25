# N8N AI Agent 配置指南 - 关键词和URL嵌入

## 当前Google Sheets数据结构

假设您的Google Sheets包含以下列：
- **SEO** - 主要关键词
- **URL** - 需要嵌入文章的URL链接

## AI Agent 提示词配置

### 系统提示词 (System Prompt)
```
您是一个专业的SEO内容创作助手。请根据提供的关键词和URL创作高质量的SEO优化文章，并自然地将URL嵌入到文章中。
```

### 用户提示词 (User Prompt)
```
请为我针对以下关键词写一篇SEO文章，并在文章中自然嵌入提供的URL。

关键词：{{$json.SEO}}
嵌入URL：{{$json.URL}}

文章要求：
1. 字数800-1200字，结构清晰
2. 自然地将提供的URL嵌入到相关内容中
3. 包含H2、H3标题层级
4. 使用项目符号或编号列表
5. 包含实际可操作的建议
6. 语言专业且易于理解

请严格按照以下JSON格式返回，不要在JSON代码块之外添加任何其他说明文字或注释：
{
  "title": "这里是文章标题",
  "content": "这里是文章正文内容，包含嵌入的URL链接"
}
```

## Edit Fields 节点配置

### 字段映射设置
- **Mode**: "Manually Map Fields"
- 添加字段映射：
  - **Source Field**: `SEO` → **Destination Field**: `SEO`
  - **Source Field**: `URL` → **Destination Field**: `URL`

### 输出示例
```json
{
  "SEO": "free invoice generator online",
  "URL": "https://freeonlineinvoice.org"
}
```

## 完整的N8N工作流节点

### 节点顺序
```
Google Sheets Trigger
       ↓
   Edit Fields (提取SEO和URL)
       ↓
    AI Agent (生成包含URL的文章)
       ↓
   Code (JavaScript) - 数据格式化
       ↓
 HTTP Request - 发布到GitHub
```

### AI Agent 节点详细配置

#### 模型设置
- **Model**: DeepSeek Chat Model (或其他您使用的模型)
- **Temperature**: 0.7
- **Max Tokens**: 2000

#### 提示词示例
**System Prompt**:
```
您是一个专业的SEO内容创作助手。请根据提供的关键词和URL创作高质量的SEO优化文章，并自然地将URL嵌入到文章中。
```

**User Prompt**:
```
请为我针对以下关键词写一篇SEO文章，并在文章中自然嵌入提供的URL。

关键词：free invoice generator online
嵌入URL：https://freeonlineinvoice.org

文章要求：
1. 字数800-1200字，结构清晰
2. 自然地将提供的URL嵌入到相关内容中
3. 包含H2、H3标题层级
4. 使用项目符号或编号列表
5. 包含实际可操作的建议
6. 语言专业且易于理解

请严格按照以下JSON格式返回：
{
  "title": "这里是文章标题",
  "content": "这里是文章正文内容，包含嵌入的URL链接"
}
```

## 预期AI输出示例

### 输入数据
```json
{
  "SEO": "free invoice generator online",
  "URL": "https://freeonlineinvoice.org"
}
```

### 预期AI输出
```json
{
  "title": "Free Online Invoice Generator: Create Professional Invoices Instantly",
  "content": "Creating professional invoices has never been easier with modern technology. In today's digital age, businesses of all sizes can benefit from using a <a href=\"https://freeonlineinvoice.org\" target=\"_blank\">free online invoice generator</a> to streamline their billing processes.\n\n## Why Use an Online Invoice Generator?\n\nOnline invoice generators offer numerous advantages over traditional methods. With platforms like <a href=\"https://freeonlineinvoice.org\">FreeOnlineInvoice.org</a>, you can:\n\n- Create professional invoices in minutes\n- Access your invoices from anywhere\n- Automate calculations and tax applications\n- Maintain consistent branding\n\n## Key Features to Look For\n\nWhen choosing an online invoice generator, consider these essential features available at <a href=\"https://freeonlineinvoice.org\">https://freeonlineinvoice.org</a>:\n\n### Customization Options\nThe ability to customize templates with your logo and brand colors is crucial for professional presentation.\n\n### Automation Capabilities\nLook for systems that can automatically calculate totals, apply taxes, and generate sequential invoice numbers.\n\n### Mobile Accessibility\nEnsure the platform works seamlessly on mobile devices, allowing you to create invoices on the go.\n\n## Getting Started\n\nTo begin using <a href=\"https://freeonlineinvoice.org\">FreeOnlineInvoice.org</a>, simply visit their website and follow these steps:\n\n1. Choose a template that matches your business needs\n2. Fill in your company and client information\n3. Add line items with descriptions and prices\n4. Review and download or send the invoice\n\nThis straightforward process eliminates the need for complex accounting software while providing professional results.\n\n## Best Practices\n\nWhen using any online invoice generator, including <a href=\"https://freeonlineinvoice.org\">the one available here</a>, remember to:\n\n- Include all necessary legal information\n- Use clear descriptions for products and services\n- Set appropriate payment terms\n- Follow up on overdue payments promptly\n\nBy leveraging the power of <a href=\"https://freeonlineinvoice.org\">free online invoice tools</a>, you can significantly improve your business's financial operations while maintaining a professional image."
}
```

## Code 节点更新配置

### JavaScript 代码（处理包含URL的文章）
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

## Google Sheets 数据结构示例

| SEO | URL |
|-----|-----|
| free invoice generator online | https://freeonlineinvoice.org |
| how to create professional invoice | https://freeonlineinvoice.org |
| invoice templates free download | https://freeonlineinvoice.org |

## 验证工作流

### 测试步骤
1. 在Google Sheets中添加一行测试数据
2. 运行N8N工作流
3. 检查AI生成的文章是否包含提供的URL
4. 验证文章是否成功发布到GitHub

### 成功标准
- ✅ AI生成的文章包含自然嵌入的URL链接
- ✅ 文章长度800-1200字，结构清晰
- ✅ 成功发布到GitHub仓库
- ✅ 网站自动更新显示新文章

## 故障排除

### 问题1：AI没有嵌入URL
**解决**：检查User Prompt中是否明确要求嵌入URL，并确保URL字段正确传递

### 问题2：URL链接格式不正确
**解决**：在Code节点中添加URL验证，确保URL格式正确

### 问题3：文章质量不佳
**解决**：调整Temperature参数或优化提示词

## 提示词优化建议

### 如果需要更具体的嵌入要求
```
请在以下位置自然嵌入提供的URL：
- 在介绍部分至少出现一次
- 在功能描述部分至少出现一次  
- 在操作步骤部分至少出现一次
- 使用自然的锚文本，不要使用"点击这里"等通用文本
```

### 如果需要特定的文章结构
```
文章结构要求：
1. 引言（包含URL）
2. 问题分析
3. 解决方案（包含URL）
4. 操作步骤（包含URL）
5. 最佳实践
6. 结论（包含URL）
```

现在您的N8N工作流可以同时处理关键词和URL，生成包含自然链接的高质量SEO文章！
