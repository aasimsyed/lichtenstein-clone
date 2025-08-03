// r2-worker.js
export default {
  async fetch(request, env) {
    // Get the request URL
    const url = new URL(request.url);
    
    // Handle CORS preflight requests first - check both method and path
    if (request.method === 'OPTIONS') {
      return handleCORS(request);
    }
    
    // Special endpoint for listing objects in the bucket
    if (url.searchParams.has('list')) {
      return await listObjects(env);
    }
    
    // Handle file uploads
    if (url.pathname === '/upload' && request.method === 'POST') {
      return await handleUpload(request, env);
    }
    
    // Image transformations removed due to compatibility issues
    // TODO: Implement image optimization via separate service
    
    // Handle file deletions
    if (url.pathname === '/delete' && request.method === 'DELETE') {
      return await handleDelete(request, env);
    }
    
    // Handle file renames
    if (url.pathname === '/rename' && request.method === 'POST') {
      return await handleRename(request, env);
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
      headers.set("Access-Control-Allow-Methods", "GET, HEAD, POST, DELETE, OPTIONS");
      headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      headers.set("Access-Control-Max-Age", "86400");
      
      return new Response(object.body, { headers });
    } catch (error) {
      console.error("R2 Worker Error:", error);
      return new Response(`Error: ${error.message}`, { status: 500 });
    }
  }
};

// Handle CORS preflight requests
function handleCORS(request) {
  // Extract the origin from the request
  const origin = request.headers.get('Origin') || '*';
  
  // Get the Access-Control-Request-Headers header
  const requestHeaders = request.headers.get('Access-Control-Request-Headers') || 'Content-Type, Authorization';
  
  // Set CORS headers for preflight response
  return new Response(null, {
    status: 204, // No content needed for preflight response
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': requestHeaders,
      'Access-Control-Max-Age': '86400',
      'Access-Control-Allow-Credentials': 'false'
    }
  });
}

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
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    headers.set("Access-Control-Max-Age", "86400");
    
    return new Response(JSON.stringify(response), { headers });
  } catch (error) {
    console.error("Error listing objects:", error);
    return new Response(`Error listing objects: ${error.message}`, { 
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Content-Type": "application/json"
      }
    });
  }
}

// Handle file uploads to R2
async function handleUpload(request, env) {
  // Extract the origin from the request for CORS
  const origin = request.headers.get('Origin') || '*';
  
  // Common headers for all responses
  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
  
  try {
    console.log("Processing upload request");
    
    // Process the form data to extract the file
    let formData;
    try {
      formData = await request.formData();
    } catch (formError) {
      console.error("Error parsing form data:", formError);
      return new Response(
        JSON.stringify({ error: 'Invalid form data: ' + formError.message }), 
        { 
          status: 400, 
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }
    
    const file = formData.get('file');
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }), 
        { 
          status: 400, 
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }
    
    // Use the provided name or generate a unique filename
    const filename = file.name;
    
    // Get content type from file metadata or infer from extension
    const contentType = file.type || inferContentType(filename);
    
    // Convert the file to an ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    
    // Upload the file to R2
    await env.MY_BUCKET.put(filename, arrayBuffer, {
      httpMetadata: {
        contentType: contentType
      }
    });
    
    // Construct the URL to access the file
    const fileUrl = `${new URL(request.url).origin}/${encodeURIComponent(filename)}`;
    
    console.log(`Successfully uploaded: ${filename} (${contentType})`);
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        key: filename,
        url: fileUrl,
        size: arrayBuffer.byteLength,
        contentType: contentType
      }), 
      { 
        status: 200, 
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  } catch (error) {
    console.error("Upload error:", error.stack || error);
    return new Response(
      JSON.stringify({ error: error.message || 'Upload failed' }), 
      { 
        status: 500, 
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  }
}

// Infer content type from file extension
function inferContentType(filename) {
  const extension = filename.split('.').pop()?.toLowerCase();
  const typeMap = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'avif': 'image/avif'
  };
  
  return typeMap[extension] || 'application/octet-stream';
}

// Image transformation function removed due to compatibility issues

async function handleDelete(request, env) {
  // Extract the origin from the request for CORS
  const origin = request.headers.get('Origin') || '*';
  
  // Common headers for all responses
  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
  
  try {
    console.log("Processing delete request");
    
    // Get the keys to delete from the request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error("Error parsing request body:", error);
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }), 
        { 
          status: 400, 
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }
    
    const keys = body.keys;
    
    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid keys provided for deletion' }), 
        { 
          status: 400, 
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }
    
    // Delete the objects
    const deleteResults = [];
    let successCount = 0;
    let failCount = 0;
    
    for (const key of keys) {
      try {
        await env.MY_BUCKET.delete(key);
        deleteResults.push({ key, success: true });
        successCount++;
      } catch (error) {
        console.error(`Error deleting ${key}:`, error);
        deleteResults.push({ key, success: false, error: error.message });
        failCount++;
      }
    }
    
    console.log(`Deleted ${successCount} objects, ${failCount} failed`);
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        deletedCount: successCount,
        failedCount: failCount,
        results: deleteResults
      }), 
      { 
        status: 200, 
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  } catch (error) {
    console.error("Delete error:", error.stack || error);
    return new Response(
      JSON.stringify({ error: error.message || 'Delete operation failed' }), 
      { 
        status: 500, 
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  }
}

// Handle file renaming from R2
async function handleRename(request, env) {
  // Extract the origin from the request for CORS
  const origin = request.headers.get('Origin') || '*';
  
  // Common headers for all responses
  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
  
  try {
    console.log("Processing rename request");
    
    // Get the rename parameters from the request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error("Error parsing request body:", error);
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }), 
        { 
          status: 400, 
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }
    
    const { oldKey, newKey } = body;
    
    if (!oldKey || !newKey) {
      return new Response(
        JSON.stringify({ error: 'Both oldKey and newKey are required' }), 
        { 
          status: 400, 
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }
    
    if (oldKey === newKey) {
      return new Response(
        JSON.stringify({ error: 'Old key and new key cannot be the same' }), 
        { 
          status: 400, 
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }
    
    // Check if the new key already exists
    const existingObject = await env.MY_BUCKET.get(newKey);
    if (existingObject) {
      return new Response(
        JSON.stringify({ error: 'A file with the new name already exists' }), 
        { 
          status: 409, 
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }
    
    // Get the original object
    const originalObject = await env.MY_BUCKET.get(oldKey);
    if (!originalObject) {
      return new Response(
        JSON.stringify({ error: 'Original file not found' }), 
        { 
          status: 404, 
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }
    
    // Copy the object to the new key with all its metadata
    await env.MY_BUCKET.put(newKey, originalObject.body, {
      httpMetadata: originalObject.httpMetadata,
      customMetadata: originalObject.customMetadata
    });
    
    // Verify the copy was successful
    const copiedObject = await env.MY_BUCKET.get(newKey);
    if (!copiedObject) {
      throw new Error('Failed to copy object to new location');
    }
    
    // Delete the original object
    await env.MY_BUCKET.delete(oldKey);
    
    console.log(`Successfully renamed ${oldKey} to ${newKey}`);
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        oldKey,
        newKey,
        message: `File renamed from ${oldKey} to ${newKey}`
      }), 
      { 
        status: 200, 
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  } catch (error) {
    console.error("Rename error:", error.stack || error);
    return new Response(
      JSON.stringify({ error: error.message || 'Rename operation failed' }), 
      { 
        status: 500, 
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  }
} 