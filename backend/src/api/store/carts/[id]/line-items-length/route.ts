
// src/api/store/carts/[id]/line-items-length/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { StoreAddCartLineItem } from "@medusajs/framework/types"
import { addLengthBasedToCartWorkflow } from "../../../../../workflows/add-length-based-to-cart"
import { EndtapConfig } from "modules/length-pricing/service"

// Extended type for request body
interface StoreAddLengthBasedLineItem extends StoreAddCartLineItem {
  selectedLength: number,
  endtapConfig: EndtapConfig
}

export const POST = async (
  req: MedusaRequest<StoreAddLengthBasedLineItem>, 
  res: MedusaResponse
) => {
  const { id } = req.params
  const item = req.validatedBody

  const { result } = await addLengthBasedToCartWorkflow(req.scope)
    .run({
      input: {
        cart_id: id,
        item,
      },
    })

  res.status(200).json({ cart: result.cart })
}