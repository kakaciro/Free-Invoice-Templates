// Supabase Blog API for dynamic blog content with advanced SEO features
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Received request body:', JSON.stringify(req.body, null, 2));
    
    const { content, title, slug, category, author = 'Admin', meta_description, tags, keywords } = req.body;

    // Validate required fields
    const missingFields = [];
    if (!title || title.trim() === '') missingFields.push('title');
    if (!content || content.trim() === '') missingFields.push('content');
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: `Missing required fields: ${missingFields.join(', ')}`,
        received_data: req.body,
        note: 'Please ensure title and content are provided and not empty'
      });
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL || 'https://pytavytnuhvkghldkxlp.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    // CRITICAL: The service role key must be set in the environment variables for this to work.
    if (!supabaseKey) {
      console.error('Supabase service key is missing. Please set the SUPABASE_SERVICE_KEY environment variable in your deployment settings.');
      return res.status(500).json({
        error: 'Server configuration error: Supabase service key is not available.',
        message: 'The API cannot connect to the database securely. The SUPABASE_SERVICE_KEY must be provided.'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Auto-generate slug from title if not provided
    const generatedSlug = slug || title.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);

    // Auto-generate meta description if not provided
    const generatedMetaDescription = meta_description || content.substring(0, 160) + '...';

    // Auto-generate keywords if not provided
    const generatedKeywords = keywords || extractKeywords(title, content);

    // Calculate SEO metrics
    const seoMetrics = calculateSEOMetrics(title, content, generatedMetaDescription);

    // Prepare blog post data - using English field names for Supabase table
    const blogPostData = {
      title: title,
      content: content,
      slug: generatedSlug,
      category: category || 'business',
      author: author,
      meta_description: generatedMetaDescription,
      keywords: generatedKeywords,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())) : ['invoice', 'business'],
      published_at: new Date().toISOString(),
      status: 'published',
      seo_score: seoMetrics.score,
      word_count: seoMetrics.wordCount,
      reading_time: seoMetrics.readingTime,
      keyword_density: seoMetrics.keywordDensity
    };

    // Insert blog post into Supabase - using English field names
    const { data, error } = await supabase
      .from('blog_posts')
      .insert([blogPostData])
      .select();

    if (error) {
      console.error('Supabase insert error:', JSON.stringify(error, null, 2));
      return res.status(500).json({
        error: 'Failed to save blog post to database. This is likely an issue with database permissions (RLS) or schema mismatch.',
        details: error.message,
        supabase_error: error // Provide the full error object for debugging
      });
    }

    console.log('Blog post saved to Supabase:', {
      id: data[0].id,
      title,
      slug: generatedSlug,
      seo_score: blogPostData.seo_score,
      word_count: blogPostData.word_count
    });

    return res.status(200).json({
      success: true,
      message: 'Blog post saved successfully to database with advanced SEO optimization',
      data: {
        id: data[0].id,
        title,
        slug: generatedSlug,
        category: blogPostData.category,
        author,
        meta_description: blogPostData.meta_description,
        keywords: blogPostData.keywords,
        seo_score: blogPostData.seo_score,
        word_count: blogPostData.word_count,
        reading_time: blogPostData.reading_time,
        keyword_density: blogPostData.keyword_density,
        url: `/blog/${generatedSlug}`,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

// Extract keywords from title and content
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

  // Return top 5 keywords
  return Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
}

// Calculate comprehensive SEO metrics
function calculateSEOMetrics(title, content, metaDescription) {
  let score = 0;
  const wordCount = content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200); // Average reading speed
  
  // Title optimization (50-60 characters optimal)
  const titleLength = title.length;
  if (titleLength >= 50 && titleLength <= 60) score += 25;
  else if (titleLength >= 40 && titleLength <= 70) score += 15;
  else score += 5;

  // Content length (800+ words optimal for SEO)
  if (wordCount >= 1200) score += 30;
  else if (wordCount >= 800) score += 25;
  else if (wordCount >= 500) score += 20;
  else if (wordCount >= 300) score += 15;
  else score += 5;

  // Meta description optimization (120-160 characters)
  const metaLength = metaDescription.length;
  if (metaLength >= 120 && metaLength <= 160) score += 20;
  else if (metaLength >= 100 && metaLength <= 180) score += 15;
  else score += 5;

  // Keyword optimization
  const keywords = extractKeywords(title, content);
  const keywordDensity = calculateKeywordDensity(title + ' ' + content, keywords[0]);
  if (keywordDensity >= 1 && keywordDensity <= 3) score += 15;
  else score += 5;

  // Content structure (headings, paragraphs)
  const headingCount = (content.match(/#+\s/g) || []).length;
  const paragraphCount = (content.split('\n\n').length);
  if (headingCount >= 2 && paragraphCount >= 5) score += 10;
  else score += 5;

  return {
    score: Math.min(score, 100),
    wordCount,
    readingTime,
    keywordDensity
  };
}

// Calculate keyword density
function calculateKeywordDensity(text, keyword) {
  if (!keyword) return 0;
  const words = text.toLowerCase().split(/\s+/);
  const keywordCount = words.filter(word => word === keyword.toLowerCase()).length;
  return (keywordCount / words.length) * 100;
}
