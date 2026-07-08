"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type ExchangeRateItem = {
  name: string;
  casa: string;
  buy: number;
  sell: number;
  updatedAt: string;
};

type ExchangeRates = {
  blue: ExchangeRateItem;
  mep: ExchangeRateItem;
  official: ExchangeRateItem;
};

interface ExchangeRatesCardProps {
  rates: ExchangeRates;
}

function formatExchangeRate(value: number) {
  return value.toLocaleString("es-AR", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function ExchangeRatesCard({ rates }: ExchangeRatesCardProps) {
  const [open, setOpen] = useState(false);

  const rows = [
    { label: "Blue", rate: rates.blue },
    { label: "MEP", rate: rates.mep },
    { label: "Oficial", rate: rates.official },
  ];

  return (
    <motion.div
      layout
      transition={{
        layout: {
          duration: 0.25,
          ease: "easeOut",
        },
      }}
      className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white text-xs shadow-sm transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900 sm:w-80"
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/70"
      >
        <div>
          <p className="font-semibold text-gray-700 dark:text-gray-100">
            Cotizaciones USD
          </p>
          <p className="mt-0.5 text-gray-400 dark:text-gray-500">
            Blue · MEP · Oficial
          </p>
        </div>

        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="exchange-rates-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: {
                duration: 0.28,
                ease: "easeOut",
              },
              opacity: {
                duration: 0.18,
                ease: "easeOut",
              },
            }}
            className="overflow-hidden border-t border-gray-100 dark:border-gray-800"
          >
            <motion.div
              initial={{ y: -6 }}
              animate={{ y: 0 }}
              exit={{ y: -4 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="px-3 pb-3 pt-2"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  Tipo
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  Compra / Venta
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                {rows.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{
                      duration: 0.18,
                      ease: "easeOut",
                      delay: index * 0.035,
                    }}
                    className="grid grid-cols-[58px_1fr_1fr] items-center gap-2"
                  >
                    <span className="font-medium text-gray-600 dark:text-gray-300">
                      {item.label}
                    </span>

                    <span className="text-gray-700 dark:text-gray-300">
                      C ${formatExchangeRate(item.rate.buy)}
                    </span>

                    <span className="font-medium text-gray-700 dark:text-gray-100">
                      V ${formatExchangeRate(item.rate.sell)}
                    </span>
                  </motion.div>
                ))}
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, delay: 0.08 }}
                className="mt-3 text-[10px] text-gray-400 dark:text-gray-500"
              >
                Fuente: DolarAPI
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}