import { SubscriberArgs, type SubscriberConfig } from "@medusajs/medusa";
import { Modules } from "@medusajs/framework/utils";
import { BACKEND_URL, STOREFRONT_URL } from "lib/constants";
import { sendPasswordResetWorkflow } from "workflows/send-password-reset";

export default async function resetPasswordTokenHandler({
  event: {
    data: { entity_id: email, token, actor_type },
  },
  container,
}: SubscriberArgs<{ entity_id: string; token: string; actor_type: string }>) {
  const notificationModuleService = container.resolve(Modules.NOTIFICATION);

  const storeURL =
    process.env.NODE_ENV === "production"
      ? STOREFRONT_URL
      : "http://localhost:8000";
  const backendURL =
    process.env.NODE_ENV === "production"
      ? BACKEND_URL + "/app"
      : "http://localhost:9000/app";

  const resetLink = `${storeURL}/reset-password?token=${token}&email=${email}`;

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
