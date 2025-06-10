// backend/src/api/webhooks/clerk/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ICustomerModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { CLERK_INTEGRATION_MODULE } from "../../../modules/clerk-integration"
import ClerkIntegrationService from "../../../modules/clerk-integration/service"
import { CustomerSyncService } from "../../../modules/clerk-integration/customer-sync"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const clerkService: ClerkIntegrationService = req.scope.resolve(CLERK_INTEGRATION_MODULE)
  const customerService: ICustomerModuleService = req.scope.resolve(Modules.CUSTOMER)
  const logger = req.scope.resolve("logger")

  // Get raw body for signature verification
  const payload = JSON.stringify(req.body)
  const headers = req.headers as Record<string, string>

  try {
    // Verify webhook signature
    const event = clerkService.verifyWebhook(payload, headers)
    
    logger.info(`Received Clerk webhook: ${event.type}`)

    // Initialize sync service
    const syncService = new CustomerSyncService(logger, clerkService, customerService)

    // Handle different event types
    switch (event.type) {
      case 'user.created':
        await handleUserCreated(event.data, syncService, clerkService)
        break

      case 'user.updated':
        await handleUserUpdated(event.data, syncService, clerkService)
        break

      case 'user.deleted':
        await handleUserDeleted(event.data, syncService)
        break

      case 'email.created':
        await handleEmailCreated(event.data, syncService, clerkService)
        break

      case 'phone_number.created':
      case 'phone_number.updated':
        await handlePhoneUpdated(event.data, syncService, clerkService)
        break

      case 'session.created':
        logger.info(`New session created for user: ${event.data.user_id}`)
        // Could track active sessions if needed
        break

      case 'session.ended':
      case 'session.removed':
      case 'session.revoked':
        logger.info(`Session ended for user: ${event.data.user_id}`)
        // Could track session analytics
        break

      default:
        logger.info(`Unhandled webhook event: ${event.type}`)
    }

    res.status(200).json({ received: true })
  } catch (error) {
    logger.error("Webhook processing error:", error)
    
    if (error.message?.includes("Invalid webhook signature")) {
      return res.status(401).json({ error: "Invalid webhook signature" })
    }
    
    // Return 200 to prevent Clerk from retrying
    res.status(200).json({ 
      received: true, 
      error: error.message 
    })
  }
}

// Handler functions
async function handleUserCreated(
  userData: any,
  syncService: CustomerSyncService,
  clerkService: ClerkIntegrationService
) {
  const clerkUser = await clerkService.getUser(userData.id)
  await syncService.syncCustomer(clerkUser)
}

async function handleUserUpdated(
  userData: any,
  syncService: CustomerSyncService,
  clerkService: ClerkIntegrationService
) {
  const clerkUser = await clerkService.getUser(userData.id)
  await syncService.syncCustomer(clerkUser)
}

async function handleUserDeleted(
  userData: any,
  syncService: CustomerSyncService
) {
  await syncService.handleUserDeletion(userData.id)
}

async function handleEmailCreated(
  emailData: any,
  syncService: CustomerSyncService,
  clerkService: ClerkIntegrationService
) {
  // Update customer if this is their primary email
  if (emailData.primary) {
    const clerkUser = await clerkService.getUser(emailData.user_id)
    await syncService.syncCustomer(clerkUser)
  }
}

async function handlePhoneUpdated(
  phoneData: any,
  syncService: CustomerSyncService,
  clerkService: ClerkIntegrationService
) {
  // Update customer if this is their primary phone
  if (phoneData.primary) {
    const clerkUser = await clerkService.getUser(phoneData.user_id)
    await syncService.syncCustomer(clerkUser)
  }
}