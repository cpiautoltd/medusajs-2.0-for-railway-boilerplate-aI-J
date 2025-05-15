import { UPSOptions } from "./service"
import { MedusaError } from "@medusajs/framework/utils"

export class UPSClient {
  options: UPSOptions
  accessToken: string | null = null
  tokenExpiry: Date | null = null

  constructor(options) {
    this.options = options
  }

  /**
   * Get OAuth 2.0 token for UPS API
   * Uses sandbox endpoints when in test mode
   */
  async getOAuthToken(): Promise<string> {
    // Return cached token if it's still valid
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken
    }

    console.log("UPSClient.getOAuthToken ::::::::::::::")

    // Determine endpoint based on test mode
    const baseUrl = this.options.sandbox
      ? "https://wwwcie.ups.com/security/v1/oauth/token"
      : "https://onlinetools.ups.com/security/v1/oauth/token"

    try {
      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "x-merchant-id": this.options.merchantId || "",
          "Authorization" : `Basic ${Buffer.from(
          `${this.options.clientId}:${this.options.clientSecret}`
        ).toString("base64")}`
        },
        body: "grant_type=client_credentials",
        // Use client ID and secret for authentication
        credentials: "include",
      })

      // if (!response.ok) {

      // Add the authentication header manually for better control
      // response.headers.set(
      //   "Authorization",
      //   `Basic ${Buffer.from(
      //     `${this.options.clientId}:${this.options.clientSecret}`
      //   ).toString("base64")}`
      // )

      if (!response.ok) {
        const error = await response.text()
        throw new MedusaError(
          MedusaError.Types.UNAUTHORIZED,
          `Failed to authenticate with UPS: ${error}`
        )
      }

      const data = await response.json()
      

      console.log("UPSClient.getOAuthToken.reponse data ::::::::::::::", data)

      // Set token and expiry
      this.accessToken = data.access_token
      // Set expiry 5 minutes before actual expiry to be safe
      this.tokenExpiry = new Date(
        Date.now() + (data.expires_in - 300) * 1000
      )
      
      return this.accessToken;
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.UNAUTHORIZED,
        `Error obtaining UPS OAuth token: ${error.message}`
      )
    }
  }

  /**
   * Send authenticated request to UPS API
   */
  private async sendRequest(
    endpoint: string,
    data?: RequestInit
  ): Promise<any> {
    const token = await this.getOAuthToken()
    
    // Determine base URL based on sandbox mode
    const baseUrl = this.options.sandbox
      ? "https://wwwcie.ups.com/api"
      : "https://onlinetools.ups.com/api"

    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...data,
        headers: {
          ...data?.headers,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-merchant-id": this.options.merchantId || "",
        },
      })

      // Check if response is JSON
      const contentType = response.headers.get("content-type")
      let responseData
      
      if (contentType?.includes("application/json")) {
        responseData = await response.json()
      } else {
        responseData = await response.text()
      }

      if (!response.ok) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `UPS API error: ${
            typeof responseData === "object"
              ? JSON.stringify(responseData)
              : responseData
          }`
        )
      }

      return responseData
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Error making request to UPS API: ${error.message}`
      )
    }
  }

  /**
   * Get shipping services available from UPS
   */
  async getShippingServices(): Promise<any> {
    return await this.sendRequest("/shipping/v1/services", {
      method: "GET",
    })
  }

  /**
   * Get shipping rates for a package
   */
  async getRates(requestData: any): Promise<any> {
    return await this.sendRequest("/rating/v1/Shop", {
      method: "POST",
      body: JSON.stringify(requestData),
    })
  }

  /**
   * Create a shipment
   */
  async createShipment(requestData: any): Promise<any> {
    return await this.sendRequest("/shipping/v1/shipments", {
      method: "POST",
      body: JSON.stringify(requestData),
    })
  }

  /**
   * Void a shipment
   */
  async voidShipment(shipmentId: string): Promise<any> {
    return await this.sendRequest(`/shipping/v1/void/shipments/${shipmentId}`, {
      method: "DELETE",
    })
  }

  /**
   * Track a shipment
   */
  async trackShipment(trackingNumber: string): Promise<any> {
    return await this.sendRequest(`/track/v1/details/${trackingNumber}`, {
      method: "GET",
    })
  }
}