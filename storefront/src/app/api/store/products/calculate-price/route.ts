// src/app/api/store/products/calculate-price/route.ts
import { NextRequest, NextResponse } from "next/server"

/**
 * API route to calculate the price of a length-based product
 * This endpoint connects to the Medusa backend to perform the price calculation
 */
export async function POST(request: NextRequest) {
  try {
    debugger;
    const body = await request.json()
    const { variant_id, selected_length, quantity = 1 } = body

    if (!variant_id || !selected_length) {
      return NextResponse.json(
        { message: "Missing required parameters" },
        { status: 400 }
      )
    }

    

    // Forward the request to Medusa backend
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/products/calculate-price`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY?.toString() || "",
          // ...request.headers,
        },
        body: JSON.stringify({
          variant_id,
          selected_length,
          quantity,
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { message: errorData.message || "Failed to calculate price" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error calculating price: api/store/products/calculate-price", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}