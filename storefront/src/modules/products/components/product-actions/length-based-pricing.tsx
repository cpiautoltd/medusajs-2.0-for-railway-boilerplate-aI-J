import React, { useEffect, useState } from "react";
import { Button, Input, Text, clx } from "@medusajs/ui";
import { ExtrudedProduct, Unit, UNIT_CONVERSIONS } from "types/global";

type LengthBasedPricingProps = {
  extrudedProduct: ExtrudedProduct;
  onLengthChange: (length: number) => void;
  className?: string;
};


// const UNIT_CONVERSIONS: Record<Unit, Record<Unit, number>> = {
//   'inch': {
//     'inch': 1,
//     'cm': 2.54, // 1 inch = 2.54 cm
//     'mm': 25.4, // 1 inch = 25.4 mm
//   },
//   'cm': {
//     'cm': 1,
//     'inch': 0.393701, // 1 cm = 0.393701 inch
//     'mm': 10, // 1 cm = 10 mm
//   },
//   'mm': {
//     'mm': 1,
//     'inch': 0.0393701, // 1 mm = 0.0393701 inch
//     'cm': 0.1, // 1 mm = 0.1 cm
//   },
// };

const LengthBasedPricing: React.FC<LengthBasedPricingProps> = ({
  extrudedProduct,
  onLengthChange,
  className,
}) => {
  const [selectedUnitType, setSelectedUnitType] = useState<string>(
    extrudedProduct.unitType
  );
  const [length, setLength] = useState<number>(extrudedProduct.minLength);
  const [error, setError] = useState<string | null>(null);

  // Convert min/max length to selected unit type
  const convertLength = (
    value: number,
    fromUnit: Unit,
    toUnit: Unit
  ): number => {
    if (fromUnit === toUnit) return value;
    
    const conversionFactor = UNIT_CONVERSIONS[fromUnit][toUnit];
    return parseFloat((value * conversionFactor).toFixed(2));
  };

  const minLength = convertLength(
    extrudedProduct.minLength,
    extrudedProduct.unitType as Unit,
    selectedUnitType as Unit
  );
  
  const maxLength = convertLength(
    extrudedProduct.maxLength,
    extrudedProduct.unitType as Unit,
    selectedUnitType as Unit
  );

  // Handle length input change
  const handleLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    
    if (isNaN(value)) {
      setError("Please enter a valid number");
      return;
    }
    
    if (value < minLength) {
      setError(`Minimum length is ${minLength} ${selectedUnitType}`);
      setLength(value);
      return;
    }
    
    if (value > maxLength) {
      setError(`Maximum length is ${maxLength} ${selectedUnitType}`);
      setLength(value);
      return;
    }
    
    setError(null);
    setLength(value);
    
    // Convert length back to base unit type for calculation
    const lengthInBaseUnit = convertLength(
      value,
      selectedUnitType as Unit,
      extrudedProduct.unitType as Unit
    );
    
    onLengthChange(lengthInBaseUnit);
  };

  // Increment/decrement length
  const adjustLength = (amount: number, decimalsOnly: boolean = false) => {
    let newLength: number;
    
    if (decimalsOnly) {
      // Only adjust the decimal part
      const integerPart = Math.floor(length);
      const decimalPart = length - integerPart;
      const newDecimalPart = Math.max(0, Math.min(0.99, decimalPart + amount));
      newLength = integerPart + newDecimalPart;
    } else {
      newLength = length + amount;
    }
    
    newLength = parseFloat(newLength.toFixed(2));
    
    if (newLength < minLength) {
      setError(`Minimum length is ${minLength} ${selectedUnitType}`);
      setLength(minLength);
      onLengthChange(extrudedProduct.minLength);
      return;
    }
    
    if (newLength > maxLength) {
      setError(`Maximum length is ${maxLength} ${selectedUnitType}`);
      setLength(maxLength);
      onLengthChange(extrudedProduct.maxLength);
      return;
    }
    
    setError(null);
    setLength(newLength);
    
    // Convert length back to base unit type for calculation
    const lengthInBaseUnit = convertLength(
      newLength,
      selectedUnitType as Unit,
      extrudedProduct.unitType  as Unit
    );
    
    onLengthChange(lengthInBaseUnit);
  };

  // Handle unit type change
  const handleUnitTypeChange = (newUnitType: string) => {
    // Convert current length to new unit type
    const convertedLength = convertLength(
      length,
      selectedUnitType as Unit,
      newUnitType as Unit
    );
    
    setSelectedUnitType(newUnitType);
    setLength(parseFloat(convertedLength.toFixed(2)));
    
    // Since base calculation unit doesn't change, we don't need to call onLengthChange here
  };

  // Initialize with default length
  useEffect(() => {
    // Set initial length to min length
    setLength(minLength);
    onLengthChange(extrudedProduct.minLength);
  }, [extrudedProduct.minLength]);

  // Handle keyboard events for increment/decrement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard events if input is focused
      const activeElement = document.activeElement;
      if (!activeElement || activeElement.tagName !== "INPUT") return;

      // Check if Ctrl key is pressed for decimal adjustment
      const isCtrlPressed = e.ctrlKey;
      
      if (e.key === "ArrowUp") {
        e.preventDefault();
        adjustLength(isCtrlPressed ? 0.01 : 1, isCtrlPressed);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        adjustLength(isCtrlPressed ? -0.01 : -1, isCtrlPressed);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [length, selectedUnitType, minLength, maxLength]);

  return (
    <div className={clx("flex flex-col gap-y-2", className)}>
      <div className="flex flex-col gap-y-1">
        <Text className="text-ui-fg-base font-medium">Select Length</Text>
        <Text className="text-ui-fg-subtle text-small-regular">
          Min: {minLength} {selectedUnitType} / Max: {maxLength} {selectedUnitType}
        </Text>
      </div>
      
      <div className="flex flex-row items-end gap-x-2">
        <div className="flex-1">
          <Input
            type="number"
            value={length}
            step="0.01"
            min={minLength}
            max={maxLength}
            onChange={handleLengthChange}
            className="w-full"
            placeholder={`Enter length in ${selectedUnitType}`}
          />
        </div>
        
        <div className="grid grid-cols-3 gap-x-1">
          {["inch", "cm", "mm"].map((unit) => (
            <Button
              key={unit}
              variant={selectedUnitType === unit ? "primary" : "secondary"}
              className="px-2 py-1 h-10"
              onClick={() => handleUnitTypeChange(unit)}
            >
              {unit}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="flex gap-x-2 mt-1">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => adjustLength(-1)}
        >
          -1
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => adjustLength(-0.1, true)}
        >
          -0.1
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => adjustLength(0.1, true)}
        >
          +0.1
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => adjustLength(1)}
        >
          +1
        </Button>
      </div>
      
      {error && (
        <Text className="text-ui-fg-error text-small-regular mt-1">
          {error}
        </Text>
      )}
      
      <Text className="text-ui-fg-subtle text-small-regular mt-1">
        Tip: Use arrow keys to adjust (↑/↓), hold Ctrl for decimal precision
      </Text>
    </div>
  );
};

export default LengthBasedPricing;