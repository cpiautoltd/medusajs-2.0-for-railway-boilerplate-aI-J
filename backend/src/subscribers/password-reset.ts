import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/medusa";
import { STOREFRONT_URL } from "lib/constants";
import { sendPasswordResetWorkflow } from "workflows/send-password-reset";

export default async function resetPasswordTokenHandler({
  event: {
    data: { entity_id: email, token, actor_type },
  },
  container,
}: SubscriberArgs<{ entity_id: string; token: string; actor_type: string }>) {

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  logger.info("reset password token handler with storefrontURL")
  logger.info(STOREFRONT_URL)

  const resetLink = `${STOREFRONT_URL ?? 'http://localhost:9000'}/reset-password?token=${token}&email=${email}`;


  console.log("The reset link is : " + resetLink)

  await sendPasswordResetWorkflow(container).run({
    input: {
      email,
      token,
      resetLink,
    },
  });

  

  //   await notificationModuleService.createNotifications({
  //     to: email,
  //     channel: "email",
  //     template: "reset-password-template",
  //     data: {
  //       // a URL to a frontend application
  //       url: `${urlPrefix}/reset-password?token=${token}&email=${email}`,
  //     },
  //   })
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
};
