// src/app/[countryCode]/(main)/bom-import/page.tsx
import { Metadata } from "next"
import BOMImportComponent from "@modules/bom/components/bom-import/index"

export const metadata: Metadata = {
  title: "Import BOM | Medusa Store",
  description: "Import your bill of materials to quickly add multiple items to cart",
}

export default function BOMImportPage() {
  return (
    <div className="content-container py-12">
      <BOMImportComponent />
    </div>
  )
}