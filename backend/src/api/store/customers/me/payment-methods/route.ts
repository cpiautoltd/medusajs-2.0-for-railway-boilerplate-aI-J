// // backend/src/api/store/customers/me/payment-methods/route.ts
// import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
// import { IPaymentModuleService } from "@medusajs/framework/types"
// import { Modules } from "@medusajs/framework/utils"
// import { authenticateClerkCustomer } from "../../../../middlewares/clerk-auth"
// import "../../../../types"

// export const GET = [
//   authenticateClerkCustomer,
//   async (req: MedusaRequest, res: MedusaResponse) => {
//     const paymentService: IPaymentModuleService = req.scope.resolve(Modules.PAYMENT)
    
//     try {
//       // Get payment sessions for customer
//       const paymentCollections = await paymentService.listPaymentCollections({},
//       {
//         filters: {
          
//         },
//         relations: ['payment_sessions', 'payment_sessions.payment_provider'],
//         order: { created_at: 'DESC' }
//       },
//       )

//       // Extract payment methods from sessions
//       const paymentMethods = paymentCollections.flatMap(collection => 
//         collection.payment_sessions?.map(session => ({
//           id: session.id,
//           provider_id: session.provider_id,
//           data: session.data,
//           status: session.status
//         })) || []
//       )

//       res.json({ payment_methods: paymentMethods })
//     } catch (error) {
//       res.status(500).json({ 
//         error: "Failed to fetch payment methods",
//         details: error.message 
//       })
//     }
//   }
// ]
