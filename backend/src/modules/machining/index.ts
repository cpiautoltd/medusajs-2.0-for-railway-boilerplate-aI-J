import MachiningModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const MACHINING_SERVICE_MODULE = "machinings"

export default Module(MACHINING_SERVICE_MODULE, {
  service: MachiningModuleService,
})