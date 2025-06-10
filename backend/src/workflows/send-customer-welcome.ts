import { 
  createWorkflow, 
  WorkflowResponse,
  // Assuming WorkflowData is also available if needed for type hinting the input
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { sendNotificationStep } from "./steps/send-notification"
import { CustomerDTO, NotificationDTO } from "@medusajs/framework/types" // Assuming NotificationDTO is available here, adjust if needed
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { container } from "@medusajs/framework"

type WorkflowInput = {
  id: string
}

type WorkflowOutput = {
  success: boolean
  message: string
  notifications?: NotificationDTO[] // Optional, if you want to return the notifications on success
}

export const sendCustomerWelcomeWorkflow = createWorkflow(
  "send-customer-welcome",
  ({ id }: WorkflowInput): WorkflowResponse<WorkflowOutput> => { 
    
    
      const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

    // Removed async and Promise from return type
    // Medusa's workflow engine handles the async resolution of steps like useQueryGraphStep internally.
    // You do NOT use 'await' directly here in the workflow definition function.
    const { data: customers } = useQueryGraphStep({
      entity: "customer",
      fields: [
        "id",
        "email",
        "first_name", 
        "last_name",
        "created_at",
      ],
      filters: {
        id: id,
      },
    })

    // The 'customers' variable here will be a "WorkflowData" object,
    // which the Medusa SDK correctly resolves when the workflow executes.
    // For type safety within the workflow definition, you might need to
    // access properties that are known to exist or provide fallbacks.
    const customer = customers[0] as CustomerDTO // This access is generally safe within Medusa workflows for array-like results

    // The SDK expects you to define the conditional logic based on what the steps would "eventually" yield.
    // If the step returns an empty array, 'customer' will be undefined.
    if (!customer) {
      return new WorkflowResponse({
        success: false,
        message: "Customer not found"
      })
    }
    
    logger.info("Customer found with details \n" + JSON.stringify(customer))

    // Similar to useQueryGraphStep, sendNotificationStep is also managed by the workflow engine.
    const notificationResult = sendNotificationStep([{
      to: customer.email,
      channel: "email",
      template: "customer-welcome",
      data: {
        customer: {
          first_name: customer.first_name || "Valued Customer",
          last_name: customer.last_name || "",
          email: customer.email,
        },
      },
    }])

    // On successful notification, return a success response with optional notification details
    return new WorkflowResponse({
      success: true,
      message: "Customer welcome notification sent successfully",
      notifications: notificationResult, // This will be a WorkflowData<NotificationDTO[]> or similar
    })
  }
)