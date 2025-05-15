import { sdk } from "@lib/config"
import { StoreCartShippingOption, StoreShippingOption } from "@medusajs/types"
import { cache } from "react"

// Shipping actions
export const listCartShippingMethods = cache(async function (cartId: string) {
  return sdk.store.fulfillment
    .listCartOptions({ cart_id: cartId }, { next: { tags: ["shipping"] } })
    .then(({ shipping_options }) => shipping_options)
    .catch(() => {
      return null
    })
})

export const calculateShippingOption = (shippingOptionID: string, cart_id: string) => {

  return sdk.store.fulfillment.calculate(shippingOptionID, {
    cart_id: cart_id,
    data: {},
  }).then(({ shipping_option }) => {
    // console.log("calculateShippingOption ::::::::::::::", shipping_option?.name, " with a calculated price of ", shipping_option?.calculated_price)  
    return shipping_option
  }).catch(() => {
    return null
  })
}


export const calculateShippingOptions = (shippingOptions: StoreCartShippingOption[], cart_id: string) => {
  

  const promises = shippingOptions
    .filter((shippingOption) => shippingOption.price_type === "calculated")
    .map((shippingOption) => 
      calculateShippingOption(shippingOption.id, cart_id)
    );

  return Promise.allSettled(promises)
}

// const promises = shippingOptions
//     .filter((shippingOption) => shippingOption.price_type === "calculated")
//     .map((shippingOption) => 
//       sdk.store.fulfillment.calculate(shippingOption.id, {
//         cart_id: cart_id,
//         data: {},
//       })
//     );

//   const results = await Promise.allSettled(promises);

//   return results.map((result) => {
//     if (result.status === "fulfilled") {
//       return result.value;
//     }
//     return null;
//   });



// if (promises.length) {

//   Promise.allSettled(promises).then((res) => {

//     const pricesMap: Record<string, number> = {}

//     res

//       .filter((r) => r.status === "fulfilled")

//       .forEach((p) => (pricesMap[p.value?.shipping_option.id || ""] = p.value?.shipping_option.amount))


//     setCalculatedPrices(pricesMap)

//   })

// }

// })
