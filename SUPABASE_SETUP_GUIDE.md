# Supabase Blog Posts 设置指南

## 问题背景
当前网站配置了Supabase，但无法访问blog_posts表中的文章，导致文章页面出现404错误。这是因为Supabase项目中可能没有创建相应的数据表，或者RLS（Row Level Security）策略阻止了访问。

## 解决方案

### 方案1：使用Supabase动态文章（推荐）
要使用Supabase动态加载文章，您需要：

#### 1. 创建blog_posts表
在Supabase SQL编辑器中执行以下SQL：

```sql
-- 创建blog_posts表
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  meta_description TEXT,
  author TEXT DEFAULT 'FreeOnlineInvoice.org',
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用RLS（行级安全）
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- 创建允许匿名读取的策略
CREATE POLICY "Allow public read access" ON blog_posts
  FOR SELECT USING (true);

-- 插入示例数据
INSERT INTO blog_posts (title, slug, content, meta_description) VALUES
(
  'Free Invoice Format in Word: How to Create Professional Invoices',
  'free-invoice-format-in-word-how-to-create-professional-invoices',
  '<p>Creating professional invoices in Word is easier than ever...</p>',
  'Learn how to create professional Word invoice formats with our free templates and step-by-step guide.'
),
(
  'How to Create Professional Invoices: A Complete Guide',
  'how-to-create-professional-invoices',
  '<p>Creating professional invoices is essential for any business...</p>',
  'Learn the essential elements of professional invoices and how to format them correctly.'
),
(
  'Top 10 Invoice Mistakes to Avoid',
  'top-10-invoice-mistakes',
  '<p>Avoiding common invoice mistakes can save you time and money...</p>',
  'Common invoice errors that can cost you money and how to prevent them.'
),
(
  'Free vs Paid Invoice Templates: What''s Best for Your Business?',
  'free-vs-paid-invoice-templates',
  '<p>Choosing between free and paid invoice templates depends on your business needs...</p>',
  'Compare the benefits of free and paid invoice templates to make the right choice.'
);
```

#### 2. 恢复动态文章加载
修改 `public/post.html` 文件，恢复Supabase API调用：

```html
<script>
document.addEventListener('DOMContentLoaded', async () => {
    const postContentDiv = document.getElementById('post-content');
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');

    if (!slug) {
        postContentDiv.innerHTML = '<p>Article not found. No slug provided.</p>';
        return;
    }

    try {
        const { data, error } = await window.supabaseClient
            .from('blog_posts')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error || !data) {
            throw new Error(error ? error.message : 'Article not found.');
        }

        document.title = data.title + " | Free online invoice";
        
        const postHTML = `
            <article>
                <h2>${data.title}</h2>
                <p class="meta">Published on ${new Date(data.published_at).toLocaleDateString()} by ${data.author || 'Admin'}</p>
                <div>${data.content}</div>
                <p style="margin-top: 2rem;"><a href="blog.html">← Back to Blog</a></p>
            </article>
        `;
        postContentDiv.innerHTML = postHTML;

    } catch (error) {
        console.error('Error loading article:', error);
        postContentDiv.innerHTML = `<p>Error loading article. Please try again later.</p>`;
    }
});
</script>
```

### 方案2：使用静态文章（当前实现）
当前网站使用的是静态文章数据，无需Supabase配置。如果您不想配置Supabase，可以：

1. 保持当前的 `public/post.html` 文件不变
2. 在 `public/blog.html` 中也使用静态文章数据
3. 所有文章内容都直接嵌入在HTML文件中

## 检查Supabase配置

### 1. 验证Supabase连接
在浏览器控制台中运行以下代码检查连接：

```javascript
// 检查Supabase客户端是否初始化
console.log('Supabase Client:', window.supabaseClient);

// 测试连接
async function testSupabase() {
    try {
        const { data, error } = await window.supabaseClient
            .from('blog_posts')
            .select('*')
            .limit(1);
        
        if (error) {
            console.error('Supabase Error:', error);
        } else {
            console.log('Supabase Data:', data);
        }
    } catch (err) {
        console.error('Test Failed:', err);
    }
}

testSupabase();
```

### 2. 检查RLS策略
在Supabase仪表板的Authentication > Policies中，确保blog_posts表有正确的读取策略。

## 推荐方案

对于生产环境，建议：
1. **使用Supabase动态文章** - 便于内容管理
2. **配置CDN缓存** - 提高性能
3. **实现静态生成** - 最佳SEO效果

对于开发环境，静态文章数据已经足够使用。

## 故障排除

如果仍然遇到问题：

1. **检查网络请求**：在浏览器开发者工具中查看API调用
2. **验证表名**：确保表名是 `blog_posts`（注意复数）
3. **检查权限**：确保匿名用户有读取权限
4. **验证数据**：在Supabase表中确认有测试数据

如果需要进一步帮助，请提供具体的错误信息。
