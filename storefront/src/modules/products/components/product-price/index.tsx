import { clx } from "@medusajs/ui"

import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@lib/util/money"

type CustomPriceType = {
  calculated_amount: number
  original_amount: number
  currency_code: string
}

export default function ProductPrice({
  product,
  variant,
  calculatedPrice,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
  calculatedPrice?: CustomPriceType | null
}) {
  // If we have a length-based price calculation, use that
  if (calculatedPrice) {
    const originalPrice = convertToLocale({ 
      amount: calculatedPrice.original_amount,
      currency_code: calculatedPrice.currency_code
    })
    
    const calculatedPriceFormatted = convertToLocale({ 
      amount: calculatedPrice.calculated_amount,
      currency_code: calculatedPrice.currency_code
    })
    
    const isDiscounted = calculatedPrice.calculated_amount < calculatedPrice.original_amount

    // Calculate percentage difference if it's a discount
    const percentageDiff = isDiscounted 
      ? Math.round(((calculatedPrice.original_amount - calculatedPrice.calculated_amount) / calculatedPrice.original_amount) * 100)
      : 0

    return (
      <div className="flex flex-col text-ui-fg-base">
        <span
          className={clx("text-xl-semi", {
            "text-ui-fg-interactive": isDiscounted,
          })}
        >
          {!variant && "From "}
          <span
            data-testid="product-price"
            data-value={calculatedPrice.calculated_amount}
          >
            {calculatedPriceFormatted}
          </span>
        </span>
        {isDiscounted && (
          <>
            <p>
              <span className="text-ui-fg-subtle">Original: </span>
              <span
                className="line-through"
                data-testid="original-product-price"
                data-value={calculatedPrice.original_amount}
              >
                {originalPrice}
              </span>
            </p>
            <span className="text-ui-fg-interactive">
              -{percentageDiff}%
            </span>
          </>
        )}
      </div>
    )
  }

  // Otherwise use the standard pricing
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <div className="block w-32 h-9 bg-gray-100 animate-pulse" />
  }

  return (
    <div className="flex flex-col text-ui-fg-base">
      <span
        className={clx("text-xl-semi", {
          "text-ui-fg-interactive": selectedPrice.price_type === "sale",
        })}
      >
        {!variant && "From "}
        <span
          data-testid="product-price"
          data-value={selectedPrice.calculated_price_number}
        >
          {selectedPrice.calculated_price}
        </span>
      </span>
      {selectedPrice.price_type === "sale" && (
        <>
          <p>
            <span className="text-ui-fg-subtle">Original: </span>
            <span
              className="line-through"
              data-testid="original-product-price"
              data-value={selectedPrice.original_price_number}
            >
              {selectedPrice.original_price}
            </span>
          </p>
          <span className="text-ui-fg-interactive">
            -{selectedPrice.percentage_diff}%
          </span>
        </>
      )}
    </div>
  )
}