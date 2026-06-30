"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, X } from "lucide-react";

interface Props {
  categories: {
    id: string;
    name: string;
  }[];
}

function SelectWrapper({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {children}
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    </div>
  );
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

  const yearOptions = useMemo(() => getYearOptions(), []);

  const typeValue = searchParams.get("type") || "all";
  const categoryValue = searchParams.get("category") || "all";
  const monthValue = searchParams.get("month") || "all";
  const yearValue = searchParams.get("year") || "all";
  const orderValue = searchParams.get("order") || "desc";

  const hasActiveFilters = Boolean(
    searchParams.get("search") ||
      searchParams.get("type") ||
      searchParams.get("category") ||
      searchParams.get("month") ||
      searchParams.get("year")
  );

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
    router.push("/dashboard/transactions");
  }

  const inputClass =
    "h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm outline-none transition-all hover:border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-100";

  const selectClass =
    "appearance-none h-11 w-full rounded-xl border border-gray-200 bg-white px-4 pr-11 text-sm font-medium text-gray-700 shadow-sm outline-none transition-all hover:border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-100";

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <FilterField label="Buscar">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar..."
            className={inputClass}
          />
        </FilterField>

        <FilterField label="Tipo">
          <SelectWrapper>
            <select
              value={typeValue}
              onChange={(event) => updateParam("type", event.target.value)}
              className={selectClass}
            >
              <option value="all">Todos</option>
              <option value="income">Ingresos</option>
              <option value="expense">Gastos</option>
            </select>
          </SelectWrapper>
        </FilterField>

        <FilterField label="Categoría">
          <SelectWrapper>
            <select
              value={categoryValue}
              onChange={(event) => updateParam("category", event.target.value)}
              className={selectClass}
            >
              <option value="all">Todas</option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </SelectWrapper>
        </FilterField>

        <FilterField label="Mes">
          <SelectWrapper>
            <select
              value={monthValue}
              onChange={(event) => updateParam("month", event.target.value)}
              className={selectClass}
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </SelectWrapper>
        </FilterField>

        <FilterField label="Año">
          <SelectWrapper>
            <select
              value={yearValue}
              onChange={(event) => updateParam("year", event.target.value)}
              className={selectClass}
            >
              {yearOptions.map((year) => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>
          </SelectWrapper>
        </FilterField>

        <FilterField label="Orden">
          <SelectWrapper>
            <select
              value={orderValue}
              onChange={(event) => updateParam("order", event.target.value)}
              className={selectClass}
            >
              <option value="desc">Recientes</option>
              <option value="asc">Antiguas</option>
            </select>
          </SelectWrapper>
        </FilterField>
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