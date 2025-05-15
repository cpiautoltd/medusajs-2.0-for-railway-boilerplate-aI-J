import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { ProductDTO } from "@medusajs/framework/types";
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows";
import { Modules } from "@medusajs/framework/utils";
import { MACHINING_SERVICE_MODULE } from "../../modules/machining";
import {
  updateMachiningServicesStep,
  MachiningServiceInput,
} from "./steps/update-machining";
import { Machining } from "modules/machining/models/machining";

export type UpdateMachiningServicesFromProductWorkflowInput = {
  product: ProductDTO;
  additional_data: {
    machining_services: Machining[];
  };
};

export const updateMachiningServicesFromProductWorkflow = createWorkflow(
  "update-machining-services-from-product",
  (input: UpdateMachiningServicesFromProductWorkflowInput) => {
    if (input.additional_data?.machining_services) {
      let updatedServices = [];
      input.additional_data?.machining_services.forEach((machiningService) => {
        const machiningServiceTF = transform(
          { input: machiningService },
          (data) => {
            return data.input;
          }
        );

        const updatedMachiningService =
        updateMachiningServicesStep(machiningServiceTF);

        console.log(
          "UPDATEDD MACHINING INSTANCE IN CREATEWORKFLOW ::: ",
          updatedMachiningService
        );

        updatedServices.push(updatedMachiningService);
      });

      when(
        updatedServices,
        (updatedServices) =>
          Array.isArray(updatedServices) && updatedServices.length > 0
      ).then(() => {
        const links = updatedServices.map((service) => ({
          [Modules.PRODUCT]: { product_id: input.product.id },
          [MACHINING_SERVICE_MODULE]: { machining_services_id: service.id },
        }));
        createRemoteLinkStep(links);
      });

      return new WorkflowResponse({ updatedServices });
    }
  }
);
