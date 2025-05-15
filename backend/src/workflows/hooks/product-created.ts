import { createProductsWorkflow } from "@medusajs/medusa/core-flows";
import { ProductDTO } from "@medusajs/framework/types";
import {
  createExtrudedProductFromProductWorkflow,
} from "../create-extruded-products";
import { ExtrudedProductsInput } from "modules/extruded-products/models/extruded-products";

createProductsWorkflow.hooks.productsCreated(
  async ({ products, additional_data }, { container }) => {
    const workflow = createExtrudedProductFromProductWorkflow(container);

     
    for (const product of products) {
      console.log("this product's product.additional_data : ", additional_data);

      // if product's additional_data is not defined, default to false
      if (additional_data === undefined) {
        continue;
      }

      const updated_additional_data = additional_data as ExtrudedProductsInput
      updated_additional_data.attached_product_id = product.id

      await workflow.run({
        input: updated_additional_data,
      });
    }
  }
);
