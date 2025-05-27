import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Determine path to the extrusion-converter catalog
    const extrusionConverterPath = path.resolve(process.cwd(), '../extrusion-converter');
    const catalogPath = path.join(extrusionConverterPath, 'processed', 'catalog.json');
    
    // Check if catalog exists
    if (!fs.existsSync(catalogPath)) {
      console.error(`Catalog not found: ${catalogPath}`);
      return NextResponse.json(
        { error: 'Catalog not found' },
        { status: 404 }
      );
    }

    // Read and parse the catalog
    const catalogData = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    
    return NextResponse.json(catalogData, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });
    
  } catch (error) {
    console.error('Error loading catalog:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}