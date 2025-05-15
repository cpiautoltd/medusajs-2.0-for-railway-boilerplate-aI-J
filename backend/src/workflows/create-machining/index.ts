import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { LinkDefinition, ProductDTO } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { MACHINING_SERVICE_MODULE } from "../../modules/machining";
import {
  createMachiningServicesStep,
  MachiningServiceInput,
} from "./steps/create-machining";
import { logger } from "@medusajs/framework";
import { createRemoteLinkStep } from "@medusajs/core-flows";
import { createMachiningLinksStep } from "./steps/create-links";
import { createMachiningsStep } from "./steps/create-machinings";
import { Machining } from "modules/machining/models/machining";

export type CreateMachiningServicesFromProductWorkflowInput = {
  product: ProductDTO;
  additional_data: {
    machining_services: {
      service_type: string;
      is_active: boolean;
      is_compulsory: boolean;
      attached_product_id: string;
      config: Record<string, unknown>;
    }[];
  };
};

export const createMachiningServicesFromProductWorkflow = createWorkflow(
  "create-machinings-from-product",
  (input: CreateMachiningServicesFromProductWorkflowInput) => {
    // Ensure machining_services is an array
    // const machiningServices = Array.isArray(input.additional_data?.machiningServiceInputs)
    //   ? input.additional_data.machining_services
    //   : input.additional_data?.machining_services
    //   ? [input.additional_data.machining_services]
    //   : [];

    // logger.info("CREATE WORKFLOW INDEX: STARTING WITH MACHINING SERVICES: " + input.additional_data.machining_services);

    // Use transform to map over machining_services and create service inputs
    const machiningServiceInputs = transform(
      { machiningServices: input.additional_data.machining_services, productId: input.product.id },
      (data) =>
        data.machiningServices.map((service) => {
          return {
            service_type: service.service_type,
            is_active: service.is_active,
            is_compulsory: service.is_compulsory,
            attached_product_id: data.productId,
            config: service.config,
          };
        })
    );

    // Create machining services for each input
    // const createdServices = transform(
    //   { machiningServiceInputs },
    //   ({ machiningServiceInputs }) => {
    //     return machiningServiceInputs.map((serviceInput: MachiningServiceInput) =>
    //       createMachiningServicesStep(serviceInput)
    //     );
    //   }
    // );

    const createdServices: Machining[] = createMachiningsStep(
      machiningServiceInputs
    );

    // logger.info("CREATE WORKFLOW INDEX: CREATED SERVICES: " + JSON.stringify(createdServices));

    const serviceIds = transform({ createdServices }, ({ createdServices }) =>
      createdServices.map((_) => _.id)
    );

    const productId = transform(input, (data) => data.product.id);

    const linksResponse = createMachiningLinksStep({
      serviceIds,
      productId
    })



    // console.log("Links Response")

    // let links: LinkDefinition[] = [];
    // serviceIds.forEach(id => {
    //   links.push({
    //     [Modules.PRODUCT]: { product_id: productId },
    //     [MACHINING_SERVICE_MODULE]: { machinings_id: id },
    //   });
    // });
    // for (let index = 0; index < serviceIds.length; index++) {
    //   links.push({
    //     [Modules.PRODUCT]: { product_id: productId },
    //     [MACHINING_SERVICE_MODULE]: { machinings_id: serviceIds[index] },
    //   });
    // }
    // createRemoteLinkStep(links);
    return new WorkflowResponse({ machinings: createdServices });
  }
);

// import {
//   createWorkflow,
//   transform,
//   when,
//   WorkflowResponse,
// } from "@medusajs/framework/workflows-sdk";
// import { LinkDefinition, ProductDTO } from "@medusajs/framework/types";
// import { createRemoteLinkStep } from "@medusajs/medusa/core-flows";
// import {

//     ContainerRegistrationKeys,

//   } from "@medusajs/framework/utils"
// import { Modules } from "@medusajs/framework/utils";
// import { MACHINING_SERVICE_MODULE } from "../../modules/machining-services";
// import {
//   createMachiningServicesStep,
//   MachiningServiceInput,
// } from "./steps/create-machining";
// import { Machining } from "modules/machining-services/models/machining";
// import { logger } from "@medusajs/framework";

// export type CreateMachiningServicesFromProductWorkflowInput = {
//   product: ProductDTO;
//   additional_data: {
//     machining_services: {
//       service_type: string;
//       is_active: boolean;
//       is_compulsory: boolean;
//       attached_product_id: string;
//       config: Record<string, unknown>;
//     }[];
//   };
// };

// export const createMachiningServicesFromProductWorkflow = createWorkflow(
//   "create-machining-services-from-product",
//   (input: CreateMachiningServicesFromProductWorkflowInput) => {

//     if (input.additional_data?.machining_services) {
//       // Check if machining_services is an array
//       const machiningServices = Array.isArray(input.additional_data.machining_services)
//         ? input.additional_data.machining_services
//         : [input.additional_data.machining_services];

//       let createdServices = [];

//       logger.info("CREATE WORKFLOW INDEX : BEFORE MS LOOP : " + createdServices.length)

//       machiningServices.forEach((machiningService) => {
//         const machiningServiceTF = transform(
//           { input: machiningService },
//           (data) => {
//             return data.input;
//           }
//         );

//         const createdMachiningService =
//         createMachiningServicesStep(machiningServiceTF);

//         logger.info(
//           "CREATE WORKFLOW INDEX : IN MS LOOP : ID ::: " + JSON.stringify(createdMachiningService)
//         );

//         createdServices.push(createdMachiningService);
//       });

//       logger.info("CREATE WORKFLOW INDEX : AFTER MS LOOP : " + createdServices.length)
//       when(
//         createdServices,
//         (createdServices) =>
//           Array.isArray(createdServices) && createdServices.length > 0
//       ).then(() => {

//         logger.info("CREATE workflow : WHEN THEN PASSED : " + createdServices.length)

//         return new WorkflowResponse({ createdServices });
//       });

//       logger.info("CREATE workflow : AFTER WHEN THEN CHECK : RETURNING NULL " + createdServices.length)
//       // return new WorkflowResponse(null);
//     }

//     logger.info("MAKING SURE TO RETURN NULL FROM WORKFLOW")

//     // Make sure to return something if the if condition doesn't execute
//     return new WorkflowResponse(null);
//   }
// );

// export const createMachiningServicesFromProductWorkflow = createWorkflow(
//   "create-machining-services-from-product",
//   (input: CreateMachiningServicesFromProductWorkflowInput) => {

//     if (input.additional_data?.machining_services) {
//       let createdServices = [];
//       input.additional_data.machining_services.forEach((machiningService) => {
//         const machiningServiceTF = transform(
//           { input: machiningService },
//           (data) => {
//             return data.input;
//           }
//         );

//         const createdMachiningService =
//           createMachiningServicesStep(machiningServiceTF);

//         console.log(
//           "CREATEDMACHINING INSTANCE IN CREATEWORKFLOW ::: ",
//           createdMachiningService
//         );

//         createdServices.push(createdMachiningService);
//       });

//       when(
//         createdServices,
//         (createdServices) =>
//           Array.isArray(createdServices) && createdServices.length > 0
//       ).then(() => {

//         // const links: LinkDefinition[] = []
//         // const links = createdServices.map((service) => ({
//         //   [Modules.PRODUCT]: { product_id: input.product.id },
//         //   [MACHINING_SERVICE_MODULE]: { machining_services_id: service.id },
//         // }));
//         // createRemoteLinkStep(links);
//         return new WorkflowResponse({ createdServices });
//       });

//       return new WorkflowResponse(null)

//     }
//   }
// );
