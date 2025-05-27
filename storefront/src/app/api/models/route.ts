// src/app/api/models/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Get model ID and LOD from query parameters
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('id');
    const lod = searchParams.get('lod') || 'medium';
    
    console.log(`API request for model: ${modelId}, lod: ${lod}`);
    
    if (!modelId) {
      return NextResponse.json(
        { error: 'Model ID is required' },
        { status: 400 }
      );
    }

    // Determine path to the extrusion-converter output
    // Assuming extrusion-converter is in the parent directory of the Next.js app
    const rootPath = process.cwd();
    console.log(`Current directory: ${rootPath}`);
    
    // Try multiple possible paths
    const possiblePaths = [
      // Relative to Next.js app
      path.join(rootPath, '../extrusion-converter/processed', lod as string, `${modelId}.glb`),
      // Absolute path
      path.join('/home/milan/opensource/extrusion-converter/processed', lod as string, `${modelId}.glb`),
      // Inside public directory
      path.join(rootPath, 'public/models', lod as string, `${modelId}.glb`),
    ];
    
    let modelPath = '';
    for (const testPath of possiblePaths) {
      console.log(`Checking path: ${testPath}`);
      if (fs.existsSync(testPath)) {
        modelPath = testPath;
        console.log(`Found model at: ${modelPath}`);
        break;
      }
    }
    
    // Check if file exists
    if (!modelPath || !fs.existsSync(modelPath)) {
      console.error(`Model not found in any of the checked paths`);
      return NextResponse.json(
        { error: 'Model not found', checkedPaths: possiblePaths },
        { status: 404 }
      );
    }

    // Read the file
    const fileBuffer = fs.readFileSync(modelPath);
    console.log(`Read file of size: ${fileBuffer.length} bytes`);
    
    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', 'model/gltf-binary');
    headers.set('Content-Disposition', `inline; filename="${modelId}.glb"`);
    headers.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });
    
  } catch (error) {
    console.error('Error serving model:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: String(error) },
      { status: 500 }
    );
  }
}