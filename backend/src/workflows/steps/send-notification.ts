import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CreateNotificationDTO } from "@medusajs/framework/types"

export const sendNotificationStep = createStep(
  "send-notification",
  async (data: CreateNotificationDTO[], { container }) => {
    const notificationModuleService = container.resolve(
      Modules.NOTIFICATION
    )

    // console.log("\n\nCreating a notification and sending it.......")
    // console.log(data[0])
    const notification = await notificationModuleService.createNotifications(data)
    return new StepResponse(notification)
  }
)