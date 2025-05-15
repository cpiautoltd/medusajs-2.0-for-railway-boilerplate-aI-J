import { model } from "@medusajs/framework/utils";
import { InferTypeOf } from "@medusajs/framework/types";

export const possibleServiceTypes = {
  PROFILES_CUT_TO_LENGTH: "profiles_cut_to_length",
  TAP_PROFILE_END: "tap_profile_end",
  LENGTH_BASED_PRODUCT: "length_based_product",
}

export const possibleUnitTypes = {
  MM: "mm",
  CM: "cm",
  INCH: "inch",
}

// Config schema definitions for type safety (as comments for reference)
// These can be enforced using a schema validation library like Zod in implementation

// Config for "profiles_cut_to_length":
// {
//   cut_price: number, // Price per cut
//   currency: string, // e.g., "USD"
//   is_enabled_on_maxlength: boolean, // Whether cut charge applies at max length
//   cut_code: string, // Code corresponding to price
//   cut_to_square: string, // e.g., "+/-.002 in"
//   cut_tolerance: string, // e.g., "+/-.015"
//   unit_type: "mm" | "cm" | "inch", // Unit for length measurements
// }

// Config for "tap_profile_end":
// {
//   left_side: {
//     tap_size: string, // e.g., "1/4-20"
//     price: number,
//     required: boolean,
//     min_depth: number, // e.g., 1.125
//     service_type: string, // e.g., "Single Hole End Tap"
//     part_no: string, // e.g., "7081"
//     currency: string,
//   },
//   right_side: {
//     tap_size: string,
//     price: number,
//     required: boolean,
//     min_depth: number,
//     service_type: string,
//     part_no: string,
//     currency: string,
//   },
// }

// Config for "length_based_product":
// {
//   unit_type: "mm" | "cm" | "inch",
//   price_per_unit: number,
//   currency: string,
//   min_length: number,
//   max_length: number,
//   is_conversion_allowed: boolean, // Allow unit conversion (e.g., mm to inch)
// }



const MachiningModel = model.define("machinings", {
  id: model.id().primaryKey(),
  attached_product_id: model.text().nullable(),
  service_type: model.enum(Object.values(possibleServiceTypes)).default(possibleServiceTypes.LENGTH_BASED_PRODUCT).nullable(),
  is_active: model.boolean().default(false),
  is_compulsory: model.boolean().default(false),
  config: model.json(), // Service-specific configuration
});

export type Machining = InferTypeOf<typeof MachiningModel>

export default MachiningModel