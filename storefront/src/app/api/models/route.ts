// storefront/src/app/api/models/route.ts
// PROXY VERSION - Streams file through Next.js server to avoid CORS
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import { RateLimiterMemory } from 'rate-limiter-flexible';

console.log('🚀 Model API Route Loading...');

// Environment variables
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_BUCKET = process.env.R2_BUCKET;

console.log('Environment check:', {
  R2_ACCESS_KEY_ID: R2_ACCESS_KEY_ID ? 'SET' : 'MISSING',
  R2_SECRET_ACCESS_KEY: R2_SECRET_ACCESS_KEY ? 'SET' : 'MISSING', 
  R2_ENDPOINT: R2_ENDPOINT || 'MISSING',
  R2_BUCKET: R2_BUCKET || 'MISSING'
});

if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT || !R2_BUCKET) {
  throw new Error(
    'Missing required environment variables: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, or R2_BUCKET'
  );
}

// Initialize S3 client for R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

console.log('✅ S3 Client initialized for R2');

// Rate limiter
const rateLimiter = new RateLimiterMemory({
  points: 50, // 50 requests
  duration: 60, // per minute
});

// CORS headers - THIS IS KEY!
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Range',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
};

// Cache headers for models
const cacheHeaders = {
  'Cache-Control': 'public, max-age=31536000, immutable',
  'Content-Type': 'model/gltf-binary',
  ...corsHeaders,
};

// OPTIONS handler for CORS preflight - REQUIRED!
export async function OPTIONS() {
  console.log('🔧 CORS preflight request received');
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// GET handler - PROXY the model file (NO REDIRECT!)
export async function GET(request: Request) {
  console.log("#################################################################################### \n\n #######################################################");

  const { searchParams } = new URL(request.url);
  const sku = searchParams.get('sku');
  const lod = searchParams.get('lod') || 'medium';

  console.log("🎯 PROXY VERSION - The sku at GET model is:", sku);
  console.log("🎯 PROXY VERSION - The lod at GET model is:", lod);

  // Validate inputs
  if (!sku || !['high', 'medium', 'low'].includes(lod)) {
    return NextResponse.json({ error: 'Invalid SKU or LOD' }, { 
      status: 400,
      headers: corsHeaders 
    });
  }

  // Rate limiting by IP
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  try {
    await rateLimiter.consume(ip);
  } catch (error) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { 
      status: 429,
      headers: corsHeaders 
    });
  }

  try {
    // Construct R2 object key
    const key = `${lod}/${sku}.glb`;
    console.log("🔑 Getting file with key:", key);

    // Get the object from R2 - NO SIGNED URL, DIRECT FETCH!
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    });

    console.log("📡 Fetching from R2...");
    const response = await s3Client.send(command);
    
    if (!response.Body) {
      console.log("❌ No body in R2 response");
      return NextResponse.json({ error: 'Model not found' }, { 
        status: 404,
        headers: corsHeaders 
      });
    }

    console.log("✅ Got response from R2, streaming to browser...");

    // Convert the stream to a buffer
    const chunks: Uint8Array[] = [];
    const reader = response.Body.transformToWebStream().getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    // Combine all chunks into a single buffer
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const buffer = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.length;
    }

    console.log(`🎉 Model loaded successfully: ${key}, size: ${buffer.length} bytes`);
    console.log("📤 Sending file to browser with CORS headers");

    // Return the model file with proper CORS headers - NO REDIRECT!
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        ...cacheHeaders,
        'Content-Length': buffer.length.toString(),
        'Accept-Ranges': 'bytes',
      },
    });

  } catch (error: any) {
    console.error('❌ Error fetching model:', error);
    return NextResponse.json({ 
      error: 'Model not found',
      details: error.message 
    }, { 
      status: 404,
      headers: corsHeaders 
    });
  }
}

// HEAD handler for range request support
export async function HEAD(request: Request) {
  const { searchParams } = new URL(request.url);
  const sku = searchParams.get('sku');
  const lod = searchParams.get('lod') || 'medium';

  console.log("📋 HEAD request for:", sku, lod);

  if (!sku || !['high', 'medium', 'low'].includes(lod)) {
    return new NextResponse(null, { 
      status: 400,
      headers: corsHeaders 
    });
  }

  try {
    const key = `${lod}/${sku}.glb`;
    
    // Check if object exists
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    });

    const response = await s3Client.send(command);
    
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': 'model/gltf-binary',
        'Content-Length': response.ContentLength?.toString() || '0',
        'Accept-Ranges': 'bytes',
        ...corsHeaders,
      },
    });

  } catch (error) {
    return new NextResponse(null, { 
      status: 404, 
      headers: corsHeaders 
    });
  }
}


// import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
// import { NextResponse } from 'next/server';
// import { RateLimiterMemory } from 'rate-limiter-flexible';

// // Validate environment variables
// const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
// const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
// const R2_ENDPOINT = process.env.R2_ENDPOINT;
// const R2_BUCKET = process.env.R2_BUCKET;

// if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT || !R2_BUCKET) {
//   throw new Error(
//     'Missing required environment variables: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, or R2_BUCKET'
//   );
// }

// // Initialize S3 client for R2
// const s3Client = new S3Client({
//   region: 'auto',
//   endpoint: R2_ENDPOINT,
//   credentials: {
//     accessKeyId: R2_ACCESS_KEY_ID,
//     secretAccessKey: R2_SECRET_ACCESS_KEY,
//   },
// });

// // Rate limiter: 20 MB/s per IP
// const rateLimiter = new RateLimiterMemory({
//   points: 20 * 1024 * 1024, // 20 MB
//   duration: 1, // per second
// });

// // Cache headers for immutable models
// const cacheHeaders = {
//   'Cache-Control': 'public, max-age=31536000, immutable',
//   'Content-Type': 'model/gltf-binary',
// };

// // GET /api/models?sku=[sku]&lod=[lod]
// export async function GET(request: Request) {

//       console.log("#################################################################################### \n\n #######################################################")

//   const { searchParams } = new URL(request.url);
//   const sku = searchParams.get('sku');
//   const lod = searchParams.get('lod') || 'medium';

//   console.log("The sku at GET model is : " + sku);
//   console.log("The lod at GET model is : " + lod)

//   // Validate inputs
//   if (!sku || !['high', 'medium', 'low'].includes(lod)) {
//     return NextResponse.json({ error: 'Invalid SKU or LOD' }, { status: 400 });
//   }

//   // Rate limiting by IP
//   const ip = request.headers.get('x-forwarded-for') || 'unknown';
//   try {
//     await rateLimiter.consume(ip, 1024); // Consume 1KB per request (adjust based on model size)
//   } catch (error) {
//     return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
//   }

//   try {
//     // Construct R2 object key
//     const key = `${lod}/${sku}.glb`;

//     // console.log("#################################################################################### \n\n #######################################################")
//     console.log("\n\n\nInside Next API / models / id : with key as : ", key )

//     // Generate signed URL (expires in 5 minutes)
//     const command = new GetObjectCommand({
//       Bucket: R2_BUCKET,
//       Key: key,
//     });
//     const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

//     // Redirect to signed URL with cache headers
//     return NextResponse.redirect(signedUrl, {
//       headers: cacheHeaders,
//     });
//   } catch (error) {
//     console.error('Error fetching model:', error);
//     return NextResponse.json({ error: 'Model not found' }, { status: 404 });
//   }
// }

// // Support range requests for progressive loading
// export async function HEAD(request: Request) {
//   const { searchParams } = new URL(request.url);
//   const sku = searchParams.get('sku');
//   const lod = searchParams.get('lod') || 'medium';

//   if (!sku || !['high', 'medium', 'low'].includes(lod)) {
//     return NextResponse.json({ error: 'Invalid SKU or LOD' }, { status: 400 });
//   }

//   return NextResponse.json({}, { headers: { 'Accept-Ranges': 'bytes' } });
// }