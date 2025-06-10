// backend/src/modules/clerk-integration/index.ts
import { Module } from "@medusajs/framework/utils"
import ClerkIntegrationService from "./service"

export const CLERK_INTEGRATION_MODULE = "clerk-integration"

export default Module(CLERK_INTEGRATION_MODULE, {
  service: ClerkIntegrationService,
})