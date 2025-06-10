import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { sendCustomerWelcomeWorkflow } from "../workflows/send-customer-welcome"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function customerCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  logger.info("customer created event subscribed successfully with data ==== " + JSON.stringify(data))


  await sendCustomerWelcomeWorkflow(container)
    .run({
      input: {
        id: data.id
      }
    })
}

export const config: SubscriberConfig = {
  event: "customer.created",
}