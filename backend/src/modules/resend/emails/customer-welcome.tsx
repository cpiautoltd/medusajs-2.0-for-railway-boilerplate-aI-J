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
  Tailwind,
} from "@react-email/components";
import * as React from "react";
import { LOGO_URL } from "../constants";
import { STOREFRONT_URL } from "lib/constants";

export interface CustomerWelcomeEmailProps {
  customer: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const STORE_URL = STOREFRONT_URL ?? "http://localhost:8000";

export const CustomerWelcomeEmailComponent = ({ customer }: CustomerWelcomeEmailProps) => {
  return (
    <Tailwind>
      <Html className="font-sans bg-gray-100">
        <Head />
        <Preview>Welcome to CPI Automation Store, {customer.first_name}!</Preview>
        <Body className="bg-white my-10 mx-auto w-full max-w-2xl">
          {/* Header */}
          <Section className="bg-[#262626] text-white px-6 py-6 text-center">
            <Img src={LOGO_URL} width="280" alt="Medusa Store" className="mx-auto" />
          </Section>

          {/* Welcome Message */}
          <Container className="p-6">
            <Heading className="text-2xl font-bold text-center text-gray-800">
              Welcome to CPI Automation Store, {customer.first_name}!
            </Heading>
            
            <Text className="text-gray-600 mt-4">
              Dear {customer.first_name} {customer.last_name},
            </Text>
            
            <Text className="text-gray-600 mt-2">
              Thank you for creating an account with us. We're thrilled to have you as part of 
              our community!
            </Text>

            <Text className="text-gray-600 mt-4">
              With your new account, you can enjoy:
            </Text>
            
            <Container className="mt-4 mb-6 pl-6">
              <Text className="text-gray-600">• Fast and easy checkout</Text>
              <Text className="text-gray-600">• Track your orders and order history</Text>
              <Text className="text-gray-600">• Save multiple shipping addresses</Text>
              <Text className="text-gray-600">• Exclusive member-only offers</Text>
            </Container>

            <Section className="text-center mt-8 mb-8">
              <Button
                href={`${STORE_URL}/account`}
                className="bg-[#262626] text-white font-semibold py-3 px-8 rounded-md inline-block no-underline"
              >
                Go to My Account
              </Button>
            </Section>

            <Text className="text-gray-600 mt-6">
              If you have any questions or need assistance, our customer support team is 
              always here to help.
            </Text>

            <Text className="text-gray-600 mt-4">
              Happy shopping!
            </Text>
            
            <Text className="text-gray-600 mt-2">
              The CPI Automation Store Team
            </Text>
          </Container>

          {/* Footer */}
          <Section className="bg-gray-100 px-6 py-4 text-center">
            <Text className="text-gray-500 text-sm">
              This email was sent to {customer.email}
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

export const customerWelcomeEmail = (props: CustomerWelcomeEmailProps) => (
  <CustomerWelcomeEmailComponent {...props} />
);

const mockNewUser = {
  "customer" : {
      first_name: 'Ted',
      last_name: 'Mosby',
      email: 'tedmosby222@yopmail.com'
    }}
// @ts-ignore
export default () => <CustomerWelcomeEmailComponent {...mockNewUser} />;