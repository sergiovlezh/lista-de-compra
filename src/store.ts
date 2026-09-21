import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Item, ProductMemory, StoreList, View } from './types'
import { uid } from './types'

export interface State {
  lists: StoreList[]
  products: Record<string, ProductMemory>
  view: View
  setView: (view: View) => void
  createList: (store: string, date: string) => string
  deleteList: (id: string) => void
  updateList: (id: string, patch: Partial<Pick<StoreList, 'store' | 'date' | 'note' | 'state'>>) => void
  addItem: (listId: string, item: Omit<Item, 'id' | 'checked' | 'qty'>) => void
  updateItemQty: (listId: string, itemId: string, qty: number) => void
  updateItem: (listId: string, itemId: string, patch: Partial<Pick<Item, 'name' | 'price'>>) => void
  renameProduct: (barcode: string, name: string) => void
  toggleItem: (listId: string, itemId: string) => void
  removeItem: (listId: string, itemId: string) => void
  rememberProduct: (barcode: string, memory: ProductMemory) => void
  updateProduct: (barcode: string, memory: Partial<ProductMemory>) => void
  deleteProduct: (barcode: string) => void
  importData: (data: { products: Record<string, ProductMemory>; lists: StoreList[] }, merge: boolean) => void
  exportData: () => string
}

const initialState = {
  lists: [] as StoreList[],
  products: {} as Record<string, ProductMemory>,
  view: { name: 'lists' } as View,
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initialState,
      setView: (view) => set({ view }),
      createList: (store, date) => {
        const id = uid()
        set((s) => ({
          lists: [
            ...s.lists,
            { id, store, date, note: '', items: [], createdAt: Date.now(), state: 'preparing' },
          ],
          view: { name: 'detail', listId: id },
        }))
        return id
      },
      deleteList: (id) =>
        set((s) => ({
          lists: s.lists.filter((l) => l.id !== id),
          view: { name: 'lists' },
        })),
      updateList: (id, patch) =>
        set((s) => ({
          lists: s.lists.map((l) => (l.id === id ? { ...l, ...patch } : l)),
        })),
      addItem: (listId, item) =>
        set((s) => {
          const list = s.lists.find((l) => l.id === listId)
          if (!list) return { products: s.products }

          const existingIdx = list.items.findIndex((i) => {
            if (item.barcode && i.barcode === item.barcode) return true
            if (!item.barcode && i.name.toLowerCase() === item.name.toLowerCase()) return true
            return false
          })

          let newItems: Item[]
          if (existingIdx >= 0) {
            newItems = list.items.map((i, idx) =>
              idx === existingIdx ? { ...i, qty: i.qty + 1 } : i
            )
          } else {
            newItems = [...list.items, { ...item, id: uid(), checked: false, qty: 1 }]
          }

          return {
            lists: s.lists.map((l) => (l.id === listId ? { ...l, items: newItems } : l)),
            products: item.barcode
              ? {
                  ...s.products,
                  [item.barcode]: {
                    name: item.name,
                    price: item.price,
                    updatedAt: Date.now(),
                  },
                }
              : s.products,
          }
        }),
      toggleItem: (listId, itemId) =>
        set((s) => ({
          lists: s.lists.map((l) =>
            l.id === listId
              ? {
                  ...l,
                  items: l.items.map((i) =>
                    i.id === itemId ? { ...i, checked: !i.checked } : i,
                  ),
                }
              : l,
          ),
        })),
      removeItem: (listId, itemId) =>
        set((s) => ({
          lists: s.lists.map((l) =>
            l.id === listId
              ? { ...l, items: l.items.filter((i) => i.id !== itemId) }
              : l,
          ),
        })),
      // ponytail: fractions allowed, 2-decimal rounding, 0/NaN handled by delete modal in UI
      updateItemQty: (listId, itemId, qty) =>
        set((s) => {
          if (!Number.isFinite(qty)) return {}
          const rounded = Math.round(qty * 100) / 100
          if (rounded <= 0) return {}
          return {
            lists: s.lists.map((l) =>
              l.id === listId
                ? {
                    ...l,
                    items: l.items.map((i) =>
                      i.id === itemId ? { ...i, qty: rounded } : i,
                    ),
                  }
                : l,
            ),
          }
        }),
      // ponytail: row-only edit; catalog sync is explicit via renameProduct/updateProduct
      updateItem: (listId, itemId, patch) =>
        set((s) => {
          const name = patch.name !== undefined ? patch.name.trim() : undefined
          const price =
            patch.price !== undefined && Number.isFinite(patch.price)
              ? Math.round((patch.price as number) * 100) / 100
              : undefined
          if (name !== undefined && !name) return {}
          if (name === undefined && price === undefined) return {}
          return {
            lists: s.lists.map((l) =>
              l.id === listId
                ? {
                    ...l,
                    items: l.items.map((i) =>
                      i.id === itemId
                        ? { ...i, ...(name !== undefined ? { name } : {}), ...(price !== undefined ? { price } : {}) }
                        : i,
                    ),
                  }
                : l,
            ),
          }
        }),
      // ponytail: name change propagates to catalog + every row with that barcode; prices elsewhere untouched
      renameProduct: (barcode, name) =>
        set((s) => {
          const trimmed = name.trim()
          if (!barcode || !trimmed) return {}
          return {
            products: s.products[barcode]
              ? { ...s.products, [barcode]: { ...s.products[barcode], name: trimmed, updatedAt: Date.now() } }
              : s.products,
            lists: s.lists.map((l) => ({
              ...l,
              items: l.items.map((i) => (i.barcode === barcode ? { ...i, name: trimmed } : i)),
            })),
          }
        }),
      rememberProduct: (barcode, memory) =>
        set((s) => ({ products: { ...s.products, [barcode]: memory } })),
      updateProduct: (barcode, memory) =>
        set((s) => ({
          products: { ...s.products, [barcode]: { ...s.products[barcode], ...memory, updatedAt: Date.now() } },
        })),
      deleteProduct: (barcode) =>
        set((s) => {
          const { [barcode]: _, ...rest } = s.products
          return { products: rest }
        }),
      importData: (data, merge) =>
        set((s) => ({
          products: merge ? { ...s.products, ...(data.products || {}) } : (data.products || {}),
          lists: merge ? [...s.lists, ...(data.lists || [])] : (data.lists || []),
        })),
      exportData: (): string => {
        const state = get()
        return JSON.stringify({ products: state.products, lists: state.lists }, null, 2)
      },
    }),
    { name: 'ldc:v1' },
  ),
)

export const listTotal = (list: StoreList) =>
  list.items.reduce((sum, i) => sum + i.price * i.qty, 0)