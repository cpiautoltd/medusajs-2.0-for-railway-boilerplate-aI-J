import { loadEnv, Modules, defineConfig } from "@medusajs/utils";
import {
  ADMIN_CORS,
  AUTH_CORS,
  BACKEND_URL,
  COOKIE_SECRET,
  DATABASE_URL,
  JWT_SECRET,
  REDIS_URL,
  RESEND_API_KEY,
  RESEND_FROM_EMAIL,
  SENDGRID_API_KEY,
  SENDGRID_FROM_EMAIL,
  SHOULD_DISABLE_ADMIN,
  STORE_CORS,
  STRIPE_API_KEY,
  STRIPE_WEBHOOK_SECRET,
  WORKER_MODE,
  MINIO_ENDPOINT,
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_BUCKET,
  MEILISEARCH_HOST,
  MEILISEARCH_ADMIN_KEY,
  UPS_CLIENT_ID,
  UPS_CLIENT_SECRET,
  UPS_MERCHANT_ID,
  MINIO_PORT,
  MINIO_USE_SSL,
} from "lib/constants";
import { EXTRUDED_PRODUCTS_MODULE } from "modules/extruded-products";
import { LENGTH_PRICING_MODULE } from "modules/length-pricing";

loadEnv(process.env.NODE_ENV, process.cwd());

const medusaConfig = {
  projectConfig: {
    databaseUrl: DATABASE_URL,
    databaseLogging: false,
    redisUrl: REDIS_URL,
    workerMode: WORKER_MODE,
    http: {
      adminCors: ADMIN_CORS,
      authCors: AUTH_CORS,
      storeCors: STORE_CORS,
      jwtSecret: JWT_SECRET,
      cookieSecret: COOKIE_SECRET,
    },
  },
  admin: {
    backendUrl: BACKEND_URL,
    disable: SHOULD_DISABLE_ADMIN,
  },
  modules: [
    {
      key: Modules.FILE,
      resolve: "@medusajs/file",
      options: {
        providers: [
          ...(MINIO_ENDPOINT && MINIO_ACCESS_KEY && MINIO_SECRET_KEY
            ? [
                {
                  resolve: "./src/modules/minio-file",
                  id: "minio",
                  options: {
                    endPoint: MINIO_ENDPOINT,
                    accessKey: MINIO_ACCESS_KEY,
                    secretKey: MINIO_SECRET_KEY,
                    bucket: MINIO_BUCKET, // Optional, default: medusa-media
                    port: MINIO_PORT, // Optional, default: 443
                    useSSL: MINIO_USE_SSL, // Optional, default: true
                  },
                },
              ]
            : [
                {
                  resolve: "@medusajs/file-local",
                  id: "local",
                  options: {
                    upload_dir: "static",
                    backend_url: `${BACKEND_URL}/static`,
                  },
                },
              ]),
        ],
      },
    },
    {
      key: Modules.FULFILLMENT,
      resolve: "@medusajs/medusa/fulfillment",
      options: {
        providers: [
          // default manual provider
          {
            resolve: "@medusajs/medusa/fulfillment-manual",
            id: "manual",
          },
          // UPS provider - add this
          {
            resolve: "./src/modules/ups",
            id: "ups",
            options: {
              clientId: UPS_CLIENT_ID,
              clientSecret: UPS_CLIENT_SECRET,
              merchantId: UPS_MERCHANT_ID, // Optional
              sandbox: "sandbox", // process.env.NODE_ENV !== "production", // Use sandbox in non-production environments
            },
          },
        ],
      },
    },
    {
      resolve: "./src/modules/extruded-products",
      key: EXTRUDED_PRODUCTS_MODULE,
    },
    {
      resolve: "./src/modules/length-pricing",
      key: LENGTH_PRICING_MODULE,
    },
    {
      resolve: "@medusajs/medusa/notification",

      options: {
        providers: [
          {
            resolve: "./src/modules/resend",

            id: "resend",

            options: {
              channels: ["email"],

              api_key: RESEND_API_KEY,

              from: RESEND_FROM_EMAIL,
            },
          },
        ],
      },
    },
    ...(REDIS_URL
      ? [
          {
            key: Modules.EVENT_BUS,
            resolve: "@medusajs/event-bus-redis",
            options: {
              redisUrl: REDIS_URL,
            },
          },
          {
            key: Modules.WORKFLOW_ENGINE,
            resolve: "@medusajs/workflow-engine-redis",
            options: {
              redis: {
                url: REDIS_URL,
              },
            },
          },
        ]
      : []),
    ...((SENDGRID_API_KEY && SENDGRID_FROM_EMAIL) ||
    (RESEND_API_KEY && RESEND_FROM_EMAIL)
      ? [
          {
            key: Modules.NOTIFICATION,
            resolve: "@medusajs/notification",
            options: {
              providers: [
                ...(SENDGRID_API_KEY && SENDGRID_FROM_EMAIL
                  ? [
                      {
                        resolve: "@medusajs/notification-sendgrid",
                        id: "sendgrid",
                        options: {
                          channels: ["email"],
                          api_key: SENDGRID_API_KEY,
                          from: SENDGRID_FROM_EMAIL,
                        },
                      },
                    ]
                  : []),
                ...(RESEND_API_KEY && RESEND_FROM_EMAIL
                  ? [
                    {
                        resolve: "./src/modules/resend",
                        id: "resend",
                        options: {
                          channels: ["email"],
                          api_key: RESEND_API_KEY,
                          from: RESEND_FROM_EMAIL,
                        },
                      },
                    ]
                  : []),
              ],
            },
          },
        ]
      : []),
    ...(STRIPE_API_KEY && STRIPE_WEBHOOK_SECRET
      ? [
          {
            key: Modules.PAYMENT,
            resolve: "@medusajs/payment",
            options: {
              providers: [
                {
                  resolve: "@medusajs/payment-stripe",
                  id: "stripe",
                  options: {
                    apiKey: STRIPE_API_KEY,
                    webhookSecret: STRIPE_WEBHOOK_SECRET,
                  },
                },
              ],
            },
          },
        ]
      : []),
  ],
  plugins: [
    ...(MEILISEARCH_HOST && MEILISEARCH_ADMIN_KEY
      ? [
          // {
          //   resolve: "@rokmohar/medusa-plugin-meilisearch",
          //   options: {
          //     config: {
          //       host: MEILISEARCH_HOST,
          //       apiKey: MEILISEARCH_ADMIN_KEY,
          //     },
          //     settings: {
          //       products: {
          //         indexSettings: {
          //           searchableAttributes: [
          //             "title",
          //             "description",
          //             "variant_sku",
          //             "subtitle", // Added
          //             "handle", // Added
          //             "category_names", // Added for searchable categories
          //             "tags", // Added for searchable tags
          //           ],
          //           displayedAttributes: [
          //             "id",
          //             "title",
          //             "description",
          //             "variant_sku",
          //             "thumbnail",
          //             "handle",
          //             "subtitle", // Added
          //             "categories", // Still useful to display original categories
          //             "category_hierarchy", // Added for displaying the hierarchy
          //             "price_cad", // Added for displaying price
          //             "tags", // Added for displaying tags
          //           ],
          //           filterableAttributes: [
          //             "status",
          //             "is_giftcard",
          //             "discountable",
          //             "category_hierarchy.lvl0",
          //             "category_hierarchy.lvl1",
          //             "category_hierarchy.lvl2", // Add more levels if needed
          //             "price_cad",
          //             "tags",
          //           ],
          //           sortableAttributes: [
          //             "title",
          //             "created_at",
          //             "updated_at",
          //             "price_cad",
          //           ],
          //           rankingRules: [
          //             "words",
          //             "typo",
          //             "proximity",
          //             "attribute",
          //             "sort",
          //             "exactness",
          //             "price_cad:asc", // Default sort by price, adjust as needed
          //           ],
          //         },
          //         primaryKey: "id",
          //         // THIS IS THE KEY PART: The transformer function
          //         transformer: (product) => {
          //           const transformedProduct = { ...product };

          //           // 1. Hierarchical Categories Transformation
          //           transformedProduct.category_hierarchy = {};
          //           transformedProduct.category_names = []; // For generic category searching

          //           if (product.categories && product.categories.length > 0) {
          //             // Sort categories by mpath length to ensure parent comes before child
          //             const sortedCategories = [...product.categories].sort(
          //               (a, b) => {
          //                 const depthA = a.mpath
          //                   ? a.mpath.split(".").length
          //                   : 0;
          //                 const depthB = b.mpath
          //                   ? b.mpath.split(".").length
          //                   : 0;
          //                 return depthA - depthB;
          //               }
          //             );

          //             let currentPath = "";
          //             sortedCategories.forEach((category, index) => {
          //               if (category.name) {
          //                 transformedProduct.category_names.push(category.name); // Collect all category names for searching
          //                 currentPath = currentPath
          //                   ? `${currentPath} > ${category.name}`
          //                   : category.name;
          //                 transformedProduct.category_hierarchy[`lvl${index}`] =
          //                   currentPath;
          //               }
          //             });
          //           }

          //           // 2. Price Transformation (assuming CAD is your primary currency)
          //           // This is a basic example. You might need more complex logic
          //           // to handle multiple currencies, customer groups, or sales channels.
          //           // For simplicity, we'll take the first CAD price found.
          //           let priceCad = null;
          //           if (
          //             transformedProduct.variants &&
          //             transformedProduct.variants.length > 0
          //           ) {
          //             // Find the first variant with prices
          //             const firstVariantWithPrices =
          //               transformedProduct.variants.find(
          //                 (v) => v.prices && v.prices.length > 0
          //               );

          //             if (firstVariantWithPrices) {
          //               // Find the first CAD price for that variant
          //               const cadPrice = firstVariantWithPrices.prices.find(
          //                 (p) => p.currency_code === "cad"
          //               );
          //               if (cadPrice) {
          //                 priceCad = cadPrice.amount;
          //               }
          //             }
          //           }
          //           transformedProduct.price_cad = priceCad; // Add to document

          //           // Remove Medusa-specific nested objects that are not useful for search
          //           // and can increase document size/complexity in Meilisearch
          //           delete transformedProduct.variants; // We extracted SKU and price
          //           delete transformedProduct.options;
          //           delete transformedProduct.images;
          //           delete transformedProduct.sales_channels;
          //           delete transformedProduct.collection;
          //           delete transformedProduct.type;
          //           delete transformedProduct.parent_category; // Redundant if category_hierarchy is used

          //           // If you have `extruded_products` or other custom relations,
          //           // decide if you want to include them directly or flatten specific attributes.
          //           // For now, let's keep `extruded_products` as it might contain useful data.

          //           return transformedProduct;
          //         },
          //       },
          //     },
          //   },
          // },
          {
            resolve: "@rokmohar/medusa-plugin-meilisearch",
            options: {
              config: {
                host: MEILISEARCH_HOST,
                apiKey: MEILISEARCH_ADMIN_KEY,
              },
              settings: {
                products: {
                  indexSettings: {
                    searchableAttributes: [
                      "title",
                      "description",
                      "variant_sku",
                    ],
                    displayedAttributes: [
                      "id",
                      "title",
                      "description",
                      "variant_sku",
                      "thumbnail",
                      "handle",
                    ],
                  },
                  primaryKey: "id",
                },
              },
            },
          },
        ]
      : []),
  ],
};

console.log(JSON.stringify(medusaConfig, null, 2));
export default defineConfig(medusaConfig);
