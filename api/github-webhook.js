// GitHub Webhook API for N8N to automatically update blog content via GitHub
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { content, title, slug, category, author = 'Admin', githubToken } = req.body;

    // Validate required fields
    if (!content || !title || !slug || !githubToken) {
      return res.status(400).json({ 
        error: 'Missing required fields: content, title, slug, githubToken are required' 
      });
    }

    // Generate HTML content for the blog post
    const htmlContent = `<!DOCTYPE html>
<html lang="en-US">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Free Online Invoice Generator</title>
    <meta name="description" content="${content.substring(0, 160)}...">
    <meta name="keywords" content="invoice generator, free invoice, online invoice, ${category || 'business'}">
    <meta name="author" content="${author}">
    <meta name="robots" content="index, follow">
    <link rel="stylesheet" href="/styles.css">
</head>
<body class="light-theme">
    <div class="container">
        <header role="banner">
            <div class="header-content">
                <h1><a href="/index.html" style="text-decoration: none; color: inherit;">Free Online Invoice Generator</a></h1>
                <p class="subtitle">Permanent free online template</p>
            </div>
        </header>

        <nav class="main-nav">
            <div class="nav-container">
                <ul class="nav-menu">
                    <li class="nav-item"><a href="/index.html" class="nav-link">Invoice Generator</a></li>
                    <li class="nav-item"><a href="/blog.html" class="nav-link">Blog & Help</a></li>
                </ul>
            </div>
        </nav>

        <main class="main-content blog-post">
            <article>
                <header class="blog-header">
                    <h1>${title}</h1>
                    <div class="blog-meta">
                        <span>By ${author}</span>
                        <span>•</span>
                        <span>${new Date().toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}</span>
                        ${category ? `<span>•</span><span>${category}</span>` : ''}
                    </div>
                </header>
                
                <div class="blog-content">
                    ${content.split('\n').map(paragraph => 
                        paragraph.trim() ? `<p>${paragraph}</p>` : ''
                    ).join('')}
                </div>
            </article>
        </main>
    </div>
</body>
</html>`;

    // Create blog post via GitHub API
    const githubResponse = await fetch(`https://api.github.com/repos/kakawebai/Free-Online-Invoice/contents/public/blog-posts/${slug}.html`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        message: `Add blog post: ${title}`,
        content: Buffer.from(htmlContent).toString('base64'),
        branch: 'main'
      })
    });

    const githubResult = await githubResponse.json();

    if (!githubResponse.ok) {
      throw new Error(`GitHub API error: ${githubResult.message}`);
    }

    console.log('Blog post created via GitHub:', {
      title,
      slug,
      category,
      author,
      githubUrl: githubResult.content.html_url
    });

    return res.status(200).json({
      success: true,
      message: 'Blog post created successfully via GitHub',
      data: {
        title,
        slug,
        category,
        author,
        url: `/blog-posts/${slug}.html`,
        githubUrl: githubResult.content.html_url,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error processing GitHub webhook:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
