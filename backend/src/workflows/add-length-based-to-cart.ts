// src/workflows/add-length-based-to-cart.ts
import {
  createWorkflow,
  transform,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { addToCartWorkflow } from "@medusajs/medusa/core-flows";
import { QueryContext } from "@medusajs/framework/utils";
import {
  calculateLengthBasedPriceStep,
  CalculateLengthBasedPriceInput,
} from "./steps/calculate-length-based-price";
import { StoreAddCartLineItem } from "@medusajs/framework/types";
import { EndtapConfig } from "modules/length-pricing/service";

type AddLengthBasedToCartInput = {
  cart_id: string;
  item: StoreAddCartLineItem & {
    selectedLength: number;
    endtapConfig: EndtapConfig;
  };
};

export const addLengthBasedToCartWorkflow = createWorkflow(
  "add-length-based-to-cart",
  ({ cart_id, item }: AddLengthBasedToCartInput) => {
    // Fetch cart details
    const { data: carts } = useQueryGraphStep({
      entity: "cart",
      filters: { id: cart_id },
      fields: ["id", "currency_code"],
    });

    // debugger;
    // console.log("WORKFLOW >> addLengthBasedToCartWorkflow : carts")

    // Fetch variant details
    const { data: variants } = useQueryGraphStep({
      entity: "variant",
      fields: [
        "*",
        "options.*",
        "options.option.*",
        "calculated_price.*",
        "product.extruded_products.*", // Include extruded products data
      ],
      filters: {
        id: item.variant_id,
      },
      options: {
        throwIfKeyNotFound: true,
      },
      context: {
        calculated_price: QueryContext({
          currency_code: carts[0].currency_code,
        }),
      },
    }).config({ name: "retrieve-variant" });

    // Calculate the length-based price
    const { totalPrice: price, extrudedProduct } =
      calculateLengthBasedPriceStep({
        variant: variants[0],
        selectedLength: item.selectedLength,
        currencyCode: carts[0].currency_code,
        endTapConfig: item.endtapConfig,
        quantity: item.quantity,
      } as unknown as CalculateLengthBasedPriceInput);

    // console.log(
    //   "WORKFLOW >> addLengthBasedToCartWorkflow : variants[0].product.extruded_products",
    //   variants[0].product.extruded_products
    // );

    // const itemToAdd = transform({
    //     item,
    //     price,
    //   }, (data) => {
    //     return [{
    //       item: data.item,
    //       unit_price: data.price,
    //     }]
    //   })

    // Prepare the item data with the custom price
    const itemToAdd = transform(
      {
        item,
        price,
        extrudedProduct,
      },
      (data) => {
        return [
          {
            variant_id: data.item.variant_id,
            quantity: data.item.quantity,
            metadata: {
              ...(data.item.metadata || {}),
              lengthPricing: {
                selectedLength: data.item.selectedLength,
                unitType: data.extrudedProduct.unitType,
                pricePerUnit: data.extrudedProduct.price_per_unit,
                cutPrice: data.extrudedProduct.cut_price,
                calculatedPrice: data.price,
                attached_product_id: data.extrudedProduct.attached_product_id,
                cut_code: data.extrudedProduct.cut_code,
                endtap_code: data.extrudedProduct.endtap_code,
                endtap_options: data.extrudedProduct.endtap_options,
                endtapConfig: data.item.endtapConfig
              },
            },
            unit_price: data.price,
          },
        ];
      }
    );

    // AddToCartWorkflowInputDTO
    // itemToAdd[0].
    // Add the item to the cart
    addToCartWorkflow.runAsStep({
      input: {
        items: itemToAdd,
        // items: itemToAdd,
        cart_id,
      },
    });

    // Refetch and return the updated cart
    const { data: updatedCarts } = useQueryGraphStep({
      entity: "cart",
      filters: { id: cart_id },
      fields: ["id", "items.*"], // , "items.metadata"
    }).config({ name: "refetch-cart" });

    console.log(
      "While updating carts, does the cart have metadata?",
      updatedCarts[0]?.items[0]?.metadata
    );

    return new WorkflowResponse({
      cart: updatedCarts[0],
    });
  }
);
