import { 
  createWorkflow, 
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { sendNotificationStep } from "./steps/send-notification"

type WorkflowInput = {
  email: string
  token: string
  resetLink: string
}

export const sendPasswordResetWorkflow = createWorkflow(
  "send-password-reset",
  ({ email, resetLink }: WorkflowInput) => {
    // Generate reset token


    // Query customer data
    // @ts-ignore
    // const { data: customers } = useQueryGraphStep({
    //   entity: "customer",
    //   fields: [
    //     "id",
    //     "email",
    //     "first_name",
    //     "last_name",
    //   ],
    //   filters: {
    //     email,
    //   },
    // })

    // const customer = customers[0]
    
    // if (!customer) {
    //   return new WorkflowResponse({
    //     success: false,
    //     message: "Customer not found"
    //   })
    // }

    // Construct reset link
    // const storeUrl = process.env.NEXT_PUBLIC_STORE_URL || "http://localhost:8000"
    // const resetLink = `${storeUrl}/account/reset-password?token=${token}&email=${email}`

    // Send notification
    const notification = sendNotificationStep([{
      to: email,
      channel: "email",
      template: "password-reset",
      data: {
        customer: {
          first_name: "Valued Customer",
          last_name: "",
          email: email,
        },
        resetLink,
      },
    }])

    return new WorkflowResponse({
        success: true
    })

    // return new WorkflowResponse({
    //   success: true,
    //   message: "",
    //   token: token,
    //   notification
    // })
  }
)