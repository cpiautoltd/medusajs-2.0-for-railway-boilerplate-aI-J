import { createWorkflow, transform, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { ProductDTO } from "@medusajs/framework/types"
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { Modules } from "@medusajs/framework/utils"
import { ExtrudedProducts, ExtrudedProductsInput } from "modules/extruded-products/models/extruded-products"
import { createExtrudedProductsStep } from "./steps/create-extruded-products"
import { EXTRUDED_PRODUCTS_MODULE } from "modules/extruded-products"

// export type CreateExtrudedProductFromProductWorkflowInput = {
//   additional_data: ExtrudedProductsInput
// }

export const createExtrudedProductFromProductWorkflow = createWorkflow(
  "create-extruded-products-from-product",
  (input: ExtrudedProductsInput) => {

    // console.log("WORKFLOW >> createExtrudedProductFromProductWorkflow : input.additional_data", input.additional_data)

    const extrudedProduct = transform(
      {
        input,
      },
      (data) => {
        return {
          ...data.input,
        }
      }
    )

    // console.log("WORKFLOW >> createExtrudedProductFromProductWorkflow : extrudedProduct TRANSFORMED", extrudedProduct)

    const extrudedProductStep: ExtrudedProducts = createExtrudedProductsStep(extrudedProduct) as ExtrudedProducts
    // console.log("WORKFLOW >> createExtrudedProductFromProductWorkflow : extrudedProductStep", extrudedProductStep)

    when((extrudedProductStep), (extrudedProductStep) => extrudedProductStep !== undefined)
      .then(() => {
        createRemoteLinkStep([{
          [Modules.PRODUCT]: {
            product_id: extrudedProductStep.attached_product_id,
          },
          [EXTRUDED_PRODUCTS_MODULE]: {
            extruded_products_id: extrudedProductStep.id,
          },
        }])
      })
      
    return new WorkflowResponse({
        extrudedProductStep
    })
  }
)