'use client'
import React, { useState, useCallback, useEffect } from 'react';
import { Button, Input, Heading, Text, Container, Badge, clx, Tabs } from '@medusajs/ui';
import { ArrowUpTray, XMarkMini, ChevronDown, ChevronRight } from '@medusajs/icons';
import { 
  parseBOMXml, 
  analyzeBOM,
  extractMachiningTypes,
  groupBOMItems,
  generateBOMSummary,
  bifurcateItemsForSearch,
  validateProfileCutting,
  type BOMItem,
  type ParsedBOM,
  type BOMAnalysis,
  type ProfileMachiningRelation,
  type BifurcatedItems,
  type SearchableProfile
} from '@lib/util/bom-parser';
import Spinner from '@modules/common/icons/spinner';

interface CollapsibleSectionProps {
  title: string;
  badge?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, badge, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        className="w-full px-4 py-3 bg-ui-bg-subtle hover:bg-ui-bg-subtle-hover flex items-center justify-between transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {isOpen ? <ChevronDown /> : <ChevronRight />}
          <Text className="font-medium">{title}</Text>
          {badge && <Badge size="small" color="blue">{badge}</Badge>}
        </div>
      </button>
      {isOpen && (
        <div className="p-4 border-t">
          {children}
        </div>
      )}
    </div>
  );
}

export default function BOMImportComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [parsedBOM, setParsedBOM] = useState<ParsedBOM | null>(null);
  const [analysis, setAnalysis] = useState<BOMAnalysis | null>(null);
  const [bifurcatedItems, setBifurcatedItems] = useState<BifurcatedItems | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
    console.log(message);
  }, []);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setLogs([]);
    addLog(`Starting to parse file: ${file.name}`);

    try {
      const xmlContent = await file.text();
      addLog(`File read successfully, size: ${xmlContent.length} characters`);
      
      const bomData = await parseBOMXml(xmlContent);
      addLog(`BOM parsed successfully: ${bomData.items.length} items found`);
      
      setParsedBOM(bomData);

      // Analyze the BOM
      const bomAnalysis = analyzeBOM(bomData.items);
      setAnalysis(bomAnalysis);
      
      // Bifurcate items for searching
      const bifurcated = bifurcateItemsForSearch(bomData.items);
      setBifurcatedItems(bifurcated);
      
      addLog(`Analysis complete: ${bomAnalysis.partTypeGroups.size} part types found`);
      addLog(`Found ${bomAnalysis.profileMachiningRelations.length} profile-machining relationships`);
      addLog(`Found ${bomAnalysis.uniquePartNumbers.size} unique part numbers`);
      addLog(`Bifurcation: ${bifurcated.profiles.length} profiles, ${bifurcated.fixedParts.length} fixed parts`);

      // Log detailed information
      bomAnalysis.partTypeGroups.forEach((group, partType) => {
        addLog(`Part Type "${partType}": ${group.items.length} items, ${group.totalQuantity} total quantity`);
      });

    } catch (error) {
      console.error('Error parsing BOM:', error);
      addLog(`ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
      alert('Failed to parse BOM file. Please check the file format.');
    } finally {
      setIsLoading(false);
    }
  }, [addLog]);

  const renderItemDetails = (item: BOMItem) => (
    <div className="space-y-2 text-sm">
      <div className="grid grid-cols-2 gap-2">
        <Text className="text-ui-fg-muted">Part Number:</Text>
        <Text className="font-mono">{item.partNumber}</Text>
        
        <Text className="text-ui-fg-muted">Tag:</Text>
        <Text className="font-mono">{item.tag || 'N/A'}</Text>
        
        <Text className="text-ui-fg-muted">Quantity:</Text>
        <Text>{item.quantity}</Text>
        
        <Text className="text-ui-fg-muted">Units:</Text>
        <Text>{item.units}</Text>
        
        {item.length && (
          <>
            <Text className="text-ui-fg-muted">Length:</Text>
            <Text>{item.length} {item.units}</Text>
          </>
        )}
        
        <Text className="text-ui-fg-muted">Unit Price:</Text>
        <Text>${item.unitPrice}</Text>
        
        <Text className="text-ui-fg-muted">Extended Price:</Text>
        <Text className="font-medium">${item.extendedPrice}</Text>
      </div>
      
      {item.panelDimension && (
        <div className="pt-2 border-t">
          <Text className="text-ui-fg-muted">Panel Dimensions:</Text>
          <Text className="font-mono text-xs">{item.panelDimension}</Text>
        </div>
      )}
      
      {item.panelNotches && (
        <div>
          <Text className="text-ui-fg-muted">Panel Notches:</Text>
          <Text className="font-mono text-xs">{item.panelNotches}</Text>
        </div>
      )}
    </div>
  );

  const renderProfileMachiningRelation = (relation: ProfileMachiningRelation) => (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="bg-ui-bg-subtle p-3 rounded">
        <Text className="font-medium text-sm">
          Profile {relation.profile.tag}: {relation.profile.partNumber}
        </Text>
        <Text className="text-sm text-ui-fg-subtle">{relation.profile.description}</Text>
        {relation.profile.length && (
          <Text className="text-sm">Length: {relation.profile.length} {relation.profile.units}</Text>
        )}
      </div>
      
      <div className="space-y-2">
        <Text className="text-sm font-medium">Related Machining Services:</Text>
        {relation.machiningServices.map((machining, idx) => (
          <div key={idx} className="ml-4 p-2 bg-ui-bg-subtle-hover rounded text-sm">
            <Text>{machining.description}</Text>
            <Text className="text-ui-fg-muted">Qty: {machining.quantity}, Price: ${machining.extendedPrice}</Text>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Container className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <Heading level="h1" className="mb-2">BOM Analysis Tool</Heading>
        <Text className="text-ui-fg-subtle">
          Upload your BOM XML file to analyze its structure and relationships
        </Text>
      </div>

      {!parsedBOM && (
        <div className="border-2 border-dashed border-ui-border-base rounded-lg p-8 text-center">
          <ArrowUpTray className="mx-auto mb-4 text-ui-fg-muted" fontSize={48} />
          <Input
            type="file"
            accept=".xml"
            onChange={handleFileUpload}
            disabled={isLoading}
            className="max-w-xs mx-auto"
          />
          <Text className="mt-4 text-sm text-ui-fg-subtle">
            Supported format: XML (AQXBOM)
          </Text>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Spinner size={32} />
          <Text className="ml-2">Processing BOM file...</Text>
        </div>
      )}

      {parsedBOM && analysis && !isLoading && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-ui-bg-subtle rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Heading level="h3">BOM Summary</Heading>
              <Button
                variant="secondary"
                size="small"
                onClick={() => {
                  setParsedBOM(null);
                  setAnalysis(null);
                  setBifurcatedItems(null);
                  setLogs([]);
                }}
              >
                <XMarkMini />
                Clear
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <Text className="text-sm text-ui-fg-muted">Order ID</Text>
                <Text className="font-medium">{parsedBOM.orderInfo.orderInfoId}</Text>
              </div>
              <div>
                <Text className="text-sm text-ui-fg-muted">Total Items</Text>
                <Text className="font-medium">{parsedBOM.items.length}</Text>
              </div>
              <div>
                <Text className="text-sm text-ui-fg-muted">Part Types</Text>
                <Text className="font-medium">{analysis.partTypeGroups.size}</Text>
              </div>
              <div>
                <Text className="text-sm text-ui-fg-muted">Unique Parts</Text>
                <Text className="font-medium">{analysis.uniquePartNumbers.size}</Text>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Text className="text-sm text-ui-fg-muted">Total Weight</Text>
                <Text className="font-medium">{parsedBOM.totalWeight.toFixed(2)} lbs</Text>
              </div>
              <div>
                <Text className="text-sm text-ui-fg-muted">Total Price</Text>
                <Text className="font-medium">${parsedBOM.totalPrice.toFixed(2)}</Text>
              </div>
              <div>
                <Text className="text-sm text-ui-fg-muted">Price Range</Text>
                <Text className="font-medium">
                  ${analysis.priceRange.min.toFixed(2)} - ${analysis.priceRange.max.toFixed(2)}
                </Text>
              </div>
              <div>
                <Text className="text-sm text-ui-fg-muted">Unit Types</Text>
                <Text className="font-medium">{Array.from(analysis.unitTypes).join(', ')}</Text>
              </div>
            </div>
          </div>

          {/* Tabs for different views */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <Tabs.List>
              <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
              <Tabs.Trigger value="by-type">By Type</Tabs.Trigger>
              <Tabs.Trigger value="relationships">Relationships</Tabs.Trigger>
              <Tabs.Trigger value="search">Search & Import</Tabs.Trigger>
              <Tabs.Trigger value="raw-data">Raw Data</Tabs.Trigger>
              <Tabs.Trigger value="logs">Logs</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="overview" className="mt-4 space-y-4">
              {/* Part Type Summary */}
              <CollapsibleSection title="Part Types" defaultOpen>
                <div className="space-y-2">
                  {Array.from(analysis.partTypeGroups.entries()).map(([partType, group]) => (
                    <div key={partType} className="flex items-center justify-between p-3 bg-ui-bg-subtle rounded">
                      <div>
                        <Text className="font-medium">{partType}</Text>
                        <Text className="text-sm text-ui-fg-subtle">{group.items.length} items</Text>
                      </div>
                      <div className="text-right">
                        <Text className="font-medium">${group.totalPrice.toFixed(2)}</Text>
                        <Text className="text-sm text-ui-fg-subtle">Qty: {group.totalQuantity}</Text>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              {/* Machining Types */}
              {analysis.partTypeGroups.has('MACHINING') && (
                <CollapsibleSection title="Machining Services">
                  <div className="space-y-2">
                    {Array.from(extractMachiningTypes(parsedBOM.items).entries()).map(([type, data]) => (
                      <div key={type} className="p-3 bg-ui-bg-subtle rounded">
                        <Text className="font-medium">{type}</Text>
                        <Text className="text-sm text-ui-fg-subtle">{data.count} occurrences</Text>
                        <div className="mt-2 space-y-1">
                          {data.items.map((item, idx) => (
                            <Text key={idx} className="text-xs text-ui-fg-muted ml-4">
                              • {item.description} (Qty: {item.quantity})
                            </Text>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}
            </Tabs.Content>

            <Tabs.Content value="by-type" className="mt-4 space-y-4">
              {Array.from(analysis.partTypeGroups.entries()).map(([partType, group]) => (
                <CollapsibleSection 
                  key={partType} 
                  title={partType} 
                  badge={`${group.items.length} items`}
                >
                  <div className="space-y-3">
                    {group.items.map((item, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <Text className="font-medium">{item.partNumber}</Text>
                            {item.tag && <Badge size="xsmall" className="ml-2">Tag: {item.tag}</Badge>}
                          </div>
                          <Text className="font-medium">${item.extendedPrice}</Text>
                        </div>
                        <Text className="text-sm text-ui-fg-subtle mb-2">{item.description}</Text>
                        {renderItemDetails(item)}
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              ))}
            </Tabs.Content>

            <Tabs.Content value="relationships" className="mt-4 space-y-4">
              {/* Profile-Machining Relationships */}
              <CollapsibleSection 
                title="Profile-Machining Relationships" 
                badge={`${analysis.profileMachiningRelations.length} found`}
                defaultOpen
              >
                <div className="space-y-4">
                  {analysis.profileMachiningRelations.length > 0 ? (
                    analysis.profileMachiningRelations.map((relation, idx) => (
                      <div key={idx}>
                        {renderProfileMachiningRelation(relation)}
                      </div>
                    ))
                  ) : (
                    <Text className="text-ui-fg-muted">No profile-machining relationships found</Text>
                  )}
                </div>
              </CollapsibleSection>

              {/* Tag Relationships */}
              <CollapsibleSection 
                title="Tag Cross-References" 
                badge={`${analysis.tagRelationships.size} found`}
              >
                <div className="space-y-2">
                  {analysis.tagRelationships.size > 0 ? (
                    Array.from(analysis.tagRelationships.entries()).map(([tag, relatedTags]) => (
                      <div key={tag} className="p-3 bg-ui-bg-subtle rounded">
                        <Text className="font-medium">Tag {tag} references:</Text>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {relatedTags.map(relatedTag => (
                            <Badge key={relatedTag} size="small">{relatedTag}</Badge>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <Text className="text-ui-fg-muted">No tag relationships found</Text>
                  )}
                </div>
              </CollapsibleSection>

              {/* Items without tags */}
              {analysis.missingTags.length > 0 && (
                <CollapsibleSection 
                  title="Items Without Tags" 
                  badge={`${analysis.missingTags.length} items`}
                >
                  <div className="space-y-2">
                    {analysis.missingTags.map((item, idx) => (
                      <div key={idx} className="p-3 bg-ui-bg-subtle rounded">
                        <Text className="font-medium">{item.partNumber}</Text>
                        <Text className="text-sm text-ui-fg-subtle">{item.description}</Text>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}
            </Tabs.Content>

            <Tabs.Content value="search" className="mt-4 space-y-4">
              {bifurcatedItems && (
                <>
                  {/* Profile Validation */}
                  <CollapsibleSection 
                    title="Profile Cutting Validation" 
                    defaultOpen
                  >
                    {(() => {
                      const validation = validateProfileCutting(bifurcatedItems.profiles);
                      return (
                        <div className="space-y-4">
                          {/* Summary */}
                          <div className="p-4 bg-ui-bg-subtle rounded">
                            <Text className="font-medium mb-2">Validation Summary:</Text>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <Text className="text-ui-fg-muted">Total Profile Pieces:</Text>
                                <Text className="font-medium">{validation.summary.totalProfiles}</Text>
                              </div>
                              <div>
                                <Text className="text-ui-fg-muted">Profiles Needing Cuts:</Text>
                                <Text className="font-medium">{validation.summary.profilesNeedingCuts}</Text>
                              </div>
                              <div>
                                <Text className="text-ui-fg-muted">Total Cut Services:</Text>
                                <Text className="font-medium">{validation.summary.totalCuttingServices}</Text>
                              </div>
                            </div>
                            {validation.summary.profilesNeedingCuts === validation.summary.totalCuttingServices ? (
                              <Text className="text-green-600 text-sm mt-2">✓ Cut services match profile requirements</Text>
                            ) : (
                              <Text className="text-orange-600 text-sm mt-2">
                                ⚠ Mismatch: {validation.summary.profilesNeedingCuts} cuts needed, {validation.summary.totalCuttingServices} provided
                              </Text>
                            )}
                          </div>

                          {/* Valid Profiles */}
                          {validation.valid.length > 0 && (
                            <div>
                              <Text className="font-medium text-green-600 mb-2">
                                ✓ Valid Profiles ({validation.valid.length})
                              </Text>
                              <div className="space-y-2">
                                {validation.valid.map((profile, idx) => (
                                  <div key={idx} className="p-3 bg-green-50 rounded text-sm">
                                    <Text>{profile.bomItem.partNumber} - {profile.bomItem.description}</Text>
                                    <Text className="text-xs text-ui-fg-muted">
                                      Length: {profile.bomItem.length || 'N/A'} {profile.bomItem.units}, 
                                      Qty: {profile.bomItem.quantity}
                                      {profile.hasCutService && ` (${profile.cuttingServices.reduce((sum, cs) => sum + parseInt(cs.quantity || '0'), 0)} cut services)`}
                                    </Text>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Missing Cut Service */}
                          {validation.missingCuts.length > 0 && (
                            <div>
                              <Text className="font-medium text-orange-600 mb-2">
                                ⚠ Missing Cut Service ({validation.missingCuts.length})
                              </Text>
                              <div className="space-y-2">
                                {validation.missingCuts.map((profile, idx) => (
                                  <div key={idx} className="p-3 bg-orange-50 rounded text-sm">
                                    <Text>{profile.bomItem.partNumber} - {profile.bomItem.description}</Text>
                                    <Text className="text-xs text-ui-fg-muted">
                                      Length: {profile.bomItem.length} {profile.bomItem.units}, 
                                      Qty: {profile.bomItem.quantity} (needs {profile.bomItem.quantity} cut services)
                                    </Text>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Extra Cut Service */}
                          {validation.extraCuts.length > 0 && (
                            <div>
                              <Text className="font-medium text-blue-600 mb-2">
                                ℹ Possible Full-Length Profiles ({validation.extraCuts.length})
                              </Text>
                              <div className="space-y-2">
                                {validation.extraCuts.map((profile, idx) => (
                                  <div key={idx} className="p-3 bg-blue-50 rounded text-sm">
                                    <Text>{profile.bomItem.partNumber} - {profile.bomItem.description}</Text>
                                    <Text className="text-xs text-ui-fg-muted">
                                      Has cut service but might be full length
                                    </Text>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </CollapsibleSection>

                  {/* Searchable Profiles */}
                  <CollapsibleSection 
                    title="Profiles for Search" 
                    badge={`${bifurcatedItems.profiles.length} items`}
                  >
                    <div className="space-y-3">
                      {bifurcatedItems.profiles.map((profile, idx) => (
                        <div key={idx} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <Text className="font-medium">{profile.bomItem.partNumber}</Text>
                              <Badge size="xsmall" className="ml-2">Tag: {profile.bomItem.tag || 'N/A'}</Badge>
                            </div>
                            <Button
                              variant="secondary"
                              size="small"
                              onClick={() => {
                                addLog(`[MOCK] Searching for profile: ${profile.bomItem.partNumber}`);
                                alert(`MOCK: Would search for profile ${profile.bomItem.partNumber}`);
                              }}
                            >
                              Search
                            </Button>
                          </div>
                          <Text className="text-sm text-ui-fg-subtle">{profile.bomItem.description}</Text>
                          <div className="mt-2 text-sm">
                            <Text>Length: {profile.bomItem.length || 'N/A'} {profile.bomItem.units}</Text>
                            <Text>Quantity: {profile.bomItem.quantity}</Text>
                          </div>
                          
                          {/* Associated Machining */}
                          <div className="mt-3 space-y-2">
                            {profile.cuttingServices.length > 0 && (
                              <div className="p-2 bg-ui-bg-subtle rounded">
                                <Text className="text-xs font-medium">Cutting Services:</Text>
                                {profile.cuttingServices.map((cut, cutIdx) => (
                                  <Text key={cutIdx} className="text-xs ml-2">
                                    • {cut.description} (Qty: {cut.quantity})
                                  </Text>
                                ))}
                              </div>
                            )}
                            {profile.tappingServices.length > 0 && (
                              <div className="p-2 bg-ui-bg-subtle rounded">
                                <Text className="text-xs font-medium">Tapping Services:</Text>
                                {profile.tappingServices.map((tap, tapIdx) => (
                                  <Text key={tapIdx} className="text-xs ml-2">
                                    • {tap.description} (Qty: {tap.quantity})
                                  </Text>
                                ))}
                              </div>
                            )}
                            {profile.otherMachining.length > 0 && (
                              <div className="p-2 bg-orange-50 rounded">
                                <Text className="text-xs font-medium text-orange-700">
                                  Unsupported Machining:
                                </Text>
                                {profile.otherMachining.map((other, otherIdx) => (
                                  <Text key={otherIdx} className="text-xs ml-2 text-orange-600">
                                    • {other.description}
                                  </Text>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>

                  {/* Fixed Parts */}
                  <CollapsibleSection 
                    title="Fixed Parts (EA)" 
                    badge={`${bifurcatedItems.fixedParts.length} items`}
                  >
                    <div className="space-y-2">
                      {bifurcatedItems.fixedParts.map((part, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-ui-bg-subtle rounded">
                          <div className="flex-1">
                            <Text className="font-medium">{part.bomItem.partNumber}</Text>
                            <Text className="text-sm text-ui-fg-subtle">{part.bomItem.description}</Text>
                            <Text className="text-xs">Qty: {part.bomItem.quantity}</Text>
                          </div>
                          <Button
                            variant="secondary"
                            size="small"
                            onClick={() => {
                              addLog(`[MOCK] Searching for fixed part: ${part.bomItem.partNumber}`);
                              alert(`MOCK: Would search for ${part.bomItem.partNumber} - visit later`);
                            }}
                          >
                            Search
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>

                  {/* Unsupported Items */}
                  {bifurcatedItems.unsupportedItems.length > 0 && (
                    <CollapsibleSection 
                      title="Unsupported Items" 
                      badge={`${bifurcatedItems.unsupportedItems.length} items`}
                    >
                      <div className="space-y-2">
                        <div className="p-3 bg-red-50 rounded mb-2">
                          <Text className="text-sm text-red-700">
                            These items (panels, gaskets) are not currently supported for import
                          </Text>
                        </div>
                        {bifurcatedItems.unsupportedItems.map((item, idx) => (
                          <div key={idx} className="p-3 bg-ui-bg-subtle rounded">
                            <Text className="font-medium">{item.partNumber}</Text>
                            <Text className="text-sm text-ui-fg-subtle">{item.description}</Text>
                            <Text className="text-xs">Type: {item.partType}, Qty: {item.quantity}</Text>
                          </div>
                        ))}
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* Orphaned Machining */}
                  {bifurcatedItems.machiningOnlyItems.length > 0 && (
                    <CollapsibleSection 
                      title="Unassociated Machining" 
                      badge={`${bifurcatedItems.machiningOnlyItems.length} items`}
                    >
                      <div className="space-y-2">
                        <div className="p-3 bg-yellow-50 rounded mb-2">
                          <Text className="text-sm text-yellow-700">
                            {"These machining services couldn't be linked to specific profiles"}
                          </Text>
                        </div>
                        {bifurcatedItems.machiningOnlyItems.map((item, idx) => (
                          <div key={idx} className="p-3 bg-ui-bg-subtle rounded">
                            <Text className="text-sm">{item.description}</Text>
                            <Text className="text-xs text-ui-fg-muted">
                              Qty: {item.quantity}, Price: ${item.extendedPrice}
                            </Text>
                          </div>
                        ))}
                      </div>
                    </CollapsibleSection>
                  )}
                </>
              )}
            </Tabs.Content>

            <Tabs.Content value="raw-data" className="mt-4">
              <div className="space-y-4">
                {/* Order Info */}
                <CollapsibleSection title="Order Information" defaultOpen>
                  <pre className="text-xs font-mono bg-ui-bg-base p-4 rounded overflow-x-auto">
                    {JSON.stringify(parsedBOM.orderInfo, null, 2)}
                  </pre>
                </CollapsibleSection>

                {/* Billing Info */}
                {parsedBOM.billingInfo && (
                  <CollapsibleSection title="Billing Information">
                    <pre className="text-xs font-mono bg-ui-bg-base p-4 rounded overflow-x-auto">
                      {JSON.stringify(parsedBOM.billingInfo, null, 2)}
                    </pre>
                  </CollapsibleSection>
                )}

                {/* Shipping Info */}
                {parsedBOM.shippingInfo && (
                  <CollapsibleSection title="Shipping Information">
                    <pre className="text-xs font-mono bg-ui-bg-base p-4 rounded overflow-x-auto">
                      {JSON.stringify(parsedBOM.shippingInfo, null, 2)}
                    </pre>
                  </CollapsibleSection>
                )}

                {/* Summary Report */}
                <CollapsibleSection title="Summary Report">
                  <pre className="text-xs font-mono bg-ui-bg-base p-4 rounded overflow-x-auto whitespace-pre-wrap">
                    {generateBOMSummary(parsedBOM, analysis)}
                  </pre>
                </CollapsibleSection>

                {/* Raw Items */}
                <CollapsibleSection title="Raw BOM Items">
                  <div className="max-h-96 overflow-y-auto">
                    <pre className="text-xs font-mono bg-ui-bg-base p-4 rounded">
                      {JSON.stringify(parsedBOM.items, null, 2)}
                    </pre>
                  </div>
                </CollapsibleSection>
              </div>
            </Tabs.Content>

            <Tabs.Content value="logs" className="mt-4">
              <div className="bg-ui-bg-base rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <Heading level="h3">Processing Logs</Heading>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => setLogs([])}
                  >
                    Clear Logs
                  </Button>
                </div>
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {logs.length > 0 ? (
                    logs.map((log, idx) => (
                      <Text key={idx} className="text-xs font-mono text-ui-fg-muted">
                        {log}
                      </Text>
                    ))
                  ) : (
                    <Text className="text-ui-fg-muted">No logs available</Text>
                  )}
                </div>
              </div>
            </Tabs.Content>
          </Tabs>
        </div>
      )}
    </Container>
  );
}

// 'use client'
// import React, { useState, useCallback, useEffect } from 'react';
// import { Button, Input, Heading, Text, Container, Badge, clx, Tabs } from '@medusajs/ui';
// import { ArrowUpTray, XMarkMini, ChevronDown, ChevronRight } from '@medusajs/icons';
// import { 
//   parseBOMXml, 
//   analyzeBOM,
//   extractMachiningTypes,
//   groupBOMItems,
//   generateBOMSummary,
//   type BOMItem,
//   type ParsedBOM,
//   type BOMAnalysis,
//   type ProfileMachiningRelation
// } from '@lib/util/bom-parser';
// import Spinner from '@modules/common/icons/spinner';

// interface CollapsibleSectionProps {
//   title: string;
//   badge?: string;
//   children: React.ReactNode;
//   defaultOpen?: boolean;
// }

// function CollapsibleSection({ title, badge, children, defaultOpen = false }: CollapsibleSectionProps) {
//   const [isOpen, setIsOpen] = useState(defaultOpen);

//   return (
//     <div className="border rounded-lg overflow-hidden">
//       <button
//         className="w-full px-4 py-3 bg-ui-bg-subtle hover:bg-ui-bg-subtle-hover flex items-center justify-between transition-colors"
//         onClick={() => setIsOpen(!isOpen)}
//       >
//         <div className="flex items-center gap-2">
//           {isOpen ? <ChevronDown /> : <ChevronRight />}
//           <Text className="font-medium">{title}</Text>
//           {badge && <Badge size="small" color="blue">{badge}</Badge>}
//         </div>
//       </button>
//       {isOpen && (
//         <div className="p-4 border-t">
//           {children}
//         </div>
//       )}
//     </div>
//   );
// }

// export default function BOMImportComponent() {
//   const [isLoading, setIsLoading] = useState(false);
//   const [parsedBOM, setParsedBOM] = useState<ParsedBOM | null>(null);
//   const [analysis, setAnalysis] = useState<BOMAnalysis | null>(null);
//   const [selectedTab, setSelectedTab] = useState('overview');
//   const [logs, setLogs] = useState<string[]>([]);

//   const addLog = useCallback((message: string) => {
//     setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
//     console.log(message);
//   }, []);

//   const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     setIsLoading(true);
//     setLogs([]);
//     addLog(`Starting to parse file: ${file.name}`);

//     try {
//       const xmlContent = await file.text();
//       addLog(`File read successfully, size: ${xmlContent.length} characters`);
      
//       const bomData = await parseBOMXml(xmlContent);
//       addLog(`BOM parsed successfully: ${bomData.items.length} items found`);
      
//       setParsedBOM(bomData);

//       // Analyze the BOM
//       const bomAnalysis = analyzeBOM(bomData.items);
//       setAnalysis(bomAnalysis);
      
//       addLog(`Analysis complete: ${bomAnalysis.partTypeGroups.size} part types found`);
//       addLog(`Found ${bomAnalysis.profileMachiningRelations.length} profile-machining relationships`);
//       addLog(`Found ${bomAnalysis.uniquePartNumbers.size} unique part numbers`);

//       // Log detailed information
//       bomAnalysis.partTypeGroups.forEach((group, partType) => {
//         addLog(`Part Type "${partType}": ${group.items.length} items, ${group.totalQuantity} total quantity`);
//       });

//     } catch (error) {
//       console.error('Error parsing BOM:', error);
//       addLog(`ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
//       alert('Failed to parse BOM file. Please check the file format.');
//     } finally {
//       setIsLoading(false);
//     }
//   }, [addLog]);

//   const renderItemDetails = (item: BOMItem) => (
//     <div className="space-y-2 text-sm">
//       <div className="grid grid-cols-2 gap-2">
//         <Text className="text-ui-fg-muted">Part Number:</Text>
//         <Text className="font-mono">{item.partNumber}</Text>
        
//         <Text className="text-ui-fg-muted">Tag:</Text>
//         <Text className="font-mono">{item.tag || 'N/A'}</Text>
        
//         <Text className="text-ui-fg-muted">Quantity:</Text>
//         <Text>{item.quantity}</Text>
        
//         <Text className="text-ui-fg-muted">Units:</Text>
//         <Text>{item.units}</Text>
        
//         {item.length && (
//           <>
//             <Text className="text-ui-fg-muted">Length:</Text>
//             <Text>{item.length} {item.units}</Text>
//           </>
//         )}
        
//         <Text className="text-ui-fg-muted">Unit Price:</Text>
//         <Text>${item.unitPrice}</Text>
        
//         <Text className="text-ui-fg-muted">Extended Price:</Text>
//         <Text className="font-medium">${item.extendedPrice}</Text>
//       </div>
      
//       {item.panelDimension && (
//         <div className="pt-2 border-t">
//           <Text className="text-ui-fg-muted">Panel Dimensions:</Text>
//           <Text className="font-mono text-xs">{item.panelDimension}</Text>
//         </div>
//       )}
      
//       {item.panelNotches && (
//         <div>
//           <Text className="text-ui-fg-muted">Panel Notches:</Text>
//           <Text className="font-mono text-xs">{item.panelNotches}</Text>
//         </div>
//       )}
//     </div>
//   );

//   const renderProfileMachiningRelation = (relation: ProfileMachiningRelation) => (
//     <div className="border rounded-lg p-4 space-y-3">
//       <div className="bg-ui-bg-subtle p-3 rounded">
//         <Text className="font-medium text-sm">
//           Profile {relation.profile.tag}: {relation.profile.partNumber}
//         </Text>
//         <Text className="text-sm text-ui-fg-subtle">{relation.profile.description}</Text>
//         {relation.profile.length && (
//           <Text className="text-sm">Length: {relation.profile.length} {relation.profile.units}</Text>
//         )}
//       </div>
      
//       <div className="space-y-2">
//         <Text className="text-sm font-medium">Related Machining Services:</Text>
//         {relation.machiningServices.map((machining, idx) => (
//           <div key={idx} className="ml-4 p-2 bg-ui-bg-subtle-hover rounded text-sm">
//             <Text>{machining.description}</Text>
//             <Text className="text-ui-fg-muted">Qty: {machining.quantity}, Price: ${machining.extendedPrice}</Text>
//           </div>
//         ))}
//       </div>
//     </div>
//   );

//   return (
//     <Container className="max-w-6xl mx-auto p-6">
//       <div className="mb-8">
//         <Heading level="h1" className="mb-2">BOM Analysis Tool</Heading>
//         <Text className="text-ui-fg-subtle">
//           Upload your BOM XML file to analyze its structure and relationships
//         </Text>
//       </div>

//       {!parsedBOM && (
//         <div className="border-2 border-dashed border-ui-border-base rounded-lg p-8 text-center">
//           <ArrowUpTray className="mx-auto mb-4 text-ui-fg-muted" fontSize={48} />
//           <Input
//             type="file"
//             accept=".xml"
//             onChange={handleFileUpload}
//             disabled={isLoading}
//             className="max-w-xs mx-auto"
//           />
//           <Text className="mt-4 text-sm text-ui-fg-subtle">
//             Supported format: XML (AQXBOM)
//           </Text>
//         </div>
//       )}

//       {isLoading && (
//         <div className="flex items-center justify-center py-12">
//           <Spinner size={32} />
//           <Text className="ml-2">Processing BOM file...</Text>
//         </div>
//       )}

//       {parsedBOM && analysis && !isLoading && (
//         <div className="space-y-6">
//           {/* Summary Card */}
//           <div className="bg-ui-bg-subtle rounded-lg p-6">
//             <div className="flex items-center justify-between mb-4">
//               <Heading level="h3">BOM Summary</Heading>
//               <Button
//                 variant="secondary"
//                 size="small"
//                 onClick={() => {
//                   setParsedBOM(null);
//                   setAnalysis(null);
//                   setLogs([]);
//                 }}
//               >
//                 <XMarkMini />
//                 Clear
//               </Button>
//             </div>
            
//             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
//               <div>
//                 <Text className="text-sm text-ui-fg-muted">Order ID</Text>
//                 <Text className="font-medium">{parsedBOM.orderInfo.orderInfoId}</Text>
//               </div>
//               <div>
//                 <Text className="text-sm text-ui-fg-muted">Total Items</Text>
//                 <Text className="font-medium">{parsedBOM.items.length}</Text>
//               </div>
//               <div>
//                 <Text className="text-sm text-ui-fg-muted">Part Types</Text>
//                 <Text className="font-medium">{analysis.partTypeGroups.size}</Text>
//               </div>
//               <div>
//                 <Text className="text-sm text-ui-fg-muted">Unique Parts</Text>
//                 <Text className="font-medium">{analysis.uniquePartNumbers.size}</Text>
//               </div>
//             </div>
            
//             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//               <div>
//                 <Text className="text-sm text-ui-fg-muted">Total Weight</Text>
//                 <Text className="font-medium">{parsedBOM.totalWeight.toFixed(2)} lbs</Text>
//               </div>
//               <div>
//                 <Text className="text-sm text-ui-fg-muted">Total Price</Text>
//                 <Text className="font-medium">${parsedBOM.totalPrice.toFixed(2)}</Text>
//               </div>
//               <div>
//                 <Text className="text-sm text-ui-fg-muted">Price Range</Text>
//                 <Text className="font-medium">
//                   ${analysis.priceRange.min.toFixed(2)} - ${analysis.priceRange.max.toFixed(2)}
//                 </Text>
//               </div>
//               <div>
//                 <Text className="text-sm text-ui-fg-muted">Unit Types</Text>
//                 <Text className="font-medium">{Array.from(analysis.unitTypes).join(', ')}</Text>
//               </div>
//             </div>
//           </div>

//           {/* Tabs for different views */}
//           <Tabs value={selectedTab} onValueChange={setSelectedTab}>
//             <Tabs.List>
//               <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
//               <Tabs.Trigger value="by-type">By Type</Tabs.Trigger>
//               <Tabs.Trigger value="relationships">Relationships</Tabs.Trigger>
//               <Tabs.Trigger value="raw-data">Raw Data</Tabs.Trigger>
//               <Tabs.Trigger value="logs">Logs</Tabs.Trigger>
//             </Tabs.List>

//             <Tabs.Content value="overview" className="mt-4 space-y-4">
//               {/* Part Type Summary */}
//               <CollapsibleSection title="Part Types" defaultOpen>
//                 <div className="space-y-2">
//                   {Array.from(analysis.partTypeGroups.entries()).map(([partType, group]) => (
//                     <div key={partType} className="flex items-center justify-between p-3 bg-ui-bg-subtle rounded">
//                       <div>
//                         <Text className="font-medium">{partType}</Text>
//                         <Text className="text-sm text-ui-fg-subtle">{group.items.length} items</Text>
//                       </div>
//                       <div className="text-right">
//                         <Text className="font-medium">${group.totalPrice.toFixed(2)}</Text>
//                         <Text className="text-sm text-ui-fg-subtle">Qty: {group.totalQuantity}</Text>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </CollapsibleSection>

//               {/* Machining Types */}
//               {analysis.partTypeGroups.has('MACHINING') && (
//                 <CollapsibleSection title="Machining Services">
//                   <div className="space-y-2">
//                     {Array.from(extractMachiningTypes(parsedBOM.items).entries()).map(([type, data]) => (
//                       <div key={type} className="p-3 bg-ui-bg-subtle rounded">
//                         <Text className="font-medium">{type}</Text>
//                         <Text className="text-sm text-ui-fg-subtle">{data.count} occurrences</Text>
//                         <div className="mt-2 space-y-1">
//                           {data.items.map((item, idx) => (
//                             <Text key={idx} className="text-xs text-ui-fg-muted ml-4">
//                               • {item.description} (Qty: {item.quantity})
//                             </Text>
//                           ))}
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </CollapsibleSection>
//               )}
//             </Tabs.Content>

//             <Tabs.Content value="by-type" className="mt-4 space-y-4">
//               {Array.from(analysis.partTypeGroups.entries()).map(([partType, group]) => (
//                 <CollapsibleSection 
//                   key={partType} 
//                   title={partType} 
//                   badge={`${group.items.length} items`}
//                 >
//                   <div className="space-y-3">
//                     {group.items.map((item, idx) => (
//                       <div key={idx} className="border rounded-lg p-4">
//                         <div className="flex items-start justify-between mb-2">
//                           <div>
//                             <Text className="font-medium">{item.partNumber}</Text>
//                             {item.tag && <Badge size="xsmall" className="ml-2">Tag: {item.tag}</Badge>}
//                           </div>
//                           <Text className="font-medium">${item.extendedPrice}</Text>
//                         </div>
//                         <Text className="text-sm text-ui-fg-subtle mb-2">{item.description}</Text>
//                         {renderItemDetails(item)}
//                       </div>
//                     ))}
//                   </div>
//                 </CollapsibleSection>
//               ))}
//             </Tabs.Content>

//             <Tabs.Content value="relationships" className="mt-4 space-y-4">
//               {/* Profile-Machining Relationships */}
//               <CollapsibleSection 
//                 title="Profile-Machining Relationships" 
//                 badge={`${analysis.profileMachiningRelations.length} found`}
//                 defaultOpen
//               >
//                 <div className="space-y-4">
//                   {analysis.profileMachiningRelations.length > 0 ? (
//                     analysis.profileMachiningRelations.map((relation, idx) => (
//                       <div key={idx}>
//                         {renderProfileMachiningRelation(relation)}
//                       </div>
//                     ))
//                   ) : (
//                     <Text className="text-ui-fg-muted">No profile-machining relationships found</Text>
//                   )}
//                 </div>
//               </CollapsibleSection>

//               {/* Tag Relationships */}
//               <CollapsibleSection 
//                 title="Tag Cross-References" 
//                 badge={`${analysis.tagRelationships.size} found`}
//               >
//                 <div className="space-y-2">
//                   {analysis.tagRelationships.size > 0 ? (
//                     Array.from(analysis.tagRelationships.entries()).map(([tag, relatedTags]) => (
//                       <div key={tag} className="p-3 bg-ui-bg-subtle rounded">
//                         <Text className="font-medium">Tag {tag} references:</Text>
//                         <div className="flex flex-wrap gap-2 mt-1">
//                           {relatedTags.map(relatedTag => (
//                             <Badge key={relatedTag} size="small">{relatedTag}</Badge>
//                           ))}
//                         </div>
//                       </div>
//                     ))
//                   ) : (
//                     <Text className="text-ui-fg-muted">No tag relationships found</Text>
//                   )}
//                 </div>
//               </CollapsibleSection>

//               {/* Items without tags */}
//               {analysis.missingTags.length > 0 && (
//                 <CollapsibleSection 
//                   title="Items Without Tags" 
//                   badge={`${analysis.missingTags.length} items`}
//                 >
//                   <div className="space-y-2">
//                     {analysis.missingTags.map((item, idx) => (
//                       <div key={idx} className="p-3 bg-ui-bg-subtle rounded">
//                         <Text className="font-medium">{item.partNumber}</Text>
//                         <Text className="text-sm text-ui-fg-subtle">{item.description}</Text>
//                       </div>
//                     ))}
//                   </div>
//                 </CollapsibleSection>
//               )}
//             </Tabs.Content>

//             <Tabs.Content value="raw-data" className="mt-4">
//               <div className="space-y-4">
//                 {/* Order Info */}
//                 <CollapsibleSection title="Order Information" defaultOpen>
//                   <pre className="text-xs font-mono bg-ui-bg-base p-4 rounded overflow-x-auto">
//                     {JSON.stringify(parsedBOM.orderInfo, null, 2)}
//                   </pre>
//                 </CollapsibleSection>

//                 {/* Billing Info */}
//                 {parsedBOM.billingInfo && (
//                   <CollapsibleSection title="Billing Information">
//                     <pre className="text-xs font-mono bg-ui-bg-base p-4 rounded overflow-x-auto">
//                       {JSON.stringify(parsedBOM.billingInfo, null, 2)}
//                     </pre>
//                   </CollapsibleSection>
//                 )}

//                 {/* Shipping Info */}
//                 {parsedBOM.shippingInfo && (
//                   <CollapsibleSection title="Shipping Information">
//                     <pre className="text-xs font-mono bg-ui-bg-base p-4 rounded overflow-x-auto">
//                       {JSON.stringify(parsedBOM.shippingInfo, null, 2)}
//                     </pre>
//                   </CollapsibleSection>
//                 )}

//                 {/* Summary Report */}
//                 <CollapsibleSection title="Summary Report">
//                   <pre className="text-xs font-mono bg-ui-bg-base p-4 rounded overflow-x-auto whitespace-pre-wrap">
//                     {generateBOMSummary(parsedBOM, analysis)}
//                   </pre>
//                 </CollapsibleSection>

//                 {/* Raw Items */}
//                 <CollapsibleSection title="Raw BOM Items">
//                   <div className="max-h-96 overflow-y-auto">
//                     <pre className="text-xs font-mono bg-ui-bg-base p-4 rounded">
//                       {JSON.stringify(parsedBOM.items, null, 2)}
//                     </pre>
//                   </div>
//                 </CollapsibleSection>
//               </div>
//             </Tabs.Content>

//             <Tabs.Content value="logs" className="mt-4">
//               <div className="bg-ui-bg-base rounded-lg p-4">
//                 <div className="flex items-center justify-between mb-4">
//                   <Heading level="h3">Processing Logs</Heading>
//                   <Button
//                     variant="secondary"
//                     size="small"
//                     onClick={() => setLogs([])}
//                   >
//                     Clear Logs
//                   </Button>
//                 </div>
//                 <div className="space-y-1 max-h-96 overflow-y-auto">
//                   {logs.length > 0 ? (
//                     logs.map((log, idx) => (
//                       <Text key={idx} className="text-xs font-mono text-ui-fg-muted">
//                         {log}
//                       </Text>
//                     ))
//                   ) : (
//                     <Text className="text-ui-fg-muted">No logs available</Text>
//                   )}
//                 </div>
//               </div>
//             </Tabs.Content>
//           </Tabs>
//         </div>
//       )}
//     </Container>
//   );
// }