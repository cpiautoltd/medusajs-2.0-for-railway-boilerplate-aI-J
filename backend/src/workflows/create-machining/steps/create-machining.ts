

import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import MachiningServicesModuleService from "../../../modules/machining/service";
import { MACHINING_SERVICE_MODULE } from "../../../modules/machining";
import { Machining } from "modules/machining/models/machining";

export type MachiningServiceInput = {
    service_type: string;
    is_active: boolean;
    is_compulsory: boolean;
    attached_product_id:string
    config: Record<string, unknown>;
}

export const createMachiningServicesStep = createStep(
  "create-machining-services",
  async (service:MachiningServiceInput, { container }) => {
    console.log("WORKFLOW >> CREATE_MACHINING_SERVICES STEP: data", service.service_type);

    if (!service) {
      console.log("WORKFLOW >> CREATE_MACHINING_SERVICES STEP: No services to create, returning");
      return
    }

    const machiningServicesModuleService: MachiningServicesModuleService = container.resolve(
      MACHINING_SERVICE_MODULE
    );

    // const createdServices:Machining[] = [];
    // for (const serviceData of services) {
    //   const serviceInput = {
    //     product_id: product_id, // Use product_id from service or step input
    //     service_type: serviceData.service_type,
    //     is_active: serviceData.is_active,
    //     is_compulsory: serviceData.is_compulsory,
    //     config: serviceData.config || {},
    //   };
      const createdService:Machining = await machiningServicesModuleService.createMachiningServicesModels(service);
    //   createdServices.push(service);
      console.log("WORKFLOW >> CREATE_MACHINING_SERVICES STEP: Created machining service", createdService.id);
    // }

    return new StepResponse(createdService, createdService);
  },
  async (createdService:any, { container }) => {
    if (createdService) {
      const machiningServicesModuleService: MachiningServicesModuleService = container.resolve(
        MACHINING_SERVICE_MODULE
      );
    //   for (const service of createdServices) {
        console.log("WORKFLOW >> CREATE_MACHINING_SERVICES STEP: Rollback - Deleting created service", createdService.id);
        await machiningServicesModuleService.deleteMachiningServicesModels(createdService.id);
    //   }
    }
  }
);