import { 
  AbstractFulfillmentProviderService,
  MedusaError
} from "@medusajs/framework/utils"
import { 
  FulfillmentOption, 
  CreateShippingOptionDTO,
  CalculateShippingOptionPriceDTO,
  CalculatedShippingOptionPrice,
  CartDTO,
} from "@medusajs/framework/types"
import { UPSClient } from "./client"
import { SHIPPING_PROVINCE_MAP, UPS_MERCHANT_ID } from "lib/constants"
import { ActualCalculateShippingOptionPriceContext, ActualItemsDTO } from "./types"
import { parse } from "path"

export type UPSOptions = {
  clientId: string
  clientSecret: string
  merchantId?: string
  sandbox: boolean
}

class UPSProviderService extends AbstractFulfillmentProviderService {
  static identifier = "ups"
  
  protected options_: UPSOptions
  protected client: UPSClient

  constructor({}, options: UPSOptions) {
    super()
    
    this.options_ = options
    this.client = new UPSClient(options)
  }

  /**
   * Returns a list of fulfillment options available from UPS
   */
  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    try {
      // console.log("UPSProviderService.getFulfillmentOptions ::::::::::::::")
      // Get UPS shipping services
      // const services = await this.client.getShippingServices()
      
      // Map UPS services to fulfillment options format
      const fulfillmentOptions: FulfillmentOption[] = []
      
      // This is a simplified approach - adjust based on actual UPS API response
      // In a real implementation, you'll parse the services from the response
      const defaultServices = [
        { code: "01", name: "UPS Next Day Air" },
        { code: "02", name: "UPS 2nd Day Air" },
        { code: "03", name: "UPS Ground" },
        { code: "07", name: "UPS Worldwide Express" },
        { code: "11", name: "UPS Standard" },
        { code: "12", name: "UPS 3 Day Select" },
        { code: "14", name: "UPS Next Day Air Early" }
      ]
      
      for (const service of defaultServices) {
        fulfillmentOptions.push({
          id: service.code,
          name: service.name,
          // Store additional data needed for rate calculation
          service_code: service.code,
          provider_id: UPSProviderService.identifier
        })
      }

      // console.log("fulfillmentOptions ::::::::::::::", fulfillmentOptions)
      
      return fulfillmentOptions
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Error fetching UPS fulfillment options: ${error.message}`
      )
    }
  }

  /**
   * Returns whether this fulfillment provider can calculate rates
   */
  async canCalculate(data: CreateShippingOptionDTO): Promise<boolean> {

    // console.log("UPSProviderService.canCalculate ::::::::::::::", data)

    return true // UPS can calculate shipping rates
  }

  /**
 * Create UPS-compatible address format with proper state/province code conversion
 */
private formatAddress(address: any): any {
  // Map full province/state names to their two-letter codes
  const provinceMap = SHIPPING_PROVINCE_MAP

  // Convert the province name to a two-letter code
  let stateProvinceCode = address.province || '';
  
  // If it's already a 2-character code, use it as is
  if (stateProvinceCode && stateProvinceCode.length === 2) {
    stateProvinceCode = stateProvinceCode.toUpperCase();
  } 
  // Otherwise, try to look it up in our map
  else if (stateProvinceCode) {
    const lookupCode = provinceMap[stateProvinceCode.toLowerCase()];
    if (lookupCode) {
      stateProvinceCode = lookupCode;
    }
  }

  return {
    AddressLine: [
      address.address_1 || "",
      address.address_2 || ""
    ].filter(Boolean),
    City: address.city || "",
    StateProvinceCode: stateProvinceCode,
    PostalCode: address.postal_code || "",
    CountryCode: address.country_code ? address.country_code.toUpperCase() : ""
  }
}

  /**
   * Calculate a shipping price
   */
  // async calculatePrice(
  //   optionData: Record<string, unknown>,
  //   data: Record<string, unknown>,
  //   context: Record<string, unknown>
  // ): Promise<CalculatedShippingOptionPrice> {
  //   try {
  //     const serviceCode = optionData.service_code as string
      
  //     console.log("UPSProviderService.calculatePrice ::::::::::::::", optionData, data, context)

  //     if (!context.shipping_address) {
  //       throw new MedusaError(
  //         MedusaError.Types.INVALID_DATA,
  //         "No shipping address provided"
  //       )
  //     }

  //     if (!context.from_location?.address) {
  //       throw new MedusaError(
  //         MedusaError.Types.INVALID_DATA,
  //         "No shipping origin address provided"
  //       )
  //     }
      
  //     // Calculate total weight and package dimensions
  //     let totalWeight = 0
  //     const items = context.items as any[] || []
      
  //     for (const item of items) {
  //       totalWeight += (item.variant?.weight || 0) * item.quantity
  //     }
      
  //     // Default weight if none provided
  //     if (totalWeight <= 0) totalWeight = 0.5
      
  //     // Create rate request payload
  //     const rateRequest = {
  //       RateRequest: {
  //         Request: {
  //           RequestOption: "Shop",
  //           TransactionReference: {
  //             CustomerContext: "Medusa UPS Rate",
  //           }
  //         },
  //         Shipment: {
  //           ShipFrom: {
  //             Address: this.formatAddress(context.from_location.address)
  //           },
  //           Shipper: {
  //             Name: "Milan Lakhani",
  //             Address: this.formatAddress(context.from_location.address),              
  //           },
  //           ShipTo: {
  //             Address: this.formatAddress(context.shipping_address)
  //           },
  //           Service: {
  //             Code: serviceCode
  //           },
  //           Package: {
  //             PackagingType: {
  //               Code: "02", // Customer supplied packaging
  //               Description: "Package"
  //             },
  //             Dimensions: {
  //               UnitOfMeasurement: {
  //                 Code: "IN"
  //               },
  //               Length: "10",
  //               Width: "10",
  //               Height: "10"
  //             },
  //             PackageWeight: {
  //               UnitOfMeasurement: {
  //                 Code: "LBS"
  //               },
  //               Weight: String(Math.max(0.1, totalWeight))
  //             }
  //           }
  //         }
  //       }
  //     }
      
  //     // Get rates from UPS
  //     const rateResponse = await this.client.getRates(rateRequest)
      
  //     // Parse rate from response
  //     const rateInfo = rateResponse?.RateResponse?.RatedShipment
      
  //     if (!rateInfo) {
  //       throw new MedusaError(
  //         MedusaError.Types.UNEXPECTED_STATE,
  //         "No rate information returned from UPS"
  //       )
  //     }
      
  //     // Get total charges
  //     const totalCharges = rateInfo.TotalCharges?.MonetaryValue
      
  //     if (!totalCharges) {
  //       throw new MedusaError(
  //         MedusaError.Types.UNEXPECTED_STATE,
  //         "No charge information returned from UPS"
  //       )
  //     }
      
  //     return {
  //       calculated_amount: Math.round(parseFloat(totalCharges) * 100), // Convert to cents
  //       is_calculated_price_tax_inclusive: false
  //     }
  //   } catch (error) {
  //     throw new MedusaError(
  //       MedusaError.Types.UNEXPECTED_STATE,
  //       `Error calculating UPS shipping rate: ${error.message}`
  //     )
  //   }
  // }

  /**
 * Calculate a shipping price
 */
// ts-ignore
async calculatePrice(
  optionData: CalculateShippingOptionPriceDTO["optionData"],
  data: CalculateShippingOptionPriceDTO["data"],
  context: any
): Promise<CalculatedShippingOptionPrice> {
  try {
    const serviceCode = optionData.service_code as string

    
    
    console.log("UPSProviderService.calculatePrice ::::::::::::::", optionData, data, context)

    if (!context.shipping_address) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "No shipping address provided"
      )
    }

    if (!context.from_location?.address) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "No shipping origin address provided"
      )
    }
    
    // Get cart items 
    const items = context.items as ActualItemsDTO[] || []
    // context.items[0].metadata.
    
    // Calculate total weight and package dimensions
    let totalWeight = 0
    let maxLength = 0
    let maxWidth = 0
    let maxHeight = 0
    
    for (const item of items) {
      // item.variantitems
      
      // Add weight based on product variant weight * quantity
      // Default to 0.5 lbs if no weight specified

      console.log(`For the item, ${item.id}, the weight is ${item.variant?.weight} and the quantity is ${item.quantity} and typeof is ${typeof item.quantity}`)

      console.log(parseInt(item.quantity.toString()))
      const itemWeight = ((item.variant?.weight/ 1000) || 0.5) * parseInt(item.quantity.toString())

      
      totalWeight += itemWeight
      console.log(`For the item, ${item.id}, the weight is ${itemWeight} and total weight is ${totalWeight}`)
      
      // Set dimensions if they're available in the variant
      if (item.variant?.length && item.variant.length > maxLength) maxLength = item.variant.length
      if (item.variant?.width && item.variant.width > maxWidth) maxWidth = item.variant.width
      if (item.variant?.height && item.variant.height > maxHeight) maxHeight = item.variant.height
    }
    
    // Ensure there's a minimum weight
    if (totalWeight <= 0) totalWeight = 0.5
    
    // Ensure weight doesn't exceed UPS maximum (150 pounds)
    const maxUpsWeight = 150
    if (totalWeight > maxUpsWeight) {
      console.log(`Weight exceeds UPS maximum of ${maxUpsWeight} pounds. Limiting to ${maxUpsWeight} pounds.`)
      totalWeight = maxUpsWeight
    }
    
    // Get shipper details from from_location
    const shipperName = context.from_location.address.company || "Shipper"
    
    // Create rate request payload
    const rateRequest = {
      RateRequest: {
        Request: {
          RequestOption: "Shop",
          TransactionReference: {
            CustomerContext: "Medusa UPS Rate"
          }
        },
        Shipment: {
          ShipFrom: {
            Name: shipperName,
            Address: this.formatAddress(context.from_location.address)
          },
          Shipper: {
            Name: shipperName,
            Address: this.formatAddress(context.from_location.address)
          },
          ShipTo: {
            Name: [
              context.shipping_address.first_name,
              context.shipping_address.last_name
            ].filter(Boolean).join(" "),
            Address: this.formatAddress(context.shipping_address)
          },
          Service: {
            Code: serviceCode
          },
          Package: {
            PackagingType: {
              Code: "02", // Customer supplied packaging
              Description: "Package"
            },
            Dimensions: {
              UnitOfMeasurement: {
                Code: "IN"
              },
              Length: String(maxLength),
              Width: String(maxWidth),
              Height: String(maxHeight)
            },
            PackageWeight: {
              UnitOfMeasurement: {
                Code: "LBS"
              },
              Weight: String(Math.max(0.1, totalWeight))
            }
          }
        }
      }
    }
    
    // Log the request for debugging
    console.log("UPS Rate Request:", JSON.stringify(rateRequest, null, 2))
    
    // Get rates from UPS
    const rateResponse = await this.client.getRates(rateRequest)
    
    // Log the response for debugging
    console.log("UPS Rate Response:", JSON.stringify(rateResponse, null, 2))
    
    // Check if we have a response
    if (!rateResponse?.RateResponse) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Invalid response from UPS"
      )
    }
    
    // The response contains an array of rated shipments, we need to find the one matching our service code
    const ratedShipments = rateResponse.RateResponse.RatedShipment || []
    
    // Find the matching service in the response
    let matchingRate;

    console.log("got UPS ratedShipments and now matching service code")
    
    // Check if RatedShipment is an array
    if (Array.isArray(ratedShipments)) {
      matchingRate = ratedShipments.find(rate => rate.Service?.Code === serviceCode)

      console.log("matchingRate is : ", matchingRate)
    } else {
      // If it's not an array, check if it's the service we want
      if (ratedShipments.Service?.Code === serviceCode) {
        matchingRate = ratedShipments
      }
    }
    
    if (!matchingRate) {
      // If no exact match is found, try to use any available rate as fallback
      matchingRate = Array.isArray(ratedShipments) ? ratedShipments[0] : ratedShipments
      
      if (!matchingRate) {
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          `No rate found for service code ${serviceCode}`
        )
      }
    }
    
    // Get total charges
    const totalCharges = matchingRate.TotalCharges?.MonetaryValue

    console.log("totalCharges is : ", totalCharges)
    
    if (!totalCharges) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "No charge information returned from UPS"
      )
    }

    
    return {
      calculated_amount: Math.round(parseFloat(totalCharges)), // Convert to cents
      is_calculated_price_tax_inclusive: false
    }
  } catch (error) {
    // Log the full error for debugging
    console.error("UPS rate calculation error:", error)
    
    // Return a fallback rate
    return {
      calculated_amount: 15, // $15.00 as fallback
      is_calculated_price_tax_inclusive: false,
    }
  }
}

  /**
   * Validates and potentially transforms the fulfillment data
   */
  async validateFulfillmentData(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<Record<string, unknown>> {

    console.log("UPSProviderService.validateFulfillmentData ::::::::::::::", optionData, data, context)

    // Store any relevant data for creating the fulfillment later
    return {
      ...data,
      service_code: optionData.service_code,
      from_address: (context.from_location as { address: string }).address, //context.from_location?.address,
      to_address: context.shipping_address
    }
  }

  /**
   * Creates a fulfillment in UPS
   */
  // async createFulfillment(
  //   data: Record<string, unknown>,
  //   items: Record<string, unknown>[],
  //   order: Record<string, unknown> | undefined,
  //   fulfillment: Record<string, unknown>
  // ): Promise<Record<string, unknown>> {
  //   try {
  //     const serviceCode = data.service_code as string
  //     const fromAddress = data.from_address as Record<string, unknown>
  //     const toAddress = data.to_address as Record<string, unknown>
      
  //     if (!serviceCode || !fromAddress || !toAddress) {
  //       throw new MedusaError(
  //         MedusaError.Types.INVALID_DATA,
  //         "Missing required shipment data"
  //       )
  //     }
      
  //     // Create shipment request
  //     const shipmentRequest = {
  //       ShipmentRequest: {
  //         Request: {
  //           RequestOption: "validate",
  //           TransactionReference: {
  //             CustomerContext: `Order ${order?.id || "unknown"}`
  //           }
  //         },
  //         Shipment: {
  //           Description: `Order ${order?.id || "unknown"}`,
  //           ShipFrom: {
  //             Name: fromAddress.name || "Sender",
  //             Address: this.formatAddress(fromAddress)
  //           },
  //           ShipTo: {
  //             Name: [
  //               toAddress.first_name, 
  //               toAddress.last_name
  //             ].filter(Boolean).join(" ") || "Recipient",
  //             Address: this.formatAddress(toAddress)
  //           },
  //           Service: {
  //             Code: serviceCode
  //           },
  //           Package: {
  //             // Package details would go here
  //             // This is simplified
  //             Description: "Order Items",
  //             PackagingType: {
  //               Code: "02",
  //               Description: "Package"
  //             },
  //             PackageWeight: {
  //               UnitOfMeasurement: {
  //                 Code: "LBS"
  //               },
  //               Weight: "1.0" // Would calculate from items
  //             }
  //           },
  //           PaymentInformation: {
  //             ShipmentCharge: {
  //               Type: "01", // Transportation
  //               BillShipper: {
  //                 AccountNumber: this.options_.merchantId || ""
  //               }
  //             }
  //           }
  //         },
  //         LabelSpecification: {
  //           LabelImageFormat: {
  //             Code: "GIF",
  //             Description: "GIF"
  //           }
  //         }
  //       }
  //     }
      
  //     // Create shipment in UPS
  //     const shipmentResponse = await this.client.createShipment(shipmentRequest)
      
  //     // Extract tracking number and label URL
  //     const trackingNumber = shipmentResponse?.ShipmentResponse?.ShipmentResults?.PackageResults?.TrackingNumber
  //     const shipmentId = shipmentResponse?.ShipmentResponse?.ShipmentResults?.ShipmentIdentificationNumber
  //     const labelUrl = shipmentResponse?.ShipmentResponse?.ShipmentResults?.PackageResults?.ShippingLabel?.GraphicImage
      
  //     // Return data to be stored with the fulfillment
  //     return {
  //       data: {
  //         ...(fulfillment.data as object || {}),
  //         tracking_number: trackingNumber,
  //         shipment_id: shipmentId,
  //         label_url: labelUrl,
  //       }
  //     }
  //   } catch (error) {
  //     throw new MedusaError(
  //       MedusaError.Types.UNEXPECTED_STATE,
  //       `Error creating UPS shipment: ${error.message}`
  //     )
  //   }
  // }

  /**
   * Cancels a fulfillment in UPS
   */
  async cancelFulfillment(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const shipmentId = data.shipment_id as string
      
      if (!shipmentId) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "No shipment ID provided for cancellation"
        )
      }
      
      // Void the shipment in UPS
      await this.client.voidShipment(shipmentId)
      
      return { success: true }
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Error cancelling UPS shipment: ${error.message}`
      )
    }
  }
}

export default UPSProviderService