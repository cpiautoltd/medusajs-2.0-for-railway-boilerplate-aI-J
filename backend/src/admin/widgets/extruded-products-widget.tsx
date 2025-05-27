import { useState, useEffect } from 'react';
import { 
  Container, 
  Heading, 
  Input, 
  Select, 
  Switch, 
  Button, 
  Text,
  IconButton,
  Label,
  toast,
  Toaster
} from '@medusajs/ui';
import { Plus, Trash2 } from 'lucide-react';
import { defineWidgetConfig } from '@medusajs/admin-sdk';

const ExtrudedProductsWidget = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [extrudedProduct, setExtrudedProduct] = useState({
    id: null,
    is_length_based: false,
    price_per_unit: 0,
    cut_price: 0,
    cut_code: '',
    unitType: 'inch',
    minLength: 0,
    maxLength: 0,
    is_endtap_based: false,
    endtap_options: [],
    endtap_code: '',
  });

  // Fetch extruded_products data
  useEffect(() => {
    const fetchExtrudedProducts = async () => {
      if (!data?.id) return;
      
      try {
        // Fetch extruded products by product ID
        const response = await fetch(`/admin/extruded-products/by-product/${data.id}`, {
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.extruded_product) {
            const parsedOptions = result.extruded_product.endtap_options 
              ? JSON.parse(result.extruded_product.endtap_options)
              : [];
            
            setExtrudedProduct({
              ...result.extruded_product,
              endtap_options: parsedOptions,
              price_per_unit: result.extruded_product.price_per_unit || 0,
              cut_price: result.extruded_product.cut_price || 0,
              minLength: result.extruded_product.minLength || 0,
              maxLength: result.extruded_product.maxLength || 0,
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch extruded products:', error);
      }
    };
    
    fetchExtrudedProducts();
  }, [data?.id]);

  const handleFieldChange = (field, value) => {
    setExtrudedProduct(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEndtapOptionChange = (index, field, value) => {
    const updatedOptions = [...extrudedProduct.endtap_options];
    updatedOptions[index] = {
      ...updatedOptions[index],
      [field]: value
    };
    setExtrudedProduct(prev => ({
      ...prev,
      endtap_options: updatedOptions
    }));
  };

  const addEndtapOption = () => {
    setExtrudedProduct(prev => ({
      ...prev,
      endtap_options: [
        ...prev.endtap_options,
        {
          tap_size: '',
          price: 0,
          min_depth: 0,
          service_type: '',
          part_no: '',
          currency: 'CAD'
        }
      ]
    }));
  };

  const removeEndtapOption = (index) => {
    setExtrudedProduct(prev => ({
      ...prev,
      endtap_options: prev.endtap_options.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    
    try {
      // Extract only the fields that are valid for the API
      const payload = {
        is_length_based: extrudedProduct.is_length_based,
        price_per_unit: extrudedProduct.price_per_unit,
        cut_price: extrudedProduct.cut_price,
        cut_code: extrudedProduct.cut_code,
        unitType: extrudedProduct.unitType,
        minLength: extrudedProduct.minLength,
        maxLength: extrudedProduct.maxLength,
        is_endtap_based: extrudedProduct.is_endtap_based,
        endtap_options: JSON.stringify(extrudedProduct.endtap_options),
        endtap_code: extrudedProduct.endtap_code,
        attached_product_id: data.id
      };

      if(extrudedProduct?.id !== null) {
        Object.assign(payload, {
          id: extrudedProduct.id
        })
      }

      // Make API call to update extruded products
      const response = await fetch(`/admin/extruded-products/${extrudedProduct.id || ''}`, {
        method: extrudedProduct.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success('Success', {
          description: 'Extruded product details saved successfully'
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save');
      }
    } catch (error) {
      toast.error('Error', {
        description: error.message || 'Failed to save extruded product details'
      });
      console.error('Save error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="p-6">
      <Heading level="h2" className="mb-6">Extruded Product Details</Heading>
      
      <div className="space-y-6">
        {/* Length-based settings */}
        <div className="flex items-center justify-between">
          <Label htmlFor="length-based" className="font-medium">Length-based Product</Label>
          <Switch
            id="length-based"
            checked={extrudedProduct.is_length_based}
            onCheckedChange={(checked) => handleFieldChange('is_length_based', checked)}
          />
        </div>

        {extrudedProduct.is_length_based && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price-per-unit">Price per Unit</Label>
                <Input
                  id="price-per-unit"
                  type="number"
                  step="0.01"
                  value={extrudedProduct.price_per_unit}
                  onChange={(e) => handleFieldChange('price_per_unit', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cut-price">Cut Price</Label>
                <Input
                  id="cut-price"
                  type="number"
                  step="0.01"
                  value={extrudedProduct.cut_price}
                  onChange={(e) => handleFieldChange('cut_price', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cut-code">Cut Code</Label>
              <Input
                id="cut-code"
                value={extrudedProduct.cut_code || ''}
                onChange={(e) => handleFieldChange('cut_code', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit-type">Unit Type</Label>
              <Select
                value={extrudedProduct.unitType}
                onValueChange={(value) => handleFieldChange('unitType', value)}
              >
                <Select.Trigger id="unit-type">
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="inch">Inch</Select.Item>
                  <Select.Item value="mm">Millimeter</Select.Item>
                  <Select.Item value="cm">Centimeter</Select.Item>
                </Select.Content>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-length">Min Length</Label>
                <Input
                  id="min-length"
                  type="number"
                  value={extrudedProduct.minLength}
                  onChange={(e) => handleFieldChange('minLength', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-length">Max Length</Label>
                <Input
                  id="max-length"
                  type="number"
                  value={extrudedProduct.maxLength}
                  onChange={(e) => handleFieldChange('maxLength', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Endtap settings */}
        <div className="flex items-center justify-between mt-6">
          <Label htmlFor="endtap-based" className="font-medium">Endtap-based Product</Label>
          <Switch
            id="endtap-based"
            checked={extrudedProduct.is_endtap_based}
            onCheckedChange={(checked) => handleFieldChange('is_endtap_based', checked)}
          />
        </div>

        {extrudedProduct.is_endtap_based && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="endtap-code">Endtap Code</Label>
              <Input
                id="endtap-code"
                value={extrudedProduct.endtap_code || ''}
                onChange={(e) => handleFieldChange('endtap_code', e.target.value)}
              />
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <Label className="font-medium">Endtap Options</Label>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={addEndtapOption}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add Option
                </Button>
              </div>

              <div className="space-y-4">
                {extrudedProduct.endtap_options.map((option, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <Text className="text-sm font-medium text-gray-600">Option {index + 1}</Text>
                      <IconButton
                        variant="transparent"
                        size="small"
                        onClick={() => removeEndtapOption(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </IconButton>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`tap-size-${index}`}>Tap Size</Label>
                        <Input
                          id={`tap-size-${index}`}
                          value={option.tap_size || ''}
                          onChange={(e) => handleEndtapOptionChange(index, 'tap_size', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`price-${index}`}>Price</Label>
                        <Input
                          id={`price-${index}`}
                          type="number"
                          step="0.01"
                          value={option.price || 0}
                          onChange={(e) => handleEndtapOptionChange(index, 'price', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`min-depth-${index}`}>Min Depth</Label>
                        <Input
                          id={`min-depth-${index}`}
                          type="number"
                          step="0.001"
                          value={option.min_depth || 0}
                          onChange={(e) => handleEndtapOptionChange(index, 'min_depth', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`service-type-${index}`}>Service Type</Label>
                        <Input
                          id={`service-type-${index}`}
                          value={option.service_type || ''}
                          onChange={(e) => handleEndtapOptionChange(index, 'service_type', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`part-no-${index}`}>Part No</Label>
                        <Input
                          id={`part-no-${index}`}
                          value={option.part_no || ''}
                          onChange={(e) => handleEndtapOptionChange(index, 'part_no', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`currency-${index}`}>Currency</Label>
                        <Select
                          value={option.currency || 'CAD'}
                          onValueChange={(value) => handleEndtapOptionChange(index, 'currency', value)}
                        >
                          <Select.Trigger id={`currency-${index}`}>
                            <Select.Value />
                          </Select.Trigger>
                          <Select.Content>
                            <Select.Item value="CAD">CAD</Select.Item>
                            <Select.Item value="USD">USD</Select.Item>
                            <Select.Item value="EUR">EUR</Select.Item>
                          </Select.Content>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <Button
            onClick={handleSave}
            isLoading={loading}
            disabled={loading}
          >
            Save Changes
          </Button>
        </div>
      </div>

      <Toaster />
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ExtrudedProductsWidget;