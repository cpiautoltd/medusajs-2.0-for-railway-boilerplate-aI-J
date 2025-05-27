"use client"

import { Button } from "@medusajs/ui"
import { isEqual } from "lodash"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"

import { useIntersection } from "@lib/hooks/use-in-view"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"

import MobileActions from "../product-actions/mobile-actions"
import ProductPrice from "../product-price"
import { HttpTypes } from "@medusajs/types"
import { ExtendedProduct, ExtrudedProduct } from "types/global"
import Input from "@modules/common/components/input"
import Spinner from "@modules/common/icons/spinner"
import {
  addLengthBasedToCart,
  calculateExtrudedPrice,
} from "@lib/data/cart-actions"
import ExtrusionVisualizer from "@modules/products/components/extrusion-visualizer"
import Extrusion3DViewer from "@modules/products/components/extrusion-3d-viewer"
import EnhancedExtrusionViewer from "../enhanced-extrusion-viewer"

type LengthBasedProductActionsProps = {
  product: ExtendedProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

type TapOption = {
  tap_size: string
  price: number
  min_depth: number
  service_type: string
  part_no: string
  currency: string
}

const optionsAsKeymap = (variantOptions: any) => {
  return variantOptions?.reduce(
    (acc: Record<string, string | undefined>, varopt: any) => {
      if (
        varopt.option &&
        varopt.value !== null &&
        varopt.value !== undefined
      ) {
        acc[varopt.option.title] = varopt.value
      }
      return acc
    },
    {}
  )
}

export default function LengthBasedProductActions({
  product,
  region,
  disabled,
}: LengthBasedProductActionsProps) {
  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const [calculatingPrice, setCalculatingPrice] = useState(false)
  const [selectedLength, setSelectedLength] = useState<number>(
    product.extruded_products?.minLength || 1
  )

  // End tap related state
  const [isTapEndEnabled, setIsTapEndEnabled] = useState(
    product.extruded_products?.is_endtap_based || false
  )
  const [tapOptionLeft, setTapOptionLeft] = useState<string | null>(null)
  const [tapOptionRight, setTapOptionRight] = useState<string | null>(null)
  const [parsedTapOptions, setParsedTapOptions] = useState<TapOption[]>([])
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null)
  const [priceError, setPriceError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d")
  const countryCode = useParams().countryCode as string

  // Parse the end tap options from JSON string
  useEffect(() => {
    if (isTapEndEnabled && product.extruded_products?.endtap_options) {
      try {
        const options = JSON.parse(product.extruded_products.endtap_options)
        setParsedTapOptions(options)
      } catch (error) {
        console.error("Error parsing end tap options:", error)
        setParsedTapOptions([])
      }
    }
  }, [isTapEndEnabled, product.extruded_products?.endtap_options])

  // If there is only 1 variant, preselect the options
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // update the options when a variant is selected
  const setOptionValue = (title: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [title]: value,
    }))
  }

  // Calculate price when length, variant, or tap options change
  useEffect(() => {
    const calculatePrice = async () => {
      if (!selectedVariant?.id || !selectedLength) return

      setCalculatingPrice(true)
      setPriceError(null)

      console.log("Trying to calculate Price for the first time")

      try {
        const extrudedProduct = product.extruded_products as ExtrudedProduct

        console.log(extrudedProduct)

        // Validate length is within allowed range
        if (
          selectedLength < extrudedProduct.minLength ||
          selectedLength > extrudedProduct.maxLength
        ) {
          setPriceError(
            `Length must be between ${extrudedProduct.minLength} and ${extrudedProduct.maxLength} ${extrudedProduct.unitType}`
          )
          setCalculatedPrice(null)
          setCalculatingPrice(false)
          return
        }

        // Build the endtap configuration
        let endtapConfig: { left?: string; right?: string } = {}
        if (tapOptionLeft) {
          endtapConfig.left = tapOptionLeft
        }
        if (tapOptionRight) {
          endtapConfig.right = tapOptionRight
        }

        console.log(
          "Sending request to calculateExtrudedPrice with options ; ",
          `\n variantID : ${selectedVariant.id}`,
          "\nselectedLEngth: ",
          selectedLength,
          "\nendTapConfig",
          endtapConfig
        )

        const { calculated_price } = await calculateExtrudedPrice({
          variantId: selectedVariant.id,
          selectedLength,
          quantity: 1,
          endtapConfig,
        })

        setCalculatedPrice(calculated_price)
      } catch (error) {
        console.error("Error calculating price:", error)
        setPriceError("Unable to calculate price")
        setCalculatedPrice(null)
      } finally {
        setCalculatingPrice(false)
      }
    }

    if (selectedVariant?.id && selectedLength) {
      calculatePrice()
    }
  }, [
    selectedVariant?.id,
    selectedLength,
    tapOptionLeft,
    tapOptionRight,
    product.extruded_products,
    region.currency_code,
  ])

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    // If we don't manage inventory, we can always add to cart
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }

    // If we allow back orders on the variant, we can add to cart
    if (selectedVariant?.allow_backorder) {
      return true
    }

    // If there is inventory available, we can add to cart
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }

    // Otherwise, we can't add to cart
    return false
  }, [selectedVariant])

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  // Add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!selectedVariant?.id || !selectedLength) return null

    setIsAdding(true)

    try {
      // Build the endtap configuration
      let endtapConfig: { left?: string; right?: string } = {}
      if (tapOptionLeft) {
        endtapConfig.left = tapOptionLeft
      }
      if (tapOptionRight) {
        endtapConfig.right = tapOptionRight
      }

      // Use custom endpoint for adding length-based products
      const response = await addLengthBasedToCart({
        variantId: selectedVariant.id,
        quantity: 1,
        selectedLength,
        countryCode,
        endtapConfig,
      })

      if (!response.success) {
        throw new Error("Failed to add item to cart")
      }
    } catch (error) {
      console.error("Error adding to cart:", error)
    } finally {
      setIsAdding(false)
    }
  }

  // Get a nice display of the extruded product details
  const extrudedProductDetails = useMemo(() => {
    const details = product.extruded_products
    if (!details) return null

    return {
      unitType: details.unitType,
      minLength: details.minLength,
      maxLength: details.maxLength,
      pricePerUnit: details.price_per_unit,
      cutPrice: details.cut_price,
    }
  }, [product.extruded_products])

  // Clear tap option when deselected
  const handleTapOptionChange = (
    side: "left" | "right",
    partNo: string | null
  ) => {
    if (side === "left") {
      setTapOptionLeft(partNo)
    } else {
      setTapOptionRight(partNo)
    }
  }

  // Calculate additional price from tap options
  const calculateTapOptionsPrice = () => {
    let tapPrice = 0

    if (tapOptionLeft) {
      const leftOption = parsedTapOptions.find(
        (opt) => opt.part_no === tapOptionLeft
      )
      if (leftOption) {
        tapPrice += leftOption.price
      }
    }

    if (tapOptionRight) {
      const rightOption = parsedTapOptions.find(
        (opt) => opt.part_no === tapOptionRight
      )
      if (rightOption) {
        tapPrice += rightOption.price
      }
    }

    return tapPrice
  }

  return (
    <>
      <div className="flex flex-col gap-y-2" ref={actionsRef}>
        <div>
          {(product.variants?.length ?? 0) > 1 && (
            <div className="flex flex-col gap-y-4">
              {(product.options || []).map((option) => {
                return (
                  <div key={option.id}>
                    <OptionSelect
                      option={option}
                      current={options[option.title ?? ""]}
                      updateOption={setOptionValue}
                      title={option.title ?? ""}
                      data-testid="product-options"
                      disabled={!!disabled || isAdding}
                    />
                  </div>
                )
              })}
              <Divider />
            </div>
          )}
        </div>

        {/* Length Selection Section */}
        <div className="flex flex-col gap-y-2 mb-4">
          <div className="text-sm font-medium">
            Select Length ({extrudedProductDetails?.unitType})
          </div>
          <div className="grid grid-cols-1 gap-y-2">
            <Input
              name="length"
              label={`Length (${extrudedProductDetails?.minLength}-${extrudedProductDetails?.maxLength} ${extrudedProductDetails?.unitType})`}
              type="number"
              min={extrudedProductDetails?.minLength}
              max={extrudedProductDetails?.maxLength}
              value={selectedLength}
              onChange={(e) => setSelectedLength(parseFloat(e.target.value))}
              required
              data-testid="length-input"
            />

            {priceError && (
              <div className="text-rose-500 text-sm" data-testid="length-error">
                {priceError}
              </div>
            )}

            <div className="text-small-regular text-ui-fg-subtle">
              Base price: ${extrudedProductDetails?.pricePerUnit.toFixed(2)} per{" "}
              {extrudedProductDetails?.unitType} + $
              {extrudedProductDetails?.cutPrice.toFixed(2)} cutting fee
            </div>
          </div>
        </div>

        {/* End Tap Options Section */}
        {isTapEndEnabled && parsedTapOptions.length > 0 && (
          <div className="flex flex-col gap-y-4 mb-4">
            <Divider />

            <div className="text-sm font-medium">End Tap Options</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left End Tap Selection */}
              <div className="flex flex-col gap-y-2">
                <div className="text-xs font-medium">Left End</div>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="no-left-tap"
                      checked={tapOptionLeft === null}
                      onChange={() => handleTapOptionChange("left", null)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="no-left-tap" className="text-sm">
                      None
                    </label>
                  </div>

                  {parsedTapOptions.map((option) => (
                    <div
                      key={`left-${option.part_no}`}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        id={`left-${option.part_no}`}
                        checked={tapOptionLeft === option.part_no}
                        onChange={() =>
                          handleTapOptionChange("left", option.part_no)
                        }
                        className="h-4 w-4"
                      />
                      <label
                        htmlFor={`left-${option.part_no}`}
                        className="text-sm flex-1"
                      >
                        {option.service_type} ({option.tap_size})
                      </label>
                      <span className="text-sm font-medium">
                        ${option.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right End Tap Selection */}
              <div className="flex flex-col gap-y-2">
                <div className="text-xs font-medium">Right End</div>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="no-right-tap"
                      checked={tapOptionRight === null}
                      onChange={() => handleTapOptionChange("right", null)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="no-right-tap" className="text-sm">
                      None
                    </label>
                  </div>

                  {parsedTapOptions.map((option) => (
                    <div
                      key={`right-${option.part_no}`}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        id={`right-${option.part_no}`}
                        checked={tapOptionRight === option.part_no}
                        onChange={() =>
                          handleTapOptionChange("right", option.part_no)
                        }
                        className="h-4 w-4"
                      />
                      <label
                        htmlFor={`right-${option.part_no}`}
                        className="text-sm flex-1"
                      >
                        {option.service_type} ({option.tap_size})
                      </label>
                      <span className="text-sm font-medium">
                        ${option.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* End Tap Preview */}
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex justify-end mb-2">
                <div className="inline-flex rounded-md shadow-sm" role="group">
                  <button
                    type="button"
                    onClick={() => setViewMode("2d")}
                    className={`px-4 py-2 text-sm font-medium border border-gray-200 rounded-l-lg ${
                      viewMode === "2d"
                        ? "bg-gray-200 text-gray-900"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    2D View
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("3d")}
                    className={`px-4 py-2 text-sm font-medium border border-gray-200 rounded-r-lg ${
                      viewMode === "3d"
                        ? "bg-gray-200 text-gray-900"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    3D View
                  </button>
                </div>
              </div>
              {viewMode === "3d" ? (
                <EnhancedExtrusionViewer
                  modelId={"8020-1001"} // Use the model ID from your product
                  length={selectedLength}
                  leftTap={!!tapOptionLeft}
                  rightTap={!!tapOptionRight}
                  color={
                    selectedVariant?.options?.find((o) =>
                      o.option?.title?.toLowerCase().includes("color")
                    )?.value || "#A9A9A9"
                  }
                  lod="medium"
                  fallbackToGeneric={true}
                />
              ) : (
                <ExtrusionVisualizer
                  length={selectedLength}
                  unitType={extrudedProductDetails?.unitType || "inch"}
                  leftTap={
                    tapOptionLeft
                      ? {
                          partNo: tapOptionLeft,
                          service_type: parsedTapOptions.find(
                            (o) => o.part_no === tapOptionLeft
                          )?.service_type,
                          tap_size: parsedTapOptions.find(
                            (o) => o.part_no === tapOptionLeft
                          )?.tap_size,
                        }
                      : null
                  }
                  rightTap={
                    tapOptionRight
                      ? {
                          partNo: tapOptionRight,
                          service_type: parsedTapOptions.find(
                            (o) => o.part_no === tapOptionRight
                          )?.service_type,
                          tap_size: parsedTapOptions.find(
                            (o) => o.part_no === tapOptionRight
                          )?.tap_size,
                        }
                      : null
                  }
                  productImage={product.thumbnail || undefined}
                  color={
                    selectedVariant?.options?.find((o) =>
                      o.option?.title?.toLowerCase().includes("color")
                    )?.value || "#A9A9A9"
                  }
                />
              )}
            </div>

            {/* End Tap Cost Summary */}
            {(tapOptionLeft || tapOptionRight) && (
              <div className="text-small-regular text-ui-fg-subtle">
                Additional end tap cost: $
                {calculateTapOptionsPrice().toFixed(2)}
              </div>
            )}
          </div>
        )}

        {/* Price Display */}
        <div className="flex items-center gap-x-2">
          {calculatingPrice ? (
            <div className="flex items-center gap-x-2">
              <Spinner />
              <span>Calculating price...</span>
            </div>
          ) : (
            calculatedPrice !== null && (
              <div className="text-xl-semi">
                Price: ${calculatedPrice.toFixed(2)}
              </div>
            )
          )}
        </div>

        <Button
          onClick={handleAddToCart}
          disabled={
            !inStock ||
            !selectedVariant ||
            !!disabled ||
            isAdding ||
            calculatingPrice ||
            calculatedPrice === null ||
            !!priceError
          }
          variant="primary"
          className="w-full h-10"
          isLoading={isAdding}
          data-testid="add-to-cart-button"
        >
          {!selectedVariant
            ? "Select variant"
            : !inStock
            ? "Out of stock"
            : calculatingPrice
            ? "Calculating price..."
            : priceError
            ? "Invalid length"
            : "Add to cart"}
        </Button>

        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock && calculatedPrice !== null && !priceError}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding || calculatingPrice}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
        />
      </div>
    </>
  )
}
