import ExtrudedProductsModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const EXTRUDED_PRODUCTS_MODULE = "extruded_products"

export default Module(EXTRUDED_PRODUCTS_MODULE, {
  service: ExtrudedProductsModuleService,
})