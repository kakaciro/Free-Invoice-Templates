# N8N 直接发布文章到 GitHub 项目方案

## 目标
通过 N8N 直接发布文章到 GitHub 项目，所有文章内容统一存储在 `articles/` 文件夹中，便于 SEO 优化和管理。

## 方案概述

### 方案 A：GitHub API 直接发布（推荐）
使用 GitHub API 直接将文章内容提交到仓库的 `articles/` 文件夹

### 方案 B：Webhook 触发自动构建
通过 GitHub webhook 在文章发布后自动构建和部署

## 推荐方案：GitHub API 直接发布

### 实施步骤

#### 步骤 1：创建 GitHub API 端点

<write_to_file>
<path>api/github-direct-publish.js</path>
<content>// GitHub Direct Publish API - 直接发布文章到 GitHub 仓库
import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Received GitHub direct publish request:', JSON.stringify(req.body, null, 2));
    
    const { 
      content, 
      title, 
      slug, 
      category = 'business', 
      author = 'Admin', 
      meta_description, 
      tags = ['invoice', 'business'],
      keywords 
    } = req.body;

    // Validate required fields
    const missingFields = [];
    if (!title || title.trim() === '') missingFields.push('title');
    if (!content || content.trim() === '') missingFields.push('content');
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: `Missing required fields: ${missingFields.join(', ')}`,
        received_data: req.body
      });
    }

    // Auto-generate slug from title if not provided
    const generatedSlug = slug || title.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);

    // Auto-generate meta description if not provided
    const generatedMetaDescription = meta_description || content.substring(0, 160) + '...';

    // Prepare article data for JSON file
    const articleData = {
      id: Date.now(), // Use timestamp as unique ID
      slug: generatedSlug,
      title: title,
      description: content.substring(0, 150) + '...',
      content: content,
      author: author,
      published_at: new Date().toISOString().split('T')[0],
      category: category,
      tags: Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()),
      meta_title: title,
      meta_description: generatedMetaDescription,
      featured: false // Will be updated in build process
    };

    // Initialize GitHub client
    const octokit = new Octokit({
      auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN
    });

    const owner = 'kakawebai';
    const repo = 'Free-Online-Invoice';
    const branch = 'main';

    // Step 1: Read existing articles.json to get current articles
    let existingArticles = { articles: [] };
    try {
      const { data: fileData } = await octokit.repos.getContent({
        owner,
        repo,
        path: 'articles/articles.json',
        ref: branch
      });

      // Decode content from base64
      const contentBuffer = Buffer.from(fileData.content, 'base64');
      existingArticles = JSON.parse(contentBuffer.toString());
      console.log('Successfully read existing articles.json');
    } catch (error) {
      if (error.status === 404) {
        console.log('articles.json not found, creating new file');
      } else {
        console.error('Error reading articles.json:', error);
        throw error;
      }
    }

    // Step 2: Add new article to the beginning of the array
    existingArticles.articles.unshift(articleData);

    // Step 3: Update articles.json on GitHub
    let sha;
    try {
      const { data: currentFile } = await octokit.repos.getContent({
        owner,
        repo,
        path: 'articles/articles.json',
        ref: branch
      });
      sha = currentFile.sha;
    } catch (error) {
      // File doesn't exist, no sha needed
      sha = undefined;
    }

    const { data: commitResult } = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: 'articles/articles.json',
      message: `Add new article: ${title}`,
      content: Buffer.from(JSON.stringify(existingArticles, null, 2)).toString('base64'),
      branch: branch,
      sha: sha
    });

    console.log('Article successfully published to GitHub:', {
      title,
      slug: generatedSlug,
      commit: commitResult.commit.sha
    });

    // Step 4: Trigger build process (optional)
    try {
      // This could trigger a GitHub Action or other build process
      console.log('Article published, build process can be triggered automatically');
    } catch (buildError) {
      console.warn('Build trigger failed, but article was published:', buildError);
    }

    return res.status(200).json({
      success: true,
      message: 'Article published directly to GitHub repository',
      data: {
        title,
        slug: generatedSlug,
        category,
        author,
        published_at: articleData.published_at,
        github_commit: commitResult.commit.sha,
        github_url: `https://github.com/${owner}/${repo}/blob/${branch}/articles/articles.json`
      }
    });

  } catch (error) {
    console.error('Error publishing to GitHub:', error);
    
    // Provide more specific error messages
    if (error.status === 401) {
      return res.status(401).json({
        error: 'GitHub authentication failed',
        message: 'Please check your GitHub Personal Access Token'
      });
    }
    
    if (error.status === 403) {
      return res.status(403).json({
        error: 'GitHub API rate limit exceeded or permission denied',
        message: 'Please check your token permissions and rate limits'
      });
    }

    return res.status(500).json({
      error: 'Failed to publish article to GitHub',
      message: error.message,
      details: error.response?.data || error
    });
  }
}

// Helper function to extract keywords
function extractKeywords(title, content) {
  const text = title + ' ' + content;
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  const wordFreq = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  return Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
}
