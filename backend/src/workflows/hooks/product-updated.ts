import { updateProductsWorkflow } from "@medusajs/medusa/core-flows";
import { EXTRUDED_PRODUCTS_MODULE } from "../../modules/extruded-products";
import ExtrudedProductsModuleService from "../../modules/extruded-products/service";
import { MedusaError } from "@medusajs/framework/utils";
import { Modules } from "@medusajs/framework/utils";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { transform } from "@medusajs/framework/workflows-sdk";
import { ExtrudedProducts } from "modules/extruded-products/models/extruded-products";

updateProductsWorkflow.hooks.productsUpdated(
  async ({ products, additional_data }, { container }) => {
    console.log("HOOK >> productsUpdated: Updating extruded products data");
    console.log("HOOK >> productsUpdated: additional_data", additional_data);
    console.log("HOOK >> productsUpdated: products", products);

    if (additional_data && additional_data?.id) {
      const query = container.resolve(ContainerRegistrationKeys.QUERY);

      const additional_data_validated = additional_data as ExtrudedProducts;
      const extrudedProductsModuleService: ExtrudedProductsModuleService =
        container.resolve(EXTRUDED_PRODUCTS_MODULE);

      for (const product of products) {
        try {
          if (!additional_data.id) {
            throw new MedusaError(
              MedusaError.Types.UNEXPECTED_STATE,
              `Failed to update extruded product data: No extruded product ID provided`
            );
          }

          // Find any extruded products linked to this product
          const { data: extrudedProductsResult }: { data: ExtrudedProducts[] } =
            await query.graph({
              entity: EXTRUDED_PRODUCTS_MODULE,

              fields: ["*"],

              filters: {
                id: additional_data_validated.id,
              },
            });

          if (!extrudedProductsResult || extrudedProductsResult.length === 0) {
            throw new MedusaError(
              MedusaError.Types.UNEXPECTED_STATE,
              `Failed to update extruded product data: No extruded product found for Extruded Product ID ${additional_data.id}`
            );
          }

          if (extrudedProductsResult.length > 0) {
            // const resultObj = {
            //     ...extrudedProductsResult[0],
            //     ...additional_data_validated
            //   }

            const updatedExtrudedProduct =
              await extrudedProductsModuleService.updateExtrudedProducts({
                ...extrudedProductsResult[0],
                ...additional_data_validated,
              });
          }
        } catch (error) {
          console.error(
            `HOOK >> productsUpdated: Error updating extruded product for product ${product.id}:`,
            error
          );
          throw new MedusaError(
            MedusaError.Types.UNEXPECTED_STATE,
            `Failed to update extruded product data: ${error.message}`
          );
        }
      }
    }
    console.log("HOOK >> productsUpdated: Completed extruded products update");
  }
);
