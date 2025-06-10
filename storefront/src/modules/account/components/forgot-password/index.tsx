import { useState } from "react"
import { useFormState } from "react-dom"
import Input from "@modules/common/components/input"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import { forgotPassword } from "@lib/data/customer"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const ForgotPassword = ({ setCurrentView }: Props) => {
  const [message, formAction] = useFormState(forgotPassword, null)
  const [isSubmitted, setIsSubmitted] = useState(false)

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center"
      data-testid="forgot-password-page"
    >
      <h1 className="text-large-semi uppercase mb-6">Forgot Password?</h1>
      
      {!isSubmitted ? (
        <>
          <p className="text-center text-base-regular text-ui-fg-base mb-8">
            Enter your email address and we will send you a link to reset your password.
          </p>
          <form
            className="w-full"
            action={async (formData) => {
              await formAction(formData)
              setIsSubmitted(true)
            }}
          >
            <div className="flex flex-col w-full gap-y-2">
              <Input
                label="Email"
                name="email"
                type="email"
                title="Enter a valid email address."
                autoComplete="email"
                required
                data-testid="email-input"
              />
            </div>
            <ErrorMessage error={message} data-testid="forgot-password-error-message" />
            <SubmitButton data-testid="forgot-password-button" className="w-full mt-6">
              Send Reset Link
            </SubmitButton>
          </form>
        </>
      ) : (
        <div className="text-center">
          <p className="text-base-regular text-ui-fg-base mb-4">
            If an account exists with this email, you will receive a password reset link.
          </p>
          <p className="text-base-regular text-ui-fg-base">
            Please check your email and follow the instructions to reset your password.
          </p>
        </div>
      )}
      
      <span className="text-center text-ui-fg-base text-small-regular mt-6">
        Remember your password?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="underline"
          data-testid="sign-in-button"
        >
          Sign in
        </button>
      </span>
    </div>
  )
}

export default ForgotPassword