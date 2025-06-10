import {
  Text,
  Column,
  Container,
  Heading,
  Html,
  Img,
  Row,
  Section,
  Tailwind,
  Head,
  Preview,
  Body,
  Link,
} from "@react-email/components";
import {
  BigNumberValue,
  CustomerDTO,
  OrderDTO,
} from "@medusajs/framework/types";
import * as React from "react";
import { LOGO_URL } from "../constants";
// import { isBigNumber, BigNumber } from "@medusajs/framework/utils"; // or wherever your BigNumber is from

type OrderPlacedEmailProps = {
  order: OrderDTO & {
    customer: CustomerDTO;
    summary?: {
      current_order_total?: number;
      original_order_total?: number;
      [key: string]: any;
    };
  };
  email_banner?: {
    body: string;
    title: string;
    url: string;
  };
};


// const LOGO_URL = "https://studio.cpiautomation.com/assets/72c2132b-8656-4d27-b029-70e5f968b297";
const COLOR_PRIMARY = "#2886c7";
const COLOR_SECONDARY = "#262626";


function OrderPlacedEmailComponent({
  order,
  email_banner,
}: OrderPlacedEmailProps) {
  const shouldDisplayBanner = email_banner && "title" in email_banner;

  const formatter = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currencyDisplay: "narrowSymbol",
    currency: order.currency_code || "CAD",
  });

  const formatPrice = (price: BigNumberValue) => {
    if (typeof price === "number") {
      return formatter.format(price);
    }

    if (typeof price === "string") {
      return formatter.format(parseFloat(price));
    }

    return price?.toString() || "";
  };

  const renderCustomizationDetails = (item: any) => {
    if (!item.metadata?.lengthPricing) {
      return null;
    }

    const { lengthPricing } = item.metadata;
    const endtapOptions = lengthPricing.endtap_options
      ? JSON.parse(lengthPricing.endtap_options)
      : [];

    return (
      <div className="mt-2 bg-gray-50 rounded text-sm">
        <div className="space-y-1">
          {/* Length Configuration */}
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Length:</span>
            <span className="font-medium">
              {lengthPricing.selectedLength} {lengthPricing.unitType}
            </span>
            <span className="text-gray-500">
              @ {formatPrice(lengthPricing.pricePerUnit)}/
              {lengthPricing.unitType}
            </span>
          </div>

          {/* Cut Service */}
          {lengthPricing.cutPrice > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Cut Service:</span>
              <span className="font-medium">
                {formatPrice(lengthPricing.cutPrice)}
              </span>
              {lengthPricing.cut_code && (
                <span className="text-gray-500">
                  (Code: {lengthPricing.cut_code})
                </span>
              )}
            </div>
          )}

          {/* Endtap Configuration */}
          {lengthPricing.endtapConfig &&
            (lengthPricing.endtapConfig.left ||
              lengthPricing.endtapConfig.right) && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <span className="text-gray-600">Endtap Configuration:</span>
                <div className="mt-1 ml-4 space-y-1">
                  {lengthPricing.endtapConfig.left && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Left:</span>
                      <span className="font-medium">
                        {(() => {
                          const leftOption = endtapOptions.find(
                            (opt) =>
                              opt.part_no === lengthPricing.endtapConfig.left
                          );
                          return leftOption
                            ? `${leftOption.tap_size} (${
                                leftOption.part_no
                              }) - ${formatPrice(leftOption.price)}`
                            : lengthPricing.endtapConfig.left;
                        })()}
                      </span>
                    </div>
                  )}
                  {lengthPricing.endtapConfig.right && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Right:</span>
                      <span className="font-medium">
                        {(() => {
                          const rightOption = endtapOptions.find(
                            (opt) =>
                              opt.part_no === lengthPricing.endtapConfig.right
                          );
                          return rightOption
                            ? `${rightOption.tap_size} (${
                                rightOption.part_no
                              }) - ${formatPrice(rightOption.price)}`
                            : lengthPricing.endtapConfig.right;
                        })()}
                      </span>
                    </div>
                  )}
                </div>
                {/* {lengthPricing.endtap_code && (
                  <div className="mt-1 ml-4 text-gray-500">
                    Endtap Code: {lengthPricing.endtap_code}
                  </div>
                )} */}
              </div>
            )}
        </div>
      </div>
    );
  };

  return (
    <Tailwind>
      <Html className="font-sans bg-gray-100">
        <Head />
        <Preview>Thank you for your order from Medusa</Preview>
        <Body className="bg-white my-10 mx-auto w-full max-w-2xl">
          {/* Header */}
          <Section className="bg-[#262626] text-white px-6 py-6 text-center">
            <Img src={LOGO_URL} width="280" alt="CPI Automation" className="mx-auto" />
          </Section>

          {/* Thank You Message */}
          <Container className="p-6">
            <Heading className="text-2xl font-bold text-center text-gray-800">
              Thank you for your order,{" "}
              {order.customer?.first_name || order.shipping_address?.first_name}
            </Heading>
            <Text className="text-center text-gray-600 mt-2">
              We're processing your order and will notify you when it ships.
            </Text>
          </Container>

          {/* Promotional Banner */}
          {shouldDisplayBanner && (
            <Container
              className="mb-4 rounded-lg p-7"
              style={{
                background: "linear-gradient(to right, #3b82f6, #4f46e5)",
              }}
            >
              <Section>
                <Row>
                  <Column align="left">
                    <Heading className="text-white text-xl font-semibold">
                      {email_banner.title}
                    </Heading>
                    <Text className="text-white mt-2">{email_banner.body}</Text>
                  </Column>
                  <Column align="right">
                    <Link
                      href={email_banner.url}
                      className="font-semibold px-2 text-white underline"
                    >
                      Shop Now
                    </Link>
                  </Column>
                </Row>
              </Section>
            </Container>
          )}

          {/* Order Items */}
          <Container className="px-6">
            <Heading className="text-xl font-semibold text-gray-800 mb-4">
              Your Items
            </Heading>
            <Row>
              <Column>
                <Text className="text-sm m-0 my-2 text-gray-500">
                  Order ID: #{order.display_id}
                </Text>
              </Column>
            </Row>
            {order.items?.map((item) => (
              <Section key={item.id} className="border-b border-gray-200 py-2">
                <Row>
                  <Column className="w-1/4 align-top">
                    <Img
                      src={item.thumbnail ?? ""}
                      alt={item.product_title ?? ""}
                      className="rounded-lg d-inherit"
                      width="100%"
                    />
                  </Column>
                  <Column className="w-3/4 pl-4">
                    <Text className="text-lg font-semibold text-gray-800">
                      {item.product_title}
                    </Text>
                    {/* <Text className="text-gray-600">
                      {item.subtitle || item.variant_title}
                    </Text> */}
                    {item.variant_sku && (
                      <Text className="text-sm text-gray-500 m-0">
                        SKU: {item.variant_sku}
                      </Text>
                    )}
                    {/* Custom configuration details */}
                    {renderCustomizationDetails(item)}
                    <Row className="mt-1">
                      <Column>
                        <Text className="text-gray-800 font-bold">
                          {formatPrice(item.unit_price)}
                        </Text>
                      </Column>
                      <Column>

                        <Text className="text-sm text-gray-600">
                          Qty: {item.quantity}
                        </Text>
                      </Column>
                      <Column align="right">
                        <Text className="text-gray-800 font-bold">
                          {formatPrice(
                            item.total || item.unit_price * item.quantity
                          )}
                        </Text>
                      </Column>
                    </Row>
                  </Column>
                </Row>
              </Section>
            ))}

            {/* Order Summary */}
            <Section className="mt-8">
              <Heading className="text-xl font-semibold text-gray-800 mb-4">
                Order Summary
              </Heading>
              <Row className="text-gray-600">
                <Column className="w-1/2">
                  <Text className="m-0">Subtotal</Text>
                </Column>
                <Column className="w-1/2 text-right">
                  <Text className="m-0">
                    {formatPrice(
                      // Calculate subtotal from items or use a reasonable calculation
                      order.items?.reduce(
                        (sum, item) => sum + item.unit_price * item.quantity,
                        0
                      ) ||
                        order.item_total ||
                        0
                    )}
                  </Text>
                </Column>
              </Row>
              {order.shipping_methods?.map((method) => (
                <Row className="text-gray-600" key={method.id}>
                  <Column className="w-1/2">
                    <Text className="m-0">{method.name}</Text>
                  </Column>
                  <Column className="w-1/2 text-right">
                    <Text className="m-0">
                      {formatPrice(method.total || method.amount || 0)}
                    </Text>
                  </Column>
                </Row>
              ))}
              <Row className="border-t border-gray-200 mt-4 text-gray-800 font-bold">
                <Column className="w-1/2">
                  <Text>Tax</Text>
                </Column>
                <Column className="w-1/2 text-right">
                  <Text>
                    {formatPrice(
                      order.summary?.tax_total || 0
                    )}
                  </Text>
                </Column>
              </Row>
              <Row className="border-t border-gray-200 mt-4 text-gray-800 font-bold">
                <Column className="w-1/2">
                  <Text>Total</Text>
                </Column>
                <Column className="w-1/2 text-right">
                  <Text>
                    {formatPrice(
                      order.summary?.current_order_total || order.total || 0
                    )}
                  </Text>
                </Column>
              </Row>
            </Section>
          </Container>

          {/* Footer */}
          <Section className="bg-gray-50 p-6 mt-10">
            <Text className="text-center text-gray-500 text-sm">
              If you have any questions, reply to this email or contact our
              support team at sales@cpiautomation.com.
            </Text>
            <Text className="text-center text-gray-500 text-sm">
              Order Token: {order.id}
            </Text>
            <Text className="text-center text-gray-400 text-xs mt-4">
              © {new Date().getFullYear()} CPI Automation Ltd. All rights reserved.
            </Text>
          </Section>
        </Body>
      </Html>
    </Tailwind>
  );
}

export const orderPlacedEmail = (props: OrderPlacedEmailProps) => (
  <OrderPlacedEmailComponent {...props} />
);

const mockOrder = {
  order: {
    id: "order_01JWRZJNAE08WPG6ED0N6KS86H",
    display_id: 3,
    status: "pending",
    version: 1,
    summary: {
      paid_total: 81.7135,
      raw_paid_total: {
        value: "81.7135",
        precision: 20,
      },
      refunded_total: 0,
      accounting_total: 81.7135,
      credit_line_total: 0,
      transaction_total: 81.7135,
      pending_difference: 0,
      raw_refunded_total: {
        value: "0",
        precision: 20,
      },
      current_order_total: 81.7135,
      original_order_total: 81.7135,
      raw_accounting_total: {
        value: "81.7135",
        precision: 20,
      },
      raw_credit_line_total: {
        value: "0",
        precision: 20,
      },
      raw_transaction_total: {
        value: "81.7135",
        precision: 20,
      },
      raw_pending_difference: {
        value: "0",
        precision: 20,
      },
      raw_current_order_total: {
        value: "81.7135",
        precision: 20,
      },
      raw_original_order_total: {
        value: "81.7135",
        precision: 20,
      },
    },
    metadata: null,
    created_at: "2025-06-02T18:48:33.360Z",
    updated_at: "2025-06-02T18:48:33.360Z",
    region_id: "reg_01JTNSC9Y1CKVJJH71Z4JBS1EG",
    total: 81.7135,
    subtotal: 81.7135,
    tax_total: 0,
    discount_total: 0,
    discount_tax_total: 0,
    original_total: 81.7135,
    original_tax_total: 0,
    item_total: 30.7135,
    item_subtotal: 30.7135,
    item_tax_total: 0,
    original_item_total: 30.7135,
    original_item_subtotal: 30.7135,
    original_item_tax_total: 0,
    shipping_total: 51,
    shipping_subtotal: 51,
    shipping_tax_total: 0,
    original_shipping_tax_total: 0,
    original_shipping_subtotal: 51,
    original_shipping_total: 51,
    items: [
      {
        id: "ordli_01JWRZJNAEY9HN8G6GWGHN5W6K",
        title: "Default Variant",
        subtitle: '1010 | 1.00" X 1.00" T-Slotted Profile - Four Open T-Slots',
        thumbnail:
          "https://cdn11.bigcommerce.com/s-mh3dry/products/279/images/611/1010_photo__87739.1673385558.500.750.png?c=2",
        variant_id: "variant_01JWCNRZPD670W8KR1ZPQZQ1Q8",
        product_id: "prod_01JWCNRZM1SP7YXMGHH5M6AVT7",
        product_title:
          '1010 | 1.00" X 1.00" T-Slotted Profile - Four Open T-Slots',
        product_description:
          '1010 is a 1.00\\" x 1.00\\" fractional 10 series square T-slot profile with four open T-slots, one on each 1.00\\" face. The profile has align-a-grooves to assist in aligning connecting profiles. The 1010 profile is compatible with all 10 series fasteners. This profile lends itself to machine guards, sound enclosures, work benches, panel mount racks and displays. The four open T-slots enable access from any direction and are useful for mounting accessories.&nbsp;Series :10 SeriesMaterial :AluminumGrade :6105-T5Finish :AnodizeColor :ClearDrop Lock :2°Moment of Inertia - IX :0.0442\\" tMoment of Inertia - IY :0.0442\\" tSurface Area :0.437 Sq. In.Yield Strength :35,000 psi.Modulus of Elasticity :10,200,000 Lbs / Sq. In.Weight lbs :0.0424 per inch',
        product_subtitle:
          '1010 | 1.00" X 1.00" T-Slotted Profile - Four Open T-Slots',
        product_type: null,
        product_type_id: null,
        product_collection: null,
        product_handle:
          "aluminum-extrusions1010-1-00-x-1-00-t-slotted-profile-four-open-t-slots",
        variant_sku: "1010",
        variant_barcode: null,
        variant_title: "Default Variant",
        variant_option_values: null,
        requires_shipping: false,
        is_discountable: true,
        is_tax_inclusive: false,
        is_custom_price: false,
        metadata: {
          lengthPricing: {
            cutPrice: 3.9959,
            cut_code: "7005",
            unitType: "inch",
            endtap_code: "7061",
            endtapConfig: {
              right: "7061",
            },
            pricePerUnit: 0.5012,
            endtap_options:
              '[{"tap_size":"1/4-20","price":3.9959,"min_depth":1.125,"service_type":"Single Hole End Tap","part_no":"7061","currency":"CAD"},{"tap_size":"M6 x 1.00","price":3.9959,"min_depth":1.125,"service_type":"Single Hole End Tap","part_no":"7063","currency":"CAD"}]',
            selectedLength: 7,
            calculatedPrice: 11.5,
            attached_product_id: "prod_01JWCNRZM1SP7YXMGHH5M6AVT7",
          },
        },
        raw_compare_at_unit_price: null,
        raw_unit_price: {
          value: "11.5",
          precision: 20,
        },
        created_at: "2025-06-02T18:48:33.361Z",
        updated_at: "2025-06-02T18:48:33.361Z",
        deleted_at: null,
        tax_lines: [],
        adjustments: [],
        compare_at_unit_price: null,
        unit_price: 11.5,
        quantity: 1,
        raw_quantity: {
          value: "1",
          precision: 20,
        },
        detail: {
          id: "orditem_01JWRZJNAF471TXG3CN6QK4T3Z",
          version: 1,
          metadata: null,
          order_id: "order_01JWRZJNAE08WPG6ED0N6KS86H",
          raw_unit_price: null,
          raw_compare_at_unit_price: null,
          raw_quantity: {
            value: "1",
            precision: 20,
          },
          raw_fulfilled_quantity: {
            value: "0",
            precision: 20,
          },
          raw_delivered_quantity: {
            value: "0",
            precision: 20,
          },
          raw_shipped_quantity: {
            value: "0",
            precision: 20,
          },
          raw_return_requested_quantity: {
            value: "0",
            precision: 20,
          },
          raw_return_received_quantity: {
            value: "0",
            precision: 20,
          },
          raw_return_dismissed_quantity: {
            value: "0",
            precision: 20,
          },
          raw_written_off_quantity: {
            value: "0",
            precision: 20,
          },
          created_at: "2025-06-02T18:48:33.361Z",
          updated_at: "2025-06-02T18:48:33.361Z",
          deleted_at: null,
          item_id: "ordli_01JWRZJNAEY9HN8G6GWGHN5W6K",
          unit_price: null,
          compare_at_unit_price: null,
          quantity: 1,
          fulfilled_quantity: 0,
          delivered_quantity: 0,
          shipped_quantity: 0,
          return_requested_quantity: 0,
          return_received_quantity: 0,
          return_dismissed_quantity: 0,
          written_off_quantity: 0,
        },
        subtotal: 11.5,
        total: 11.5,
        original_total: 11.5,
        discount_total: 0,
        discount_subtotal: 0,
        discount_tax_total: 0,
        tax_total: 0,
        original_tax_total: 0,
        refundable_total_per_unit: 11.5,
        refundable_total: 11.5,
        fulfilled_total: 0,
        shipped_total: 0,
        return_requested_total: 0,
        return_received_total: 0,
        return_dismissed_total: 0,
        write_off_total: 0,
        raw_subtotal: {
          value: "11.5",
          precision: 20,
        },
        raw_total: {
          value: "11.5",
          precision: 20,
        },
        raw_original_total: {
          value: "11.5",
          precision: 20,
        },
        raw_discount_total: {
          value: "0",
          precision: 20,
        },
        raw_discount_subtotal: {
          value: "0",
          precision: 20,
        },
        raw_discount_tax_total: {
          value: "0",
          precision: 20,
        },
        raw_tax_total: {
          value: "0",
          precision: 20,
        },
        raw_original_tax_total: {
          value: "0",
          precision: 20,
        },
        raw_refundable_total_per_unit: {
          value: "11.5",
          precision: 20,
        },
        raw_refundable_total: {
          value: "11.5",
          precision: 20,
        },
        raw_fulfilled_total: {
          value: "0",
          precision: 20,
        },
        raw_shipped_total: {
          value: "0",
          precision: 20,
        },
        raw_return_requested_total: {
          value: "0",
          precision: 20,
        },
        raw_return_received_total: {
          value: "0",
          precision: 20,
        },
        raw_return_dismissed_total: {
          value: "0",
          precision: 20,
        },
        raw_write_off_total: {
          value: "0",
          precision: 20,
        },
        variant: {
          id: "variant_01JWCNRZPD670W8KR1ZPQZQ1Q8",
          title: "Default Variant",
          sku: "1010",
          barcode: null,
          ean: null,
          upc: null,
          allow_backorder: false,
          manage_inventory: false,
          hs_code: null,
          origin_country: null,
          mid_code: null,
          material: null,
          weight: 0,
          length: 1,
          height: 1,
          width: 90,
          metadata: null,
          variant_rank: 0,
          product_id: "prod_01JWCNRZM1SP7YXMGHH5M6AVT7",
          product: {
            id: "prod_01JWCNRZM1SP7YXMGHH5M6AVT7",
            title: '1010 | 1.00" X 1.00" T-Slotted Profile - Four Open T-Slots',
            handle:
              "aluminum-extrusions1010-1-00-x-1-00-t-slotted-profile-four-open-t-slots",
            subtitle:
              '1010 | 1.00" X 1.00" T-Slotted Profile - Four Open T-Slots',
            description:
              '1010 is a 1.00\\" x 1.00\\" fractional 10 series square T-slot profile with four open T-slots, one on each 1.00\\" face. The profile has align-a-grooves to assist in aligning connecting profiles. The 1010 profile is compatible with all 10 series fasteners. This profile lends itself to machine guards, sound enclosures, work benches, panel mount racks and displays. The four open T-slots enable access from any direction and are useful for mounting accessories.&nbsp;Series :10 SeriesMaterial :AluminumGrade :6105-T5Finish :AnodizeColor :ClearDrop Lock :2°Moment of Inertia - IX :0.0442\\" tMoment of Inertia - IY :0.0442\\" tSurface Area :0.437 Sq. In.Yield Strength :35,000 psi.Modulus of Elasticity :10,200,000 Lbs / Sq. In.Weight lbs :0.0424 per inch',
            is_giftcard: false,
            status: "published",
            thumbnail:
              "https://cdn11.bigcommerce.com/s-mh3dry/products/279/images/611/1010_photo__87739.1673385558.500.750.png?c=2",
            weight: "0.0424",
            length: "1",
            height: "1",
            width: "90",
            origin_country: null,
            hs_code: null,
            mid_code: null,
            material: null,
            discountable: true,
            external_id: "279",
            metadata: {
              bigcommerce_id: 279,
              bigcommerce_sku: "1010",
            },
            type_id: null,
            type: null,
            collection_id: null,
            collection: null,
            created_at: "2025-05-29T00:06:21.571Z",
            updated_at: "2025-05-29T00:06:21.571Z",
            deleted_at: null,
          },
          created_at: "2025-05-29T00:06:21.645Z",
          updated_at: "2025-05-29T00:06:21.645Z",
          deleted_at: null,
        },
      },
      {
        id: "ordli_01JWRZJNAFR947ABD68TKS2EAD",
        title: "Default Variant",
        subtitle: "40-3891 | Standard End Fastener, M8",
        thumbnail:
          "https://cdn11.bigcommerce.com/s-mh3dry/products/831/images/2542/40-3891_photo__38185.1674059405.500.750.png?c=2",
        variant_id: "variant_01JWD5H9F7RRF3ZW7Z6AMF35J3",
        product_id: "prod_01JWD5H9DZEAS21P1H2V2RTTKJ",
        product_title: "40-3891 | Standard End Fastener, M8",
        product_description:
          "The standard end fastener assembly is comprised of a button head socket cap screw and wing clip. The end fastener provides a fixed, 90 degree, moderate-strength connection that is completely hidden. The winged tabs of the clip prevent the mating profile from rotating. This connection method requires two machining services; an end tap on the mounting profile and an access hole in the mating profile in order to reach the screw head. Additional Information: Wing clips are available separately (without the button head socket cap screw) for instances where you want to create your own custom assembly.&nbsp;Series :40 SeriesType :AssemblyMaterial :SteelColor :BrightA :15.87mmB :11.43mmC :7.62mmD :8.63mmE :33.02mmF :25.40mmG :M8H :25.00mmWeight :0.047000",
        product_subtitle: "40-3891 | Standard End Fastener, M8",
        product_type: null,
        product_type_id: null,
        product_collection: null,
        product_handle:
          "fasteners-and-hardware40-3891-standard-end-fastener-m8",
        variant_sku: "40-3891",
        variant_barcode: null,
        variant_title: "Default Variant",
        variant_option_values: null,
        requires_shipping: false,
        is_discountable: true,
        is_tax_inclusive: false,
        is_custom_price: false,
        metadata: {},
        raw_compare_at_unit_price: null,
        raw_unit_price: {
          value: "3.7035",
          precision: 20,
        },
        created_at: "2025-06-02T18:48:33.361Z",
        updated_at: "2025-06-02T18:48:33.361Z",
        deleted_at: null,
        tax_lines: [],
        adjustments: [],
        compare_at_unit_price: null,
        unit_price: 3.7035,
        quantity: 1,
        raw_quantity: {
          value: "1",
          precision: 20,
        },
        detail: {
          id: "orditem_01JWRZJNAFEVD2TYXYDXAW9W3J",
          version: 1,
          metadata: null,
          order_id: "order_01JWRZJNAE08WPG6ED0N6KS86H",
          raw_unit_price: null,
          raw_compare_at_unit_price: null,
          raw_quantity: {
            value: "1",
            precision: 20,
          },
          raw_fulfilled_quantity: {
            value: "0",
            precision: 20,
          },
          raw_delivered_quantity: {
            value: "0",
            precision: 20,
          },
          raw_shipped_quantity: {
            value: "0",
            precision: 20,
          },
          raw_return_requested_quantity: {
            value: "0",
            precision: 20,
          },
          raw_return_received_quantity: {
            value: "0",
            precision: 20,
          },
          raw_return_dismissed_quantity: {
            value: "0",
            precision: 20,
          },
          raw_written_off_quantity: {
            value: "0",
            precision: 20,
          },
          created_at: "2025-06-02T18:48:33.361Z",
          updated_at: "2025-06-02T18:48:33.361Z",
          deleted_at: null,
          item_id: "ordli_01JWRZJNAFR947ABD68TKS2EAD",
          unit_price: null,
          compare_at_unit_price: null,
          quantity: 1,
          fulfilled_quantity: 0,
          delivered_quantity: 0,
          shipped_quantity: 0,
          return_requested_quantity: 0,
          return_received_quantity: 0,
          return_dismissed_quantity: 0,
          written_off_quantity: 0,
        },
        subtotal: 3.7035,
        total: 3.7035,
        original_total: 3.7035,
        discount_total: 0,
        discount_subtotal: 0,
        discount_tax_total: 0,
        tax_total: 0,
        original_tax_total: 0,
        refundable_total_per_unit: 3.7035,
        refundable_total: 3.7035,
        fulfilled_total: 0,
        shipped_total: 0,
        return_requested_total: 0,
        return_received_total: 0,
        return_dismissed_total: 0,
        write_off_total: 0,
        raw_subtotal: {
          value: "3.7035",
          precision: 20,
        },
        raw_total: {
          value: "3.7035",
          precision: 20,
        },
        raw_original_total: {
          value: "3.7035",
          precision: 20,
        },
        raw_discount_total: {
          value: "0",
          precision: 20,
        },
        raw_discount_subtotal: {
          value: "0",
          precision: 20,
        },
        raw_discount_tax_total: {
          value: "0",
          precision: 20,
        },
        raw_tax_total: {
          value: "0",
          precision: 20,
        },
        raw_original_tax_total: {
          value: "0",
          precision: 20,
        },
        raw_refundable_total_per_unit: {
          value: "3.7035",
          precision: 20,
        },
        raw_refundable_total: {
          value: "3.7035",
          precision: 20,
        },
        raw_fulfilled_total: {
          value: "0",
          precision: 20,
        },
        raw_shipped_total: {
          value: "0",
          precision: 20,
        },
        raw_return_requested_total: {
          value: "0",
          precision: 20,
        },
        raw_return_received_total: {
          value: "0",
          precision: 20,
        },
        raw_return_dismissed_total: {
          value: "0",
          precision: 20,
        },
        raw_write_off_total: {
          value: "0",
          precision: 20,
        },
        variant: {
          id: "variant_01JWD5H9F7RRF3ZW7Z6AMF35J3",
          title: "Default Variant",
          sku: "40-3891",
          barcode: null,
          ean: null,
          upc: null,
          allow_backorder: false,
          manage_inventory: false,
          hs_code: null,
          origin_country: null,
          mid_code: null,
          material: null,
          weight: 0,
          length: 1,
          height: 1,
          width: 1,
          metadata: null,
          variant_rank: 0,
          product_id: "prod_01JWD5H9DZEAS21P1H2V2RTTKJ",
          product: {
            id: "prod_01JWD5H9DZEAS21P1H2V2RTTKJ",
            title: "40-3891 | Standard End Fastener, M8",
            handle: "fasteners-and-hardware40-3891-standard-end-fastener-m8",
            subtitle: "40-3891 | Standard End Fastener, M8",
            description:
              "The standard end fastener assembly is comprised of a button head socket cap screw and wing clip. The end fastener provides a fixed, 90 degree, moderate-strength connection that is completely hidden. The winged tabs of the clip prevent the mating profile from rotating. This connection method requires two machining services; an end tap on the mounting profile and an access hole in the mating profile in order to reach the screw head. Additional Information: Wing clips are available separately (without the button head socket cap screw) for instances where you want to create your own custom assembly.&nbsp;Series :40 SeriesType :AssemblyMaterial :SteelColor :BrightA :15.87mmB :11.43mmC :7.62mmD :8.63mmE :33.02mmF :25.40mmG :M8H :25.00mmWeight :0.047000",
            is_giftcard: false,
            status: "published",
            thumbnail:
              "https://cdn11.bigcommerce.com/s-mh3dry/products/831/images/2542/40-3891_photo__38185.1674059405.500.750.png?c=2",
            weight: "0.047",
            length: "0.9843",
            height: "1.3",
            width: "1",
            origin_country: null,
            hs_code: null,
            mid_code: null,
            material: null,
            discountable: true,
            external_id: "831",
            metadata: {
              bigcommerce_id: 831,
              bigcommerce_sku: "40-3891",
            },
            type_id: null,
            type: null,
            collection_id: null,
            collection: null,
            created_at: "2025-05-29T04:41:46.689Z",
            updated_at: "2025-05-29T04:41:46.689Z",
            deleted_at: null,
          },
          created_at: "2025-05-29T04:41:46.728Z",
          updated_at: "2025-05-29T04:41:46.728Z",
          deleted_at: null,
        },
      },
      {
        id: "ordli_01JWRZJNAFW42SVXTC690JN0J1",
        title: "Default Variant",
        subtitle: "20-2020 | 20mm X 20mm T-Slotted Profile - Four Open T-Slots",
        thumbnail:
          "https://cdn11.bigcommerce.com/s-mh3dry/products/408/images/869/20-2020_photo__07357.1673392313.500.750.png?c=2",
        variant_id: "variant_01JWF0R5F1QT019088E1VAT2NQ",
        product_id: "prod_01JWF0R5E2KWKZFFPN063E73FT",
        product_title:
          "20-2020 | 20mm X 20mm T-Slotted Profile - Four Open T-Slots",
        product_description:
          "20-2020 is a 20mm x 20mm metric 20 series square T-slot profile with four open T-slots, one on each 20mm face. The profile is smooth, which makes it resistant to dirt and debris buildup while also being easy to clean. The 20-2020 profile is compatible with all 20 series fasteners. The 20-2020 profile is part of the smallest profile series 80/20 offers and lends itself to machine guards, work benches, panel mount racks or displays. The four open T-slots enable access from any direction and are useful for mounting accessories.&nbsp;Series :20 SeriesMaterial :AluminumGrade :6105-T5Finish :AnodizeColor :ClearDrop Lock :2°Moment of Inertia - IX :0.6826 cmtMoment of Inertia - IY :0.6826 cmtSurface Area :1.591 Sq cmYield Strength :241.1 N/ Sq. mmModulus of Elasticity :70,326.5 N/Sq. mmWeight lbs :0.0247 per inch",
        product_subtitle:
          "20-2020 | 20mm X 20mm T-Slotted Profile - Four Open T-Slots",
        product_type: null,
        product_type_id: null,
        product_collection: null,
        product_handle:
          "aluminum-extrusions20-2020-20mm-x-20mm-t-slotted-profile-four-open-t-slots",
        variant_sku: "20-2020",
        variant_barcode: null,
        variant_title: "Default Variant",
        variant_option_values: null,
        requires_shipping: false,
        is_discountable: true,
        is_tax_inclusive: false,
        is_custom_price: false,
        metadata: {
          lengthPricing: {
            cutPrice: 3.9959,
            cut_code: "20-7005",
            unitType: "mm",
            endtap_code: "20-7063",
            endtapConfig: {
              left: "20-7061",
              right: "20-7063",
            },
            pricePerUnit: 0.0141,
            endtap_options:
              '[{"tap_size":"M5 x .80","price":3.9959,"min_depth":22.23,"service_type":"Single Hole End Tap","part_no":"20-7063","currency":"CAD"},{"tap_size":"10-32","price":3.9959,"min_depth":22.23,"service_type":"Single Hole End Tap","part_no":"20-7061","currency":"CAD"}]',
            selectedLength: 250,
            calculatedPrice: 15.51,
            attached_product_id: "prod_01JWF0R5E2KWKZFFPN063E73FT",
          },
        },
        raw_compare_at_unit_price: null,
        raw_unit_price: {
          value: "15.51",
          precision: 20,
        },
        created_at: "2025-06-02T18:48:33.361Z",
        updated_at: "2025-06-02T18:48:33.361Z",
        deleted_at: null,
        tax_lines: [],
        adjustments: [],
        compare_at_unit_price: null,
        unit_price: 15.51,
        quantity: 1,
        raw_quantity: {
          value: "1",
          precision: 20,
        },
        detail: {
          id: "orditem_01JWRZJNAFM0MASYPJG24Y8VDJ",
          version: 1,
          metadata: null,
          order_id: "order_01JWRZJNAE08WPG6ED0N6KS86H",
          raw_unit_price: null,
          raw_compare_at_unit_price: null,
          raw_quantity: {
            value: "1",
            precision: 20,
          },
          raw_fulfilled_quantity: {
            value: "0",
            precision: 20,
          },
          raw_delivered_quantity: {
            value: "0",
            precision: 20,
          },
          raw_shipped_quantity: {
            value: "0",
            precision: 20,
          },
          raw_return_requested_quantity: {
            value: "0",
            precision: 20,
          },
          raw_return_received_quantity: {
            value: "0",
            precision: 20,
          },
          raw_return_dismissed_quantity: {
            value: "0",
            precision: 20,
          },
          raw_written_off_quantity: {
            value: "0",
            precision: 20,
          },
          created_at: "2025-06-02T18:48:33.361Z",
          updated_at: "2025-06-02T18:48:33.361Z",
          deleted_at: null,
          item_id: "ordli_01JWRZJNAFW42SVXTC690JN0J1",
          unit_price: null,
          compare_at_unit_price: null,
          quantity: 1,
          fulfilled_quantity: 0,
          delivered_quantity: 0,
          shipped_quantity: 0,
          return_requested_quantity: 0,
          return_received_quantity: 0,
          return_dismissed_quantity: 0,
          written_off_quantity: 0,
        },
        subtotal: 15.51,
        total: 15.51,
        original_total: 15.51,
        discount_total: 0,
        discount_subtotal: 0,
        discount_tax_total: 0,
        tax_total: 0,
        original_tax_total: 0,
        refundable_total_per_unit: 15.51,
        refundable_total: 15.51,
        fulfilled_total: 0,
        shipped_total: 0,
        return_requested_total: 0,
        return_received_total: 0,
        return_dismissed_total: 0,
        write_off_total: 0,
        raw_subtotal: {
          value: "15.51",
          precision: 20,
        },
        raw_total: {
          value: "15.51",
          precision: 20,
        },
        raw_original_total: {
          value: "15.51",
          precision: 20,
        },
        raw_discount_total: {
          value: "0",
          precision: 20,
        },
        raw_discount_subtotal: {
          value: "0",
          precision: 20,
        },
        raw_discount_tax_total: {
          value: "0",
          precision: 20,
        },
        raw_tax_total: {
          value: "0",
          precision: 20,
        },
        raw_original_tax_total: {
          value: "0",
          precision: 20,
        },
        raw_refundable_total_per_unit: {
          value: "15.51",
          precision: 20,
        },
        raw_refundable_total: {
          value: "15.51",
          precision: 20,
        },
        raw_fulfilled_total: {
          value: "0",
          precision: 20,
        },
        raw_shipped_total: {
          value: "0",
          precision: 20,
        },
        raw_return_requested_total: {
          value: "0",
          precision: 20,
        },
        raw_return_received_total: {
          value: "0",
          precision: 20,
        },
        raw_return_dismissed_total: {
          value: "0",
          precision: 20,
        },
        raw_write_off_total: {
          value: "0",
          precision: 20,
        },
        variant: {
          id: "variant_01JWF0R5F1QT019088E1VAT2NQ",
          title: "Default Variant",
          sku: "20-2020",
          barcode: null,
          ean: null,
          upc: null,
          allow_backorder: false,
          manage_inventory: false,
          hs_code: null,
          origin_country: null,
          mid_code: null,
          material: null,
          weight: 0,
          length: 1,
          height: 1,
          width: 90,
          metadata: null,
          variant_rank: 0,
          product_id: "prod_01JWF0R5E2KWKZFFPN063E73FT",
          product: {
            id: "prod_01JWF0R5E2KWKZFFPN063E73FT",
            title:
              "20-2020 | 20mm X 20mm T-Slotted Profile - Four Open T-Slots",
            handle:
              "aluminum-extrusions20-2020-20mm-x-20mm-t-slotted-profile-four-open-t-slots",
            subtitle:
              "20-2020 | 20mm X 20mm T-Slotted Profile - Four Open T-Slots",
            description:
              "20-2020 is a 20mm x 20mm metric 20 series square T-slot profile with four open T-slots, one on each 20mm face. The profile is smooth, which makes it resistant to dirt and debris buildup while also being easy to clean. The 20-2020 profile is compatible with all 20 series fasteners. The 20-2020 profile is part of the smallest profile series 80/20 offers and lends itself to machine guards, work benches, panel mount racks or displays. The four open T-slots enable access from any direction and are useful for mounting accessories.&nbsp;Series :20 SeriesMaterial :AluminumGrade :6105-T5Finish :AnodizeColor :ClearDrop Lock :2°Moment of Inertia - IX :0.6826 cmtMoment of Inertia - IY :0.6826 cmtSurface Area :1.591 Sq cmYield Strength :241.1 N/ Sq. mmModulus of Elasticity :70,326.5 N/Sq. mmWeight lbs :0.0247 per inch",
            is_giftcard: false,
            status: "published",
            thumbnail:
              "https://cdn11.bigcommerce.com/s-mh3dry/products/408/images/869/20-2020_photo__07357.1673392313.500.750.png?c=2",
            weight: "0.0243",
            length: "0.78",
            height: "0.78",
            width: "90",
            origin_country: null,
            hs_code: null,
            mid_code: null,
            material: null,
            discountable: true,
            external_id: "408",
            metadata: {
              bigcommerce_id: 408,
              bigcommerce_sku: "20-2020",
            },
            type_id: null,
            type: null,
            collection_id: null,
            collection: null,
            created_at: "2025-05-29T21:56:37.955Z",
            updated_at: "2025-05-29T21:56:37.955Z",
            deleted_at: null,
          },
          created_at: "2025-05-29T21:56:37.985Z",
          updated_at: "2025-05-29T21:56:37.985Z",
          deleted_at: null,
        },
      },
    ],
    shipping_address: {
      id: "caaddr_01JWRZFNFRB5YD3G7H8V9GZNZ1",
      customer_id: null,
      company: "Maple Tech Inc",
      first_name: "John",
      last_name: "Doe",
      address_1: "123 Queen St W",
      address_2: "",
      city: "Toronto",
      country_code: "ca",
      province: "ON",
      postal_code: "M5H 2M9",
      phone: "+1-647-555-0199",
      metadata: null,
      created_at: "2025-06-02T18:46:55.224Z",
      updated_at: "2025-06-02T18:46:55.224Z",
      deleted_at: null,
    },
    billing_address: {
      id: "caaddr_01JWRZFNFQ417RT84K0JJ78S73",
      customer_id: null,
      company: "Maple Tech Inc",
      first_name: "John",
      last_name: "Doe",
      address_1: "123 Queen St W",
      address_2: "",
      city: "Toronto",
      country_code: "ca",
      province: "ON",
      postal_code: "M5H 2M9",
      phone: "+1-647-555-0199",
      metadata: null,
      created_at: "2025-06-02T18:46:55.224Z",
      updated_at: "2025-06-02T18:46:55.224Z",
      deleted_at: null,
    },
    shipping_methods: [
      {
        id: "ordsm_01JWRZJNADCBF566HKGC7JNGFZ",
        name: "UPS Standard",
        description: null,
        is_tax_inclusive: false,
        is_custom_amount: false,
        shipping_option_id: "so_01JWC2QTQ9790FMX5YAFHCHWRM",
        data: {
          to_address: {
            id: "caaddr_01JWRZFNFRB5YD3G7H8V9GZNZ1",
            city: "Toronto",
            phone: "+1-647-555-0199",
            company: "Maple Tech Inc",
            metadata: null,
            province: "ON",
            address_1: "123 Queen St W",
            address_2: "",
            last_name: "Doe",
            created_at: "2025-06-02T18:46:55.224Z",
            deleted_at: null,
            first_name: "John",
            updated_at: "2025-06-02T18:46:55.224Z",
            customer_id: null,
            postal_code: "M5H 2M9",
            country_code: "ca",
          },
          from_address: {
            id: "laddr_01JWC2N2V8TNDMVEP5ETMN75A2",
            city: "Mississauga",
            phone: "+19056254805",
            company: "CPI Automation Ltd",
            metadata: null,
            province: "Ontario",
            address_1: "5155 Timberlea Blvd",
            address_2: "",
            created_at: "2025-05-28T18:32:10.856Z",
            deleted_at: null,
            updated_at: "2025-05-28T18:32:10.856Z",
            postal_code: "L4W2S3",
            country_code: "ca",
          },
          service_code: "11",
        },
        metadata: null,
        raw_amount: {
          value: "51",
          precision: 20,
        },
        created_at: "2025-06-02T18:48:33.362Z",
        updated_at: "2025-06-02T18:48:33.362Z",
        deleted_at: null,
        tax_lines: [],
        adjustments: [],
        amount: 51,
        order_id: "order_01JWRZJNAE08WPG6ED0N6KS86H",
        detail: {
          id: "ordspmv_01JWRZJNADRP6P26MJKY7G3QG2",
          version: 1,
          order_id: "order_01JWRZJNAE08WPG6ED0N6KS86H",
          return_id: null,
          exchange_id: null,
          claim_id: null,
          created_at: "2025-06-02T18:48:33.362Z",
          updated_at: "2025-06-02T18:48:33.362Z",
          deleted_at: null,
          shipping_method_id: "ordsm_01JWRZJNADCBF566HKGC7JNGFZ",
        },
        subtotal: 51,
        total: 51,
        original_total: 51,
        discount_total: 0,
        discount_subtotal: 0,
        discount_tax_total: 0,
        tax_total: 0,
        original_tax_total: 0,
        raw_subtotal: {
          value: "51",
          precision: 20,
        },
        raw_total: {
          value: "51",
          precision: 20,
        },
        raw_original_total: {
          value: "51",
          precision: 20,
        },
        raw_discount_total: {
          value: "0",
          precision: 20,
        },
        raw_discount_subtotal: {
          value: "0",
          precision: 20,
        },
        raw_discount_tax_total: {
          value: "0",
          precision: 20,
        },
        raw_tax_total: {
          value: "0",
          precision: 20,
        },
        raw_original_tax_total: {
          value: "0",
          precision: 20,
        },
      },
    ],
    payment_collections: [
      {
        id: "pay_col_01JWRZHQGGBPZCREX0AA8XAXQM",
        currency_code: "cad",
        completed_at: "2025-06-02T18:53:18.824Z",
        status: "completed",
        metadata: null,
        raw_amount: {
          value: "81.7135",
          precision: 20,
        },
        raw_authorized_amount: {
          value: "81.7135",
          precision: 20,
        },
        raw_captured_amount: {
          value: "81.7135",
          precision: 20,
        },
        raw_refunded_amount: {
          value: "0",
          precision: 20,
        },
        created_at: "2025-06-02T18:48:02.833Z",
        updated_at: "2025-06-02T18:53:18.829Z",
        deleted_at: null,
        payments: [
          {
            id: "pay_01JWRZJN84RV5AKFMSYG9JV5Z2",
            currency_code: "cad",
            provider_id: "pp_stripe_stripe",
            data: {
              id: "pi_3RVdOx2SdoJrIZMM02JIl7kA",
              amount: 8171,
              object: "payment_intent",
              review: null,
              source: null,
              status: "succeeded",
              created: 1748890083,
              invoice: null,
              currency: "cad",
              customer: null,
              livemode: false,
              metadata: {
                session_id: "payses_01JWRZHQK94P39V64XQPRWVRNX",
              },
              shipping: null,
              processing: null,
              application: null,
              canceled_at: null,
              description: null,
              next_action: null,
              on_behalf_of: null,
              client_secret:
                "pi_3RVdOx2SdoJrIZMM02JIl7kA_secret_LIfqUbvRJli2JRxJDPYE5GYeO",
              latest_charge: "ch_3RVdOx2SdoJrIZMM0fYas5RW",
              receipt_email: null,
              transfer_data: null,
              amount_details: {
                tip: {},
              },
              capture_method: "manual",
              payment_method: "pm_1RVdPP2SdoJrIZMMVu9XihAj",
              transfer_group: null,
              amount_received: 8171,
              amount_capturable: 0,
              last_payment_error: null,
              setup_future_usage: null,
              cancellation_reason: null,
              confirmation_method: "automatic",
              payment_method_types: ["card", "affirm", "klarna", "link"],
              statement_descriptor: null,
              application_fee_amount: null,
              payment_method_options: {
                card: {
                  network: null,
                  installments: null,
                  mandate_options: null,
                  request_three_d_secure: "automatic",
                },
                link: {
                  persistent_token: null,
                },
                affirm: {},
                klarna: {
                  preferred_locale: null,
                },
              },
              automatic_payment_methods: {
                enabled: true,
                allow_redirects: "always",
              },
              statement_descriptor_suffix: null,
              payment_method_configuration_details: {
                id: "pmc_1RBT0M2SdoJrIZMMYnA3mkui",
                parent: null,
              },
            },
            metadata: null,
            captured_at: "2025-06-02T18:53:18.799Z",
            canceled_at: null,
            payment_collection_id: "pay_col_01JWRZHQGGBPZCREX0AA8XAXQM",
            payment_session: {
              id: "payses_01JWRZHQK94P39V64XQPRWVRNX",
            },
            raw_amount: {
              value: "81.7135",
              precision: 20,
            },
            created_at: "2025-06-02T18:48:33.284Z",
            updated_at: "2025-06-02T18:53:18.805Z",
            deleted_at: null,
            payment_session_id: "payses_01JWRZHQK94P39V64XQPRWVRNX",
            refunds: [],
            captures: [
              {
                id: "capt_01JWRZVB34X8PCH6090HSYWRBJ",
                payment_id: "pay_01JWRZJN84RV5AKFMSYG9JV5Z2",
                metadata: null,
                created_by: null,
                raw_amount: {
                  value: "81.7135",
                  precision: 20,
                },
                created_at: "2025-06-02T18:53:17.796Z",
                updated_at: "2025-06-02T18:53:17.796Z",
                deleted_at: null,
                amount: 81.7135,
              },
            ],
            amount: 81.7135,
          },
        ],
        amount: 81.7135,
        authorized_amount: 81.7135,
        captured_amount: 81.7135,
        refunded_amount: 0,
      },
    ],
    fulfillments: [],
    payment_status: "captured",
    fulfillment_status: "not_fulfilled",
  },
};
// @ts-ignore
export default () => <OrderPlacedEmailComponent {...mockOrder} />;