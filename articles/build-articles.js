const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// 读取文章数据
const articlesData = require('./articles.json');
const articles = articlesData.articles;

console.log('🚀 开始构建文章页面...');

// 生成博客首页 (blog.html)
function buildBlogPage() {
    console.log('📝 生成博客首页...');
    
    // 读取现有的blog.html作为模板
    let blogContent = fs.readFileSync('./public/blog.html', 'utf8');
    
    // 生成最新的文章列表
    const latestArticles = articles
        .filter(article => article.featured)
        .slice(0, 6) // 最多显示6篇文章
        .map(article => `
            <article class="article-card">
                <h3><a href="post.html?slug=${article.slug}">${article.title}</a></h3>
                <p class="article-excerpt">${article.description}</p>
                <div class="article-meta">
                    <span class="category">${article.category}</span>
                    <span class="date">${new Date(article.published_at).toLocaleDateString()}</span>
                </div>
            </article>
        `).join('');

    // 替换文章列表部分
    blogContent = blogContent.replace(
        /<div class="articles-grid">[\s\S]*?<\/div>/,
        `<div class="articles-grid">${latestArticles}</div>`
    );

    // 写入更新后的文件
    fs.writeFileSync('./public/blog.html', blogContent);
    console.log('✅ 博客首页生成完成');
}

// 生成文章数据文件 (post-data.js)
function buildPostData() {
  console.log('📄 生成文章数据文件...');

  // 将 Markdown 转为 HTML（如已是 HTML 则直接使用）
  const preparedArticlesObj = articles.reduce((acc, article) => {
    const prepared = { ...article };
    const isHTML = /<\s*(p|h\d|ul|ol|li|a|strong|em)\b/i.test(String(prepared.content || ''));
    prepared.content = isHTML ? (prepared.content || '') : marked.parse(String(prepared.content || ''));
    acc[prepared.slug] = prepared;
    return acc;
  }, {});

  const postData = `// 文章数据 - 自动生成
const staticArticles = ${JSON.stringify(preparedArticlesObj, null, 2)};

// 文章加载逻辑
document.addEventListener('DOMContentLoaded', () => {
  const postContentDiv = document.getElementById('post-content');
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  if (!slug) {
    postContentDiv.innerHTML = '<p>Article not found. No slug provided.</p>';
    return;
  }

  const article = staticArticles[slug];
  if (!article) {
    postContentDiv.innerHTML = \`
      <article>
        <h2>Article Not Found</h2>
        <p>The article you're looking for doesn't exist or may have been moved.</p>
        <p><a href="blog.html">← Back to Blog</a></p>
      </article>
    \`;
    return;
  }

  // 更新页面标题和meta
  document.title = article.meta_title || (article.title + ' | Free online invoice');
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) { metaDesc = document.createElement('meta'); metaDesc.name = 'description'; document.head.appendChild(metaDesc); }
  metaDesc.content = article.meta_description || article.description;

  // 结构化数据
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.meta_description || article.description,
    "author": { "@type": "Organization", "name": article.author },
    "datePublished": article.published_at,
    "dateModified": article.published_at,
    "publisher": { "@type": "Organization", "name": "FreeOnlineInvoice.org", "url": "https://freeonlineinvoice.org" }
  };
  const existingScript = document.querySelector('script[type="application/ld+json"]');
  if (existingScript) existingScript.remove();
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(structuredData);
  document.head.appendChild(script);

  // 生成文章内容（使用新的样式结构）
  const postHTML = \`
    <article class="blog-post" itemscope itemtype="https://schema.org/Article">
      <header class="post-header">
        <h1 itemprop="headline">\${article.title}</h1>
        <div class="post-meta">
          <span itemprop="author" itemscope itemtype="https://schema.org/Organization"><span itemprop="name">\${article.author}</span></span>
          <span class="read-time">\${article.reading_time || '5 min'}</span>
          <time class="post-date" itemprop="datePublished" datetime="\${article.published_at}">\${new Date(article.published_at).toLocaleDateString()}</time>
          <span class="post-category">\${article.category}</span>
        </div>
      </header>
      <div class="post-content" itemprop="articleBody">\${article.content}</div>
      <div class="article-tags">\${(article.tags || []).map(tag => \`<span class="tag">\${tag}</span>\`).join('')}</div>
      <div class="article-navigation"><a href="blog.html">← Back to Blog</a></div>
    </article>
  \`;
  postContentDiv.innerHTML = postHTML;
});
`;

  fs.writeFileSync('./public/post-data.js', postData);
  console.log('✅ 文章数据文件生成完成');
}

// 更新站点地图
function updateSitemap() {
    console.log('🗺️ 更新站点地图...');
    
    const baseUrl = 'https://freeonlineinvoice.org';
    const today = new Date().toISOString().split('T')[0];
    
    let sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${baseUrl}/</loc>
        <lastmod>${today}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>${baseUrl}/blog.html</loc>
        <lastmod>${today}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>`;

    // 添加文章URL到站点地图
    articles.forEach(article => {
        sitemapContent += `
    <url>
        <loc>${baseUrl}/post.html?slug=${article.slug}</loc>
        <lastmod>${today}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>`;
    });

    sitemapContent += '\n</urlset>';
    
    fs.writeFileSync('./public/sitemap.xml', sitemapContent);
    console.log('✅ 站点地图更新完成');
}

// 生成SEO报告
function generateSEOReport() {
    console.log('📊 生成SEO报告...');
    
    const report = {
        totalArticles: articles.length,
        featuredArticles: articles.filter(a => a.featured).length,
        categories: [...new Set(articles.map(a => a.category))],
        tags: [...new Set(articles.flatMap(a => a.tags))],
        articlesWithMeta: articles.filter(a => a.meta_title && a.meta_description).length,
        latestArticle: articles.reduce((latest, article) => 
            new Date(article.published_at) > new Date(latest.published_at) ? article : latest
        )
    };

    console.log('📈 SEO报告:');
    console.log(`   总文章数: ${report.totalArticles}`);
    console.log(`   精选文章: ${report.featuredArticles}`);
    console.log(`   分类: ${report.categories.join(', ')}`);
    console.log(`   标签: ${report.tags.join(', ')}`);
    console.log(`   有meta标签的文章: ${report.articlesWithMeta}`);
    console.log(`   最新文章: "${report.latestArticle.title}"`);
}

// 执行所有构建任务
function buildAll() {
    try {
        buildBlogPage();
        buildPostData();
        updateSitemap();
        generateSEOReport();
        console.log('\n🎉 所有构建任务完成！');
        console.log('💡 现在您可以：');
        console.log('   1. 编辑 articles/articles.json 来更新内容');
        console.log('   2. 运行 npm run build:articles 重新构建');
        console.log('   3. 部署更新到服务器');
    } catch (error) {
        console.error('❌ 构建过程中出现错误:', error);
        process.exit(1);
    }
}

// 如果是直接运行此脚本
if (require.main === module) {
    buildAll();
}

module.exports = { buildAll };
