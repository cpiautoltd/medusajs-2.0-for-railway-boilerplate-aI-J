// backend/src/api/store/customers/exists/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { CLERK_INTEGRATION_MODULE } from "../../../../modules/clerk-integration"
import ClerkIntegrationService from "../../../../modules/clerk-integration/service"

interface CustomerExistsBody {
  email: string
}

export const POST = async (req: MedusaRequest<CustomerExistsBody>, res: MedusaResponse) => {
  const { email } = req.body
  
  if (!email) {
    return res.status(400).json({ error: "Email is required" })
  }

  const clerkService: ClerkIntegrationService = req.scope.resolve(CLERK_INTEGRATION_MODULE)
  
  try {
    const clerkUser = await clerkService.getUserByEmail(email)
    
    res.json({ 
      exists: !!clerkUser,
      registered: !!clerkUser
    })
  } catch (error) {
    res.status(500).json({ error: "Failed to check user existence" })
  }
}