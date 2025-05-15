import {
  calculateShippingOption,
  calculateShippingOptions,
  listCartShippingMethods,
} from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import Payment from "@modules/checkout/components/payment"
import Review from "@modules/checkout/components/review"
import Shipping from "@modules/checkout/components/shipping"
import { useEffect } from "react"

export default async function CheckoutForm({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) {
  if (!cart) {
    return null
  }

  let shippingMethods = await listCartShippingMethods(cart.id)

  if (shippingMethods?.length) {
    const updatedShippingMethods = await calculateShippingOptions(shippingMethods, cart.id)
    
    // Extract the fulfilled results and their values, filtering out nulls
    const validShippingMethods = updatedShippingMethods
      .filter((result): result is PromiseFulfilledResult<HttpTypes.StoreCartShippingOption> => 
        result.status === "fulfilled" && result.value !== null)
      .map(result => result.value);
    
    // Only update if we have valid results
    if (validShippingMethods.length) {
      shippingMethods = validShippingMethods;
    }
  }

  const paymentMethods = await listCartPaymentMethods(cart.region?.id ?? "")

  if (!shippingMethods || !paymentMethods) {
    return null
  }
  // console.log(
  //   "BEFORE :: checkoutForm :: for shipping ::::::::::::::",
  //   shippingMethods
  // )
  console.log({ shippingMethods, paymentMethods })

  // if (shippingMethods?.length !== 0) {
  //   shippingMethods?.forEach((method) => {
  //     // check if they have got the shipping rates calculated, if not then recalculate them
  //     if (method.price_type === "calculated" && !method.calculated_price) {
  //       const promises = shippingMethods
  //         .filter(
  //           (shippingOption) => shippingOption.price_type === "calculated"
  //         )
  //         .map(async (shippingOption) => {
  //           const updatedShippingMethod = await calculateShippingOption(
  //             shippingOption.id,
  //             cart.id
  //           )
  //           return updatedShippingMethod
  //         })

  //       if (promises.length) {
  //         Promise.all(promises).then((res) => {
  //           res.forEach((result) => {
  //             shippingMethods
  //               .find(method => method.id === result?.id)?
  //           })
  //         })
  //       }
  //     }
  //   })
  // }

  // console.log(
  //   "AFTER :: checkoutForm :: for shipping ::::::::::::::",
  //   shippingMethods
  // )

  return (
    <div>
      <div className="w-full grid grid-cols-1 gap-y-8">
        <div>
          <Addresses cart={cart} customer={customer} />
        </div>

        <div>
          <Shipping cart={cart} availableShippingMethods={shippingMethods} />
        </div>

        <div>
          <Payment cart={cart} availablePaymentMethods={paymentMethods} />
        </div>

        <div>
          <Review cart={cart} />
        </div>
      </div>
    </div>
  )
}
