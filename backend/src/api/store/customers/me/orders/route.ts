// backend/src/api/store/customers/me/orders/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { IOrderModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { authenticateClerkCustomer } from "../../../../middlewares/clerk-auth"
import "../../../../types"

export const GET = [
  authenticateClerkCustomer,
  async (req: MedusaRequest, res: MedusaResponse) => {
    const orderService: IOrderModuleService = req.scope.resolve(Modules.ORDER)
    
    const { limit = 20, offset = 0, status } = req.query

    const filters: any = {
      customer_id: req.customer_id
    }

    if (status) {
      filters.status = Array.isArray(status) ? status : [status]
    }

    // Use listOrders instead of listAndCount
    const [orders, count] = await orderService.listAndCountOrders(filters, {

      take: Number(limit),
      skip: Number(offset),
      relations: ["items", "shipping_address", "shipping_methods"]
    })

    // Get count separately if needed
    // const count = await orderService.listAndCountOrders(filters, {
    //   count: true
    // })

    res.json({
      orders,
      count: count,
      offset: Number(offset),
      limit: Number(limit),
    })
  }
]