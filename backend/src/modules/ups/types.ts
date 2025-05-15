import { 
    CartDTO, 
    CartLineItemDTO,
    CalculateShippingOptionPriceDTO,
    CartPropsForFulfillment,
    StockLocationDTO
  } from "@medusajs/framework/types"
  
  /**
   * Actual structure of variant as seen in data
   */
  export type ActualVariant = {
    id: string;
    weight?: number;
    length?: number;
    height?: number;
    width?: number;
    [key: string]: unknown;
  };
  
  /**
   * Actual structure of product as seen in data
   */
  export type ActualProduct = {
    id: string;
    [key: string]: unknown;
  };
  
  /**
   * The actual cart item structure as seen in the data
   * Using intersection types to extend the original CartLineItemDTO
   */
  export type ActualCartLineItemDTO = Omit<CartLineItemDTO, 'variant' | 'product'> & {
    // Additional properties in the actual data not in the type definition
    product_title: string;
    product_description: string;
    product_subtitle: string;
    product_handle: string;
    variant_sku: string;
    variant_title: string;
    
    // Actual nested objects
    variant: ActualVariant;
    product: ActualProduct;
  };

  export type ActualItemsDTO = (CartLineItemDTO & {
    variant: {
      id: string;
      weight: number;
      length: number;
      height: number;
      width: number;
      material: string;
      product: {
        id: string;
      };
    };
    product: {
      id: string;
      collection_id: string;
      categories: { id: string }[];
      tags: { id: string }[];
    };
  })
  
  /**
   * Actual cart context structure that extends CartPropsForFulfillment
   * but with the actual items structure
   */
  export type ActualCartPropsForFulfillment = Omit<CartPropsForFulfillment, 'items'> & {
    items: ActualItemsDTO[]
  };
  
  /**
   * The actual context structure for shipping option price calculation
   */
  export type ActualCalculateShippingOptionPriceContext2 = Omit<CalculateShippingOptionPriceDTO['context'], keyof CartPropsForFulfillment> & 
  ActualCartPropsForFulfillment;
  export type ActualCalculateShippingOptionPriceContext = ActualCartPropsForFulfillment & {
    /**
     * The location that the items will be shipped from.
     */
    from_location?: StockLocationDTO;
    [k: string]: unknown;
};

  