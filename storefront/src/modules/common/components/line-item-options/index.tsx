// src/modules/common/components/line-item-options/index.tsx
import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"
import { extractLengthDetails } from "@lib/util/length-based-utils"

type LineItemOptionsProps = {
  variant: HttpTypes.StoreProductVariant | undefined
  metadata?: Record<string, any> | null
  "data-testid"?: string
  "data-value"?: HttpTypes.StoreProductVariant
}

const LineItemOptions = ({
  variant,
  metadata,
  "data-testid": dataTestid,
  "data-value": dataValue,
}: LineItemOptionsProps) => {
  // Check if this is a length-based product by examining metadata
  const lengthDetails = extractLengthDetails(metadata)
  const isLengthBased = Boolean(lengthDetails)

  return (
    <div className="text-small-regular text-ui-fg-subtle">
      {variant && (
        <Text
          data-testid={dataTestid}
          data-value={dataValue}
          className="inline-block txt-medium text-ui-fg-subtle w-full overflow-hidden text-ellipsis"
        >
          Variant: {variant.title}
        </Text>
      )}
      
      {isLengthBased && lengthDetails && (
        <Text
          className="inline-block txt-medium text-ui-fg-subtle w-full overflow-hidden text-ellipsis"
          data-testid="length-details"
        >
          Length: {lengthDetails.length} {lengthDetails.unitType || "inch"}
        </Text>
      )}
    </div>
  )
}

export default LineItemOptions