// backend/src/modules/clerk-integration/types.ts
import { CustomerDTO } from "@medusajs/framework/types"

export interface ClerkIntegrationOptions {
  secretKey: string
  publishableKey: string
  webhookSecret?: string
  authorizedParties?: string[]
}

export interface ClerkUser {
  clerkUserId: string
  email: string
  emailVerified: boolean
  firstName: string | null
  lastName: string | null
  username: string | null
  imageUrl: string | null
  phoneNumber: string | null
  phoneVerified: boolean
  lastSignInAt: number | null
  createdAt: number
  updatedAt: number
  externalId: string | null
  metadata: {
    publicMetadata: Record<string, any>
    privateMetadata: Record<string, any>
    unsafeMetadata: Record<string, any>
  }
}

export interface ClerkSession {
  sessionId: string
  userId: string
  status: string
  lastActiveAt: number
  expireAt: number
}

export interface ClerkTokenData {
  azp?: string
  exp: number
  iat: number
  iss: string
  nbf: number
  sid?: string
  sub: string
}

export interface CustomerWithClerk extends CustomerDTO {
  clerk_user_id?: string
  clerk_session_id?: string
  clerk_metadata?: Record<string, any>
}