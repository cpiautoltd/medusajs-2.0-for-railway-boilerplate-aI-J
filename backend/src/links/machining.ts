import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import MachiningService from "../modules/machining";

export default defineLink(
  ProductModule.linkable.product,
  {
    linkable: MachiningService.linkable.machinings,
    isList: true,
    deleteCascade: true
  }
  
);