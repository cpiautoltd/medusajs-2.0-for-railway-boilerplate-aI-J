// backend/src/api/store/customers/me/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ICustomerModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { authenticateClerkCustomer } from "../../../middlewares/clerk-auth"
import "../../../types"

export const GET = [
  authenticateClerkCustomer,
  async (req: MedusaRequest, res: MedusaResponse) => {
    const customerService: ICustomerModuleService = req.scope.resolve(Modules.CUSTOMER)
    
    const customer = await customerService.retrieveCustomer(req.customer_id!, {
      relations: ["addresses"]
    })
    
    res.json({ customer })
  }
]

interface UpdateCustomerBody {
  first_name?: string
  last_name?: string
  phone?: string
  metadata?: Record<string, any>
}

export const POST = [
  authenticateClerkCustomer,
  async (req: MedusaRequest<UpdateCustomerBody>, res: MedusaResponse) => {
    const customerService: ICustomerModuleService = req.scope.resolve(Modules.CUSTOMER)
    const { first_name, last_name, phone, metadata } = req.body

    // Update customer details
    const updated = await customerService.updateCustomers(req.customer_id!, {
      first_name,
      last_name,
      phone,
      metadata: {
        ...req.customer!.metadata,
        ...metadata,
      }
    })

    res.json({ customer: updated })
  }
]