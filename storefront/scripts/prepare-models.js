#!/usr/bin/env node
/**
 * prepare-models.js
 * 
 * This script prepares the converted 3D models for use in a NextJS application.
 * It copies the models and metadata to the public directory of your NextJS app
 * and generates a unified catalog file.
 */

const fs = require('fs-extra');
const path = require('path');

// Configuration (customize these paths)
const CONFIG = {
  // Source directories
  sourcePath: path.resolve(process.env.HOME, 'extrusion-converter'),
  modelsPath: path.resolve(process.env.HOME, 'extrusion-converter/processed/medium'), // Default to medium LOD
  metadataPath: path.resolve(process.env.HOME, 'extrusion-converter/metadata'),
  
  // Destination (NextJS app)
  nextjsPath: path.resolve(process.cwd()),
  outputPath: path.resolve(process.cwd(), 'public/models'),
  
  // Options
  generatePreviewImages: false, // Not implemented yet
  copyAllLods: false,
};

// Parse command line arguments
const args = process.argv.slice(2);
args.forEach(arg => {
  const [key, value] = arg.split('=');
  
  switch (key) {
    case '--source':
      CONFIG.sourcePath = path.resolve(value);
      CONFIG.modelsPath = path.resolve(value, 'processed/medium');
      CONFIG.metadataPath = path.resolve(value, 'metadata');
      break;
    case '--models':
      CONFIG.modelsPath = path.resolve(value);
      break;
    case '--nextjs':
      CONFIG.nextjsPath = path.resolve(value);
      CONFIG.outputPath = path.resolve(value, 'public/models');
      break;
    case '--output':
      CONFIG.outputPath = path.resolve(value);
      break;
    case '--lod':
      CONFIG.modelsPath = path.resolve(CONFIG.sourcePath, `processed/${value}`);
      break;
    case '--all-lods':
      CONFIG.copyAllLods = true;
      break;
  }
});

// Main function
async function prepareModels() {
  console.log('Preparing 3D models for NextJS...');
  console.log(`Source: ${CONFIG.sourcePath}`);
  console.log(`Destination: ${CONFIG.outputPath}`);
  
  try {
    // Ensure output directory exists
    await fs.ensureDir(CONFIG.outputPath);
    
    // Read the catalog file if it exists
    let catalog = { models: [] };
    const catalogPath = path.resolve(CONFIG.sourcePath, 'processed/catalog.json');
    
    if (await fs.pathExists(catalogPath)) {
      catalog = await fs.readJson(catalogPath);
    } else {
      // If no catalog exists, generate one from metadata files
      console.log('No catalog found, generating from metadata files...');
      const metadataFiles = await fs.readdir(CONFIG.metadataPath);
      
      for (const file of metadataFiles) {
        if (file.endsWith('.json')) {
          const metadata = await fs.readJson(path.resolve(CONFIG.metadataPath, file));
          catalog.models.push(metadata);
        }
      }
    }
    
    // Process each model
    console.log(`Found ${catalog.models.length} models to process`);
    
    for (const model of catalog.models) {
      const modelId = model.id;
      console.log(`Processing model: ${modelId}`);
      
      // Determine which LODs to copy
      const lods = CONFIG.copyAllLods ? ['low', 'medium', 'high'] : ['medium'];
      
      for (const lod of lods) {
        const sourceFile = path.resolve(CONFIG.sourcePath, `processed/${lod}/${modelId}.glb`);
        
        // Skip if source file doesn't exist
        if (!(await fs.pathExists(sourceFile))) {
          console.log(`  ⚠️ Model file not found: ${sourceFile}`);
          continue;
        }
        
        // Create output directory structure
        const outputDir = CONFIG.copyAllLods 
          ? path.resolve(CONFIG.outputPath, modelId, lod)
          : path.resolve(CONFIG.outputPath, modelId);
        
        await fs.ensureDir(outputDir);
        
        // Copy the model file
        const outputFile = path.resolve(outputDir, `${modelId}.glb`);
        await fs.copy(sourceFile, outputFile);
        
        console.log(`  ✅ Copied ${lod} model: ${outputFile}`);
        
        // Update the file path in the metadata
        if (CONFIG.copyAllLods) {
          model.modelFiles = model.modelFiles || {};
          model.modelFiles[lod] = `${modelId}/${lod}/${modelId}.glb`;
        } else {
          model.modelFile = `${modelId}/${modelId}.glb`;
        }
      }
      
      // Create a model-specific metadata file
      const modelMetadataPath = path.resolve(CONFIG.outputPath, modelId, 'metadata.json');
      await fs.writeJson(modelMetadataPath, model, { spaces: 2 });
      console.log(`  ✅ Created metadata: ${modelMetadataPath}`);
    }
    
    // Write the catalog file
    const outputCatalogPath = path.resolve(CONFIG.outputPath, 'catalog.json');
    await fs.writeJson(outputCatalogPath, catalog, { spaces: 2 });
    console.log(`✅ Created catalog: ${outputCatalogPath}`);
    
    // Create an index.js file for easy importing in NextJS
    const indexContent = `
/**
 * Auto-generated index file for 3D models
 * Generated on: ${new Date().toISOString()}
 */

export const modelCatalog = ${JSON.stringify(catalog, null, 2)};

export const getModelById = (id) => {
  return modelCatalog.models.find(model => model.id === id) || null;
};

export const getModelPath = (id, lod = 'medium') => {
  const model = getModelById(id);
  if (!model) return null;
  
  if (model.modelFiles && model.modelFiles[lod]) {
    return model.modelFiles[lod];
  }
  
  return model.modelFile || \`\${id}/\${id}.glb\`;
};

export default modelCatalog;
`.trim();

    const indexPath = path.resolve(CONFIG.outputPath, 'index.js');
    await fs.writeFile(indexPath, indexContent);
    console.log(`✅ Created index.js: ${indexPath}`);
    
    console.log('\n🎉 All models prepared successfully!');
    console.log(`\nTo use these models in your NextJS app, you can import them like this:`);
    console.log(`
  import { getModelById, getModelPath } from '@/public/models';
  
  // Get a model's metadata
  const model = getModelById('${catalog.models[0]?.id || 'model-id'}');
  
  // Get the path to a model file
  const modelPath = getModelPath('${catalog.models[0]?.id || 'model-id'}');
  
  // Use in your component
  const MyComponent = () => {
    return (
      <ExtrusionViewer modelPath={modelPath} length={12} />
    );
  };
    `);
    
  } catch (error) {
    console.error('Error preparing models:', error);
    process.exit(1);
  }
}

// Run the main function
prepareModels();