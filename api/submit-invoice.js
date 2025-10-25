import { put } from '@vercel/blob';

// This is the standard Vercel Serverless Function signature for Node.js
export default async function handler(request, response) {
  // 1. Check for the secret API token
  const authHeader = request.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.API_TOKEN}`) {
    return response.status(401).send('Unauthorized');
  }

  // 2. Ensure it's a POST request
  if (request.method !== 'POST') {
    return response.status(405).send('Method Not Allowed');
  }

  try {
    // 3. The body is already parsed by Vercel
    const { title, content } = request.body;

    if (!title || !content) {
      return response.status(400).send('Missing title or content');
    }

    // 4. Generate a URL-friendly slug for the filename
    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const filename = `articles/${slug}.json`;

    // 5. Prepare the article data
    const articleData = {
      title,
      content,
      publishedAt: new Date().toISOString(),
    };

    // 6. Upload the JSON file to Vercel Blob
    const blob = await put(filename, JSON.stringify(articleData), {
      access: 'public',
      contentType: 'application/json',
    });

    // 7. Return the URL of the uploaded file
    return response.status(200).json(blob);
  } catch (error) {
    console.error('Error processing request:', error);
    return response.status(500).send('Internal Server Error');
  }
}