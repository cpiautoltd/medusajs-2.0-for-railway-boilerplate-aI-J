import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Button,
  Link,
  Tailwind,
} from "@react-email/components";
import * as React from "react";
import { LOGO_URL } from "../constants";


// const LOGO_URL = "https://studio.cpiautomation.com/assets/72c2132b-8656-4d27-b029-70e5f968b297"

export interface PasswordResetEmailProps {
  customer: {
    first_name: string;
    last_name: string;
    email: string;
  };
  resetLink: string;
}


export const PasswordResetEmailComponent = ({ customer, resetLink }: PasswordResetEmailProps) => {
  return (
    <Tailwind>
      <Html className="font-sans bg-gray-100">
        <Head />
        <Preview>Reset your password for CPI Automation Store</Preview>
        <Body className="bg-white my-10 mx-auto w-full max-w-2xl">
          {/* Header */}
          <Section className="bg-[#262626] text-white px-6 py-6 text-center">
            <Img src={LOGO_URL} width="280" alt="CPI Automation Store" className="mx-auto" />
          </Section>

          {/* Content */}
          <Container className="p-6">
            <Heading className="text-2xl font-bold text-center text-gray-800">
              Password Reset Request
            </Heading>
            
            <Text className="text-gray-600 mt-4">
              Hi {customer.first_name},
            </Text>
            
            <Text className="text-gray-600 mt-2">
              We received a request to reset the password for your Medusa Store account 
              associated with {customer.email}.
            </Text>

            <Text className="text-gray-600 mt-4">
              To reset your password, please click the button below:
            </Text>

            <Section className="text-center mt-8 mb-8">
              <Button
                href={resetLink}
                className="bg-[#262626] text-white font-semibold py-3 px-8 rounded-md inline-block no-underline"
              >
                Reset Password
              </Button>
            </Section>

            <Text className="text-gray-600 text-sm">
              Or copy and paste this link into your browser:
            </Text>
            <Text className="text-gray-600 text-sm break-all">
              <Link href={resetLink} className="text-blue-600 underline">
                {resetLink}
              </Link>
            </Text>

            <Text className="text-gray-600 mt-6">
              <strong>Important:</strong> This password reset link will expire in 1 hour 
              for security reasons.
            </Text>

            <Text className="text-gray-600 mt-4">
              If you didn't request a password reset, please ignore this email or contact 
              our support team if you have concerns about your account security.
            </Text>

            <Text className="text-gray-600 mt-6">
              Best regards,<br />
              The CPI Automation Store Team
            </Text>
          </Container>

          {/* Footer */}
          <Section className="bg-gray-100 px-6 py-4 text-center">
            <Text className="text-gray-500 text-sm">
              This is an automated email. Please do not reply to this message.
            </Text>
            <Text className="text-gray-400 text-xs mt-2">
              © {new Date().getFullYear()} CPI Automation Store. All rights reserved.
            </Text>
          </Section>
        </Body>
      </Html>
    </Tailwind>
  );
};

export const passwordResetEmail = (props: PasswordResetEmailProps) => (
  <PasswordResetEmailComponent {...props} />
);

const mockPasswordResetObj = {
  customer: {
    first_name: "John",
    last_name: "Doe",
    email: 'johndoe@example.com'
  },
  resetLink: 'http://localhost:8000'
}

export default () => <PasswordResetEmailComponent {...mockPasswordResetObj} />