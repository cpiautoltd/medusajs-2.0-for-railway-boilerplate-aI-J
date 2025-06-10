import { SubscriberArgs, type SubscriberConfig } from "@medusajs/medusa";
import { Modules } from "@medusajs/framework/utils";
import { STOREFRONT_URL } from "lib/constants";
import { sendPasswordResetWorkflow } from "workflows/send-password-reset";

export default async function resetPasswordTokenHandler({
  event: {
    data: { entity_id: email, token, actor_type },
  },
  container,
}: SubscriberArgs<{ entity_id: string; token: string; actor_type: string }>) {


  const resetLink = `${STOREFRONT_URL}/reset-password?token=${token}&email=${email}`;



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
