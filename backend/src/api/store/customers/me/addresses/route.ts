
// backend/src/api/store/customers/me/addresses/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { authenticateClerkCustomer } from "../../../../middlewares/clerk-auth"

export const GET = [
  authenticateClerkCustomer,
  async (req: MedusaRequest, res: MedusaResponse) => {
    const customerService = req.scope.resolve("customer")
    
    const customer = await customerService.retrieveCustomer(req.customer_id, {
      relations: ["addresses"]
    })

    res.json({ addresses: customer.addresses })
  }
]

export const POST = [
  authenticateClerkCustomer,
  async (req: MedusaRequest, res: MedusaResponse) => {
    const customerService = req.scope.resolve("customer")
    
    const address = await customerService.addAddresses({
      customer_id: req.customer_id,
      ...req.body
    })

    res.json({ address })
  }
]