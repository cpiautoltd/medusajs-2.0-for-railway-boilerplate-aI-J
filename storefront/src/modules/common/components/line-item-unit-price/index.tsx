// src/modules/common/components/line-item-unit-price/index.tsx
import { getPricesForVariant } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import { extractLengthDetails } from "@lib/util/length-based-utils"
import { getLineItemUnitPrice } from "@lib/util/line-item-price-utils"
import { convertToLocale } from "@lib/util/money"

type LineItemUnitPriceProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  style?: "default" | "tight"
}

const LineItemUnitPrice = ({
  item,
  style = "default",
}: LineItemUnitPriceProps) => {
  // Check if this is a length-based product
  const lengthDetails = extractLengthDetails(item.metadata)
  const isLengthBased = Boolean(lengthDetails)
  
  // For regular products, use the standard pricing logic
  if (!isLengthBased) {
    const {
      original_price,
      calculated_price,
      original_price_number,
      calculated_price_number,
      percentage_diff,
      currency_code,
    } = getPricesForVariant(item.variant) ?? {}
    
    const hasReducedPrice = calculated_price_number < original_price_number

    return (
      <div className="flex flex-col text-ui-fg-muted justify-center h-full">
        {hasReducedPrice && (
          <>
            <p>
              {style === "default" && (
                <span className="text-ui-fg-muted">Original: </span>
              )}
              <span
                className="line-through"
                data-testid="product-unit-original-price"
              >
                {original_price}
              </span>
            </p>
            {style === "default" && (
              <span className="text-ui-fg-interactive">-{percentage_diff}%</span>
            )}
          </>
        )}
        <span
          className={clx("text-base-regular", {
            "text-ui-fg-interactive": hasReducedPrice,
          })}
          data-testid="product-unit-price"
        >
          {calculated_price}
        </span>
      </div>
    )
  }
  
  // For length-based products, calculate the unit price from metadata
  const unitPrice = getLineItemUnitPrice(item)
  const formattedUnitPrice = convertToLocale({
    amount: unitPrice,
    currency_code: item.variant?.calculated_price?.currency_code || "USD",
  })
  
  return (
    <div className="flex flex-col text-ui-fg-muted justify-center h-full">
      <span className="text-base-regular" data-testid="product-unit-price">
        {formattedUnitPrice}
      </span>
      {lengthDetails && style === "default" && (
        <span className="text-small-regular">
          {lengthDetails.length} {lengthDetails.unitType || "inch"}
        </span>
      )}
    </div>
  )
}

export default LineItemUnitPrice