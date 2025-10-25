# 构建文章页面使用说明

## 运行构建命令的位置

### 1. 在项目根目录运行
在包含 `package.json` 文件的目录中运行构建命令：

```bash
# 确保您在项目根目录（包含 package.json 的目录）
cd "C:\Users\123\Desktop\Free Online Invoice - 副本"

# 运行构建命令
npm run build:articles
```

### 2. 构建命令说明

#### 主要构建命令
```bash
# 构建文章页面（主要命令）
npm run build:articles

# 开发模式（自动构建 + 启动服务器）
npm run dev

# 生产构建
npm run build
```

#### 完整的开发流程
```bash
# 1. 编辑文章内容
#    打开 articles/articles.json 文件进行编辑

# 2. 构建更新
npm run build:articles

# 3. 本地测试
npm run dev

# 4. 部署到生产环境
#    将 public/ 目录下的文件部署到服务器
```

## 构建过程会生成的文件

运行 `npm run build:articles` 后会更新以下文件：

1. **public/blog.html** - 博客首页，显示最新文章列表
2. **public/post-data.js** - 文章数据文件，包含所有文章内容
3. **public/sitemap.xml** - 站点地图，包含所有文章URL
4. **SEO报告** - 在控制台显示构建统计信息

## 构建输出示例

成功运行后会看到类似输出：
```
🚀 开始构建文章页面...
📝 生成博客首页...
✅ 博客首页生成完成
📄 生成文章数据文件...
✅ 文章数据文件生成完成
🗺️ 更新站点地图...
✅ 站点地图更新完成
📊 生成SEO报告...
📈 SEO报告:
   总文章数: 4
   精选文章: 3
   分类: tutorial, guide, tips, comparison
   有meta标签的文章: 4
   最新文章: "Free Invoice Format in Word: How to Create Professional Invoices"

🎉 所有构建任务完成！
```

## 常见问题

### 1. 如果出现 "node: command not found"
- 需要安装 Node.js：https://nodejs.org/
- 推荐安装 LTS 版本

### 2. 如果出现模块错误
```bash
# 安装项目依赖
npm install
```

### 3. 构建后如何测试
```bash
# 启动本地服务器测试
npm run dev
# 然后在浏览器打开 http://localhost:8000
```

### 4. 部署到生产环境
- 将整个 `public/` 目录上传到您的Web服务器
- 确保服务器配置正确支持静态文件

## 自动化构建（推荐）

### 在部署前自动构建
如果您使用Vercel、Netlify等平台，可以在部署配置中添加构建命令：

```json
// vercel.json 或 netlify.toml
{
  "buildCommand": "npm run build:articles",
  "outputDirectory": "public"
}
```

### 本地开发工作流
```bash
# 1. 编辑 articles/articles.json
# 2. 运行构建
npm run build:articles
# 3. 本地测试
npm run dev
# 4. 提交更改
git add .
git commit -m "更新文章内容"
git push origin main
```

## 重要提示

- 每次修改 `articles/articles.json` 后都需要运行构建命令
- 构建过程会覆盖现有的 `blog.html` 和 `post-data.js`
- 站点地图会自动包含所有文章URL，有利于SEO
- 构建过程会生成结构化数据（Schema.org），提升搜索排名
