

import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import MachiningServicesModuleService from "../../../modules/machining/service";
import { MACHINING_SERVICE_MODULE } from "../../../modules/machining";
import { Machining } from "modules/machining/models/machining";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

export type MachiningServiceInput = {
    service_type: string;
    is_active: boolean;
    is_compulsory: boolean;
    attached_product_id:string
    config: Record<string, unknown>;
}

export const createMachiningsStep = createStep(
  "create-machinings",
  async (services:MachiningServiceInput[], { container }) => {
    console.log("WORKFLOW >> CREATE_MACHINING_SERVICES STEP: Number of services", services.length);

    if (!services.length) {
      console.log("WORKFLOW >> CREATE_MACHINING_SERVICES STEP: No services to create, returning");
      return
    }

    const machiningServicesModuleService: MachiningServicesModuleService = container.resolve(
      MACHINING_SERVICE_MODULE
    );

    // const link = container.resolve(ContainerRegistrationKeys.LINK)

    // const createdServices:Machining[] = [];
    // for (const serviceData of services) {
    //   const serviceInput = {
    //     product_id: product_id, // Use product_id from service or step input
    //     service_type: serviceData.service_type,
    //     is_active: serviceData.is_active,
    //     is_compulsory: serviceData.is_compulsory,
    //     config: serviceData.config || {},
    //   };

//     {
//     id: string;
//     attached_product_id: string;
//     service_type: string;
//     is_active: boolean;
//     is_compulsory: boolean;
//     config: Record<string, unknown>;
//     created_at: Date;
//     updated_at: Date;
//     deleted_at: Date;
// }[]
      const createdServices:Machining[] = await machiningServicesModuleService.createMachiningServicesModels(services);
    //   createdServices.push(service);
      console.log("WORKFLOW >> CREATE_MACHINING_SERVICES STEP: Created machining service", createdServices.length);

    return new StepResponse(createdServices, createdServices);
  },
  async (createdServices:Machining[], { container }) => {
    console.log("Rollbacking create-machinings")
    if (createdServices.length) {
      const machiningServicesModuleService: MachiningServicesModuleService = container.resolve(
        MACHINING_SERVICE_MODULE
      );
    //   for (const service of createdServices) {
        console.log("WORKFLOW >> CREATE_MACHINING_SERVICES STEP: Rollback - Deleting created service", createdServices.length);
        await machiningServicesModuleService.deleteMachiningServicesModels(createdServices.map(_ => _.id));
    //   }
    }
  }
);