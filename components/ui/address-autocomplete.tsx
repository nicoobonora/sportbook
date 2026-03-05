/**
 * Input con autocomplete per indirizzi via Nominatim (OpenStreetMap).
 * Debounce a 400ms per rispettare il rate limit di 1 req/s.
 */
"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Loader2, MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  searchAddress,
  parseNominatimResult,
  type NominatimResult,
  type ParsedAddress,
} from "@/lib/utils/nominatim"

type AddressAutocompleteProps = {
  defaultValue?: string
  onSelect: (result: ParsedAddress) => void
  placeholder?: string
  id?: string
}

export function AddressAutocomplete({
  defaultValue = "",
  onSelect,
  placeholder = "Cerca indirizzo...",
  id,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(defaultValue)
  const [results, setResults] = useState<NominatimResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 3) {
      setResults([])
      setIsOpen(false)
      return
    }
    setLoading(true)
    const data = await searchAddress(q)
    setResults(data)
    setIsOpen(data.length > 0)
    setSelectedIndex(-1)
    setLoading(false)
  }, [])

  function handleInputChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(value), 400)
  }

  function handleSelect(result: NominatimResult) {
    const parsed = parseNominatimResult(result)
    setQuery(parsed.address)
    setIsOpen(false)
    setResults([])
    onSelect(parsed)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || results.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault()
      handleSelect(results[selectedIndex])
    } else if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Input
          id={id}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setIsOpen(true) }}
          placeholder={placeholder}
          className="pl-8"
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={id ? `${id}-listbox` : undefined}
        />
        {loading && (
          <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul
          id={id ? `${id}-listbox` : undefined}
          role="listbox"
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md"
        >
          {results.map((result, i) => (
            <li
              key={result.place_id}
              role="option"
              aria-selected={i === selectedIndex}
              className={`cursor-pointer px-3 py-2 text-sm transition-colors hover:bg-accent ${
                i === selectedIndex ? "bg-accent" : ""
              }`}
              onMouseDown={() => handleSelect(result)}
            >
              <p className="truncate font-medium">
                {parseNominatimResult(result).address}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {[
                  parseNominatimResult(result).city,
                  parseNominatimResult(result).postal_code,
                  parseNominatimResult(result).region,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </li>
          ))}
          <li className="border-t px-3 py-1.5 text-[10px] text-muted-foreground">
            Dati da OpenStreetMap
          </li>
        </ul>
      )}
    </div>
  )
}
