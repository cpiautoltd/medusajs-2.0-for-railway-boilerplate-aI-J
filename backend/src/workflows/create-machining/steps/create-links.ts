import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { LinkDefinition } from "@medusajs/framework/types"
import {
  createStep,
  StepResponse
} from "@medusajs/framework/workflows-sdk"
import { MACHINING_SERVICE_MODULE } from "modules/machining"
import { logger } from "@medusajs/framework"
import { createRemoteLinkStep } from "@medusajs/core-flows"

interface CreateMachiningLinksInput {
  serviceIds: string[]
  productId: string
}

export const createMachiningLinksStep = createStep(
  "create-machining-link",
  async function (
    input: CreateMachiningLinksInput,
    { container }
  ) {

    if(!input.productId || input.serviceIds.length === 0) {
        return new StepResponse({
            success: false,
            message: "No productId or Service Ids found to link!!"
        })
    }

    const linksService = container.resolve(
      ContainerRegistrationKeys.LINK
    )

    const links:LinkDefinition[] = []

    for (const sid of input.serviceIds) {
              links.push({
                [Modules.PRODUCT]: {
                  product_id: input.productId,
                },
    
                [MACHINING_SERVICE_MODULE]: {
                  machinings_id: sid,
                },
              });
            }

            // createRemoteLinkStep(links)
    
           const linksResponse =  await linksService.create(links);



    // await linksService.create
    return new StepResponse({
      success: true,
      message: "linked",
      res: linksResponse
    })
  },
  async function (
    input,
    { container }
  ) {
    logger.info("In compensation function of linking step")
    
  }
)