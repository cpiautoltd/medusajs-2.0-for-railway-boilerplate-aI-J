import type { StoreProduct } from "@medusajs/framework/types";

// Enum definitions
export enum ServiceType {
  PROFILES_CUT_TO_LENGTH = "profiles_cut_to_length",
  TAP_PROFILE_END = "tap_profile_end",
  LENGTH_BASED_PRODUCT = "length_based_product",
}

export enum UnitType {
  MM = "mm",
  CM = "cm",
  INCH = "inch",
}

// Config types for each service_type
interface ProfilesCutToLengthConfig {
  cut_price: number;
  currency: string;
  is_enabled_on_maxlength: boolean;
  cut_code: string;
  cut_to_square: string;
  cut_tolerance: string;
  unit_type: UnitType;
}

interface TapProfileEndSide {
  tap_size: string;
  price: number;
  required: boolean;
  min_depth: number;
  service_type: string;
  part_no: string;
  currency: string;
}

interface TapProfileEndConfig {
  left_side: TapProfileEndSide;
  right_side: TapProfileEndSide;
}

interface LengthBasedProductConfig {
  unit_type: UnitType;
  price_per_unit: number;
  currency: string;
  min_length: number;
  max_length: number;
  is_conversion_allowed: boolean;
}

// Union type for config based on service_type
export type MachiningServiceConfig =
  | ({ service_type: ServiceType.PROFILES_CUT_TO_LENGTH } & ProfilesCutToLengthConfig)
  | ({ service_type: ServiceType.TAP_PROFILE_END } & TapProfileEndConfig)
  | ({ service_type: ServiceType.LENGTH_BASED_PRODUCT } & LengthBasedProductConfig);

// Main machining service type
export interface MachiningService {
  id: string;
  product_id: string | null;
  service_type: ServiceType | null;
  is_active: boolean;
  is_compulsory: boolean;
  config: MachiningServiceConfig | null;
}

// Module definition type
export interface MachiningServicesModule {
  resolve: (key: string) => any;
  register: (key: string, value: any) => void;
}

// Additional data type for product creation/update
export interface ProductAdditionalData {
  machining_services: Array<{
    id?: string;
    service_type: ServiceType;
    is_active: boolean;
    is_compulsory: boolean;
    config: MachiningServiceConfig;
  }>;
}

// Extend StoreProduct type to include additional_data
export interface ExtendedStoreProduct extends StoreProduct {
  additional_data?: ProductAdditionalData;
}