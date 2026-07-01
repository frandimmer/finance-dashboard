"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  categories: {
    id: string;
    name: string;
  }[];
}

function FilterField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="text-xs font-medium text-gray-400">{label}</span>
      {children}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: {
    value: string;
    label: string;
  }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-11 min-h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 [&>span]:truncate">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>

      <SelectContent
        position="popper"
        align="start"
        sideOffset={2}
        className="w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] rounded-xl border-gray-200 bg-white shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
      >
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="cursor-pointer rounded-lg text-sm"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const months = [
  { value: "all", label: "Todos" },
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

function getYearOptions() {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 10;
  const endYear = currentYear + 1;

  const years = [{ value: "all", label: "Todos" }];

  for (let year = endYear; year >= startYear; year--) {
    years.push({
      value: year.toString(),
      label: year.toString(),
    });
  }

  return years;
}

export function TransactionFilters({ categories }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const searchValueFromUrl = searchParams.get("search") || "";
  const [search, setSearch] = useState(searchValueFromUrl);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const yearOptions = useMemo(() => getYearOptions(), []);

  const typeValue = searchParams.get("type") || "all";
  const categoryValue = searchParams.get("category") || "all";
  const monthValue = searchParams.get("month") || "all";
  const yearValue = searchParams.get("year") || "all";
  const orderValue = searchParams.get("order") || "desc";

  const typeOptions = [
    { value: "all", label: "Todos" },
    { value: "income", label: "Ingresos" },
    { value: "expense", label: "Gastos" },
  ];

  const categoryOptions = [
    { value: "all", label: "Todas" },
    ...categories.map((category) => ({
      value: category.id,
      label: category.name,
    })),
  ];

  const orderOptions = [
    { value: "desc", label: "Recientes" },
    { value: "asc", label: "Antiguas" },
  ];

  const activeFiltersCount = [
    searchParams.get("search"),
    searchParams.get("type"),
    searchParams.get("category"),
    searchParams.get("month"),
    searchParams.get("year"),
  ].filter(Boolean).length;

  const hasActiveFilters = activeFiltersCount > 0;

  function buildUrl(params: URLSearchParams) {
    const query = params.toString();

    return query
      ? `/dashboard/transactions?${query}`
      : "/dashboard/transactions";
  }

  useEffect(() => {
    const cleanSearch = search.trim();

    if (cleanSearch === searchValueFromUrl) {
      return;
    }

    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (!cleanSearch) {
        params.delete("search");
      } else {
        params.set("search", cleanSearch);
      }

      router.replace(buildUrl(params));
    }, 425);

    return () => clearTimeout(timeout);
  }, [search, searchParams, searchValueFromUrl, router]);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (!value || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    if (key === "month" && value !== "all" && !params.get("year")) {
      params.set("year", new Date().getFullYear().toString());
    }

    router.push(buildUrl(params));
  }

  function clearFilters() {
    setSearch("");
    setMobileFiltersOpen(false);
    router.push("/dashboard/transactions");
  }

  const inputClass =
    "h-11 min-h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm outline-none transition-all hover:border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-100";

  const filtersContent = (
    <>
      <FilterField label="Tipo">
        <FilterSelect
          value={typeValue}
          onChange={(value) => updateParam("type", value)}
          placeholder="Todos"
          options={typeOptions}
        />
      </FilterField>

      <FilterField label="Categoría">
        <FilterSelect
          value={categoryValue}
          onChange={(value) => updateParam("category", value)}
          placeholder="Todas"
          options={categoryOptions}
        />
      </FilterField>

      <FilterField label="Mes">
        <FilterSelect
          value={monthValue}
          onChange={(value) => updateParam("month", value)}
          placeholder="Todos"
          options={months}
        />
      </FilterField>

      <FilterField label="Año">
        <FilterSelect
          value={yearValue}
          onChange={(value) => updateParam("year", value)}
          placeholder="Todos"
          options={yearOptions}
        />
      </FilterField>

      <FilterField label="Orden">
        <FilterSelect
          value={orderValue}
          onChange={(value) => updateParam("order", value)}
          placeholder="Recientes"
          options={orderOptions}
        />
      </FilterField>
    </>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="hidden md:grid md:grid-cols-6 gap-3">
        <FilterField label="Buscar">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar..."
            className={inputClass}
          />
        </FilterField>

        {filtersContent}
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        <FilterField label="Buscar">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar..."
            className={inputClass}
          />
        </FilterField>

        <button
          type="button"
          onClick={() => setMobileFiltersOpen((open) => !open)}
          className="flex h-11 min-h-11 w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:bg-gray-50"
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-gray-400" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="rounded-full bg-gray-900 px-2 py-0.5 text-xs font-semibold text-white">
                {activeFiltersCount}
              </span>
            )}
          </span>
        </button>

        <div
          className={`grid transition-all duration-300 ease-out ${
            mobileFiltersOpen
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div
              className={`grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-transform duration-300 ease-out ${
                mobileFiltersOpen
                  ? "translate-y-0 scale-100"
                  : "-translate-y-2 scale-[0.98]"
              }`}
            >
              {filtersContent}
            </div>
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex justify-end">
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-700"
          >
            <X className="h-3.5 w-3.5" />
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}