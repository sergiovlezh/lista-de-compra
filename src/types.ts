export type ListState = 'preparing' | 'shopping' | 'reviewed'

export interface Item {
  id: string
  barcode: string
  name: string
  price: number
  qty: number
  checked: boolean
}

export interface StoreList {
  id: string
  store: string
  date: string // yyyy-mm-dd, native <input type="date">
  note: string
  items: Item[]
  createdAt: number
  state: ListState
}

// ponytail: product catalog = last-seen name/price per barcode, no separate entity file
export interface ProductMemory {
  name: string
  price: number
  updatedAt: number
}

export type View =
  | { name: 'lists' }
  | { name: 'detail'; listId: string }
  | { name: 'scanner'; listId: string }
  | { name: 'products' }

export const uid = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
