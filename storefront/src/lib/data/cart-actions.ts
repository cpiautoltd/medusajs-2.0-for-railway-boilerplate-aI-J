"use server"

import { getCartId, getAuthHeaders } from "@lib/data/cookies"
import { revalidateTag } from "next/cache"
import medusaError from "@lib/util/medusa-error"
import { getOrSetCart } from "./cart"

/**
 * Add a length-based product to the cart
 */
export async function addLengthBasedToCart({
  variantId,
  quantity,
  selectedLength,
  countryCode,
  endtapConfig = {}
}: {
  variantId: string
  quantity: number
  selectedLength: number
  countryCode: string
  endtapConfig?: {
    left?: string,
    right?: string
  }
}) {
  if (!variantId) {
    throw new Error("Missing variant ID when adding to cart")
  }

  console.log(" \n\n +++++++++++++++++++++++++++++++++++++++++++++++++++++ \n", "Adding length-based product to cart: ", variantId, " with quantity: ", quantity, " and selectedLength: ", selectedLength, " \n\n +++++++++++++++++++++++++++++++++++++++++++++++++++++ \n")

  // Get or create cart
  const cart = await getOrSetCart(countryCode)
  if (!cart) {
    throw new Error("Error retrieving or creating cart")
  }

  // Call the specific endpoint for length-based products
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/carts/${cart.id}/line-items-length`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY?.toString() || "",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          variant_id: variantId,
          quantity,
          selectedLength,
          endtapConfig
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to add length-based product to cart")
    }

    // Revalidate cart data
    revalidateTag("cart")
    return { success: true }
  } catch (error) {
    console.error("Error adding length-based product to cart:", error)
    throw medusaError(error)
  }
}

/**
 * Calculate the price of a length-based product without adding it to cart
 */
export async function calculateExtrudedPrice({
  variantId,
  selectedLength,
  quantity = 1,
  endtapConfig
}: {
  variantId: string
  selectedLength: number
  quantity?: number
  endtapConfig: {
    left?: string,
    right?: string
  } | null
}) {

  console.log("We are in calculateExtrudedPrice : with variantID", variantId);
  console.log("We are in calculateExtrudedPrice : with endtapConfig", endtapConfig);
  console.log("We are in calculateExtrudedPrice : with selectedLength", selectedLength);

  if (!variantId || !selectedLength) {
    throw new Error("Missing required parameters for price calculation")
  }

  // debugger;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/products/calculate-price`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY?.toString() || "",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          variant_id: variantId,
          selected_length: selectedLength,
          quantity,
          endtapConfig
        }),
      }
    )

    console.log("response at calculateExtrudedPrice : ", response)

    if (!response.ok) {
      console.log("!!!!!!!!!!! RESPONSE NOT OK!!!!!!!!!!!!!!!!")
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to calculate price")
    }

    const data = await response.json()

    // console.log("data at calculateExtrudedPrice : ", data)
    return data
  } catch (error) {
    console.error("Error calculating price: calculateExtrudedPrice", error)
    throw medusaError(error)
  }
}