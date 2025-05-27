// src/modules/common/components/line-item-price/index.tsx
import { clx } from "@medusajs/ui"

import { getPercentageDiff } from "@lib/util/get-precentage-diff"
import { getPricesForVariant } from "@lib/util/get-product-price"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { extractLengthDetails } from "@lib/util/length-based-utils"
import { getLineItemTotalPrice } from "@lib/util/line-item-price-utils"

type LineItemPriceProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  style?: "default" | "tight"
}

const LineItemPrice = ({ item, style = "default" }: LineItemPriceProps) => {
  // Check if this is a length-based product
  const lengthDetails = extractLengthDetails(item.metadata)
  const isLengthBased = Boolean(lengthDetails)
  
  // For regular products, use the standard pricing logic
  if (!isLengthBased) {
    const { currency_code, calculated_price_number, original_price_number } =
      getPricesForVariant(item.variant) ?? {}

    const adjustmentsSum = (item.adjustments || []).reduce(
      (acc, adjustment) => adjustment.amount + acc,
      0
    )

    const originalPrice = original_price_number * item.quantity
    const currentPrice = calculated_price_number * item.quantity - adjustmentsSum
    const hasReducedPrice = currentPrice < originalPrice

    return (
      <div className="flex flex-col gap-x-2 text-ui-fg-subtle items-end">
        <div className="text-left">
          {hasReducedPrice && (
            <>
              <p>
                {style === "default" && (
                  <span className="text-ui-fg-subtle">Original: </span>
                )}
                <span
                  className="line-through text-ui-fg-muted"
                  data-testid="product-original-price"
                >
                  {convertToLocale({
                    amount: originalPrice,
                    currency_code,
                  })}
                </span>
              </p>
              {style === "default" && (
                <span className="text-ui-fg-interactive">
                  -{getPercentageDiff(originalPrice, currentPrice || 0)}%
                </span>
              )}
            </>
          )}
          <span
            className={clx("text-base-regular", {
              "text-ui-fg-interactive": hasReducedPrice,
            })}
            data-testid="product-price"
          >
            {convertToLocale({
              amount: currentPrice,
              currency_code,
            })}
          </span>
        </div>
      </div>
    )
  }
  
  // For length-based products, calculate the total price from metadata
  const totalPrice = getLineItemTotalPrice(item)
  const currencyCode = item.variant?.calculated_price?.currency_code || "CAD"
  
  const formattedTotalPrice = convertToLocale({
    amount: totalPrice,
    currency_code: currencyCode,
  })
  
  return (
    <div className="flex flex-col gap-x-2 text-ui-fg-subtle items-end">
      <div className="text-left">
        <span
          className="text-base-regular"
          data-testid="product-price"
        >
          {formattedTotalPrice}
        </span>
        {lengthDetails && style === "default" && (
          <div className="text-ui-fg-subtle text-small-regular">
            Includes cutting fee
          </div>
        )}
      </div>
    </div>
  )
}

export default LineItemPrice