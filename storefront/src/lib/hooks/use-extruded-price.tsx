import { useState, useEffect } from "react"
import { convertToLocale } from "@lib/util/money"
import { ExtrudedProduct } from "types/global"

interface ExtrudedPriceResult {
  calculatedPrice: number
  formattedPrice: string
  isLoading: boolean
  error: string | null
}

export const useExtrudedPrice = (
  variantId: string | undefined,
  extrudedProduct: ExtrudedProduct | undefined,
  selectedLength: number,
  quantity: number,
  currencyCode: string
): ExtrudedPriceResult => {
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const calculatePrice = async () => {
      if (!variantId || !extrudedProduct || !selectedLength) {
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        // We could use an API endpoint here, but for simplicity and to reduce API calls,
        // we'll calculate it directly based on the extruded product data
        // This should be replaced with an actual API call in production
        
        const basePrice = extrudedProduct.price_per_unit * selectedLength
        const totalPrice = basePrice + extrudedProduct.cut_price
        const finalPrice = totalPrice * quantity
        
        setCalculatedPrice(finalPrice)
      } catch (err) {
        console.error("Error calculating price:", err)
        setError("Failed to calculate price. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    calculatePrice()
  }, [variantId, extrudedProduct, selectedLength, quantity])

  const formattedPrice = convertToLocale({
    amount: calculatedPrice,
    currency_code: currencyCode,
  })

  return {
    calculatedPrice,
    formattedPrice,
    isLoading,
    error,
  }
}

// This is a more accurate implementation that would call the backend API
export const useExtrudedPriceWithAPI = (
  variantId: string | undefined,
  selectedLength: number,
  quantity: number,
  currencyCode: string
): ExtrudedPriceResult => {
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const calculatePrice = async () => {
      if (!variantId || !selectedLength) {
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/store/products/calculate-price", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            variant_id: variantId,
            selected_length: selectedLength,
            quantity,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to calculate price")
        }

        const data = await response.json()
        setCalculatedPrice(data.calculated_price)
      } catch (err) {
        console.error("Error calculating price:", err)
        setError("Failed to calculate price. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    calculatePrice()
  }, [variantId, selectedLength, quantity])

  const formattedPrice = convertToLocale({
    amount: calculatedPrice,
    currency_code: currencyCode,
  })

  return {
    calculatedPrice,
    formattedPrice,
    isLoading,
    error,
  }
}