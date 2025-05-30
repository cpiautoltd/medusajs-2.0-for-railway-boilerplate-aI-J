import type { StoreProduct } from "@medusajs/types"

export type FeaturedProduct = {
  id: string
  title: string
  handle: string
  thumbnail?: string
}

export type VariantPrice = {
  calculated_price_number: number
  calculated_price: string
  original_price_number: number
  original_price: string
  currency_code: string
  price_type: string
  percentage_diff: string
}

export type Unit = "inch" | "cm" | "mm"
export type UnitType = "mm" | "inch" // Only mm and inch for display

export const UNIT_CONVERSIONS: Record<Unit, Record<Unit, number>> = {
  'inch': {
    'inch': 1,
    'cm': 2.54,
    'mm': 25.4,
  },
  'cm': {
    'cm': 1,
    'inch': 0.393701,
    'mm': 10,
  },
  'mm': {
    'mm': 1,
    'inch': 0.0393701,
    'cm': 0.1,
  },
}

export type ExtrudedProduct = {
  id: string
  is_length_based: boolean
  unitType: string
  minLength: number
  maxLength: number
  price_per_unit: number
  cut_price: number
  raw_price_per_unit: {
    value: string
    precision: number
  }
  raw_cut_price: {
    value: string
    precision: number
  }
  created_at: string
  updated_at: string | null
  deleted_at: string | null
  attached_product_id: string | null
  endtap_code: string | null
  endtap_options: string | null
  is_endtap_based: boolean
}

export type ExtendedProduct = StoreProduct & {
  extruded_products?: ExtrudedProduct
}

export type LengthBasedCartItem = {
  length: number
  unitType: string
  price_per_unit: number
  cut_price: number
  total_length_price: number
}


// import type { StoreProduct } from "@medusajs/types"

// export type FeaturedProduct = {
//   id: string
//   title: string
//   handle: string
//   thumbnail?: string
// }

// export type VariantPrice = {
//   calculated_price_number: number
//   calculated_price: string
//   original_price_number: number
//   original_price: string
//   currency_code: string
//   price_type: string
//   percentage_diff: string
// }

// export type ExtrudedProduct = {
//   id: string
//   is_length_based: boolean
//   unitType: string
//   minLength: number
//   maxLength: number
//   price_per_unit: number
//   cut_price: number
//   raw_price_per_unit: {
//     value: string
//     precision: number
//   }
//   raw_cut_price: {
//     value: string
//     precision: number
//   }
//   created_at: string
//   updated_at: string | null
//   deleted_at: string | null
//   attached_product_id: string | null
//   endtap_code: string | null
//   endtap_options: string | null
//   is_endtap_based: boolean
// }

// export type ExtendedProduct = StoreProduct & {
//   extruded_products?: ExtrudedProduct
// }

// export type LengthBasedCartItem = {
//   length: number
//   unitType: string
//   price_per_unit: number
//   cut_price: number
//   total_length_price: number
// }