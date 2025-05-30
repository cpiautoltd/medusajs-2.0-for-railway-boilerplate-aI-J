"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { MagnifyingGlassMini } from "@medusajs/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function SearchLinkClient() {
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault()
        router.push("/search")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [router])

  return (
    <LocalizedClientLink
      href="/search"
      className="group inline-flex items-center gap-2 px-3 py-2 border border-ui-border-base rounded-md bg-ui-bg-base hover:border-ui-border-strong text-ui-fg-muted transition-colors"
      data-testid="search-link"
    >
      <MagnifyingGlassMini className="w-4 h-4 text-ui-fg-muted group-hover:text-ui-fg-base" />
      <span className="hidden small:inline text-sm text-ui-fg-subtle group-hover:text-ui-fg-base">
        Search the store
      </span>
      <div className="ml-auto items-center gap-1 text-xs text-ui-fg-muted font-mono border border-ui-border-base rounded px-1.5 py-0.5 bg-ui-bg-field hidden small:flex">
        <kbd className="text-xs">Ctrl</kbd>
        <span>+</span>
        <kbd className="text-xs">/</kbd>
      </div>
    </LocalizedClientLink>
  )
}
