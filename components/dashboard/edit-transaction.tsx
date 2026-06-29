"use client"

import { useState, useTransition } from "react"
import { updateTransaction } from "@/app/actions/updateTransaction"

interface Props {
  transaction: {
    id: string
    amount: number
    description: string | null
    type: string
    categoryId: string | null
  }
  categories: {
    id: string
    name: string
  }[]
}

export function EditTransaction({
  transaction,
  categories,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [amount, setAmount] = useState(transaction.amount)
  const [description, setDescription] = useState(
    transaction.description || ""
  )
  const [type, setType] = useState(transaction.type)
  const [categoryId, setCategoryId] = useState(
    transaction.categoryId || ""
  )

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-xs text-blue-600 hover:underline"
      >
        Editar
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2 p-3 border rounded-lg bg-gray-50">
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="border rounded px-2 py-1 text-sm"
        placeholder="Descripción"
      />

      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        className="border rounded px-2 py-1 text-sm"
      />

      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="border rounded px-2 py-1 text-sm"
      >
        <option value="income">Ingreso</option>
        <option value="expense">Gasto</option>
      </select>

      <select
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        className="border rounded px-2 py-1 text-sm"
      >
        <option value="">Sin categoría</option>

        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        <button
          onClick={() =>
            startTransition(async () => {
              await updateTransaction({
                id: transaction.id,
                amount,
                description,
                type,
                categoryId,
              })

              setEditing(false)
            })
          }
          className="px-3 py-1 rounded bg-black text-white text-xs"
        >
          {isPending ? "Guardando..." : "Guardar"}
        </button>

        <button
          onClick={() => setEditing(false)}
          className="px-3 py-1 rounded border text-xs"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}