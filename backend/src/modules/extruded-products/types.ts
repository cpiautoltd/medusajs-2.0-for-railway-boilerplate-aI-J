export interface ExtrudedProduct {
  is_length_based?: boolean,
  price_per_unit?: number,
  cut_price?: number,
  unitType?: string,
  minLength?: number,
  maxLength?: number
}
  export interface LengthPricingLineItemMetadata {
    selectedLength: number
    unitType: 'mm' | 'cm' | 'inch'
    pricePerUnit: number
  }