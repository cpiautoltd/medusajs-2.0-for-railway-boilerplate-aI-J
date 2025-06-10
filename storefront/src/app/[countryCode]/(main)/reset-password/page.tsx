"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useFormState } from "react-dom"
import Input from "@modules/common/components/input"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { resetPassword } from "@lib/data/customer"



export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const email = searchParams.get("email")
  const [message, formAction] = useFormState(resetPassword, null)
  const [isSubmitted, setIsSubmitted] = useState(false)

  if (!token || !email) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="max-w-sm w-full">
          <h1 className="text-large-semi text-center mb-6">Invalid Reset Link</h1>
          <p className="text-center text-base-regular text-ui-fg-base mb-4">
            The password reset link is invalid or has expired.
          </p>
          <LocalizedClientLink
            href="/account/login"
            className="w-full btn btn-primary"
          >
            Return to Login
          </LocalizedClientLink>
        </div>
      </div>
    )
  }

  if (isSubmitted && !message) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="max-w-sm w-full">
          <h1 className="text-large-semi text-center mb-6">Password Reset Successfully</h1>
          <p className="text-center text-base-regular text-ui-fg-base mb-4">
            Your password has been reset successfully. You can now log in with your new password.
          </p>
          <LocalizedClientLink
            href="/account/login"
            className="w-full btn btn-primary"
          >
            Go to Login
          </LocalizedClientLink>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
      <div className="max-w-sm w-full">
        <h1 className="text-large-semi text-center mb-6">Reset Your Password</h1>
        <p className="text-center text-base-regular text-ui-fg-base mb-8">
          Enter your new password below.
        </p>
        <form
          className="w-full"
          action={async (formData) => {
            formData.append("token", token)
            formData.append("email", email)
            await formAction(formData)
            if (!message) {
              setIsSubmitted(true)
            }
          }}
        >
          <div className="flex flex-col w-full gap-y-2">
            <Input
              label="New Password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              data-testid="password-input"
            />
            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              data-testid="confirm-password-input"
            />
          </div>
          <ErrorMessage error={message} data-testid="reset-password-error" />
          <SubmitButton data-testid="reset-password-button" className="w-full mt-6">
            Reset Password
          </SubmitButton>
        </form>
        <div className="text-center mt-6">
          <LocalizedClientLink
            href="/account"
            className="text-ui-fg-base text-small-regular underline"
          >
            Back to Login
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}