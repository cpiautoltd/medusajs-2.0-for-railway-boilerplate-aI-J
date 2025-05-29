"use client"

import { Table, Text, clx } from "@medusajs/ui"

// src/modules/cart/components/item/index.tsx
import { updateLineItem } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import CartItemSelect from "@modules/cart/components/cart-item-select"
import ErrorMessage from "@modules/checkout/components/error-message"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import Thumbnail from "@modules/products/components/thumbnail"
import { useState } from "react"
import { extractLengthDetails } from "@lib/util/length-based-utils"
import { convertToLocale } from "@lib/util/money"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "full" | "preview"
}

const Item = ({ item, type = "full" }: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { handle } = item.variant?.product ?? {}

  // Check if this is a length-based product by examining metadata
  const lengthDetails = extractLengthDetails(item.metadata)
  const isLengthBased = Boolean(lengthDetails)

  console.log("Redering the cart item component for line item", item.cart_id)

  console.log(
    "\n +++++++++++++++++++++ \n The Item is : ",
    item,
    " \n +++++++++++++++++++++ \n"
  )

  console.log(
    "\n +++++++++++++++++++++ \n The metadata is : ",
    item.metadata,
    " \n +++++++++++++++++++++ \n"
  )
  console.log(
    "\n +++++++++++++++++++++ \n The lengthDetails is : ",
    lengthDetails,
    " \n +++++++++++++++++++++ \n"
  )

  const changeQuantity = async (quantity: number) => {
    setError(null)
    setUpdating(true)

    await updateLineItem({
      lineId: item.id,
      quantity,
    })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setUpdating(false)
      })
  }

  // TODO: Update this to grab the actual max inventory
  const maxQtyFromInventory = 100
  const maxQuantity = item.variant?.manage_inventory ? 100 : maxQtyFromInventory

  const leftTapPrice = convertToLocale({
    amount: lengthDetails?.endtaps?.left?.price,
    currency_code:
      item.variant?.calculated_price?.currency_code?.toUpperCase() || "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const rightTapPrice = convertToLocale({
    amount: lengthDetails?.endtaps?.right?.price,
    currency_code:
      item.variant?.calculated_price?.currency_code?.toUpperCase() || "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return (
    <Table.Row className="w-full" data-testid="product-row">
      <Table.Cell className="!pl-0 p-4 w-24">
        <LocalizedClientLink
          href={`/products/${handle}`}
          className={clx("flex", {
            "w-16": type === "preview",
            "small:w-24 w-12": type === "full",
          })}
        >
          <Thumbnail
            thumbnail={item.variant?.product?.thumbnail}
            images={item.variant?.product?.images}
            size="square"
          />
        </LocalizedClientLink>
      </Table.Cell>

      <Table.Cell className="text-left">
        <Text
          className="txt-medium-plus text-ui-fg-base"
          data-testid="product-title"
        >
          {item.product_title}
        </Text>
        {!isLengthBased && (
          <LineItemOptions
            variant={item.variant}
            data-testid="product-variant"
          />
        )}

        {/* Display length information for length-based products */}
        {isLengthBased && lengthDetails && (
          <div className="text-ui-fg-subtle text-small-regular space-y-1">
            <Text className="block">
              Length: {lengthDetails.length} {lengthDetails.unitType || "inch"}
            </Text>

            {/* Display endtap information if available */}
            {(lengthDetails.endtaps?.left || lengthDetails.endtaps?.right) && (
              <div>
                <Text className="block font-medium">Endtaps:</Text>
                <div className="ml-3 text-xs">
                  {lengthDetails.endtaps.left && (
                    <div>
                      <strong>L:</strong>{" "}
                      {
                        lengthDetails.endtaps.left?.service_type?.split(
                          " End Tap"
                        )[0]
                      }{" "}
                      ({lengthDetails.endtaps.left?.tap_size}){" - "}
                      {leftTapPrice}
                    </div>
                  )}
                  {lengthDetails.endtaps.right && (
                    <div>
                      <strong>R:</strong>{" "}
                      {
                        lengthDetails.endtaps.right?.service_type?.split(
                          " End Tap"
                        )[0]
                      }{" "}
                      ({lengthDetails.endtaps.right?.tap_size}){" - "}
                      {leftTapPrice}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Table.Cell>

      {type === "full" && (
        <Table.Cell>
          <div className="flex gap-2 items-center w-28">
            <DeleteButton id={item.id} data-testid="product-delete-button" />
            <CartItemSelect
              value={item.quantity}
              onChange={(value) => changeQuantity(parseInt(value.target.value))}
              className="w-14 h-10 p-4"
              data-testid="product-select-button"
            >
              {Array.from(
                {
                  length: Math.min(maxQuantity, 10),
                },
                (_, i) => (
                  <option value={i + 1} key={i}>
                    {i + 1}
                  </option>
                )
              )}
            </CartItemSelect>
            {updating && <Spinner />}
          </div>
          <ErrorMessage error={error} data-testid="product-error-message" />
        </Table.Cell>
      )}

      {type === "full" && (
        <Table.Cell className="hidden small:table-cell">
          <LineItemUnitPrice item={item} style="tight" />
        </Table.Cell>
      )}

      <Table.Cell className="!pr-0">
        <span
          className={clx("!pr-0", {
            "flex flex-col items-end h-full justify-center": type === "preview",
          })}
        >
          {type === "preview" && (
            <span className="flex gap-x-1 ">
              <Text className="text-ui-fg-muted">{item.quantity}x </Text>
              <LineItemUnitPrice item={item} style="tight" />
            </span>
          )}
          <LineItemPrice item={item} style="tight" />
        </span>
      </Table.Cell>
    </Table.Row>
  )
}

export default Item
