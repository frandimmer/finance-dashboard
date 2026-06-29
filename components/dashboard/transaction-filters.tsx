"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { ChevronDown } from "lucide-react"

interface Props {
  categories: {
    id: string
    name: string
  }[]
}

function SelectWrapper({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`relative ${className}`}>
      {children}
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    </div>
  )
}

export function TransactionFilters({ categories }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(
    searchParams.get("search") || ""
  )

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())

    if (!value || value === "all") {
      params.delete(key)
    } else {
      params.set(key, value)
    }

    router.push(`/dashboard/transactions?${params.toString()}`)
  }

  function handleSearch(value: string) {
    setSearch(value)

    const params = new URLSearchParams(searchParams.toString())

    if (!value) {
      params.delete("search")
    } else {
      params.set("search", value)
    }

    router.push(`/dashboard/transactions?${params.toString()}`)
  }

  const selectClass =
    "appearance-none h-11 w-full rounded-xl border border-gray-200 bg-white px-4 pr-11 text-sm font-medium text-gray-700 shadow-sm outline-none transition-all hover:border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"

  return (
    <div className="flex flex-col md:flex-row gap-3">
      <input
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Buscar..."
        className="h-11 w-full md:w-72 rounded-xl border border-gray-200 px-4 text-sm shadow-sm outline-none transition-all focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
      />

      <SelectWrapper className="min-w-[150px]">
        <select
          defaultValue={searchParams.get("type") || "all"}
          onChange={(e) => updateParam("type", e.target.value)}
          className={selectClass}
        >
          <option value="all">Todos</option>
          <option value="income">Ingresos</option>
          <option value="expense">Gastos</option>
        </select>
      </SelectWrapper>

      <SelectWrapper className="min-w-[190px]">
        <select
          defaultValue={searchParams.get("category") || "all"}
          onChange={(e) => updateParam("category", e.target.value)}
          className={selectClass}
        >
          <option value="all">Categorías</option>

          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </SelectWrapper>

      <SelectWrapper className="min-w-[150px]">
        <select
          defaultValue={searchParams.get("order") || "desc"}
          onChange={(e) => updateParam("order", e.target.value)}
          className={selectClass}
        >
          <option value="desc">Recientes</option>
          <option value="asc">Antiguas</option>
        </select>
      </SelectWrapper>
    </div>
  )
}