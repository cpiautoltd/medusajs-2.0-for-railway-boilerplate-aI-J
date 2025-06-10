// backend/src/api/middlewares/clerk-auth.ts
import { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework"
import { ICustomerModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { CLERK_INTEGRATION_MODULE } from "../../modules/clerk-integration"
import ClerkIntegrationService from "../../modules/clerk-integration/service"
import { CustomerSyncService } from "../../modules/clerk-integration/customer-sync"

// Import type extensions
import "../../types"

/**
 * Middleware to authenticate customers using Clerk tokens
 */
export async function authenticateClerkCustomer(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const clerkService: ClerkIntegrationService = req.scope.resolve(CLERK_INTEGRATION_MODULE)
  const customerService: ICustomerModuleService = req.scope.resolve(Modules.CUSTOMER)
  const logger = req.scope.resolve("logger")

  // Get token from Authorization header
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: "No authorization token provided",
      code: "MISSING_TOKEN"
    })
  }

  const token = authHeader.substring(7)

  try {
    // Verify the Clerk token
    const tokenData = await clerkService.verifyToken(token)
    
    if (!tokenData) {
      return res.status(401).json({ 
        error: "Invalid or expired token",
        code: "INVALID_TOKEN"
      })
    }

    // Get full user details from Clerk
    const clerkUser = await clerkService.getUser(tokenData.sub)
    
    // Sync with Medusa customer
    const syncService = new CustomerSyncService(logger, clerkService, customerService)
    const customer = await syncService.syncCustomer(clerkUser)

    // Attach to request context
    req.auth_context = {
      customer_id: customer.id,
      actor_id: customer.id,
      actor_type: 'customer',
      auth_identity_id: clerkUser.clerkUserId,
      app_metadata: {
        clerk_session_id: tokenData.sid,
        clerk_user_id: clerkUser.clerkUserId,
      }
    }

    // Add customer to request for easy access
    req.customer = customer
    req.customer_id = customer.id

    next()
  } catch (error) {
    logger.error("Clerk authentication error:", error)
    return res.status(401).json({ 
      error: "Authentication failed",
      code: "AUTH_FAILED",
      details: error.message
    })
  }
}

/**
 * Optional authentication - doesn't fail if no token provided
 */
export async function optionalClerkAuth(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const authHeader = req.headers.authorization
  
  if (!authHeader?.startsWith('Bearer ')) {
    // No token provided, continue without authentication
    return next()
  }

  // If token is provided, validate it
  return authenticateClerkCustomer(req, res, next)
}

/**
 * Admin authentication check - ensures user is NOT a customer
 */
export async function requireNotCustomer(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  if (req.auth_context?.actor_type === 'customer') {
    return res.status(403).json({ 
      error: "Access denied for customers",
      code: "CUSTOMER_ACCESS_DENIED"
    })
  }
  
  next()
}