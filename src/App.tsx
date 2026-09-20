import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, useLocation, Outlet } from 'react-router-dom'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { listTotal, useStore, type State } from './store'
import type { ProductMemory, Item, StoreList, ListState } from './types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Trash2, Camera, Plus, Minus, X, RotateCcw, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

const primary = 'bg-gray-900 text-white'
const ghost = 'border border-gray-300'

const stateLabels: Record<ListState, string> = {
  preparing: 'Preparando',
  shopping: 'Comprando',
  reviewed: 'Revisado',
}
const stateColors: Record<ListState, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  preparing: 'default',
  shopping: 'secondary',
  reviewed: 'success',
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Lists />} />
          <Route path="lists/:listId" element={<Detail />} />
          <Route path="lists/:listId/scanner" element={<Scanner />} />
          <Route path="products" element={<Products />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:barcode" element={<ProductForm />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

function Layout() {
  const location = useLocation()
  const isProducts = location.pathname.startsWith('/products')
  const isSettings = location.pathname === '/settings'

  return (
    <main className="mx-auto max-w-3xl min-h-screen p-4">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">lista-de-compra</h1>
        <nav className="flex gap-2">
          <Link to="/" className={ghost}>Listas</Link>
          <Link to="/products" className={ghost}>Productos</Link>
          <Link to="/settings" className={ghost}>Ajustes</Link>
        </nav>
      </header>
      <div className="space-y-3">
        {isProducts && !isSettings && (
          <div className="flex gap-2">
            <Link to="/products/new" className={primary}>+ Nuevo</Link>
          </div>
        )}
      </div>
      <Outlet />
    </main>
  )
}

function Lists() {
  const lists = useStore((s: State) => s.lists)
  const createList = useStore((s: State) => s.createList)
  const updateList = useStore((s: State) => s.updateList)
  const deleteList = useStore((s: State) => s.deleteList)
  const [store, setStore] = useState('')
  const [filterState, setFilterStateRaw] = useState<'preparing' | 'shopping' | 'reviewed' | 'all'>('all')
  const setFilterState = (value: string) => {
    setFilterStateRaw(value as 'preparing' | 'shopping' | 'reviewed' | 'all')
  }
  const [filterDate, setFilterDate] = useState('')
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)

  const filteredLists = lists
    .filter((l) => {
      if (filterState !== 'all' && l.state !== filterState) return false
      if (filterDate && l.date !== filterDate) return false
      return true
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="space-y-4">
      <section className="rounded border p-4 space-y-3">
        <h2 className="font-medium">Nueva lista</h2>
        <form
          className="flex gap-2 flex-wrap"
          onSubmit={(e) => {
            e.preventDefault()
            createList(store.trim() || 'Sin tienda', date)
            setStore('')
            setDate(today)
          }}
        >
          <Input placeholder="Tienda" value={store} onChange={(e) => setStore(e.target.value)} className="flex-1 min-w-[200px]" />
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
          <Button type="submit">+ Crear</Button>
        </form>
      </section>

      <section className="space-y-3">
        <div className="flex gap-2 flex-wrap items-center">
          <Label htmlFor="filter-state" className="text-sm">Estado:</Label>
          <Select value={filterState} onValueChange={setFilterState}>
            <SelectTrigger id="filter-state" className="w-[180px]">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="preparing">Preparando</SelectItem>
              <SelectItem value="shopping">Comprando</SelectItem>
              <SelectItem value="reviewed">Revisado</SelectItem>
            </SelectContent>
          </Select>
          <Label htmlFor="filter-date" className="text-sm">Fecha:</Label>
          <Input id="filter-date" type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-40" />
          {(filterState !== 'all' || filterDate) && (
            <Button variant="ghost" size="sm" onClick={() => { setFilterState('all'); setFilterDate('') }}>
              <X className="h-4 w-4 mr-1" /> Limpiar
            </Button>
          )}
        </div>

        {filteredLists.length === 0 ? (
          <div className="rounded border border-dashed p-6 text-center text-gray-500">
            {lists.length === 0 ? 'Sin listas todavía. Crea la primera arriba.' : 'No hay listas que coincidan con los filtros.'}
          </div>
        ) : (
          <ul className="divide-y rounded border">
            {filteredLists.map((l) => (
              <li key={l.id} className="p-3">
                <Link to={`/lists/${l.id}`} className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{l.store || 'Sin tienda'}</span>
                      <Badge variant={stateColors[l.state]}>{stateLabels[l.state]}</Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      {l.date} · {l.items.filter((i) => i.checked).length}/{l.items.length} · ${listTotal(l).toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={(e) => {
                      e.preventDefault()
                      const newState: ListState = l.state === 'preparing' ? 'shopping' : l.state === 'shopping' ? 'reviewed' : 'preparing'
                      updateList(l.id, { state: newState })
                    }}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={(e) => {
                      e.preventDefault()
                      if (confirm('¿Eliminar esta lista?')) deleteList(l.id)
                    }}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Detail() {
  const { listId } = useParams<{ listId: string }>()
  const navigate = useNavigate()
  const list = useStore((s: State) => s.lists.find((l) => l.id === listId))
  const updateList = useStore((s: State) => s.updateList)
  const deleteList = useStore((s: State) => s.deleteList)
  const addItem = useStore((s: State) => s.addItem)
  const updateItemQty = useStore((s: State) => s.updateItemQty)
  const toggleItem = useStore((s: State) => s.toggleItem)
  const removeItem = useStore((s: State) => s.removeItem)
  const products = useStore((s: State) => s.products)
  const [barcode, setBarcode] = useState('')
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [qty, setQty] = useState(1)
  const [deleteConfirmItemId, setDeleteConfirmItemId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const productNames = Object.values(products).map((p: ProductMemory) => p.name).filter(Boolean)

  if (!list) return <Empty text="Lista no encontrada." />

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const code = barcode.trim()
    if (!code && !name.trim()) return
    const known = code ? products[code] : undefined
    let finalName = name.trim() || known?.name || code
    let finalPrice = parseFloat(price) || 0
    if (known) {
      if (!name.trim()) finalName = known.name
      if (!price) finalPrice = known.price
      else if (parseFloat(price) !== known.price) {
        if (!confirm(`El precio guardado es $${known.price}. ¿Actualizar a $${price}?`))
          finalPrice = known.price
      }
    }
    addItem(listId!, { barcode: code, name: finalName, price: finalPrice, qty })
    setBarcode('')
    setName('')
    setPrice('')
    setQty(1)
  }

  const onNameSelect = (selectedName: string) => {
    const match = Object.entries(products).find(([, p]) => p.name === selectedName)
    if (match) {
      const [code, p] = match
      setBarcode(code)
      if (!price) setPrice(p.price.toString())
    }
  }

  const handleQtyChange = (itemId: string, newQty: number) => {
    if (newQty < 1) {
      setDeleteConfirmItemId(itemId)
      setShowDeleteConfirm(true)
    } else {
      updateItemQty(listId!, itemId, newQty)
    }
  }

  const confirmDelete = () => {
    if (deleteConfirmItemId) {
      removeItem(listId!, deleteConfirmItemId)
    }
    setShowDeleteConfirm(false)
    setDeleteConfirmItemId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2 flex-1">
          <Input value={list.store} onChange={(e) => updateList(listId!, { store: e.target.value })} placeholder="Tienda" className="flex-1" />
          <Input type="date" value={list.date} onChange={(e) => updateList(listId!, { date: e.target.value })} className="w-40" />
          <Select value={list.state} onValueChange={(v) => updateList(listId!, { state: v as ListState })}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="preparing">Preparando</SelectItem>
              <SelectItem value="shopping">Comprando</SelectItem>
              <SelectItem value="reviewed">Revisado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <form className="flex gap-2 flex-wrap" onSubmit={submit}>
          <Input placeholder="Código" value={barcode} onChange={(e) => setBarcode(e.target.value)} className="flex-1 min-w-[120px]" />
          <Autocomplete value={name} onChange={setName} options={productNames} placeholder="Nombre" onSelect={onNameSelect} className="flex-1 min-w-[150px]" />
          <Input placeholder="$" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className="w-24" />
          <Input type="number" min="1" max="99" value={qty} onChange={(e) => setQty(parseInt(e.target.value) || 1)} className="w-20" />
          <Button type="submit">+</Button>
        </form>

        <Button className="w-full" onClick={() => navigate(`/lists/${listId}/scanner`)}>
          <Camera className="h-4 w-4 mr-2" /> Escanear
        </Button>
      </div>

      <Separator />

      {list.items.length === 0 ? (
        <div className="rounded border border-dashed p-6 text-center text-gray-500">Lista vacía. Agrega items arriba o escanea.</div>
      ) : (
        <div className="rounded border overflow-hidden">
          <div className="grid grid-cols-[1fr_60px_80px_80px_100px_40px] gap-2 px-3 py-2 text-xs font-medium text-gray-500 border-b bg-gray-50">
            <div>Producto</div>
            <div className="text-center">Cantidad</div>
            <div className="text-right pr-2">Precio</div>
            <div className="text-right pr-2">Total</div>
            <div></div>
            <div></div>
          </div>
          <ul className="divide-y max-h-[50vh] overflow-auto">
            {list.items.map((i: Item) => (
              <li key={i.id} className="grid grid-cols-[1fr_60px_80px_80px_100px_40px] gap-2 px-3 py-2 items-center">
                <div className="min-w-0">
                  <div className={cn(i.checked ? 'line-through text-gray-400' : '')}>{i.name}</div>
                  <div className="text-xs text-gray-500">{i.barcode}</div>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleQtyChange(i.id, i.qty - 1)} disabled={i.qty <= 1}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-10 text-center">{i.qty}</span>
                  <Button variant="ghost" size="icon" onClick={() => handleQtyChange(i.id, i.qty + 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-right pr-2 text-sm">${i.price.toFixed(2)}</div>
                <div className="text-right pr-2 text-sm font-medium">${(i.price * i.qty).toFixed(2)}</div>
                <Checkbox checked={i.checked} onCheckedChange={() => toggleItem(listId!, i.id)} />
                <Button variant="ghost" size="icon" onClick={() => { setDeleteConfirmItemId(i.id); setShowDeleteConfirm(true) }}>
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-right font-semibold text-lg">Total: ${listTotal(list).toFixed(2)}</div>

      <Textarea rows={2} placeholder="Notas" value={list.note} onChange={(e) => updateList(listId!, { note: e.target.value })} />

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar item?</DialogTitle>
            <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button variant="outline" onClick={() => { if (confirm('¿Eliminar esta lista?')) { deleteList(listId!); navigate('/') } }} className="w-full">
        <Trash2 className="h-4 w-4 mr-2" /> Eliminar lista
      </Button>
    </div>
  )
}

function Scanner() {
  const { listId } = useParams<{ listId: string }>()
  if (!listId) return <Empty text="Lista no encontrada." />
  const products = useStore((s: State) => s.products)
  const addItem = useStore((s: State) => s.addItem)
  const navigate = useNavigate()
  const [started, setStarted] = useState(false)
  const [error, setError] = useState('')
  const [miss, setMiss] = useState<{ barcode: string } | null>(null)
  const [missName, setMissName] = useState('')
  const [missPrice, setMissPrice] = useState('')
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scannedRef = useRef('')

  useEffect(() => () => {
    scannerRef.current?.stop().catch(() => {})
    try { scannerRef.current?.clear() } catch {}
  }, [])

  const start = async () => {
    setError('')
    try {
      const qr = new Html5Qrcode('reader', {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A, Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128, Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      })
      scannerRef.current = qr
      setStarted(true)
      await qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (code) => {
          if (scannedRef.current === code) return
          scannedRef.current = code
          const known = useStore.getState().products[code]
          if (known) {
            addItem(listId, { barcode: code, name: known.name, price: known.price, qty: 1 })
            navigate(`/lists/${listId}`)
          } else {
            setMiss({ barcode: code })
          }
        },
        () => {},
      )
    } catch {
      setError('Sin cámara. Revisa permisos o usa entrada manual.')
      setStarted(false)
    }
  }

  const stop = () => {
    scannerRef.current?.stop().catch(() => {})
    try { scannerRef.current?.clear() } catch {}
    setStarted(false)
    navigate(`/lists/${listId}`)
  }

  if (miss)
    return (
      <div className="space-y-4 p-4">
        <h2 className="text-lg font-semibold">Código nuevo: {miss.barcode}</h2>
        <form className="space-y-3" onSubmit={(e) => {
          e.preventDefault()
          addItem(listId, { barcode: miss.barcode, name: missName.trim() || miss.barcode, price: parseFloat(missPrice) || 0, qty: 1 })
          navigate(`/lists/${listId}`)
        }}>
          <div>
            <Label>Nombre</Label>
            <Input placeholder="Nombre" value={missName} onChange={(e) => setMissName(e.target.value)} autoFocus required />
          </div>
          <div>
            <Label>Precio</Label>
            <Input placeholder="0.00" inputMode="decimal" value={missPrice} onChange={(e) => setMissPrice(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Guardar y agregar</Button>
            <Button type="button" variant="outline" onClick={() => { setMiss(null); start() }}>Volver a escanear</Button>
          </div>
        </form>
      </div>
    )

  return (
    <div className="space-y-4">
      {!started ? (
        <Button className="w-full" onClick={start} size="lg">
          <Camera className="h-4 w-4 mr-2" /> Iniciar escáner
        </Button>
      ) : (
        <>
          <div id="reader" className="rounded border overflow-hidden bg-black aspect-video" />
          <div className="flex items-center justify-center gap-4 p-4">
            <Button variant="destructive" onClick={stop}>
              <X className="h-4 w-4 mr-2" /> Cancelar
            </Button>
          </div>
          {error && <p className="text-center text-sm text-red-600">{error}</p>}
          {started && <p className="text-center text-sm text-gray-500">Apunta al código. Conocidos: {Object.keys(products).length}</p>}
        </>
      )}
    </div>
  )
}

function Products() {
  const products = useStore((s: State) => s.products)
  const deleteProduct = useStore((s: State) => s.deleteProduct)

  const productEntries = Object.entries(products).sort(([, a], [, b]: [string, ProductMemory]) => b.updatedAt - a.updatedAt)

  return (
    <div className="space-y-4">
      {productEntries.length === 0 ? (
        <div className="rounded border border-dashed p-6 text-center text-gray-500">Sin productos guardados. Agregue items a listas o cree uno nuevo.</div>
      ) : (
        <ul className="divide-y rounded border">
          {productEntries.map(([barcode, p]: [string, ProductMemory]) => (
            <li key={barcode} className="flex items-center justify-between gap-2 p-3">
              <Link to={`/products/${barcode}`} className="flex-1 min-w-0">
                <div className="font-medium truncate">{p.name}</div>
                <div className="text-xs text-gray-500">{barcode} · ${p.price.toFixed(2)} · {new Date(p.updatedAt).toLocaleString()}</div>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => { if (confirm('¿Eliminar producto?')) deleteProduct(barcode) }}>
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ProductForm() {
  const { barcode } = useParams<{ barcode: string }>()
  const navigate = useNavigate()
  const products = useStore((s: State) => s.products)
  const updateProduct = useStore((s: State) => s.updateProduct)
  const deleteProduct = useStore((s: State) => s.deleteProduct)
  const isNew = !barcode

  const existing = barcode ? products[barcode] : null
  const [name, setName] = useState(existing?.name || '')
  const [price, setPrice] = useState(existing?.price.toString() || '')
  const [code, setCode] = useState(barcode || '')
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState('')
  const scannerRef = useRef<Html5Qrcode | null>(null)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const finalCode = code.trim()
    const finalName = name.trim()
    if (!finalName) return

    if (isNew) {
      const newBarcode = finalCode || uid()
      updateProduct(newBarcode, { name: finalName, price: parseFloat(price) || 0, updatedAt: Date.now() })
      navigate('/products')
    } else {
      const finalBarcode = finalCode || barcode!
      if (finalBarcode !== barcode) {
        deleteProduct(barcode!)
        updateProduct(finalBarcode, { name: finalName, price: parseFloat(price) || 0, updatedAt: Date.now() })
        navigate('/products')
      } else {
        updateProduct(barcode!, { name: finalName, price: parseFloat(price) || 0, updatedAt: Date.now() })
        navigate('/products')
      }
    }
  }

  const handleDelete = () => {
    if (confirm('¿Eliminar producto?')) {
      deleteProduct(barcode!)
      navigate('/products')
    }
  }

  const startScan = async () => {
    setScanError('')
    setScanning(true)
    try {
      const qr = new Html5Qrcode('product-scanner', {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A, Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128, Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      })
      scannerRef.current = qr
      await qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (scannedCode) => {
          setCode(scannedCode)
          const known = useStore.getState().products[scannedCode]
          if (known) {
            setName(known.name)
            setPrice(known.price.toString())
          }
          stopScan()
        },
        () => {},
      )
    } catch {
      setScanError('Sin cámara. Ingrese el código manualmente.')
      setScanning(false)
    }
  }

  const stopScan = () => {
    scannerRef.current?.stop().catch(() => {})
    try { scannerRef.current?.clear() } catch {}
    setScanning(false)
  }

  useEffect(() => () => stopScan(), [])

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{isNew ? 'Nuevo producto' : 'Editar producto'}</h2>

      <form className="space-y-4" onSubmit={handleSave}>
        <div className="space-y-2">
          <Label>Código de barras</Label>
          <div className="flex gap-2">
            <Input placeholder="Código" value={code} onChange={(e) => setCode(e.target.value)} disabled={scanning} className="flex-1" />
            <Button type="button" variant={scanning ? 'destructive' : 'outline'} onClick={scanning ? stopScan : startScan}>
              {scanning ? '✕ Cancelar' : <><Camera className="h-4 w-4 mr-1" /> Escanear</>}
            </Button>
          </div>
          {scanError && <p className="text-sm text-red-600">{scanError}</p>}
          {scanning && <div id="product-scanner" className="rounded border overflow-hidden bg-black aspect-video" />}
        </div>

        <div className="space-y-2">
          <Label>Nombre *</Label>
          <Input placeholder="Nombre del producto" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </div>

        <div className="space-y-2">
          <Label>Precio</Label>
          <Input placeholder="0.00" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>

        <div className="flex gap-2">
          <Button type="submit">{isNew ? 'Crear' : 'Guardar'}</Button>
          {!isNew && <Button type="button" variant="destructive" onClick={handleDelete}>Eliminar</Button>}
          <Button type="button" variant="outline" onClick={() => navigate('/products')}>Cancelar</Button>
        </div>
      </form>
    </div>
  )
}

function Settings() {
  const products = useStore((s: State) => s.products)
  const importProducts = useStore((s: State) => s.importProducts)
  const importLists = useStore((s: State) => s.importLists)
  const exportData = useStore((s: State) => s.exportData)
  const [importMode, setImportMode] = useState<'products' | 'lists'>('products')
  const [mergeMode, setMergeMode] = useState(true)

  const productEntries = Object.entries(products).sort(([, a], [, b]: [string, ProductMemory]) => b.updatedAt - a.updatedAt)

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        let data: unknown
        if (file.name.endsWith('.json')) {
          data = JSON.parse(ev.target?.result as string)
        } else if (file.name.endsWith('.csv')) {
          const text = ev.target?.result as string
          const lines = text.trim().split('\n')
          const headers = lines[0].split(',').map((h) => h.trim())
          data = lines.slice(1).map((line) => {
            const vals = line.split(',').map((v) => v.trim())
            return Object.fromEntries(headers.map((h, i) => [h, vals[i]]))
          })
        } else {
          alert('Formato no soportado. Use .json o .csv')
          return
        }
        if (importMode === 'products') {
          const productsData = data as Record<string, { name: string; price: number; updatedAt: number }>
          importProducts(productsData, mergeMode)
        } else {
          const listsData = data as StoreList[]
          importLists(listsData, mergeMode)
        }
        alert(`Importados correctamente (${importMode})`)
      } catch {
        alert('Error al importar. Verifique el formato del archivo.')
      }
    }
    reader.readAsText(file)
  }

  const handleExport = (includeLists: boolean) => {
    const json = exportData(includeLists)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lista-de-compra-${includeLists ? 'full' : 'products'}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportCSV = () => {
    const headers = ['barcode', 'name', 'price', 'updatedAt']
    const rows = productEntries.map(([barcode, p]: [string, ProductMemory]) => [barcode, p.name, p.price.toString(), p.updatedAt.toString()])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `products-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Ajustes</h2>

      <section className="space-y-3 rounded border p-4">
        <h3 className="font-medium">Importar / Exportar</h3>
        <div className="flex gap-2 flex-wrap text-sm">
          <Label className="flex items-center gap-2"><input type="radio" name="importMode" checked={importMode === 'products'} onChange={() => setImportMode('products')} /> Productos</Label>
          <Label className="flex items-center gap-2"><input type="radio" name="importMode" checked={importMode === 'lists'} onChange={() => setImportMode('lists')} /> Listas</Label>
          <Label className="flex items-center gap-2"><input type="checkbox" checked={mergeMode} onChange={(e) => setMergeMode(e.target.checked)} /> Fusionar</Label>
        </div>
        <Input type="file" accept=".json,.csv" onChange={handleImport} />
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => handleExport(false)}>Exportar productos (JSON)</Button>
          <Button variant="outline" onClick={() => handleExport(true)}>Exportar todo (JSON)</Button>
          <Button variant="outline" onClick={handleExportCSV}>Exportar productos (CSV)</Button>
        </div>
      </section>

      <section className="space-y-3 rounded border p-4">
        <h3 className="font-medium">Información</h3>
        <p className="text-sm text-gray-600">Productos guardados: {Object.keys(products).length}</p>
        <p className="text-sm text-gray-600">Listas guardadas: {useStore.getState().lists.length}</p>
      </section>
    </div>
  )
}

function Autocomplete({
  value,
  onChange,
  options,
  placeholder,
  onSelect,
  className,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder: string
  onSelect?: (v: string) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const filtered = options.filter((o) => o.toLowerCase().includes(value.toLowerCase()))

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') { e.preventDefault(); setOpen(true); setHighlighted(0) }
      return
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)) }
    else if (e.key === 'Enter' && filtered[highlighted]) { e.preventDefault(); onChange(filtered[highlighted]); onSelect?.(filtered[highlighted]); setOpen(false) }
    else if (e.key === 'Escape') { setOpen(false) }
  }

  return (
    <div className={cn('relative', className)} onClick={() => setOpen(true)}>
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setHighlighted(0) }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      {open && filtered.length && (
        <ul className="absolute z-10 w-full mt-1 rounded border border-gray-300 bg-white shadow-md max-h-48 overflow-auto">
          {filtered.map((opt, i) => (
            <li key={opt} className={cn('px-2 py-1.5 cursor-pointer', i === highlighted ? 'bg-gray-100' : '')} onMouseDown={(e) => { e.preventDefault(); onChange(opt); onSelect?.(opt); setOpen(false) }}>{opt}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="rounded border border-dashed p-6 text-center text-gray-500">{text}</p>
}

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`