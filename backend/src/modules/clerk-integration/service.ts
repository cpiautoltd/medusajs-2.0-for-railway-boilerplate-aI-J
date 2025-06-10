// backend/src/modules/clerk-integration/service.ts
import { Logger } from "@medusajs/framework/types";
import { MedusaError } from "@medusajs/framework/utils";
import { createClerkClient, ClerkClient, verifyToken } from "@clerk/backend";
import { ClerkIntegrationOptions, ClerkUser, ClerkTokenData } from "./types";

type InjectedDependencies = {
  logger: Logger;
};

class ClerkIntegrationService {
  protected readonly logger_: Logger;
  protected readonly options_: ClerkIntegrationOptions;
  protected readonly clerk: ClerkClient;

  constructor(
    { logger }: InjectedDependencies,
    options: ClerkIntegrationOptions
  ) {
    this.logger_ = logger;
    this.options_ = options;

    this.clerk = createClerkClient({
      secretKey: options.secretKey,
    });

    this.logger_.info("Clerk Integration Service initialized");
  }

  /**
   * Validate options
   */
  static validateOptions(options: Record<any, any>) {
    if (!options.secretKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Clerk secret key is required"
      );
    }
    if (!options.publishableKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Clerk publishable key is required"
      );
    }
  }

  /**
   * Verify and decode a Clerk token
   */
  async verifyToken(token: string): Promise<ClerkTokenData | null> {
    try {
      const verifiedToken = await verifyToken(token, {
        secretKey: this.options_.secretKey,
        authorizedParties: this.options_.authorizedParties || [
          "http://localhost:3000",
          "http://localhost:8000",
          "http://localhost:5173", // Vite
        ],
      });

      return verifiedToken as ClerkTokenData;
    } catch (error) {
      this.logger_.error("Token verification failed:", error);
      return null;
    }
  }

  /**
   * Get user data from Clerk by user ID
   */
  async getUser(clerkUserId: string): Promise<ClerkUser> {
    try {
      const user = await this.clerk.users.getUser(clerkUserId);

      return {
        clerkUserId: user.id,
        email:
          user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
            ?.emailAddress || "",
        emailVerified:
          user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
            ?.verification?.status === "verified" || false,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        imageUrl: user.imageUrl,
        phoneNumber:
          user.phoneNumbers.find((p) => p.id === user.primaryPhoneNumberId)
            ?.phoneNumber || null,
        phoneVerified:
          user.phoneNumbers.find((p) => p.id === user.primaryPhoneNumberId)
            ?.verification?.status === "verified" || false,
        lastSignInAt: user.lastSignInAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        externalId: user.externalId,
        metadata: {
          publicMetadata: user.publicMetadata || {},
          privateMetadata: user.privateMetadata || {},
          unsafeMetadata: user.unsafeMetadata || {},
        },
      };
    } catch (error) {
      this.logger_.error(`Error fetching Clerk user ${clerkUserId}:`, error);
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Clerk user not found: ${clerkUserId}`
      );
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<ClerkUser | null> {
    try {
      const users = await this.clerk.users.getUserList({
        emailAddress: [email],
      });

      if (users.data.length === 0) {
        return null;
      }

      return this.getUser(users.data[0].id);
    } catch (error) {
      this.logger_.error(`Error fetching Clerk user by email ${email}:`, error);
      return null;
    }
  }

  /**
   * Update user metadata in Clerk
   */
  async updateUserMetadata(
    clerkUserId: string,
    metadata: {
      publicMetadata?: Record<string, any>;
      privateMetadata?: Record<string, any>;
      unsafeMetadata?: Record<string, any>;
    }
  ) {
    try {
      await this.clerk.users.updateUserMetadata(clerkUserId, metadata);
    } catch (error) {
      this.logger_.error(
        `Error updating Clerk user metadata ${clerkUserId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get session details
   */
  async getSession(sessionId: string) {
    try {
      return await this.clerk.sessions.getSession(sessionId);
    } catch (error) {
      this.logger_.error(`Error fetching session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Verify webhook payload
   */
  verifyWebhook(payload: string, headers: Record<string, string>): any {
    if (!this.options_.webhookSecret) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Webhook secret not configured"
      );
    }

    // Use Svix to verify the webhook
    const Webhook = require("svix").Webhook;
    const wh = new Webhook(this.options_.webhookSecret);

    try {
      return wh.verify(payload, {
        "svix-id": headers["svix-id"],
        "svix-timestamp": headers["svix-timestamp"],
        "svix-signature": headers["svix-signature"],
      });
    } catch (error) {
      this.logger_.error("Webhook verification failed:", error);
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Invalid webhook signature"
      );
    }
  }
}

export default ClerkIntegrationService;
