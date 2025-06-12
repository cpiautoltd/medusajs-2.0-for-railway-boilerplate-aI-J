"use client"

import { Button } from "@medusajs/ui"
import { isEqual } from "lodash"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState, useRef } from "react"

import { useIntersection } from "@lib/hooks/use-in-view"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import MobileActions from "../product-actions/mobile-actions"
import ProductPrice from "../product-price"
import { HttpTypes } from "@medusajs/types"
import {
  ExtendedProduct,
  ExtrudedProduct,
  Unit,
  UNIT_CONVERSIONS,
} from "types/global"
import Spinner from "@modules/common/icons/spinner"
import {
  addLengthBasedToCart,
  calculateExtrudedPrice,
} from "@lib/data/cart-actions"
import ExtrusionVisualizer from "@modules/products/components/extrusion-visualizer"
import EnhancedExtrusionViewer from "../enhanced-extrusion-viewer"
import EnhancedLengthInput from "./enhanced-length-input"
import EndTapOptions, { TapOption } from "./end-tap-options"
import { convertToLocale } from "@lib/util/money"
import { convertLength } from "./length-utils"

type LengthBasedProductActionsProps = {
  product: ExtendedProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

type UnitType = "mm" | "inch"

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

  // Convert unitType from product to our UnitType
  const baseUnitType: UnitType =
    product.extruded_products?.unitType === "cm"
      ? "mm"
      : (product.extruded_products?.unitType as UnitType) || "inch"

  const [displayUnit, setDisplayUnit] = useState<UnitType>(baseUnitType)
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
  const [viewMode, setViewMode] = useState<"2d" | "3d">("3d")
  const [quantity, setQuantity] = useState(1)
  const countryCode = useParams().countryCode as string

  const [isPriceCalculating, setIsPriceCalculating] = useState(false)

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

  // Get display value based on current unit
  const displayLength = useMemo(() => {
    return convertLength(
      selectedLength,
      baseUnitType as Unit,
      displayUnit as Unit
    )
  }, [selectedLength, baseUnitType, displayUnit])

  // Get min/max in display units
  const minDisplayLength = useMemo(() => {
    return convertLength(
      product.extruded_products?.minLength || 0,
      baseUnitType as Unit,
      displayUnit as Unit
    )
  }, [product.extruded_products?.minLength, baseUnitType, displayUnit])

  const maxDisplayLength = useMemo(() => {
    return convertLength(
      product.extruded_products?.maxLength || 100,
      baseUnitType as Unit,
      displayUnit as Unit
    )
  }, [product.extruded_products?.maxLength, baseUnitType, displayUnit])

  // Update the options when a variant is selected
  const setOptionValue = (title: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [title]: value,
    }))
  }

  // Handle length change with unit conversion
  const handleLengthChange = (newValue: number) => {
    // Convert from display unit to base unit
    const valueInBaseUnit = convertLength(
      newValue,
      displayUnit as Unit,
      baseUnitType as Unit
    )

    // Clamp to min/max in base unit
    const clampedValue = Math.max(
      product.extruded_products?.minLength || 0,
      Math.min(product.extruded_products?.maxLength || 100, valueInBaseUnit)
    )

    setSelectedLength(clampedValue)
  }

  // Handle unit change
  const handleUnitChange = (newUnit: UnitType) => {
    setDisplayUnit(newUnit)
  }

  // Handle immediate length changes (for UI responsiveness)
// const handleLengthChange = (newValue: number) => {
//   // Convert from display unit to base unit
//   const valueInBaseUnit = convertLength(
//     newValue,
//     displayUnit as Unit,
//     baseUnitType as Unit
//   )

//   // Clamp to min/max in base unit
//   const clampedValue = Math.max(
//     product.extruded_products?.minLength || 0,
//     Math.min(product.extruded_products?.maxLength || 100, valueInBaseUnit)
//   )

//   // Update length immediately for responsive UI
//   setSelectedLength(clampedValue)
// }

// Handle debounced price calculation (separate from immediate UI updates)
const handleDebouncedPriceCalculation = async (newValue: number) => {
  if (!selectedVariant || !product.extruded_products) return

  setIsPriceCalculating(true)
  setPriceError(null)

  try {
    // Convert from display unit to base unit
    const valueInBaseUnit = convertLength(
      newValue,
      displayUnit as Unit,
      baseUnitType as Unit
    )

    const clampedValue = Math.max(
      product.extruded_products?.minLength || 0,
      Math.min(product.extruded_products?.maxLength || 100, valueInBaseUnit)
    )

    const tapOptions: Record<string, string> = {}
    if (isTapEndEnabled) {
      if (tapOptionLeft) tapOptions.left = tapOptionLeft
      if (tapOptionRight) tapOptions.right = tapOptionRight
    }

    const result = await calculateExtrudedPrice({
      variantId: selectedVariant.id,
      selectedLength: clampedValue,
      endtapConfig: tapOptions,
    })

    if (result && result?.calculated_price) {
      setCalculatedPrice(result.calculated_price)
    } else {
      setPriceError("Failed to calculate price")
    }
  } catch (error) {
    console.error("Error calculating price:", error)
    setPriceError("Error calculating price. Please try again.")
  } finally {
    setIsPriceCalculating(false)
  }
}

  // 2. ADD this new useEffect to handle tap option changes (since we removed the above):
useEffect(() => {
  // Only recalculate when tap options change (not length)
  if (selectedVariant && product.extruded_products && (tapOptionLeft || tapOptionRight)) {
    handleDebouncedPriceCalculation(displayLength)
  }
}, [tapOptionLeft, tapOptionRight])

// 3. ADD initial price calculation on component mount:
useEffect(() => {
  // Calculate initial price when variant is first selected
  if (selectedVariant && product.extruded_products && calculatedPrice === null) {
    handleDebouncedPriceCalculation(displayLength)
  }
}, [selectedVariant])



  // Calculate price whenever inputs change
  // useEffect(() => {
  //   const calculatePrice = async () => {
  //     if (!selectedVariant || !product.extruded_products) return

  //     setCalculatingPrice(true)
  //     setPriceError(null)

  //     try {
  //       const tapOptions: Record<string, string> = {}
  //       if (isTapEndEnabled) {
  //         if (tapOptionLeft) tapOptions.left = tapOptionLeft
  //         if (tapOptionRight) tapOptions.right = tapOptionRight
  //       }

  //       const result = await calculateExtrudedPrice({
  //         variantId: selectedVariant.id,
  //         selectedLength: selectedLength,
  //         endtapConfig: tapOptions,
  //       })

  //       if (result && result?.calculated_price) {
  //         setCalculatedPrice(result.calculated_price)
  //       } else {
  //         setPriceError(result.error || "Failed to calculate price")
  //         setCalculatedPrice(null)
  //       }
  //     } catch (error) {
  //       console.error("Price calculation error:", error)
  //       setPriceError("Failed to calculate price")
  //       setCalculatedPrice(null)
  //     } finally {
  //       setCalculatingPrice(false)
  //     }
  //   }

  //   calculatePrice()
  // }, [
  //   selectedVariant,
  //   selectedLength,
  //   tapOptionLeft,
  //   tapOptionRight,
  //   isTapEndEnabled,
  //   product.extruded_products,
  // ])

  // Add to cart handler
  const handleAddToCart = async () => {
    if (!selectedVariant || !calculatedPrice) return

    setIsAdding(true)

    try {
      const tapOptions: Record<string, string> = {}
      if (isTapEndEnabled) {
        if (tapOptionLeft) tapOptions.left = tapOptionLeft
        if (tapOptionRight) tapOptions.right = tapOptionRight
      }

      await addLengthBasedToCart({
        variantId: selectedVariant.id,
        quantity: quantity,
        countryCode,
        selectedLength: selectedLength,
        endtapConfig: tapOptions,
      })
    } catch (error) {
      console.error("Error adding to cart:", error)
    } finally {
      setIsAdding(false)
    }
  }

  const inStock = useMemo(() => {
    if (!selectedVariant) return false

    console.log("inStack useMemo", selectedVariant)

    return selectedVariant.manage_inventory
      ? (selectedVariant.inventory_quantity ?? 0) > 0
      : true
  }, [selectedVariant])

  // Get price per unit
  const pricePerUnit = useMemo(() => {
    if (!product.extruded_products?.price_per_unit) return null

    const basePrice = product.extruded_products.price_per_unit
    if (displayUnit === baseUnitType) {
      return basePrice
    }

    // Convert price to display unit
    if (baseUnitType === "mm") {
      // Convert mm to inch: multiply by 25.4
      return parseFloat((basePrice * 25.4).toFixed(4))
    } else {
      // Convert inch to mm: divide by 25.4
      return parseFloat((basePrice / 25.4).toFixed(4))
    }
  }, [product.extruded_products?.price_per_unit, displayUnit, baseUnitType])

  // Ref for intersection observer
  const actionsRef = useRef<HTMLDivElement>(null)
  const inView = useIntersection(actionsRef, "0px")

  return (
    <>
      <div className="flex flex-col gap-y-4" ref={actionsRef}>
        {/* Product Options */}
        {/* {(product.options?.length ?? 0) > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Options
            </h3>
            <div className="flex flex-col gap-y-3">
              {product.options?.map((option) => (
                <OptionSelect
                  key={option.id}
                  option={option}
                  current={options[option.title]}
                  updateOption={setOptionValue}
                  title={option.title}
                  disabled={disabled || isAdding || calculatingPrice}
                />
              ))}
            </div>
          </div>
        )}

        <Divider /> */}

        {/* Enhanced Length Input */}
        {/* <EnhancedLengthInput
          value={displayLength}
          min={minDisplayLength}
          max={maxDisplayLength}
          unit={displayUnit}
          disabled={disabled || isAdding}
          loading={calculatingPrice}
          onChange={handleLengthChange}
          onUnitChange={handleUnitChange}
          pricePerUnit={pricePerUnit ?? undefined}
          currency={region?.currency_code?.toUpperCase() || "$"}
        /> */}

<EnhancedLengthInput
  value={displayLength}
  min={minDisplayLength}
  max={maxDisplayLength}
  unit={displayUnit}
  disabled={isAdding}
  loading={calculatingPrice} // Keep this for external loading states
  onChange={handleLengthChange} // Immediate UI updates
  onDebouncedChange={handleDebouncedPriceCalculation} // Debounced price calculation
  onUnitChange={handleUnitChange}
  pricePerUnit={pricePerUnit ?? undefined}
  currency={region?.currency_code?.toUpperCase() || "$"}
  debounceMs={800} // 800ms delay for price calculation
/>
        {/* End Tap Options */}
        {isTapEndEnabled && parsedTapOptions.length > 0 && (
          <>
            <Divider />
            <EndTapOptions
              options={parsedTapOptions}
              leftValue={tapOptionLeft}
              rightValue={tapOptionRight}
              onLeftChange={setTapOptionLeft}
              onRightChange={setTapOptionRight}
              disabled={disabled || isAdding || calculatingPrice}
              loading={calculatingPrice}
              currency={region?.currency_code?.toUpperCase() || "$"}
            />
          </>
        )}

        <Divider />

        {/* Price Display */}
        {/* <div className="flex flex-col gap-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Total Price
            </span>
            {calculatingPrice ? (
              <div className="flex items-center gap-2">
                <Spinner className="animate-spin h-4 w-4" />
                <span className="text-sm text-gray-500">Calculating...</span>
              </div>
            ) : priceError ? (
              <span className="text-sm text-red-600">{priceError}</span>
            ) : calculatedPrice ? (
              <span className="text-lg font-semibold">
                {convertToLocale({
                  amount: calculatedPrice,
                  currency_code: region?.currency_code || "usd",
                })}
              </span>
            ) : (
              <span className="text-sm text-gray-500">Select options</span>
            )}
          </div>
        </div> */}

        {/* Price Display */}
{/* <div className="flex flex-col gap-y-2">
  {calculatedPrice && quantity > 1 && (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">
        Unit Price
      </span>
      <span className="text-sm text-gray-600">
        {convertToLocale({
          amount: calculatedPrice,
          currency_code: region?.currency_code || "usd",
        })}
      </span>
    </div>
  )}
  
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium text-gray-700">
      Total Price {quantity > 1 && `(${quantity} × unit)`}
    </span>
    {calculatingPrice ? (
      <div className="flex items-center gap-2">
        <Spinner className="animate-spin h-4 w-4" />
        <span className="text-sm text-gray-500">Calculating...</span>
      </div>
    ) : priceError ? (
      <span className="text-sm text-red-600">{priceError}</span>
    ) : calculatedPrice ? (
      <span className="text-lg font-semibold">
        {convertToLocale({
          amount: calculatedPrice * quantity,
          currency_code: region?.currency_code || "usd",
        })}
      </span>
    ) : (
      <span className="text-sm text-gray-500">Select options</span>
    )}
  </div>
</div> */}


{/* Price Display */}
<div className="flex flex-col gap-y-2">
  {/* Unit Price */}
  {calculatedPrice && quantity > 1 && (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">
        Unit Price
      </span>
      <span className="text-sm text-gray-600">
        {convertToLocale({
          amount: calculatedPrice,
          currency_code: region?.currency_code || "usd",
        })}
      </span>
    </div>
  )}
  
  {/* Total Price */}
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium text-gray-700">
      Total Price {quantity > 1 && `(${quantity} × unit)`}
    </span>
    {calculatingPrice || isPriceCalculating ? (
      <div className="flex items-center gap-2">
        <Spinner className="animate-spin h-4 w-4" />
        <span className="text-sm text-gray-500">Calculating...</span>
      </div>
    ) : priceError ? (
      <span className="text-sm text-red-600">{priceError}</span>
    ) : calculatedPrice ? (
      <span className="text-lg font-semibold">
        {convertToLocale({
          amount: calculatedPrice * quantity,
          currency_code: region?.currency_code || "usd",
        })}
      </span>
    ) : (
      <span className="text-sm text-gray-500">Select options</span>
    )}
  </div>
</div>
        {/* Quantity and Add to Cart Row */}
        <div className="flex gap-3 items-end">
          {/* Quantity Selector */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="quantity"
              className="text-sm font-medium text-gray-700"
            >
              Qty
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={
                  quantity <= 1 || disabled || isAdding || calculatingPrice
                }
                className="px-3 py-2.5 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                −
              </button>
              <input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                }
                disabled={disabled || isAdding || calculatingPrice}
                className="w-16 py-2.5 text-center border-0 focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                disabled={disabled || isAdding || calculatingPrice}
                className="px-3 py-2.5 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            disabled={
              !selectedVariant ||
              !inStock ||
              isAdding ||
              calculatingPrice ||
              !calculatedPrice ||
              !!priceError
            }
            variant="primary"
            className="flex-1"
            isLoading={isAdding}
            size="large"
          >
            {!inStock ? "Out of stock" : isAdding ? "Adding..." : "Add to cart"}
          </Button>
        </div>
        {/* Add to Cart Button */}
        {/* <Button
          onClick={handleAddToCart}
          disabled={
            !selectedVariant ||
            !inStock ||
            isAdding ||
            calculatingPrice ||
            !calculatedPrice ||
            !!priceError
          }
          variant="primary"
          className="w-full"
          isLoading={isAdding}
          size="large"
        >
          {!inStock ? "Out of stock" : isAdding ? "Adding..." : "Add to cart"}
        </Button> */}

        {/* Visualizers */}
        <div className="mt-6">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setViewMode("2d")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                viewMode === "2d"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              2D View
            </button>
            <button
              onClick={() => setViewMode("3d")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                viewMode === "3d"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              3D View
            </button>
          </div>

          {viewMode === "2d" && product.extruded_products ? (
            <ExtrusionVisualizer
              length={displayLength}
              unitType={displayUnit}
              leftTap={
                tapOptionLeft
                  ? (() => {
                      const option = parsedTapOptions.find(
                        (to) => to.part_no === tapOptionLeft
                      )
                      return option
                        ? {
                            partNo: option.part_no,
                            service_type: option.service_type,
                            tap_size: option.tap_size,
                          }
                        : null
                    })()
                  : null
              }
              rightTap={
                tapOptionRight
                  ? (() => {
                      const option = parsedTapOptions.find(
                        (to) => to.part_no === tapOptionRight
                      )
                      return option
                        ? {
                            partNo: option.part_no,
                            service_type: option.service_type,
                            tap_size: option.tap_size,
                          }
                        : null
                    })()
                  : null
              }
              productImage={product.thumbnail || undefined}
              color={
                selectedVariant?.options?.find((o) =>
                  o.option?.title?.toLowerCase().includes("color")
                )?.value || "#A9A9A9"
              }
            />
          ) : product.extruded_products ? (
            <EnhancedExtrusionViewer
              modelId={product.variants?.[0]?.sku ?? "1001"}
              length={selectedLength}
              width={100} // You may need to adjust these based on your product data
              height={100}
              leftTap={!!tapOptionLeft}
              rightTap={!!tapOptionRight}
              color="#cccccc"
              lod="low"
              fallbackToGeneric={true}
            />
          ) : null}
        </div>
      </div>

      {/* Mobile Actions */}
      <MobileActions
        product={product}
        variant={selectedVariant}
        options={options}
        updateOptions={setOptionValue}
        inStock={inStock}
        handleAddToCart={handleAddToCart}
        isAdding={isAdding}
        show={!inView}
        optionsDisabled={disabled || !selectedVariant || calculatingPrice}
      />
    </>
  )
}
