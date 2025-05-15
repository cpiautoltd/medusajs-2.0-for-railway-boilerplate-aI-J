import { model } from "@medusajs/framework/utils";
import { InferTypeOf } from "@medusajs/framework/types"

export const possibleUnitTypes = {
  MM: "mm",
  CM: "cm",
  INCH: "inch",
}

const ExtrudedProductsModel = model.define("extruded_products", {
  id: model.id().primaryKey(),
  is_length_based: model.boolean().default(false),
  price_per_unit: model.bigNumber().default(0).nullable(),
  cut_price: model.bigNumber().default(0).nullable(),
  cut_code: model.text().nullable(),
  unitType: model.enum(Object.values(possibleUnitTypes)).default(possibleUnitTypes.INCH),
  minLength: model.number().default(0).nullable(),
  maxLength: model.number().default(0).nullable(),
  is_endtap_based: model.boolean().default(false),
  endtap_options: model.text().nullable(),
  endtap_code: model.text().nullable(),
  attached_product_id: model.text().nullable()
});

export type ExtrudedProducts = InferTypeOf<typeof ExtrudedProductsModel>
export type ExtrudedProductsInput = {
  is_length_based: boolean;
  price_per_unit: number;
  cut_price: number | null;
  cut_code: string | null;
  unitType: string; // or a specific union type if possible
  minLength: number | null;
  maxLength: number | null;
  is_endtap_based: boolean;
  endtap_options: string; // or a specific type like Record<string, unknown>
  endtap_code: string | null;
  attached_product_id: string | null;
};


export default ExtrudedProductsModel
