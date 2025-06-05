// src/lib/util/bom-parser.ts

export interface BOMItem {
  sortOrder: string;
  manufacturerId: string;
  customerId: string;
  headingId: string;
  partNumber: string;
  tag: string;
  partType: string; // No longer restricted to specific types
  description: string;
  length?: string;
  weight: string;
  units: string;
  unitPrice: string;
  blockName: string;
  quantity: string;
  drawingFileName: string;
  extendedPrice: string;
  // Additional fields that might exist
  panelDimension?: string;
  panelNotches?: string;
  panelMachining?: string;
  [key: string]: any; // Allow for unknown fields
}

export interface OrderInfo {
  orderInfoId: string;
  kits: string;
  requiredDeliveryDate: string;
  distributorPONumber: string;
  customerPONumber: string;
  customerRefNumber: string;
  notes: string;
  designRefCode: string;
}

export interface BillingInfo {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  fax?: string;
  email?: string;
}

export interface ShippingInfo extends BillingInfo {
  shippingMethod: string;
  shippingWeight: string;
  shippingBoxes?: string;
  shippingAmount: string;
}

export interface ParsedBOM {
  orderInfo: OrderInfo;
  billingInfo?: BillingInfo;
  shippingInfo?: ShippingInfo;
  items: BOMItem[];
  totalPrice: number;
  totalWeight: number;
}

// Analysis structures
export interface PartTypeGroup {
  partType: string;
  items: BOMItem[];
  totalQuantity: number;
  totalPrice: number;
  totalWeight: number;
}

export interface ProfileMachiningRelation {
  profile: BOMItem;
  machiningServices: BOMItem[];
  relatedTags: string[];
}

export interface BOMAnalysis {
  partTypeGroups: Map<string, PartTypeGroup>;
  profileMachiningRelations: ProfileMachiningRelation[];
  tagRelationships: Map<string, string[]>;
  uniquePartNumbers: Set<string>;
  unitTypes: Set<string>;
  priceRange: { min: number; max: number };
  missingTags: BOMItem[];
}

// Type definition for parsed XML structure
interface ParsedXMLResult {
  aqxbom?: {
    arrayoforderinfo?: {
      orderinfo?: any;
      billinginfo?: any;
      shippinginfo?: any;
    };
    arrayofbomtemplate?: {
      bomtemplate?: any | any[];
    };
  };
}

export async function parseBOMXml(xmlContent: string): Promise<ParsedBOM> {
  try {
    // Dynamic import to avoid issues with server-side rendering
    const { parseString } = await import('xml2js');
    
    const result = await new Promise<ParsedXMLResult>((resolve, reject) => {
      parseString(xmlContent, {
        explicitArray: false,
        ignoreAttrs: true,
        normalizeTags: true,
        tagNameProcessors: [(name: string) => name.toLowerCase()]
      }, (err: any, result: any) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    // Extract order info
    const orderInfoData = result.aqxbom?.arrayoforderinfo?.orderinfo || {};
    const orderInfo: OrderInfo = {
      orderInfoId: orderInfoData.orderinfoid || '',
      kits: orderInfoData.kits || '1',
      requiredDeliveryDate: orderInfoData.requireddeliverydate || '',
      distributorPONumber: orderInfoData.distributorponumber || '',
      customerPONumber: orderInfoData.customerponumber || '',
      customerRefNumber: orderInfoData.customerrefnumber || '',
      notes: orderInfoData.notes || '',
      designRefCode: orderInfoData.designrefcode || '',
    };

    // Extract billing info if present
    const billingData = result.aqxbom?.arrayoforderinfo?.billinginfo;
    const billingInfo: BillingInfo | undefined = billingData ? {
      name: billingData.name || '',
      address1: billingData.address1 || '',
      address2: billingData.address2 || '',
      city: billingData.city || '',
      state: billingData.state || '',
      zip: billingData.zip || '',
      phone: billingData.phone || '',
      fax: billingData.fax || '',
      email: billingData.email || '',
    } : undefined;

    // Extract shipping info if present
    const shippingData = result.aqxbom?.arrayoforderinfo?.shippinginfo;
    const shippingInfo: ShippingInfo | undefined = shippingData ? {
      shippingMethod: shippingData.shippingmethod || '',
      shippingWeight: shippingData.shippingweight || '0',
      shippingBoxes: shippingData.shippingboxes || '',
      shippingAmount: shippingData.shippingamount || '0',
      name: shippingData.name || '',
      address1: shippingData.address1 || '',
      address2: shippingData.address2 || '',
      city: shippingData.city || '',
      state: shippingData.state || '',
      zip: shippingData.zip || '',
      phone: shippingData.phone || '',
      fax: shippingData.fax || '',
      email: shippingData.email || '',
    } : undefined;

    // Extract BOM items
    const bomTemplates = result.aqxbom?.arrayofbomtemplate?.bomtemplate || [];
    const items: BOMItem[] = [];
    
    // Ensure bomTemplates is an array
    const templates = Array.isArray(bomTemplates) ? bomTemplates : [bomTemplates];
    
    for (const template of templates) {
      const item: BOMItem = {
        sortOrder: template.sortorder || '',
        manufacturerId: template.manufacturerid || '',
        customerId: template.customerid || '',
        headingId: template.headingid || '',
        partNumber: template.partnumber || '',
        tag: template.tag || '',
        partType: template.parttype || 'UNKNOWN',
        description: template.description || '',
        length: template.length || undefined,
        weight: template.weight || '0',
        units: template.units || 'EA',
        unitPrice: template.unitprice || '0',
        blockName: template.blockname || '',
        quantity: template.quantity || '1',
        drawingFileName: template.drawingfilename || '',
        extendedPrice: template.extendedprice || '0',
        panelDimension: template.paneldimension || undefined,
        panelNotches: template.panelnotches || undefined,
        panelMachining: template.panelmachining || undefined,
      };

      // Capture any additional fields
      Object.keys(template).forEach(key => {
        if (!(key in item)) {
          item[key] = template[key];
        }
      });

      items.push(item);
    }

    // Calculate totals
    const totalPrice = items.reduce((sum, item) => 
      sum + parseFloat(item.extendedPrice || '0'), 0
    );
    const totalWeight = items.reduce((sum, item) => 
      sum + (parseFloat(item.weight || '0') * parseFloat(item.quantity || '1')), 0
    );

    return {
      orderInfo,
      billingInfo,
      shippingInfo,
      items,
      totalPrice,
      totalWeight,
    };
  } catch (error) {
    console.error('Error parsing BOM XML:', error);
    throw new Error('Failed to parse BOM XML file');
  }
}

// Analyze BOM to understand relationships and groupings
export function analyzeBOM(items: BOMItem[]): BOMAnalysis {
  const partTypeGroups = new Map<string, PartTypeGroup>();
  const tagRelationships = new Map<string, string[]>();
  const uniquePartNumbers = new Set<string>();
  const unitTypes = new Set<string>();
  const missingTags: BOMItem[] = [];
  let minPrice = Infinity;
  let maxPrice = -Infinity;

  // Group by part type
  items.forEach(item => {
    const partType = item.partType || 'UNKNOWN';
    uniquePartNumbers.add(item.partNumber);
    unitTypes.add(item.units);

    const price = parseFloat(item.unitPrice || '0');
    minPrice = Math.min(minPrice, price);
    maxPrice = Math.max(maxPrice, price);

    if (!item.tag) {
      missingTags.push(item);
    }

    if (!partTypeGroups.has(partType)) {
      partTypeGroups.set(partType, {
        partType,
        items: [],
        totalQuantity: 0,
        totalPrice: 0,
        totalWeight: 0,
      });
    }

    const group = partTypeGroups.get(partType)!;
    group.items.push(item);
    group.totalQuantity += parseInt(item.quantity || '0');
    group.totalPrice += parseFloat(item.extendedPrice || '0');
    group.totalWeight += parseFloat(item.weight || '0') * parseInt(item.quantity || '0');
  });

  // Analyze tag relationships in descriptions
  items.forEach(item => {
    if (!item.tag) return;

    // Look for references to other tags in descriptions
    const referencedTags: string[] = [];
    items.forEach(otherItem => {
      if (otherItem.tag && otherItem.tag !== item.tag) {
        // Check if this item's tag is mentioned in the description
        if (item.description.includes(otherItem.tag) || 
            item.description.includes(`in ${otherItem.tag}`) ||
            item.description.includes(`on ${otherItem.tag}`)) {
          referencedTags.push(otherItem.tag);
        }
      }
    });

    if (referencedTags.length > 0) {
      tagRelationships.set(item.tag, referencedTags);
    }
  });

  // Find profile-machining relationships
  const profileMachiningRelations = findProfileMachiningRelations(items);

  return {
    partTypeGroups,
    profileMachiningRelations,
    tagRelationships,
    uniquePartNumbers,
    unitTypes,
    priceRange: { min: minPrice, max: maxPrice },
    missingTags,
  };
}

// Find relationships between profiles and machining services
function findProfileMachiningRelations(items: BOMItem[]): ProfileMachiningRelation[] {
  const relations: ProfileMachiningRelation[] = [];
  
  // Get all profile items (typically RECTEXT but we're being flexible)
  const profiles = items.filter(item => 
    item.partType === 'RECTEXT' || 
    item.description.toLowerCase().includes('extrusion') ||
    item.description.toLowerCase().includes('profile')
  );

  // Get all machining items
  const machiningItems = items.filter(item => 
    item.partType === 'MACHINING'
  );

  profiles.forEach(profile => {
    const relatedMachining: BOMItem[] = [];
    const relatedTags: string[] = [];

    machiningItems.forEach(machining => {
      // Check if machining references this profile's tag
      if (profile.tag && (
        machining.description.includes(`in ${profile.tag}`) ||
        machining.description.includes(`on ${profile.tag}`) ||
        machining.description.includes(profile.tag)
      )) {
        relatedMachining.push(machining);
        relatedTags.push(profile.tag);
      }

      // Also check for part number references
      if (machining.description.includes(profile.partNumber)) {
        relatedMachining.push(machining);
      }
    });

    if (relatedMachining.length > 0) {
      relations.push({
        profile,
        machiningServices: relatedMachining,
        relatedTags,
      });
    }
  });

  return relations;
}

// Extract unique machining service types
export function extractMachiningTypes(items: BOMItem[]): Map<string, { count: number; items: BOMItem[] }> {
  const machiningTypes = new Map<string, { count: number; items: BOMItem[] }>();
  
  items
    .filter(item => item.partType === 'MACHINING')
    .forEach(item => {
      const description = item.description.toLowerCase();
      let type = 'Other';

      // Categorize based on keywords
      if (description.includes('cut to length') || description.includes('cut')) {
        type = 'Cutting';
      } else if (description.includes('counterbore')) {
        type = 'Counterbore';
      } else if (description.includes('tap')) {
        type = 'Tapping';
      } else if (description.includes('drill')) {
        type = 'Drilling';
      } else if (description.includes('notch')) {
        type = 'Notching';
      }

      if (!machiningTypes.has(type)) {
        machiningTypes.set(type, { count: 0, items: [] });
      }

      const typeData = machiningTypes.get(type)!;
      typeData.count++;
      typeData.items.push(item);
    });

  return machiningTypes;
}

// Group items by various criteria for analysis
export function groupBOMItems(items: BOMItem[], groupBy: 'partNumber' | 'partType' | 'units' | 'tag'): Map<string, BOMItem[]> {
  const groups = new Map<string, BOMItem[]>();
  
  items.forEach(item => {
    const key = item[groupBy] || 'UNKNOWN';
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  });
  
  return groups;
}

// Generate a summary report of the BOM
export function generateBOMSummary(parsedBOM: ParsedBOM, analysis: BOMAnalysis): string {
  const lines: string[] = [];
  
  lines.push('=== BOM SUMMARY ===');
  lines.push(`Order ID: ${parsedBOM.orderInfo.orderInfoId}`);
  lines.push(`Design Reference: ${parsedBOM.orderInfo.designRefCode}`);
  lines.push(`Total Items: ${parsedBOM.items.length}`);
  lines.push(`Total Price: ${parsedBOM.totalPrice.toFixed(2)}`);
  lines.push(`Total Weight: ${parsedBOM.totalWeight.toFixed(2)} lbs`);
  lines.push('');
  
  lines.push('=== PART TYPE BREAKDOWN ===');
  analysis.partTypeGroups.forEach((group, partType) => {
    lines.push(`${partType}: ${group.items.length} items, ${group.totalQuantity} total qty, ${group.totalPrice.toFixed(2)}`);
  });
  lines.push('');
  
  lines.push('=== PROFILE-MACHINING RELATIONSHIPS ===');
  analysis.profileMachiningRelations.forEach(relation => {
    lines.push(`Profile ${relation.profile.tag} (${relation.profile.partNumber}):`);
    relation.machiningServices.forEach(machining => {
      lines.push(`  - ${machining.description} (Qty: ${machining.quantity})`);
    });
  });
  lines.push('');
  
  lines.push('=== TAG RELATIONSHIPS ===');
  analysis.tagRelationships.forEach((relatedTags, tag) => {
    lines.push(`Tag ${tag} references: ${relatedTags.join(', ')}`);
  });
  
  return lines.join('\n');
}

// Types for search and bifurcation
export interface SearchableProfile {
  bomItem: BOMItem;
  cuttingServices: BOMItem[];
  tappingServices: BOMItem[];
  otherMachining: BOMItem[];
  hasCutService: boolean;
  needsCutService: boolean; // true if length < 90 IN
}

export interface SearchableFixedPart {
  bomItem: BOMItem;
  searchStatus: 'pending' | 'found' | 'not_found';
  searchQuery?: string;
}

export interface BifurcatedItems {
  profiles: SearchableProfile[];
  fixedParts: SearchableFixedPart[];
  unsupportedItems: BOMItem[];
  machiningOnlyItems: BOMItem[]; // Machining without associated profiles
}

// Bifurcate items for searching
export function bifurcateItemsForSearch(items: BOMItem[]): BifurcatedItems {
  const profiles: SearchableProfile[] = [];
  const fixedParts: SearchableFixedPart[] = [];
  const unsupportedItems: BOMItem[] = [];
  const machiningOnlyItems: BOMItem[] = [];

  // First, identify all profiles
  const profileItems = items.filter(item => 
    item.partType === 'RECTEXT' || 
    item.description.toLowerCase().includes('extrusion') ||
    item.description.toLowerCase().includes('profile')
  );

  // Get all machining items
  const allMachiningItems = items.filter(item => item.partType === 'MACHINING');
  
  // Group cutting services by type (part number they apply to)
  const cuttingServicesByType = new Map<string, { items: BOMItem[], totalQty: number, usedQty: number }>();
  
  allMachiningItems.forEach(machining => {
    const desc = machining.description.toLowerCase();
    if (desc.includes('cut to length') || (desc.includes('cut') && desc.includes('slot'))) {
      // Extract the profile type from description (e.g., "1.5" x 1.5"" -> "1515")
      let profileType = 'generic';
      
      // Try to match common patterns
      if (desc.includes('1.5" x 1.5"') || desc.includes('1.5 x 1.5')) {
        profileType = '1515';
      } else if (desc.includes('3" x 3"') || desc.includes('3 x 3')) {
        profileType = '3030';
      } else if (desc.includes('2" x 2"') || desc.includes('2 x 2')) {
        profileType = '2020';
      } else if (desc.includes('1" x 1"') || desc.includes('1 x 1')) {
        profileType = '1010';
      }
      
      if (!cuttingServicesByType.has(profileType)) {
        cuttingServicesByType.set(profileType, { items: [], totalQty: 0, usedQty: 0 });
      }
      
      const serviceGroup = cuttingServicesByType.get(profileType)!;
      serviceGroup.items.push(machining);
      serviceGroup.totalQty += parseInt(machining.quantity || '0');
    }
  });

  // Process each profile
  profileItems.forEach(profile => {
    const lengthInInches = profile.length ? parseFloat(profile.length) : 0;
    const needsCutService = lengthInInches > 0 && lengthInInches < 90; // Assuming 90 inches is full length
    const profileQty = parseInt(profile.quantity || '1');

    const searchableProfile: SearchableProfile = {
      bomItem: profile,
      cuttingServices: [],
      tappingServices: [],
      otherMachining: [],
      hasCutService: false,
      needsCutService
    };

    // Find profile type for matching cutting services
    let profileType = 'generic';
    const partNum = profile.partNumber.toUpperCase();
    if (partNum.includes('1515')) profileType = '1515';
    else if (partNum.includes('3030')) profileType = '3030';
    else if (partNum.includes('2020')) profileType = '2020';
    else if (partNum.includes('1010')) profileType = '1010';

    // Assign cutting services based on quantity needed
    if (needsCutService && cuttingServicesByType.has(profileType)) {
      const serviceGroup = cuttingServicesByType.get(profileType)!;
      if (serviceGroup.usedQty + profileQty <= serviceGroup.totalQty) {
        searchableProfile.hasCutService = true;
        serviceGroup.usedQty += profileQty;
        // Create a virtual cutting service item for this profile
        searchableProfile.cuttingServices.push({
          ...serviceGroup.items[0],
          quantity: profileQty.toString(),
          extendedPrice: (parseFloat(serviceGroup.items[0].unitPrice || '0') * profileQty).toFixed(2)
        });
      }
    }

    // Find other machining services specific to this profile's tag
    allMachiningItems.forEach(machining => {
      const desc = machining.description.toLowerCase();
      
      // Skip cutting services as they're handled above
      if (desc.includes('cut to length') || (desc.includes('cut') && desc.includes('slot'))) {
        return;
      }
      
      // Check if this machining references the profile's tag
      if (profile.tag && (
        machining.description.includes(` in ${profile.tag} `) ||
        machining.description.includes(` in ${profile.tag}`) ||
        machining.description.includes(`on ${profile.tag}`)
      )) {
        if (desc.includes('tap')) {
          searchableProfile.tappingServices.push(machining);
        } else {
          searchableProfile.otherMachining.push(machining);
        }
      }
    });

    profiles.push(searchableProfile);
  });

  // Process fixed parts (EA units)
  items.forEach(item => {
    if (item.partType === 'FIXED_PARTS' && item.units === 'EA') {
      fixedParts.push({
        bomItem: item,
        searchStatus: 'pending',
        searchQuery: item.partNumber
      });
    }
  });

  // Find unsupported items and truly unassociated machining
  items.forEach(item => {
    if (item.partType === 'PANELS' || item.partType === 'PANEL_GASKET') {
      unsupportedItems.push(item);
    }
  });

  // Find machining that wasn't assigned to any profile
  allMachiningItems.forEach(machining => {
    let isAssigned = false;
    
    // Check cutting services assignment
    cuttingServicesByType.forEach(serviceGroup => {
      if (serviceGroup.items.includes(machining) && serviceGroup.usedQty > 0) {
        isAssigned = true;
      }
    });
    
    // Check profile-specific machining
    profiles.forEach(profile => {
      if (profile.tappingServices.includes(machining) || 
          profile.otherMachining.includes(machining)) {
        isAssigned = true;
      }
    });
    
    if (!isAssigned && !machining.description.toLowerCase().includes('panel')) {
      machiningOnlyItems.push(machining);
    }
  });

  return {
    profiles,
    fixedParts,
    unsupportedItems,
    machiningOnlyItems
  };
}

// Validate profile-cutting relationships
export function validateProfileCutting(profiles: SearchableProfile[]): { 
  valid: SearchableProfile[]; 
  missingCuts: SearchableProfile[]; 
  extraCuts: SearchableProfile[];
  summary: { totalProfiles: number; totalCuttingServices: number; profilesNeedingCuts: number; }
} {
  const valid: SearchableProfile[] = [];
  const missingCuts: SearchableProfile[] = [];
  const extraCuts: SearchableProfile[] = [];
  
  let totalProfiles = 0;
  let profilesNeedingCuts = 0;
  let totalCuttingServices = 0;

  profiles.forEach(profile => {
    const qty = parseInt(profile.bomItem.quantity || '1');
    totalProfiles += qty;
    
    if (profile.needsCutService) {
      profilesNeedingCuts += qty;
      if (!profile.hasCutService) {
        missingCuts.push(profile);
      } else {
        valid.push(profile);
        profile.cuttingServices.forEach(cs => {
          totalCuttingServices += parseInt(cs.quantity || '0');
        });
      }
    } else if (profile.hasCutService) {
      extraCuts.push(profile);
      profile.cuttingServices.forEach(cs => {
        totalCuttingServices += parseInt(cs.quantity || '0');
      });
    } else {
      valid.push(profile);
    }
  });

  return { 
    valid, 
    missingCuts, 
    extraCuts,
    summary: {
      totalProfiles,
      totalCuttingServices,
      profilesNeedingCuts
    }
  };
}

// // src/lib/util/bom-parser.ts

// export interface BOMItem {
//   sortOrder: string;
//   manufacturerId: string;
//   customerId: string;
//   headingId: string;
//   partNumber: string;
//   tag: string;
//   partType: string; // No longer restricted to specific types
//   description: string;
//   length?: string;
//   weight: string;
//   units: string;
//   unitPrice: string;
//   blockName: string;
//   quantity: string;
//   drawingFileName: string;
//   extendedPrice: string;
//   // Additional fields that might exist
//   panelDimension?: string;
//   panelNotches?: string;
//   panelMachining?: string;
//   [key: string]: any; // Allow for unknown fields
// }

// export interface OrderInfo {
//   orderInfoId: string;
//   kits: string;
//   requiredDeliveryDate: string;
//   distributorPONumber: string;
//   customerPONumber: string;
//   customerRefNumber: string;
//   notes: string;
//   designRefCode: string;
// }

// export interface BillingInfo {
//   name: string;
//   address1: string;
//   address2?: string;
//   city: string;
//   state: string;
//   zip: string;
//   phone: string;
//   fax?: string;
//   email?: string;
// }

// export interface ShippingInfo extends BillingInfo {
//   shippingMethod: string;
//   shippingWeight: string;
//   shippingBoxes?: string;
//   shippingAmount: string;
// }

// export interface ParsedBOM {
//   orderInfo: OrderInfo;
//   billingInfo?: BillingInfo;
//   shippingInfo?: ShippingInfo;
//   items: BOMItem[];
//   totalPrice: number;
//   totalWeight: number;
// }

// // Analysis structures
// export interface PartTypeGroup {
//   partType: string;
//   items: BOMItem[];
//   totalQuantity: number;
//   totalPrice: number;
//   totalWeight: number;
// }

// export interface ProfileMachiningRelation {
//   profile: BOMItem;
//   machiningServices: BOMItem[];
//   relatedTags: string[];
// }

// export interface BOMAnalysis {
//   partTypeGroups: Map<string, PartTypeGroup>;
//   profileMachiningRelations: ProfileMachiningRelation[];
//   tagRelationships: Map<string, string[]>;
//   uniquePartNumbers: Set<string>;
//   unitTypes: Set<string>;
//   priceRange: { min: number; max: number };
//   missingTags: BOMItem[];
// }

// // Type definition for parsed XML structure
// interface ParsedXMLResult {
//   aqxbom?: {
//     arrayoforderinfo?: {
//       orderinfo?: any;
//       billinginfo?: any;
//       shippinginfo?: any;
//     };
//     arrayofbomtemplate?: {
//       bomtemplate?: any | any[];
//     };
//   };
// }

// export async function parseBOMXml(xmlContent: string): Promise<ParsedBOM> {
//   try {
//     // Dynamic import to avoid issues with server-side rendering
//     const { parseString } = await import('xml2js');
    
//     const result = await new Promise<ParsedXMLResult>((resolve, reject) => {
//       parseString(xmlContent, {
//         explicitArray: false,
//         ignoreAttrs: true,
//         normalizeTags: true,
//         tagNameProcessors: [(name: string) => name.toLowerCase()]
//       }, (err: any, result: any) => {
//         if (err) reject(err);
//         else resolve(result);
//       });
//     });

//     // Extract order info
//     const orderInfoData = result.aqxbom?.arrayoforderinfo?.orderinfo || {};
//     const orderInfo: OrderInfo = {
//       orderInfoId: orderInfoData.orderinfoid || '',
//       kits: orderInfoData.kits || '1',
//       requiredDeliveryDate: orderInfoData.requireddeliverydate || '',
//       distributorPONumber: orderInfoData.distributorponumber || '',
//       customerPONumber: orderInfoData.customerponumber || '',
//       customerRefNumber: orderInfoData.customerrefnumber || '',
//       notes: orderInfoData.notes || '',
//       designRefCode: orderInfoData.designrefcode || '',
//     };

//     // Extract billing info if present
//     const billingData = result.aqxbom?.arrayoforderinfo?.billinginfo;
//     const billingInfo: BillingInfo | undefined = billingData ? {
//       name: billingData.name || '',
//       address1: billingData.address1 || '',
//       address2: billingData.address2 || '',
//       city: billingData.city || '',
//       state: billingData.state || '',
//       zip: billingData.zip || '',
//       phone: billingData.phone || '',
//       fax: billingData.fax || '',
//       email: billingData.email || '',
//     } : undefined;

//     // Extract shipping info if present
//     const shippingData = result.aqxbom?.arrayoforderinfo?.shippinginfo;
//     const shippingInfo: ShippingInfo | undefined = shippingData ? {
//       shippingMethod: shippingData.shippingmethod || '',
//       shippingWeight: shippingData.shippingweight || '0',
//       shippingBoxes: shippingData.shippingboxes || '',
//       shippingAmount: shippingData.shippingamount || '0',
//       name: shippingData.name || '',
//       address1: shippingData.address1 || '',
//       address2: shippingData.address2 || '',
//       city: shippingData.city || '',
//       state: shippingData.state || '',
//       zip: shippingData.zip || '',
//       phone: shippingData.phone || '',
//       fax: shippingData.fax || '',
//       email: shippingData.email || '',
//     } : undefined;

//     // Extract BOM items
//     const bomTemplates = result.aqxbom?.arrayofbomtemplate?.bomtemplate || [];
//     const items: BOMItem[] = [];
    
//     // Ensure bomTemplates is an array
//     const templates = Array.isArray(bomTemplates) ? bomTemplates : [bomTemplates];
    
//     for (const template of templates) {
//       const item: BOMItem = {
//         sortOrder: template.sortorder || '',
//         manufacturerId: template.manufacturerid || '',
//         customerId: template.customerid || '',
//         headingId: template.headingid || '',
//         partNumber: template.partnumber || '',
//         tag: template.tag || '',
//         partType: template.parttype || 'UNKNOWN',
//         description: template.description || '',
//         length: template.length || undefined,
//         weight: template.weight || '0',
//         units: template.units || 'EA',
//         unitPrice: template.unitprice || '0',
//         blockName: template.blockname || '',
//         quantity: template.quantity || '1',
//         drawingFileName: template.drawingfilename || '',
//         extendedPrice: template.extendedprice || '0',
//         panelDimension: template.paneldimension || undefined,
//         panelNotches: template.panelnotches || undefined,
//         panelMachining: template.panelmachining || undefined,
//       };

//       // Capture any additional fields
//       Object.keys(template).forEach(key => {
//         if (!(key in item)) {
//           item[key] = template[key];
//         }
//       });

//       items.push(item);
//     }

//     // Calculate totals
//     const totalPrice = items.reduce((sum, item) => 
//       sum + parseFloat(item.extendedPrice || '0'), 0
//     );
//     const totalWeight = items.reduce((sum, item) => 
//       sum + (parseFloat(item.weight || '0') * parseFloat(item.quantity || '1')), 0
//     );

//     return {
//       orderInfo,
//       billingInfo,
//       shippingInfo,
//       items,
//       totalPrice,
//       totalWeight,
//     };
//   } catch (error) {
//     console.error('Error parsing BOM XML:', error);
//     throw new Error('Failed to parse BOM XML file');
//   }
// }

// // Analyze BOM to understand relationships and groupings
// export function analyzeBOM(items: BOMItem[]): BOMAnalysis {
//   const partTypeGroups = new Map<string, PartTypeGroup>();
//   const tagRelationships = new Map<string, string[]>();
//   const uniquePartNumbers = new Set<string>();
//   const unitTypes = new Set<string>();
//   const missingTags: BOMItem[] = [];
//   let minPrice = Infinity;
//   let maxPrice = -Infinity;

//   // Group by part type
//   items.forEach(item => {
//     const partType = item.partType || 'UNKNOWN';
//     uniquePartNumbers.add(item.partNumber);
//     unitTypes.add(item.units);

//     const price = parseFloat(item.unitPrice || '0');
//     minPrice = Math.min(minPrice, price);
//     maxPrice = Math.max(maxPrice, price);

//     if (!item.tag) {
//       missingTags.push(item);
//     }

//     if (!partTypeGroups.has(partType)) {
//       partTypeGroups.set(partType, {
//         partType,
//         items: [],
//         totalQuantity: 0,
//         totalPrice: 0,
//         totalWeight: 0,
//       });
//     }

//     const group = partTypeGroups.get(partType)!;
//     group.items.push(item);
//     group.totalQuantity += parseInt(item.quantity || '0');
//     group.totalPrice += parseFloat(item.extendedPrice || '0');
//     group.totalWeight += parseFloat(item.weight || '0') * parseInt(item.quantity || '0');
//   });

//   // Analyze tag relationships in descriptions
//   items.forEach(item => {
//     if (!item.tag) return;

//     // Look for references to other tags in descriptions
//     const referencedTags: string[] = [];
//     items.forEach(otherItem => {
//       if (otherItem.tag && otherItem.tag !== item.tag) {
//         // Check if this item's tag is mentioned in the description
//         if (item.description.includes(otherItem.tag) || 
//             item.description.includes(`in ${otherItem.tag}`) ||
//             item.description.includes(`on ${otherItem.tag}`)) {
//           referencedTags.push(otherItem.tag);
//         }
//       }
//     });

//     if (referencedTags.length > 0) {
//       tagRelationships.set(item.tag, referencedTags);
//     }
//   });

//   // Find profile-machining relationships
//   const profileMachiningRelations = findProfileMachiningRelations(items);

//   return {
//     partTypeGroups,
//     profileMachiningRelations,
//     tagRelationships,
//     uniquePartNumbers,
//     unitTypes,
//     priceRange: { min: minPrice, max: maxPrice },
//     missingTags,
//   };
// }

// // Find relationships between profiles and machining services
// function findProfileMachiningRelations(items: BOMItem[]): ProfileMachiningRelation[] {
//   const relations: ProfileMachiningRelation[] = [];
  
//   // Get all profile items (typically RECTEXT but we're being flexible)
//   const profiles = items.filter(item => 
//     item.partType === 'RECTEXT' || 
//     item.description.toLowerCase().includes('extrusion') ||
//     item.description.toLowerCase().includes('profile')
//   );

//   // Get all machining items
//   const machiningItems = items.filter(item => 
//     item.partType === 'MACHINING'
//   );

//   profiles.forEach(profile => {
//     const relatedMachining: BOMItem[] = [];
//     const relatedTags: string[] = [];

//     machiningItems.forEach(machining => {
//       // Check if machining references this profile's tag
//       if (profile.tag && (
//         machining.description.includes(`in ${profile.tag}`) ||
//         machining.description.includes(`on ${profile.tag}`) ||
//         machining.description.includes(profile.tag)
//       )) {
//         relatedMachining.push(machining);
//         relatedTags.push(profile.tag);
//       }

//       // Also check for part number references
//       if (machining.description.includes(profile.partNumber)) {
//         relatedMachining.push(machining);
//       }
//     });

//     if (relatedMachining.length > 0) {
//       relations.push({
//         profile,
//         machiningServices: relatedMachining,
//         relatedTags,
//       });
//     }
//   });

//   return relations;
// }

// // Extract unique machining service types
// export function extractMachiningTypes(items: BOMItem[]): Map<string, { count: number; items: BOMItem[] }> {
//   const machiningTypes = new Map<string, { count: number; items: BOMItem[] }>();
  
//   items
//     .filter(item => item.partType === 'MACHINING')
//     .forEach(item => {
//       const description = item.description.toLowerCase();
//       let type = 'Other';

//       // Categorize based on keywords
//       if (description.includes('cut to length') || description.includes('cut')) {
//         type = 'Cutting';
//       } else if (description.includes('counterbore')) {
//         type = 'Counterbore';
//       } else if (description.includes('tap')) {
//         type = 'Tapping';
//       } else if (description.includes('drill')) {
//         type = 'Drilling';
//       } else if (description.includes('notch')) {
//         type = 'Notching';
//       }

//       if (!machiningTypes.has(type)) {
//         machiningTypes.set(type, { count: 0, items: [] });
//       }

//       const typeData = machiningTypes.get(type)!;
//       typeData.count++;
//       typeData.items.push(item);
//     });

//   return machiningTypes;
// }

// // Group items by various criteria for analysis
// export function groupBOMItems(items: BOMItem[], groupBy: 'partNumber' | 'partType' | 'units' | 'tag'): Map<string, BOMItem[]> {
//   const groups = new Map<string, BOMItem[]>();
  
//   items.forEach(item => {
//     const key = item[groupBy] || 'UNKNOWN';
//     if (!groups.has(key)) {
//       groups.set(key, []);
//     }
//     groups.get(key)!.push(item);
//   });
  
//   return groups;
// }

// // Generate a summary report of the BOM
// export function generateBOMSummary(parsedBOM: ParsedBOM, analysis: BOMAnalysis): string {
//   const lines: string[] = [];
  
//   lines.push('=== BOM SUMMARY ===');
//   lines.push(`Order ID: ${parsedBOM.orderInfo.orderInfoId}`);
//   lines.push(`Design Reference: ${parsedBOM.orderInfo.designRefCode}`);
//   lines.push(`Total Items: ${parsedBOM.items.length}`);
//   lines.push(`Total Price: $${parsedBOM.totalPrice.toFixed(2)}`);
//   lines.push(`Total Weight: ${parsedBOM.totalWeight.toFixed(2)} lbs`);
//   lines.push('');
  
//   lines.push('=== PART TYPE BREAKDOWN ===');
//   analysis.partTypeGroups.forEach((group, partType) => {
//     lines.push(`${partType}: ${group.items.length} items, ${group.totalQuantity} total qty, $${group.totalPrice.toFixed(2)}`);
//   });
//   lines.push('');
  
//   lines.push('=== PROFILE-MACHINING RELATIONSHIPS ===');
//   analysis.profileMachiningRelations.forEach(relation => {
//     lines.push(`Profile ${relation.profile.tag} (${relation.profile.partNumber}):`);
//     relation.machiningServices.forEach(machining => {
//       lines.push(`  - ${machining.description} (Qty: ${machining.quantity})`);
//     });
//   });
//   lines.push('');
  
//   lines.push('=== TAG RELATIONSHIPS ===');
//   analysis.tagRelationships.forEach((relatedTags, tag) => {
//     lines.push(`Tag ${tag} references: ${relatedTags.join(', ')}`);
//   });
  
//   return lines.join('\n');
// }