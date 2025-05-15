import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import ExtrudedProductsModuleService from "../../../modules/extruded-products/service"
import { EXTRUDED_PRODUCTS_MODULE } from "../../../modules/extruded-products"
import { ExtrudedProducts, ExtrudedProductsInput } from "modules/extruded-products/models/extruded-products"

export const createExtrudedProductsStep = createStep(
  "create-extruded-products",
  async (data: ExtrudedProductsInput, { container }) => {

    console.log("WORKFLOW >> CREATE_EXTRUDED_PRODUCTS STEP 111 : data", data)

    if (data === undefined) {

      console.log("returning", data)

      return
    }

    const extrudedProductsModuleService: ExtrudedProductsModuleService = container.resolve(
        EXTRUDED_PRODUCTS_MODULE
    )

    const extrudedProducts = await extrudedProductsModuleService.createExtrudedProducts(data)
    console.log("WORKFLOW >> createExtrudedProductsSTEP : Created extruded products", extrudedProducts)

    return new StepResponse(extrudedProducts, extrudedProducts)
  },
  async (extrudedProduct, { container }) => {
    const extrudedProductsModuleService: ExtrudedProductsModuleService = container.resolve(
        EXTRUDED_PRODUCTS_MODULE
    )

    console.log("WORKFLOW >> createExtrudedProductsSTEP : Deleting extruded product", extrudedProduct.id)

    await extrudedProductsModuleService.deleteExtrudedProducts(extrudedProduct.id)
  }
)