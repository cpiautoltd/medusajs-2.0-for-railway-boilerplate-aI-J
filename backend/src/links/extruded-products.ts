import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import ExtrudedProductsModule from "../modules/extruded-products";

export default defineLink(
  ProductModule.linkable.product,
  ExtrudedProductsModule.linkable.extrudedProducts
);