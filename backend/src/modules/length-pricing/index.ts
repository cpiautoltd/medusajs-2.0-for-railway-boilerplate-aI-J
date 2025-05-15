// src/modules/length-pricing/index.ts
import { Module } from "@medusajs/framework/utils"
import LengthPricingService from "./service"

export const LENGTH_PRICING_MODULE = "length-pricing"

export default Module(LENGTH_PRICING_MODULE, {
  service: LengthPricingService,
})