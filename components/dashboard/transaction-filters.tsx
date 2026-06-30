"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

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

  const [search, setSearch] = useState(searchParams.get("search") || "");

  const yearOptions = useMemo(() => getYearOptions(), []);

  function pushParams(params: URLSearchParams) {
    const query = params.toString();

    router.push(
      query ? `/dashboard/transactions?${query}` : "/dashboard/transactions"
    );
  }

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

    pushParams(params);
  }

  function handleSearch(value: string) {
    setSearch(value);

    const params = new URLSearchParams(searchParams.toString());

    if (!value) {
      params.delete("search");
    } else {
      params.set("search", value);
    }

    pushParams(params);
  }

  const inputClass =
    "h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm outline-none transition-all hover:border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-100";

  const selectClass =
    "appearance-none h-11 w-full rounded-xl border border-gray-200 bg-white px-4 pr-11 text-sm font-medium text-gray-700 shadow-sm outline-none transition-all hover:border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-100";

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
      <FilterField label="Buscar">
        <input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Buscar..."
          className={inputClass}
        />
      </FilterField>

      <FilterField label="Tipo">
        <SelectWrapper>
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
      </FilterField>

      <FilterField label="Categoría">
        <SelectWrapper>
          <select
            defaultValue={searchParams.get("category") || "all"}
            onChange={(e) => updateParam("category", e.target.value)}
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
            defaultValue={searchParams.get("month") || "all"}
            onChange={(e) => updateParam("month", e.target.value)}
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
            defaultValue={searchParams.get("year") || "all"}
            onChange={(e) => updateParam("year", e.target.value)}
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
            defaultValue={searchParams.get("order") || "desc"}
            onChange={(e) => updateParam("order", e.target.value)}
            className={selectClass}
          >
            <option value="desc">Recientes</option>
            <option value="asc">Antiguas</option>
          </select>
        </SelectWrapper>
      </FilterField>
    </div>
  );
}