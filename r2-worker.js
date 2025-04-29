// r2-worker.js
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Special endpoint for listing objects in the bucket
    if (url.searchParams.has('list')) {
      return await listObjects(env);
    }
    
    // Decode the pathname to handle encoded URLs
    const encodedObjectKey = url.pathname.slice(1); // Remove the leading slash
    const objectKey = decodeURIComponent(encodedObjectKey);
    
    if (!objectKey) {
      return new Response("Not Found", { status: 404 });
    }
    
    // Log environment variables for debugging (will appear in the Cloudflare logs)
    console.log("Environment:", {
      r2Endpoint: env.R2_ENDPOINT || "Not set",
      hasMyBucket: !!env.MY_BUCKET,
    });
    
    try {
      const object = await env.MY_BUCKET.get(objectKey);
      
      if (!object) {
        console.error(`Object not found: ${objectKey}`);
        return new Response("Not Found", { status: 404 });
      }
      
      // Set appropriate cache headers
      const headers = new Headers();
      headers.set("Content-Type", object.httpMetadata?.contentType || "application/octet-stream");
      headers.set("Cache-Control", "public, max-age=31536000");
      headers.set("Access-Control-Allow-Origin", "*");
      
      return new Response(object.body, { headers });
    } catch (error) {
      console.error("R2 Worker Error:", error);
      return new Response(`Error: ${error.message}`, { status: 500 });
    }
  }
};

// List all objects in the bucket
async function listObjects(env) {
  try {
    const options = {
      limit: 1000,
      // prefix: '', // Uncomment and set this if you want to list objects with a specific prefix
    };
    
    const objects = await env.MY_BUCKET.list(options);
    
    // Transform the objects to include only necessary information
    const transformedObjects = objects.objects.map(obj => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded.toISOString(),
      etag: obj.etag,
      httpMetadata: obj.httpMetadata
    }));
    
    const response = {
      objects: transformedObjects,
      truncated: objects.truncated,
      cursor: objects.cursor
    };
    
    // Set appropriate headers
    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    headers.set("Access-Control-Allow-Origin", "*");
    
    return new Response(JSON.stringify(response), { headers });
  } catch (error) {
    return new Response(`Error listing objects: ${error.message}`, { status: 500 });
  }
} 