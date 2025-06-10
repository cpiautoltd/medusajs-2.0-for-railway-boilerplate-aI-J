// backend/src/modules/clerk-integration/customer-sync.ts
import { ICustomerModuleService, Logger } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import ClerkIntegrationService from "./service"
import { ClerkUser } from "./types"

export class CustomerSyncService {
  private readonly logger_: Logger
  private readonly clerkService: ClerkIntegrationService
  private readonly customerService: ICustomerModuleService

  constructor(
    logger: Logger,
    clerkService: ClerkIntegrationService,
    customerService: ICustomerModuleService
  ) {
    this.logger_ = logger
    this.clerkService = clerkService
    this.customerService = customerService
  }

  /**
   * Find or create a customer from Clerk user data
   */
  async syncCustomer(clerkUser: ClerkUser) {
    try {
      // First, try to find by clerk_user_id in metadata
      let customers = await this.customerService.listCustomers({
        metadata: {
          clerk_user_id: clerkUser.clerkUserId
        }
      })

      if (customers.length > 0) {
        // Update existing customer
        return await this.updateCustomer(customers[0].id, clerkUser)
      }

      // If not found by clerk_user_id, try by email
      customers = await this.customerService.listCustomers({
        email: clerkUser.email
      })

      if (customers.length > 0) {
        // Link existing customer to Clerk
        return await this.updateCustomer(customers[0].id, clerkUser)
      }

      // Create new customer
      return await this.createCustomer(clerkUser)
    } catch (error) {
      this.logger_.error("Error syncing customer:", error)
      throw error
    }
  }

  /**
   * Create a new customer from Clerk user data
   */
  private async createCustomer(clerkUser: ClerkUser) {
    const customerData = {
      email: clerkUser.email,
      first_name: clerkUser.firstName || undefined,
      last_name: clerkUser.lastName || undefined,
      phone: clerkUser.phoneNumber || undefined,
      metadata: {
        clerk_user_id: clerkUser.clerkUserId,
        clerk_username: clerkUser.username,
        clerk_email_verified: clerkUser.emailVerified,
        clerk_phone_verified: clerkUser.phoneVerified,
        clerk_image_url: clerkUser.imageUrl,
        clerk_created_at: new Date(clerkUser.createdAt).toISOString(),
        clerk_last_sign_in: clerkUser.lastSignInAt ? new Date(clerkUser.lastSignInAt).toISOString() : null,
        ...clerkUser.metadata.publicMetadata,
      }
    }

    const customer = await this.customerService.createCustomers(customerData)
    this.logger_.info(`Created customer ${customer.id} for Clerk user ${clerkUser.clerkUserId}`)
    
    // Update Clerk with Medusa customer ID
    await this.clerkService.updateUserMetadata(clerkUser.clerkUserId, {
      privateMetadata: {
        medusa_customer_id: customer.id
      }
    })

    return customer
  }

  /**
   * Update existing customer with Clerk data
   */
  private async updateCustomer(customerId: string, clerkUser: ClerkUser) {
    const updateData = {
      email: clerkUser.email,
      first_name: clerkUser.firstName || undefined,
      last_name: clerkUser.lastName || undefined,
      phone: clerkUser.phoneNumber || undefined,
      metadata: {
        clerk_user_id: clerkUser.clerkUserId,
        clerk_username: clerkUser.username,
        clerk_email_verified: clerkUser.emailVerified,
        clerk_phone_verified: clerkUser.phoneVerified,
        clerk_image_url: clerkUser.imageUrl,
        clerk_last_sign_in: clerkUser.lastSignInAt ? new Date(clerkUser.lastSignInAt).toISOString() : null,
        clerk_updated_at: new Date(clerkUser.updatedAt).toISOString(),
        ...clerkUser.metadata.publicMetadata,
      }
    }

    const customer = await this.customerService.updateCustomers(customerId, updateData)
    this.logger_.info(`Updated customer ${customer.id} with Clerk user ${clerkUser.clerkUserId}`)

    // Update Clerk with Medusa customer ID if not already set
    if (!clerkUser.metadata.privateMetadata?.medusa_customer_id) {
      await this.clerkService.updateUserMetadata(clerkUser.clerkUserId, {
        privateMetadata: {
          medusa_customer_id: customer.id
        }
      })
    }

    return customer
  }

  /**
   * Handle user deletion
   */
  async handleUserDeletion(clerkUserId: string) {
    try {
      const customers = await this.customerService.listCustomers({
        metadata: {
          clerk_user_id: clerkUserId
        }
      })

      if (customers.length === 0) {
        this.logger_.warn(`No customer found for deleted Clerk user ${clerkUserId}`)
        return
      }

      // Soft delete by updating metadata
      for (const customer of customers) {
        await this.customerService.updateCustomers(customer.id, {
          metadata: {
            ...customer.metadata,
            clerk_deleted_at: new Date().toISOString(),
            clerk_user_id: `deleted_${clerkUserId}`,
          }
        })
        this.logger_.info(`Marked customer ${customer.id} as deleted for Clerk user ${clerkUserId}`)
      }
    } catch (error) {
      this.logger_.error(`Error handling user deletion for ${clerkUserId}:`, error)
      throw error
    }
  }
}