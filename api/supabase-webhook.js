// Supabase Webhook API for auto-publishing blog content with database storage
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { content, title, slug, category, author = 'Admin', meta_description, tags } = req.body;

    // Validate required fields
    const missingFields = [];
    if (!title) missingFields.push('title');
    if (!content) missingFields.push('content');
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: `Missing required fields: ${missingFields.join(', ')}`,
        received_data: req.body
      });
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL || 'https://kyfmwshuseaqadfhygei.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseKey) {
      return res.status(500).json({
        error: 'Supabase configuration missing'
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

    // Prepare blog post data
    const blogPostData = {
      title,
      content,
      slug: generatedSlug,
      category: category || 'business',
      author,
      meta_description: generatedMetaDescription,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())) : ['invoice', 'business'],
      published_at: new Date().toISOString(),
      status: 'published',
      seo_score: calculateSEOScore(title, content, generatedMetaDescription)
    };

    // Insert blog post into Supabase
    const { data, error } = await supabase
      .from('blog_posts')
      .insert([blogPostData])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({
        error: 'Failed to save blog post to database',
        details: error.message
      });
    }

    console.log('Blog post saved to Supabase:', {
      id: data[0].id,
      title,
      slug: generatedSlug,
      seo_score: blogPostData.seo_score
    });

    return res.status(200).json({
      success: true,
      message: 'Blog post saved successfully to database',
      data: {
        id: data[0].id,
        title,
        slug: generatedSlug,
        category: blogPostData.category,
        author,
        meta_description: blogPostData.meta_description,
        url: `/blog/${generatedSlug}`,
        seo_score: blogPostData.seo_score,
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

// Calculate basic SEO score for the content
function calculateSEOScore(title, content, metaDescription) {
  let score = 0;
  
  // Title score (optimal length 50-60 characters)
  const titleLength = title.length;
  if (titleLength >= 50 && titleLength <= 60) score += 30;
  else if (titleLength >= 40 && titleLength <= 70) score += 20;
  else score += 10;

  // Content score (minimum 300 words for good SEO)
  const wordCount = content.split(/\s+/).length;
  if (wordCount >= 800) score += 40;
  else if (wordCount >= 500) score += 30;
  else if (wordCount >= 300) score += 20;
  else score += 10;

  // Meta description score (optimal length 120-160 characters)
  const metaLength = metaDescription.length;
  if (metaLength >= 120 && metaLength <= 160) score += 30;
  else if (metaLength >= 100 && metaLength <= 180) score += 20;
  else score += 10;

  return Math.min(score, 100);
}
