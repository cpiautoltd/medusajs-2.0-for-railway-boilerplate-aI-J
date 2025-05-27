// src/lib/model-catalog.ts
export type ModelMetadata = {
  id: string;
  name: string;
  dimensions: {
    width: number;
    height: number;
    baseLength: number;
  };
  boundingBox: {
    min: number[];
    max: number[];
  };
  center: number[];
  extrusionAxis: string;
  material: string;
  modelFile: string;
  lod: string;
  fileSize: number;
};

export type ModelCatalog = {
  models: ModelMetadata[];
};

export async function getModelCatalog(): Promise<ModelCatalog> {
  try {
    const response = await fetch('/api/models/catalog');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch model catalog: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching model catalog:', error);
    return { models: [] };
  }
}

export async function getModelById(id: string): Promise<ModelMetadata | null> {
  try {
    const catalog = await getModelCatalog();
    return catalog.models.find(model => model.id === id) || null;
  } catch (error) {
    console.error(`Error fetching model with ID ${id}:`, error);
    return null;
  }
}