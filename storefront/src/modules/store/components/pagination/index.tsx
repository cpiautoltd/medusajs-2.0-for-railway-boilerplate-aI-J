"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { clx } from "@medusajs/ui"

export function Pagination({
  page,
  totalPages,
  totalResults,
  perPage,
  "data-testid": dataTestid,
}: {
  page: number
  totalPages: number
  totalResults: number
  perPage: number
  "data-testid"?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", newPage.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  const renderPageButton = (
    p: number,
    label: string | number,
    isCurrent: boolean
  ) => (
    <button
      key={p}
      onClick={() => handlePageChange(p)}
      disabled={isCurrent}
      className={clx(
        "px-3 py-1 rounded-md text-sm font-medium transition-colors",
        isCurrent
          ? "bg-gray-900 text-white cursor-default"
          : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
      )}
    >
      {label}
    </button>
  )

  const renderEllipsis = (key: string) => (
    <span key={key} className="px-2 text-gray-400">
      ...
    </span>
  )

  const renderPageButtons = () => {
    const buttons = []
    if (totalPages <= 7) {
      buttons.push(
        ...Array.from({ length: totalPages }, (_, i) =>
          renderPageButton(i + 1, i + 1, page === i + 1)
        )
      )
    } else {
      if (page <= 4) {
        buttons.push(
          ...Array.from({ length: 5 }, (_, i) =>
            renderPageButton(i + 1, i + 1, page === i + 1)
          )
        )
        buttons.push(renderEllipsis("e1"))
        buttons.push(
          renderPageButton(totalPages, totalPages, page === totalPages)
        )
      } else if (page >= totalPages - 3) {
        buttons.push(renderPageButton(1, 1, page === 1))
        buttons.push(renderEllipsis("e2"))
        buttons.push(
          ...Array.from({ length: 5 }, (_, i) =>
            renderPageButton(
              totalPages - 4 + i,
              totalPages - 4 + i,
              page === totalPages - 4 + i
            )
          )
        )
      } else {
        buttons.push(renderPageButton(1, 1, page === 1))
        buttons.push(renderEllipsis("e3"))
        buttons.push(renderPageButton(page - 1, page - 1, false))
        buttons.push(renderPageButton(page, page, true))
        buttons.push(renderPageButton(page + 1, page + 1, false))
        buttons.push(renderEllipsis("e4"))
        buttons.push(
          renderPageButton(totalPages, totalPages, page === totalPages)
        )
      }
    }
    return buttons
  }

  const start = (page - 1) * perPage + 1
  const end = Math.min(start + perPage - 1, totalResults)

  return (
    <div className="flex flex-col items-center justify-between w-full gap-4 mt-12">
      <div className="text-sm text-gray-600">
        Showing <span className="font-medium">{start}</span>–
        <span className="font-medium">{end}</span> of{" "}
        <span className="font-medium">{totalResults}</span> results
      </div>
      <div className="flex items-center gap-2" data-testid={dataTestid}>
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1 text-sm rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Prev
        </button>

        {renderPageButtons()}

        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1 text-sm rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  )
}
