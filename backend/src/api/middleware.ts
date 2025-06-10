import { logger } from "@medusajs/framework";
import { defineMiddlewares, validateAndTransformBody } from "@medusajs/framework/http";
import { 
  StoreAddCartLineItem,
} from "@medusajs/medusa/api/store/carts/validators"
import { 
  authenticateClerkCustomer, 
  optionalClerkAuth,
  requireNotCustomer 
} from "./middlewares/clerk-auth"
import { z } from "zod";

// Define enums matching the model
const possibleServiceTypes = {
  PROFILES_CUT_TO_LENGTH: "profiles_cut_to_length",
  TAP_PROFILE_END: "tap_profile_end",
  LENGTH_BASED_PRODUCT: "length_based_product",
};

const possibleUnitTypes = {
  MM: "mm",
  CM: "cm",
  INCH: "inch",
};

// Zod schemas for each config type
const profilesCutToLengthConfigSchema = z.object({
  cut_price: z.number(),
  currency: z.string(),
  is_enabled_on_maxlength: z.boolean(),
  cut_code: z.string(),
  cut_to_square: z.string(),
  cut_tolerance: z.string(),
  unit_type: z.enum([
    possibleUnitTypes.MM,
    possibleUnitTypes.CM,
    possibleUnitTypes.INCH,
  ]),
});

const tapProfileEndSideSchema = z.object({
  tap_size: z.string(),
  price: z.number(),
  required: z.boolean(),
  min_depth: z.number(),
  service_type: z.string(),
  part_no: z.string(),
  currency: z.string(),
});

const tapProfileEndConfigSchema = z.object({
  left_side: tapProfileEndSideSchema,
  right_side: tapProfileEndSideSchema,
});

const lengthBasedProductConfigSchema = z.object({
  unit_type: z.enum([
    possibleUnitTypes.MM,
    possibleUnitTypes.CM,
    possibleUnitTypes.INCH,
  ]),
  price_per_unit: z.number(),
  currency: z.string(),
  min_length: z.number(),
  max_length: z.number(),
  is_conversion_allowed: z.boolean(),
});

// Discriminated union for config based on service_type
const configSchema = z.discriminatedUnion("service_type", [
  z.object({
    service_type: z.literal(possibleServiceTypes.PROFILES_CUT_TO_LENGTH),
    config: profilesCutToLengthConfigSchema,
  }),
  z.object({
    service_type: z.literal(possibleServiceTypes.TAP_PROFILE_END),
    config: tapProfileEndConfigSchema,
  }),
  z.object({
    service_type: z.literal(possibleServiceTypes.LENGTH_BASED_PRODUCT),
    config: lengthBasedProductConfigSchema,
  }),
]);

// Base machining service schema (shared fields for POST and PUT)
const baseMachiningServiceSchema = z.object({
  service_type: z.enum([
    possibleServiceTypes.PROFILES_CUT_TO_LENGTH,
    possibleServiceTypes.TAP_PROFILE_END,
    possibleServiceTypes.LENGTH_BASED_PRODUCT,
  ]),
  is_active: z.boolean(),
  is_compulsory: z.boolean(),
  attached_product_id: z.string(),
  config: z.any(), // Temporary placeholder, will refine with transform
});

// Schema for POST (no id, created_at, updated_at, deleted_at)
const machiningServicePostSchema = baseMachiningServiceSchema.transform(
  (data) => {
    const configValidation = configSchema.parse({
      service_type: data.service_type,
      config: data.config,
    });
    return {
      ...data,
      config: configValidation.config,
    };
  }
);

// Schema for PUT (requires id, excludes created_at, updated_at, deleted_at)
const machiningServicePutSchema = baseMachiningServiceSchema
  .extend({
    id: z.string(),
  })
  .transform((data) => {
    const configValidation = configSchema.parse({
      service_type: data.service_type,
      config: data.config,
    });
    return {
      ...data,
      config: configValidation.config,
    };
  });

  const EndtapConfigSchema = z.object({
  left: z.string().optional(),
  right: z.string().optional()
})

export const StoreAddLengthBasedLineItemSchema = StoreAddCartLineItem.extend({
  selectedLength: z.number().min(0, "Selected length must be greater than 0"),
  endtapConfig: EndtapConfigSchema
})


export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/carts/:id/line-items-length",
      method: "POST",
      middlewares: [
        validateAndTransformBody(
          StoreAddLengthBasedLineItemSchema
        ),
      ],
    },
    {
      matcher: "/store/customers/me*",
      middlewares: [authenticateClerkCustomer],
    },
    {
      matcher: "/store/customers/*/addresses*",
      middlewares: [authenticateClerkCustomer],
    },
    {
      matcher: "/store/orders/customer/*",
      middlewares: [authenticateClerkCustomer],
    },
    
    // Cart with optional auth (guest checkout support)
    {
      matcher: "/store/carts*",
      middlewares: [optionalClerkAuth],
    },
    
    // Checkout requires authentication
    {
      matcher: "/store/carts/*/complete",
      middlewares: [authenticateClerkCustomer],
    },
    
    // Payment and shipping with auth
    {
      matcher: "/store/payment-collections*",
      middlewares: [authenticateClerkCustomer],
    },
    {
      matcher: "/store/shipping-options*",
      middlewares: [optionalClerkAuth],
    },
    
    // Returns require authentication
    {
      matcher: "/store/returns*",
      middlewares: [authenticateClerkCustomer],
    },
    
    // Admin protection
    {
      matcher: "/admin/*",
      middlewares: [requireNotCustomer],
    },
    
    // Skip auth for webhooks
    {
      matcher: "/webhooks/clerk",
      middlewares: [],
    },
    // {

    //   matcher: "/admin/products/:id",

    //   method: "GET",

    //   middlewares: [

    //     (req, res, next) => {

    //       logger.info("\n\n MIDDLEWARE REQUEST \n\n")
    //       console.log(res.json())

    //       next()

    //     },

    //   ],

    // },
    // {
    //   method: "POST",
    //   matcher: "/admin/products/:id",
    //   additionalDataValidator: {
    //     machining_services: z.array(machiningServicePostSchema).optional(),
    //   },
    // },
    // {
    //   method: "PUT",
    //   matcher: "/admin/products/:id",
    //   additionalDataValidator: {
    //     machining_services: z.array(machiningServicePutSchema).optional(),
    //   },
    // },
  ],
});

// import { defineMiddlewares } from "@medusajs/framework/http";
// import { z } from "zod";

// export default defineMiddlewares({
//   routes: [
//     {
//       method: "POST",
//       matcher: "/admin/products/:id",
//       additionalDataValidator: {
//           machining_services: z
//             .array(
//               z.object({
//                 service_type: z.string(),
//                 is_active: z.boolean(),
//                 is_compulsory: z.boolean(),
//                 attached_product_id: z.string(),
//                 config: z.record(z.unknown()),
//               })
//             )
//             .optional(),
//         }
//     },
//     {
//       method: "PUT",
//       matcher: "/admin/products/:id",
//       additionalDataValidator: {
//           machining_services: z
//             .array(
//               z.object({
//                 id: z.string(),
//                 service_type: z.string(),
//                 is_active: z.boolean(),
//                 is_compulsory: z.boolean(),
//                 attached_product_id: z.string(),
//                 config: z.record(z.unknown()),
//               })
//             )
//             .optional(),
//         }
//     },
//   ],
// });
