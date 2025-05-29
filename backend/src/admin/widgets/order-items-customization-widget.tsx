// src/admin/widgets/order-items-customization.tsx
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps } from "@medusajs/framework/types"
import { useState, useEffect } from 'react';
import { 
  Container, 
  Heading, 
  Text,
  Badge,
  clx
} from '@medusajs/ui';
import { 
  Ruler, 
  Scissors, 
  CircleDot,
  Package,
  Hash
} from 'lucide-react';

const OrderItemsCustomizationWidget = ({ data }: DetailWidgetProps<any>) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (data?.items) {
      setItems(data.items);
      setLoading(false);
    }
  }, [data]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  if (loading) {
    return (
      <Container className="p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </Container>
    );
  }

  const hasCustomItems = items.some(item => item.metadata?.lengthPricing);

  return (
    <Container className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <Heading level="h2" className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Order Items
        </Heading>
        <div className="flex items-center gap-3">
          {hasCustomItems && (
            <Badge size="small" className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
              Contains Custom Items
            </Badge>
          )}
          <Text className="text-sm text-gray-500">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </Text>
        </div>
      </div>
      
      {/* Items List */}
      <div className="space-y-3">
        {items.map((item) => {
          const hasCustomization = item.metadata?.lengthPricing;
          const lengthPricing = hasCustomization ? item.metadata.lengthPricing : null;
          const endtapOptions = lengthPricing?.endtap_options ? JSON.parse(lengthPricing.endtap_options) : [];

          return (
            <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 overflow-hidden hover:shadow-md transition-shadow">
              {/* Main Item Row */}
              <div className="p-4">
                <div className="flex gap-3">
                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                    {item.thumbnail ? (
                      <img 
                        src={item.thumbnail} 
                        alt={item.title}
                        className="w-12 h-12 md:w-14 md:h-14 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex-1">
                        <Text className="font-medium text-sm md:text-base line-clamp-1">
                          {item.product_title}
                        </Text>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Text className="text-xs text-gray-500 dark:text-gray-400">
                            SKU: {item.variant_sku}
                          </Text>
                          {item.subtitle && (
                            <>
                              <span className="text-gray-300 dark:text-gray-600">•</span>
                              <Text className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                {item.subtitle}
                              </Text>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Price Info */}
                      <div className="flex items-center gap-4 sm:gap-6">
                        <div className="text-left sm:text-right">
                          <Text className="text-xs text-gray-500 dark:text-gray-400">
                            {item.quantity} × {formatCurrency(item.unit_price)}
                          </Text>
                          <Text className="font-semibold text-base md:text-lg">
                            {formatCurrency(item.unit_price * item.quantity)}
                          </Text>
                        </div>
                      </div>
                    </div>

                    {/* Custom Configuration - Always Visible */}
                    {hasCustomization && lengthPricing && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {/* Length Badge */}
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-md text-xs font-medium">
                          <Ruler className="h-3.5 w-3.5" />
                          <span>{lengthPricing.selectedLength} {lengthPricing.unitType}</span>
                          <span className="text-blue-500 dark:text-blue-400">@ {formatCurrency(lengthPricing.pricePerUnit)}/{lengthPricing.unitType}</span>
                        </div>

                        {/* Cut Service */}
                        {lengthPricing.cutPrice && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 rounded-md text-xs font-medium">
                            <Scissors className="h-3.5 w-3.5" />
                            <span>Cut</span>
                            <span className="text-green-500 dark:text-green-400">{formatCurrency(lengthPricing.cutPrice)}</span>
                          </div>
                        )}

                        {/* Endtaps */}
                        {lengthPricing.endtapConfig && (lengthPricing.endtapConfig.left || lengthPricing.endtapConfig.right) && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-md text-xs font-medium">
                            <CircleDot className="h-3.5 w-3.5" />
                            <span>Endtaps:</span>
                            {lengthPricing.endtapConfig.left && (
                              <span>
                                L-{(() => {
                                  const opt = endtapOptions.find(o => o.part_no === lengthPricing.endtapConfig.left);
                                  return opt ? opt.tap_size : lengthPricing.endtapConfig.left;
                                })()}
                              </span>
                            )}
                            {lengthPricing.endtapConfig.left && lengthPricing.endtapConfig.right && (
                              <span className="text-purple-400">|</span>
                            )}
                            {lengthPricing.endtapConfig.right && (
                              <span>
                                R-{(() => {
                                  const opt = endtapOptions.find(o => o.part_no === lengthPricing.endtapConfig.right);
                                  return opt ? opt.tap_size : lengthPricing.endtapConfig.right;
                                })()}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Service Codes */}
                        {(lengthPricing.cut_code || lengthPricing.endtap_code) && (
                          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-gray-50 dark:bg-gray-800 rounded-md text-xs">
                            {lengthPricing.cut_code && (
                              <span className="">
                                Cut: <span className="font-normal font-sans txt-compact-small capitalize">{lengthPricing.cut_code}</span>
                              </span>
                            )}
                            {lengthPricing.cut_code && lengthPricing.endtap_code && (
                              <span className="text-gray-300 dark:text-gray-600">•</span>
                            )}
                            {lengthPricing.endtap_code && (
                              <span className="">
                                Endtap: <span className="font-normal font-sans txt-compact-small capitalize">{lengthPricing.endtap_code}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Summary */}
      {data?.summary && (
        <div className="mt-6 flex justify-end">
          <div className="w-full sm:w-auto sm:min-w-[280px] bg-gray-50 dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Text className="text-sm">Subtotal</Text>
                <Text className="text-sm font-medium">
                  {formatCurrency(data.summary.current_order_total - (data.summary.shipping_total || 0))}
                </Text>
              </div>
              {data.summary.shipping_total > 0 && (
                <div className="flex justify-between items-center">
                  <Text className="text-sm text-gray-600 dark:text-gray-400">Shipping</Text>
                  <Text className="text-sm font-medium">{formatCurrency(data.summary.shipping_total)}</Text>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-gray-300 dark:border-gray-600">
                <Text className="font-semibold">Order Total</Text>
                <Text className="font-bold text-xl">{formatCurrency(data.summary.current_order_total)}</Text>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "order.details.after",
})

export default OrderItemsCustomizationWidget


// import { useState, useEffect } from 'react';
// import { 
//   Container, 
//   Heading, 
//   Text,
//   Badge,
//   Table,
//   clx
// } from '@medusajs/ui';
// import { 
//   Ruler, 
//   Scissors, 
//   CircleDot,
//   Package,
//   DollarSign,
//   Hash
// } from 'lucide-react';
// import { defineWidgetConfig } from '@medusajs/admin-sdk';

// const OrderItemsCustomizationWidget = ({ data }) => {
//   const [items, setItems] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (data?.items) {
//       setItems(data.items);
//       setLoading(false);
//     }
//   }, [data]);

//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat('en-CA', {
//       style: 'currency',
//       currency: 'CAD'
//     }).format(amount);
//   };

//   const formatLength = (length, unit) => {
//     return `${length} ${unit}${length !== 1 ? 's' : ''}`;
//   };

//   const renderCustomizationDetails = (item) => {
//     if (!item.metadata?.lengthPricing) {
//       return null;
//     }

//     const { lengthPricing } = item.metadata;
//     const endtapOptions = lengthPricing.endtap_options ? 
//       JSON.parse(lengthPricing.endtap_options) : [];

//     return (
//       <div className="mt-4 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
//         <div className="flex items-center gap-2 mb-3">
//           <Badge size="small">
//             Custom Configuration
//           </Badge>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//           {/* Length Information */}
//           <div className="flex items-start gap-3">
//             <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
//               <Ruler className="h-4 w-4 text-blue-600 dark:text-blue-400" />
//             </div>
//             <div>
//               <Text className="text-xs text-gray-500 dark:text-gray-400">Selected Length</Text>
//               <Text className="font-medium">
//                 {formatLength(lengthPricing.selectedLength, lengthPricing.unitType)}
//               </Text>
//               <Text className="text-xs text-gray-500 dark:text-gray-400">
//                 @ {formatCurrency(lengthPricing.pricePerUnit)}/{lengthPricing.unitType}
//               </Text>
//             </div>
//           </div>

//           {/* Cut Information */}
//           {lengthPricing.cutPrice && (
//             <div className="flex items-start gap-3">
//               <div className="p-2 bg-green-100 dark:bg-green-900 rounded">
//                 <Scissors className="h-4 w-4 text-green-600 dark:text-green-400" />
//               </div>
//               <div>
//                 <Text className="text-xs text-gray-500 dark:text-gray-400">Cut Service</Text>
//                 <Text className="font-medium">{formatCurrency(lengthPricing.cutPrice)}</Text>
//                 <Text className="text-xs text-gray-500 dark:text-gray-400">
//                   Code: {lengthPricing.cut_code}
//                 </Text>
//               </div>
//             </div>
//           )}

//           {/* Calculated Price */}
//           <div className="flex items-start gap-3">
//             <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded">
//               <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
//             </div>
//             <div>
//               <Text className="text-xs text-gray-500 dark:text-gray-400">Calculated Price</Text>
//               <Text className="font-medium text-lg">
//                 {formatCurrency(lengthPricing.calculatedPrice)}
//               </Text>
//             </div>
//           </div>
//         </div>

//         {/* Endtap Configuration */}
//         {lengthPricing.endtapConfig && (lengthPricing.endtapConfig.left || lengthPricing.endtapConfig.right) && (
//           <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
//             <div className="flex items-center gap-2 mb-3">
//               <CircleDot className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
//               <Text className="font-medium">Endtap Configuration</Text>
//             </div>
            
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               {lengthPricing.endtapConfig.left && (
//                 <div className="bg-white dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-700">
//                   <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">Left Endtap</Text>
//                   {(() => {
//                     const leftOption = endtapOptions.find(opt => opt.part_no === lengthPricing.endtapConfig.left);
//                     return leftOption ? (
//                       <div className="space-y-1">
//                         <Text className="font-medium">{leftOption.tap_size}</Text>
//                         <Text className="text-xs text-gray-600 dark:text-gray-400">
//                           Part: {leftOption.part_no} • {formatCurrency(leftOption.price)}
//                         </Text>
//                         <Text className="text-xs text-gray-500 dark:text-gray-400">
//                           {leftOption.service_type}
//                         </Text>
//                       </div>
//                     ) : (
//                       <Text className="text-sm">{lengthPricing.endtapConfig.left}</Text>
//                     );
//                   })()}
//                 </div>
//               )}
              
//               {lengthPricing.endtapConfig.right && (
//                 <div className="bg-white dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-700">
//                   <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">Right Endtap</Text>
//                   {(() => {
//                     const rightOption = endtapOptions.find(opt => opt.part_no === lengthPricing.endtapConfig.right);
//                     return rightOption ? (
//                       <div className="space-y-1">
//                         <Text className="font-medium">{rightOption.tap_size}</Text>
//                         <Text className="text-xs text-gray-600 dark:text-gray-400">
//                           Part: {rightOption.part_no} • {formatCurrency(rightOption.price)}
//                         </Text>
//                         <Text className="text-xs text-gray-500 dark:text-gray-400">
//                           {rightOption.service_type}
//                         </Text>
//                       </div>
//                     ) : (
//                       <Text className="text-sm">{lengthPricing.endtapConfig.right}</Text>
//                     );
//                   })()}
//                 </div>
//               )}
//             </div>

//             {/* Endtap Code if available */}
//             {lengthPricing.endtap_code && (
//               <div className="mt-2">
//                 <Text className="text-xs text-gray-500 dark:text-gray-400">
//                   Endtap Code: {lengthPricing.endtap_code}
//                 </Text>
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     );
//   };

//   if (loading) {
//     return (
//       <Container className="p-6">
//         <div className="animate-pulse space-y-4">
//           <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
//           <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
//         </div>
//       </Container>
//     );
//   }

//   return (
//     <Container className="p-6">
//       <Heading level="h2" className="mb-6 flex items-center gap-2">
//         <Package className="h-5 w-5" />
//         Order Items
//       </Heading>
      
//       <div className="space-y-6">
//         {items.map((item, index) => (
//           <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
//             {/* Item Header */}
//             <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
//               <div className="flex items-start gap-4">
//                 {item.thumbnail && (
//                   <img 
//                     src={item.thumbnail} 
//                     alt={item.title}
//                     className="w-16 h-16 object-cover rounded-md"
//                   />
//                 )}
//                 <div className="space-y-1">
//                   <Text className="font-semibold">{item.product_title}</Text>
//                   <Text className="text-sm text-gray-600 dark:text-gray-400">
//                     {item.subtitle || item.variant_title}
//                   </Text>
//                   {item.variant_sku && (
//                     <div className="flex items-center gap-1 mt-1">
//                       <Hash className="h-3 w-3 text-gray-400" />
//                       <Text className="text-xs text-gray-500 dark:text-gray-400">
//                         SKU: {item.variant_sku}
//                       </Text>
//                     </div>
//                   )}
//                 </div>
//               </div>
              
//               {/* Price and Quantity */}
//               <div className="text-right space-y-1">
//                 <Text className="font-semibold text-lg">
//                   {formatCurrency(item.unit_price)}
//                 </Text>
//                 <Text className="text-sm text-gray-600 dark:text-gray-400">
//                   Qty: {item.quantity}
//                 </Text>
//                 <Text className="text-sm font-medium">
//                   Total: {formatCurrency(item.unit_price * item.quantity)}
//                 </Text>
//               </div>
//             </div>

//             {/* Customization Details */}
//             {renderCustomizationDetails(item)}
//           </div>
//         ))}
//       </div>

//       {/* Order Summary */}
//       {data?.summary && (
//         <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
//           <div className="flex justify-end">
//             <div className="space-y-2 text-right">
//               <div className="flex justify-between gap-8">
//                 <Text className="text-gray-600 dark:text-gray-400">Item Total:</Text>
//                 <Text className="font-medium">{formatCurrency(data.summary.current_order_total)}</Text>
//               </div>
//               {data.summary.shipping_total > 0 && (
//                 <div className="flex justify-between gap-8">
//                   <Text className="text-gray-600 dark:text-gray-400">Shipping:</Text>
//                   <Text className="font-medium">{formatCurrency(data.summary.shipping_total)}</Text>
//                 </div>
//               )}
//               <div className="flex justify-between gap-8 pt-2 border-t border-gray-200 dark:border-gray-700">
//                 <Text className="font-semibold">Order Total:</Text>
//                 <Text className="font-semibold text-lg">{formatCurrency(data.summary.current_order_total)}</Text>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </Container>
//   );
// };

// export const config = defineWidgetConfig({
//   zone: "order.details.after",
// })

// export default OrderItemsCustomizationWidget;