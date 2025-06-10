// backend/src/types/index.ts
import { MedusaRequest as BaseMedusaRequest } from "@medusajs/framework"
import { CustomerDTO } from "@medusajs/framework/types"

// Extend the MedusaRequest type to include our custom properties
declare module "@medusajs/framework" {
  export interface MedusaRequest<Body> extends BaseMedusaRequest<Body> {
    auth_context?: {
      customer_id: string
      actor_id: string
      actor_type: 'customer' | 'user'
      auth_identity_id: string
      app_metadata?: {
        clerk_session_id?: string
        clerk_user_id?: string
      }
    }
    customer?: CustomerDTO
    customer_id?: string
  }
}

// Export empty object to make this a module
export {}