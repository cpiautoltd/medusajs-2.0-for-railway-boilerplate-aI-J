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
import Spinner from "@modules/common/icons/spinner"
import {
  addLengthBasedToCart,
  calculateExtrudedPrice,
} from "@lib/data/cart-actions"
import ExtrusionVisualizer from "@modules/products/components/extrusion-visualizer"
import EnhancedExtrusionViewer from "../enhanced-extrusion-viewer"
import { ChevronUpDown, Plus, Minus } from "@medusajs/icons"
import { convertToLocale } from "@lib/util/money"

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

type UnitType = "mm" | "inch"

const UNIT_CONVERSIONS = {
  inch: {
    mm: 25.4,
    inch: 1,
  },
  mm: {
    inch: 0.0393701,
    mm: 1,
  },
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
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d")
  const countryCode = useParams().countryCode as string

  // Refs for keyboard shortcuts
  const lengthInputRef = useRef<HTMLInputElement>(null)

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

  // Convert between units
  const convertLength = (
    value: number,
    from: UnitType,
    to: UnitType
  ): number => {
    if (from === to) return value
    return value * UNIT_CONVERSIONS[from][to]
  }

  // Get display value based on current unit
  const displayLength = useMemo(() => {
    return convertLength(selectedLength, baseUnitType, displayUnit)
  }, [selectedLength, baseUnitType, displayUnit])

  // Get min/max in display units
  const minDisplayLength = useMemo(() => {
    return convertLength(
      product.extruded_products?.minLength || 0,
      baseUnitType,
      displayUnit
    )
  }, [product.extruded_products?.minLength, baseUnitType, displayUnit])

  const maxDisplayLength = useMemo(() => {
    return convertLength(
      product.extruded_products?.maxLength || 100,
      baseUnitType,
      displayUnit
    )
  }, [product.extruded_products?.maxLength, baseUnitType, displayUnit])

  // update the options when a variant is selected
  const setOptionValue = (title: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [title]: value,
    }))
  }

  // Handle length change with unit conversion
  const handleLengthChange = (
    newValue: number,
    inDisplayUnit: boolean = true
  ) => {
    let valueInBaseUnit = newValue

    if (inDisplayUnit && displayUnit !== baseUnitType) {
      valueInBaseUnit = convertLength(newValue, displayUnit, baseUnitType)
    }

    // Clamp to min/max
    const clampedValue = Math.max(
      product.extruded_products?.minLength || 0,
      Math.min(product.extruded_products?.maxLength || 100, valueInBaseUnit)
    )

    setSelectedLength(clampedValue)
  }

  const convertUnitPrice = (
    price: number,
    from: UnitType
  ): { converted: number; unit: UnitType } => {
    if (from === "mm") {
      // Convert mm to inch: multiply by 25.4
      return {
        converted: parseFloat((price * 25.4).toFixed(4)),
        unit: "inch",
      }
    } else if (from === "inch") {
      // Convert inch to mm: divide by 25.4
      return {
        converted: parseFloat((price / 25.4).toFixed(4)),
        unit: "mm",
      }
    } else {
      throw new Error("Invalid unit. Use 'mm' or 'inch'.")
    }
  }

  // Increment/decrement handlers
  const getIncrementAmount = (isSubIncrement: boolean) => {
    if (displayUnit === "inch") {
      return isSubIncrement ? 0.1 : 1
    } else {
      return isSubIncrement ? 1 : 25
    }
  }

  const incrementLength = (isSubIncrement: boolean = false) => {
    const increment = getIncrementAmount(isSubIncrement)
    const newValue = displayLength + increment
    handleLengthChange(newValue, true)
  }

  const decrementLength = (isSubIncrement: boolean = false) => {
    const increment = getIncrementAmount(isSubIncrement)
    const newValue = displayLength - increment
    handleLengthChange(newValue, true)
  }

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement !== lengthInputRef.current) return

      const isCtrlOrShift = e.ctrlKey || e.shiftKey

      if (e.key === "ArrowUp") {
        e.preventDefault()
        incrementLength(isCtrlOrShift)
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        decrementLength(isCtrlOrShift)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [displayLength, displayUnit])

  // Mouse wheel handler
  const handleWheel = (e: React.WheelEvent) => {
    if (document.activeElement !== lengthInputRef.current) return

    e.preventDefault()
    const isCtrlOrShift = e.ctrlKey || e.shiftKey

    if (e.deltaY < 0) {
      incrementLength(isCtrlOrShift)
    } else {
      decrementLength(isCtrlOrShift)
    }
  }

  // Calculate price when length, variant, or tap options change
  useEffect(() => {
    const calculatePrice = async () => {
      if (!selectedVariant?.id || !selectedLength) return

      setCalculatingPrice(true)
      setPriceError(null)

      try {
        const extrudedProduct = product.extruded_products as ExtrudedProduct

        // Validate length is within allowed range
        if (
          selectedLength < extrudedProduct.minLength ||
          selectedLength > extrudedProduct.maxLength
        ) {
          setPriceError(
            `Length must be between ${minDisplayLength.toFixed(
              2
            )} and ${maxDisplayLength.toFixed(2)} ${displayUnit}`
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
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }
    if (selectedVariant?.allow_backorder) {
      return true
    }
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }
    return false
  }, [selectedVariant])

  const actionsRef = useRef<HTMLDivElement>(null)
  const inView = useIntersection(actionsRef, "0px")

  // Add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!selectedVariant?.id || !selectedLength) return null

    setIsAdding(true)

    try {
      let endtapConfig: { left?: string; right?: string } = {}
      if (tapOptionLeft) {
        endtapConfig.left = tapOptionLeft
      }
      if (tapOptionRight) {
        endtapConfig.right = tapOptionRight
      }

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

  // Get selected tap options
  const getSelectedTapOption = (side: "left" | "right") => {
    const partNo = side === "left" ? tapOptionLeft : tapOptionRight
    if (!partNo) return null
    return parsedTapOptions.find((opt) => opt.part_no === partNo)
  }

  const formatExtrusionMinMaxLength = (value: number) => {
    if (displayUnit === "inch") {
      const [intPart, decimalPart = "00"] = value.toFixed(2).split(".")
      return `${intPart.padStart(2, "0")}.${decimalPart}`
    } else {
      return value.toFixed(0).toString().padStart(4, "0")
    }
  }

  return (
    <>
      <div className="flex flex-col gap-y-0" ref={actionsRef}>
        {/* Variant Selection */}
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

        {/* Length Selection Section */}
        <div className="bg-ui-bg-subtle rounded-lg">
          <div className="flex items-center justify-center">
            <div className="w-full">
              <div
                className="inline-flex w-full rounded-md shadow-sm"
                role="group"
              >
                <button
                  type="button"
                  onClick={() => setDisplayUnit("inch")}
                  className={`flex-1 py-2 text-sm font-medium border transition-colors ${
                    displayUnit === "inch"
                      ? "bg-ui-bg-interactive text-ui-fg-on-color border-ui-border-interactive"
                      : "bg-ui-bg-base text-ui-fg-base border-ui-border-base hover:bg-ui-bg-base-hover"
                  } rounded-l-md`}
                >
                  Inch
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayUnit("mm")}
                  className={`flex-1 py-2 text-sm font-medium border transition-colors ${
                    displayUnit === "mm"
                      ? "bg-ui-bg-interactive text-ui-fg-on-color border-ui-border-interactive"
                      : "bg-ui-bg-base text-ui-fg-base border-ui-border-base hover:bg-ui-bg-base-hover"
                  } rounded-r-md`}
                >
                  mm
                </button>
              </div>
            </div>
          </div>

<div className="mt-6">
          <div className="text-sm font-semibold text-gray-600">
            Length Options
          </div>
        </div>
          <div className="mt-2 bg-white rounded-md py-4 px-6 space-y-4 shadow-sm border border-gray-200">
            <div className="flex flex-row items-center gap-4">
              <div className="relative flex-1">
                <input
                  ref={lengthInputRef}
                  type="number"
                  value={displayLength.toFixed(displayUnit === "inch" ? 2 : 0)}
                  onChange={(e) =>
                    handleLengthChange(parseFloat(e.target.value) || 0, true)
                  }
                  min={minDisplayLength}
                  max={maxDisplayLength}
                  step={displayUnit === "inch" ? 0.01 : 1}
                  className="w-full px-4 py-3 text-center text-lg font-medium bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-20"
                  style={{
                    WebkitAppearance: "none",
                    MozAppearance: "textfield",
                  }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 text-right leading-tight">
                  <div>
                    {displayUnit === baseUnitType
                      ? product.extruded_products?.price_per_unit || 0
                      : convertUnitPrice(
                          product.extruded_products?.price_per_unit || 0,
                          baseUnitType
                        ).converted}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    / {displayUnit}
                  </div>
                </span>
              </div>

              <div className="grid grid-rows-2 gap-1 text-[10px] text-gray-500">
                <div className="flex justify-between items-center w-full gap-1">
                  <span className="font-medium text-gray-700">
                    {formatExtrusionMinMaxLength(minDisplayLength)}
                  </span>
                  <span className="font-medium">Min</span>
                </div>
                <div className="flex justify-between items-center w-full gap-1">
                  <span className="font-medium text-gray-700">
                    {formatExtrusionMinMaxLength(maxDisplayLength)}
                  </span>
                  <span className="font-medium rounded-sm">Max</span>
                </div>
              </div>
            </div>

            <div className="">
              <div className="text-left ml-2 mt-2 text-[10px] text-gray-500">
                * Use ↑↓ keys (hold Ctrl for fine adjustments)
              </div>
              <div className="text-left ml-2 text-[11px] text-gray-500">
                * A cut fee of{" "}
                <span className="font-semibold">
                  {convertToLocale({
                    amount: product.extruded_products?.cut_price || 0,
                    currency_code: region.currency_code,
                  })}
                </span>{" "}
                is applicable.
              </div>
            </div>
          </div>

          {priceError && (
            <div className="text-rose-500 text-sm" data-testid="length-error">
              {priceError}
            </div>
          )}
        </div>

        <div className="mt-6">
          <div className="text-sm font-semibold text-gray-600">
            End Tap Options
          </div>
        </div>
        {isTapEndEnabled && parsedTapOptions.length > 0 && (
          <div className="bg-white rounded-md mt-2 py-4 px-6 space-y-4 shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left End Tap */}
              <div className="space-y-3">
                <h4 className="text-xs text-center font-semibold text-gray-500">
                  Left End
                </h4>
                <div className="space-y-2">
                  <button
                    onClick={() => setTapOptionLeft(null)}
                    className={`w-full rounded-md border px-2 py-2 transition-all duration-150 flex items-center justify-between ${
                      tapOptionLeft === null
                        ? "ring-2 ring-blue-500"
                        : "border-gray-300 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-[12px] font-semibold text-gray-500">
                      No Tap Included
                    </span>
                  </button>

                  {parsedTapOptions.map((option) => {
                    const isSelected = tapOptionLeft === option.part_no
                    return (
                      <button
                        key={`left-${option.part_no}`}
                        onClick={() => setTapOptionLeft(option.part_no)}
                        className={`w-full rounded-md border px-4 py-3 transition-all duration-150 text-center ${
                          isSelected
                            ? "ring-2 ring-blue-500"
                            : "border-gray-300 bg-white hover:bg-gray-50"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-gray-500">
                            {option.tap_size}
                          </div>

                          <div className="text-[8px] text-gray-500">
                            {option.service_type}
                          </div>

                          <div className="text-[10px] font-medium text-gray-500">
                            {convertToLocale({
                              amount: option.price,
                              currency_code: region.currency_code,
                            })}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Right End Tap */}
              <div className="space-y-3">
                <h4 className="text-xs text-center font-semibold text-gray-500">
                  Right End
                </h4>
                <div className="space-y-2">
                  <button
                    onClick={() => setTapOptionRight(null)}
                    className={`w-full rounded-md border px-2 py-2 transition-all duration-150 flex items-center justify-between ${
                      tapOptionRight === null
                        ? "ring-2 ring-blue-500"
                        : "border-gray-300 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-[12px] font-semibold text-gray-500">
                      No Tap Included
                    </span>
                  </button>

                  {parsedTapOptions.map((option) => {
                    const isSelected = tapOptionRight === option.part_no
                    return (
                      <button
                        key={`right-${option.part_no}`}
                        onClick={() => setTapOptionRight(option.part_no)}
                        className={`w-full rounded-md border px-4 py-3 transition-all duration-150 text-center ${
                          isSelected
                            ? "ring-2 ring-blue-500"
                            : "border-gray-300 bg-white hover:bg-gray-50"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-gray-600">
                            {option.tap_size}
                          </div>
                          <div className="text-[8px] text-gray-600">
                            {option.service_type}
                          </div>

                          <div className="text-[10px] font-medium text-gray-600">
                            {convertToLocale({
                              amount: option.price,
                              currency_code: region.currency_code,
                            })}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {(tapOptionLeft || tapOptionRight) && (
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between text-xs text-gray-700">
                  <span className="font-medium">Additional tap cost:</span>
                  <span className="font-semibold text-blue-600">
                    +
                    {convertToLocale({
                      amount: calculateTapOptionsPrice(),
                      currency_code: region.currency_code,
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Price Display */}
        {/* <div className="space-y-4 mt-6">
          {calculatingPrice ? (
            <div className="flex items-center justify-center gap-2 py-4">
              <Spinner />
              <span>Calculating price...</span>
            </div>
          ) : (
            calculatedPrice !== null && (
              <div className="bg-ui-bg-base border border-ui-border-base rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">Total Price:</span>
                  <span className="text-2xl font-semibold text-ui-fg-interactive">
                    {convertToLocale({
                      amount: calculatedPrice,
                      currency_code: region.currency_code,
                    })}
                  </span>
                </div>
              </div>
            )
          )} */}

        <div className="space-y-4 mt-6">
          {calculatedPrice !== null && (
            <div className="bg-ui-bg-base border border-ui-border-base rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">Total Price:</span>
                <span className="text-2xl font-semibold text-ui-fg-interactive">
                  {calculatingPrice ? (
                    <div className="flex items-center justify-center gap-2 py-4">
                      <Spinner />
                    </div>
                  ) : (
                    <div>
                      {convertToLocale({
                        amount: calculatedPrice,
                        currency_code: region.currency_code,
                      })}
                    </div>
                  )}
                </span>
              </div>
            </div>
          )}

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
            className="w-full h-12"
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
        </div>

        {/* 3D/2D Visualization */}
        {(tapOptionLeft ||
          tapOptionRight ||
          selectedLength !== product.extruded_products?.minLength) && (
          <div className="bg-ui-bg-subtle rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-medium">Preview</h3>
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  onClick={() => setViewMode("2d")}
                  className={`px-4 py-2 text-sm font-medium border transition-colors ${
                    viewMode === "2d"
                      ? "bg-ui-bg-interactive text-ui-fg-on-color border-ui-border-interactive"
                      : "bg-ui-bg-base text-ui-fg-base border-ui-border-base hover:bg-ui-bg-base-hover"
                  } rounded-l-md`}
                >
                  2D View
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("3d")}
                  className={`px-4 py-2 text-sm font-medium border transition-colors ${
                    viewMode === "3d"
                      ? "bg-ui-bg-interactive text-ui-fg-on-color border-ui-border-interactive"
                      : "bg-ui-bg-base text-ui-fg-base border-ui-border-base hover:bg-ui-bg-base-hover"
                  } rounded-r-md`}
                >
                  3D View
                </button>
              </div>
            </div>

            {viewMode === "3d" ? (
              <EnhancedExtrusionViewer
                length={selectedLength}
                leftTap={!!tapOptionLeft}
                rightTap={!!tapOptionRight}
                color={
                  selectedVariant?.options?.find((o) =>
                    o.option?.title?.toLowerCase().includes("color")
                  )?.value || "#A9A9A9"
                }
                modelId="8020-1001"
                lod="medium"
                fallbackToGeneric={true}
              />
            ) : (
              <ExtrusionVisualizer
                length={displayLength}
                unitType={displayUnit}
                leftTap={
                  tapOptionLeft && getSelectedTapOption("left")
                    ? {
                        partNo: tapOptionLeft,
                        service_type:
                          getSelectedTapOption("left")?.service_type,
                        tap_size: getSelectedTapOption("left")?.tap_size,
                      }
                    : null
                }
                rightTap={
                  tapOptionRight && getSelectedTapOption("right")
                    ? {
                        partNo: tapOptionRight,
                        service_type:
                          getSelectedTapOption("right")?.service_type,
                        tap_size: getSelectedTapOption("right")?.tap_size,
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
        )}

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
