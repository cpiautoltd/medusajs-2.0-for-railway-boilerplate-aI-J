"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { cache } from "react"
import { getAuthHeaders, removeAuthToken, setAuthToken } from "./cookies"

export const getCustomer = cache(async function () {
  return await sdk.store.customer
    .retrieve({}, { next: { tags: ["customer"] }, ...getAuthHeaders() })
    .then(({ customer }) => customer)
    .catch(() => null)
})

export const updateCustomer = cache(async function (
  body: HttpTypes.StoreUpdateCustomer
) {
  const updateRes = await sdk.store.customer
    .update(body, {}, getAuthHeaders())
    .then(({ customer }) => customer)
    .catch(medusaError)

  revalidateTag("customer")
  return updateRes
})

export async function signup(_currentState: unknown, formData: FormData) {
  const password = formData.get("password") as string
  const customerForm = {
    email: formData.get("email") as string,
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    phone: formData.get("phone") as string,
  }

  try {
    const token = await sdk.auth.register("customer", "emailpass", {
      email: customerForm.email,
      password: password,
    })

    const customHeaders = { authorization: `Bearer ${token}` }

    const { customer: createdCustomer } = await sdk.store.customer.create(
      customerForm,
      {},
      customHeaders
    )

    const loginToken = await sdk.auth.login("customer", "emailpass", {
      email: customerForm.email,
      password,
    })

    setAuthToken(
      typeof loginToken === "string" ? loginToken : loginToken.location
    )

    revalidateTag("customer")
    return createdCustomer
  } catch (error: any) {
    return error.toString()
  }
}

export async function login(_currentState: unknown, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  try {
    await sdk.auth
      .login("customer", "emailpass", { email, password })
      .then((token) => {
        setAuthToken(typeof token === "string" ? token : token.location)
        revalidateTag("customer")
      })
  } catch (error: any) {
    return error.toString()
  }
}

export async function signout(countryCode: string) {
  await sdk.auth.logout()
  removeAuthToken()
  revalidateTag("auth")
  revalidateTag("customer")
  redirect(`/${countryCode}/account`)
}

export const addCustomerAddress = async (
  _currentState: unknown,
  formData: FormData
): Promise<any> => {
  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
    phone: formData.get("phone") as string,
  }

  return sdk.store.customer
    .createAddress(address, {}, getAuthHeaders())
    .then(({ customer }) => {
      revalidateTag("customer")
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const deleteCustomerAddress = async (
  addressId: string
): Promise<void> => {
  await sdk.store.customer
    .deleteAddress(addressId, getAuthHeaders())
    .then(() => {
      revalidateTag("customer")
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const updateCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  const addressId = currentState.addressId as string

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
    phone: formData.get("phone") as string,
  }

  return sdk.store.customer
    .updateAddress(addressId, address, {}, getAuthHeaders())
    .then(() => {
      revalidateTag("customer")
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const forgotPassword = async (
  _currentState: unknown,
  formData: FormData
) => {
  const email = formData.get("email") as string

  try {
    await sdk.auth
      .resetPassword("customer", "emailpass", {
        identifier: email,
      })
      .then(() => {
        return "If an account exists with the specified email, it'll receive instructions to reset the password."
        // setAuthToken(typeof token === 'string' ? token : token.location)
        // revalidateTag("customer")
      })
  } catch (error: any) {
    return "If an account exists with the specified email, it'll receive instructions to reset the password."
  }
}

export const resetPassword = async (
  _currentState: unknown,
  formData: FormData
) => {
  const email = formData.get("email") as string
  const token = formData.get("token") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string
  
  if (password !== confirmPassword && password.length !== 0) {
    return "Passwords do not match"
  }
  
  if (!email) {
    return "Invalid or expired URL. Please try again in a while or contact support"
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/auth/customer/emailpass/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        email,
        password
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    console.log("Password updated successfully with response", response.json())

    // Password reset successfully!
    revalidateTag("customer")
    
  } catch (error) {
    console.log("An error occurred while resetting user's password", error)
    console.log("Here is the formdata", formData)
    // alert(`Couldn't reset password: ${error.message}`)
    throw error // Re-throw to handle in calling code if needed
  }
}

// export const resetPassword = async (
//   _currentState: unknown,
//   formData: FormData
// ) => {
//   const email = formData.get("email") as string
//   const token = formData.get("token") as string
//   const password = formData.get("password") as string
//   const confirmPassword = formData.get("confirmPassword") as string

//   if (password !== confirmPassword && password.length !== 0) {
//     return "Passwords do not match"
//   }

//   if (!email) {
//     return "Invalid or expired URL. Please try again in a while or contact support"
//   }
//   sdk.auth
//     .updateProvider(
//       "customer",
//       "emailpass",
//       {
//         email,
//         password,
//       },
//       token
//     )

//     .then(() => {
//       // alert("Password reset successfully!")
//       // revalidateTag("customer")
//     })

//     .catch((error) => {
//       console.log("An error occured while resetting user's password", error)
//       console.log("Here is the formdata", formData)
//       // alert(`Couldn't reset password: ${error.message}`)
//     })

//     .finally(() => {})
// }
