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

const stateLabels: Record<ListState, string> = {
  preparing: 'Preparando',
  shopping: 'Comprando',
  reviewed: 'Revisado',
}
const stateColors: Record<ListState, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  preparing: 'default',
  shopping: 'warning',
  reviewed: 'success',
}

const navLink = 'inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg text-primary hover:bg-primary-light transition-colors min-h-[40px] touch-manipulation'
const pageHeader = 'sticky top-0 z-40 flex items-center justify-between gap-2 px-4 py-3 bg-white/95 backdrop-blur-sm border-b border-border'

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
    <main className="min-h-screen bg-background safe-area-inset-bottom safe-area-inset-top">
      <header className={pageHeader}>
        <h1 className="text-lg font-semibold text-text">lista-de-compra</h1>
        <nav className="flex gap-1">
          <Link to="/" className={navLink}>Listas</Link>
          <Link to="/products" className={navLink}>Productos</Link>
          <Link to="/settings" className={navLink}>Ajustes</Link>
        </nav>
      </header>
      <div className="px-4 py-4 pb-24 space-y-4">
        {isProducts && !isSettings && (
          <div className="flex gap-2">
            <Link to="/products/new" className="btn-primary btn-block btn-lg">+ Nuevo producto</Link>
          </div>
        )}
        <Outlet />
      </div>
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
      <section className="rounded-xl border border-border bg-white shadow-sm">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="font-medium text-text">Nueva lista</h2>
        </div>
        <div className="p-4 space-y-3">
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              createList(store.trim() || 'Sin tienda', date)
              setStore('')
              setDate(today)
            }}
          >
            <div className="flex-1">
              <Label htmlFor="new-list-store" className="block text-sm font-medium text-text mb-1.5">Tienda</Label>
              <Input id="new-list-store" placeholder="Ej: Mercadona" value={store} onChange={(e) => setStore(e.target.value)} />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="w-full sm:w-[160px]">
                <Label htmlFor="new-list-date" className="block text-sm font-medium text-text mb-1.5">Fecha</Label>
                <Input id="new-list-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <Button type="submit" className="btn-primary btn-block btn-lg sm:self-end sm:w-auto" style={{ minWidth: '140px' }}>+ Crear</Button>
            </div>
          </form>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Label htmlFor="filter-state" className="sr-only">Filtrar por estado</Label>
            <Select value={filterState} onValueChange={setFilterState}>
              <SelectTrigger id="filter-state" className="w-full">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="preparing">Preparando</SelectItem>
                <SelectItem value="shopping">Comprando</SelectItem>
                <SelectItem value="reviewed">Revisado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label htmlFor="filter-date" className="sr-only">Filtrar por fecha</Label>
            <Input id="filter-date" type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} placeholder="Fecha" />
          </div>
          {(filterState !== 'all' || filterDate) && (
            <Button variant="ghost" size="sm" onClick={() => { setFilterState('all'); setFilterDate('') }} className="self-end">
              <X className="h-4 w-4 mr-1" /> Limpiar
            </Button>
          )}
        </div>

        {filteredLists.length === 0 ? (
          <div className="rounded-xl border border-border bg-white shadow-sm py-12 text-center">
            <p className="text-text-muted">{lists.length === 0 ? 'Sin listas todavía. Crea la primera arriba.' : 'No hay listas que coincidan con los filtros.'}</p>
          </div>
        ) : (
          <ul className="rounded-xl border border-border bg-white shadow-sm divide-y divide-border scrollbar-thin">
            {filteredLists.map((l) => (
              <li key={l.id}>
                <Link to={`/lists/${l.id}`} className="flex items-center justify-between gap-2 p-4 border-b border-border last:border-0 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate text-text">{l.store || 'Sin tienda'}</span>
                      <Badge variant={stateColors[l.state]}>{stateLabels[l.state]}</Badge>
                    </div>
                    <div className="text-sm text-text-muted mt-1">
                      {l.date} · {l.items.filter((i) => i.checked).length}/{l.items.length} · ${listTotal(l).toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={(e) => {
                      e.preventDefault()
                      const newState: ListState = l.state === 'preparing' ? 'shopping' : l.state === 'shopping' ? 'reviewed' : 'preparing'
                      updateList(l.id, { state: newState })
                    }} aria-label="Cambiar estado">
                      <RotateCcw className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={(e) => {
                      e.preventDefault()
                      if (confirm('¿Eliminar esta lista?')) deleteList(l.id)
                    }} aria-label="Eliminar lista">
                      <Trash2 className="h-5 w-5 text-destructive" />
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
    addItem(listId!, { barcode: code, name: finalName, price: finalPrice })
    setBarcode('')
    setName('')
    setPrice('')
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
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex flex-col gap-2 flex-1 min-w-0 sm:flex-row">
          <div className="flex-1 min-w-0">
            <Label htmlFor="detail-store" className="sr-only">Tienda</Label>
            <Input id="detail-store" value={list.store} onChange={(e) => updateList(listId!, { store: e.target.value })} placeholder="Tienda" />
          </div>
          <div className="w-full sm:w-[160px]">
            <Label htmlFor="detail-date" className="sr-only">Fecha</Label>
            <Input id="detail-date" type="date" value={list.date} onChange={(e) => updateList(listId!, { date: e.target.value })} />
          </div>
          <div className="w-full sm:w-[140px]">
            <Label htmlFor="detail-state" className="sr-only">Estado</Label>
            <Select value={list.state} onValueChange={(v) => updateList(listId!, { state: v as ListState })}>
              <SelectTrigger id="detail-state" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="preparing">Preparando</SelectItem>
                <SelectItem value="shopping">Comprando</SelectItem>
                <SelectItem value="reviewed">Revisado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} aria-label="Volver">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-white shadow-sm">
        <div className="p-4 space-y-3">
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={submit}>
            <div className="flex-1 min-w-0">
              <Label htmlFor="add-barcode" className="sr-only">Código</Label>
              <Input id="add-barcode" placeholder="Código" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
            </div>
            <div className="flex-1 min-w-0">
              <Label htmlFor="add-name" className="sr-only">Nombre</Label>
              <Autocomplete value={name} onChange={setName} options={productNames} placeholder="Nombre" onSelect={onNameSelect} />
            </div>
            <div className="w-full sm:w-[100px]">
              <Label htmlFor="add-price" className="sr-only">Precio</Label>
              <Input id="add-price" placeholder="$" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <Button type="submit" className="btn-primary btn-lg self-end" style={{ minWidth: '100px' }}>+</Button>
          </form>

          <Button className="btn-secondary btn-block btn-lg" onClick={() => navigate(`/lists/${listId}/scanner`)}>
            <Camera className="h-5 w-5 mr-2" /> Escanear código
          </Button>
        </div>
      </div>

      <Separator />

      {list.items.length === 0 ? (
        <div className="rounded-xl border border-border bg-white shadow-sm py-12 text-center">
          <p className="text-text-muted">Lista vacía. Agrega items arriba o escanea.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-2 px-3 py-2 text-xs font-medium text-text-muted border-b border-border bg-gray-50 sticky top-0 z-10">
            <div className="w-6"></div>
            <div>Producto</div>
            <div className="text-center w-20">Cant.</div>
            <div className="text-right pr-3 w-24">Precio</div>
            <div className="text-right pr-3 w-28">Total</div>
            <div className="w-12"></div>
          </div>
          <ul className="divide-y divide-border scrollbar-thin max-h-[60vh] overflow-auto">
            {list.items.map((i: Item) => (
              <li key={i.id} className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-2 px-3 py-3 items-center">
                <Checkbox checked={i.checked} onCheckedChange={() => toggleItem(listId!, i.id)} className="h-5 w-5" />
                <div className="min-w-0">
                  <div className={cn('font-medium truncate', i.checked ? 'line-through text-text-muted' : 'text-text')}>{i.name}</div>
                  {i.barcode && <div className="text-xs text-text-muted truncate">{i.barcode}</div>}
                </div>
                <div className="flex items-center justify-center gap-1 w-20">
                  <Button variant="ghost" size="icon" onClick={() => handleQtyChange(i.id, i.qty - 1)} disabled={i.qty <= 1} aria-label="Decrementar">
                    <Minus className="h-5 w-5" />
                  </Button>
                  <span className="w-10 text-center font-medium text-text">{i.qty}</span>
                  <Button variant="ghost" size="icon" onClick={() => handleQtyChange(i.id, i.qty + 1)} aria-label="Incrementar">
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
                <div className="text-right pr-3 w-24 text-sm text-text">${i.price.toFixed(2)}</div>
                <div className="text-right pr-3 w-28 text-sm font-medium text-primary">${(i.price * i.qty).toFixed(2)}</div>
                <Button variant="ghost" size="icon" onClick={() => { setDeleteConfirmItemId(i.id); setShowDeleteConfirm(true) }} aria-label="Eliminar">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-right font-semibold text-xl text-text">Total: ${listTotal(list).toFixed(2)}</div>

      <div className="rounded-xl border border-border bg-white shadow-sm">
        <div className="p-4">
          <Label htmlFor="list-note" className="block text-sm font-medium text-text mb-1.5">Notas</Label>
          <Textarea id="list-note" rows={3} placeholder="Notas adicionales..." value={list.note} onChange={(e) => updateList(listId!, { note: e.target.value })} />
        </div>
      </div>

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

      <Button variant="outline" onClick={() => { if (confirm('¿Eliminar esta lista?')) { deleteList(listId!); navigate('/') } }} className="btn-block btn-lg">
        <Trash2 className="h-5 w-5 mr-2" /> Eliminar lista
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
  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => () => {
    scannerRef.current?.stop().catch(() => {})
    try { scannerRef.current?.clear() } catch {}
  }, [])

  const playBeep = () => {
    // Always vibrate as feedback (works on mobile, no-op on desktop)
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
    const ctx = audioContextRef.current
    if (!ctx) return
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => playBeepInternal(ctx))
    } else {
      playBeepInternal(ctx)
    }
  }

  const playBeepInternal = (ctx: AudioContext) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 800
    gain.gain.value = 0.3
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
    osc.stop(ctx.currentTime + 0.1)
  }

  const handleScanSuccess = (code: string) => {
    if (scannedRef.current === code) return
    scannedRef.current = code
    const known = useStore.getState().products[code]
    if (known) {
      playBeep()
      addItem(listId, { barcode: code, name: known.name, price: known.price })
      // Navigate immediately - cleanup effect will stop the scanner
      setTimeout(() => {
        navigate(`/lists/${listId}`)
      }, 100)
    } else {
      // Don't stop() here - let the miss form show, cleanup effect will handle scanner
      setMiss({ barcode: code })
    }
  }

  const start = async () => {
    setError('')
    try {
      // Create and unlock AudioContext on user gesture (button click)
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new AudioContext()
      await ctx.resume() // Unlock on user gesture
      audioContextRef.current = ctx

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
        { fps: 10, qrbox: { width: 300, height: 300 } },
        handleScanSuccess,
        () => {},
      )
    } catch {
      setError('Sin cámara. Revisa permisos o usa entrada manual.')
      setStarted(false)
    }
  }

  const stop = () => {
    const scanner = scannerRef.current
    if (scanner) {
      scanner.stop().catch(() => {})
      try { scanner.clear() } catch {}
      scannerRef.current = null
    }
    setStarted(false)
    navigate(`/lists/${listId}`)
  }

  if (miss)
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-white shadow-sm">
          <div className="p-4 space-y-4">
            <h2 className="text-lg font-semibold text-text">Código nuevo: <span className="font-mono text-primary">{miss.barcode}</span></h2>
            <form className="space-y-4" onSubmit={(e) => {
              e.preventDefault()
              addItem(listId, { barcode: miss.barcode, name: missName.trim() || miss.barcode, price: parseFloat(missPrice) || 0 })
              navigate(`/lists/${listId}`)
            }}>
              <div>
                <Label htmlFor="miss-name" className="block text-sm font-medium text-text mb-1.5">Nombre *</Label>
                <Input id="miss-name" placeholder="Nombre del producto" value={missName} onChange={(e) => setMissName(e.target.value)} autoFocus required />
              </div>
              <div>
                <Label htmlFor="miss-price" className="block text-sm font-medium text-text mb-1.5">Precio</Label>
                <Input id="miss-price" placeholder="0.00" inputMode="decimal" value={missPrice} onChange={(e) => setMissPrice(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="btn-primary btn-block btn-lg">Guardar y agregar</Button>
                <Button type="button" variant="outline" className="btn-block btn-lg" onClick={() => { setMiss(null); start() }}>Volver a escanear</Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )

  return (
    <div className="space-y-4">
      <div className="space-y-4 max-w-md mx-auto">
        <div id="reader" className="w-full aspect-video bg-black relative overflow-hidden rounded-xl border border-border" style={{ minHeight: '300px', maxHeight: '50vh' }}>
          {started && (
            <>
              <div className="scanner-cutout">
                <div className="scanner-line" />
              </div>
            </>
          )}
        </div>
        {!started ? (
          <div className="rounded-xl border border-border bg-white shadow-sm">
            <div className="p-6 space-y-4 text-center">
              <Camera className="h-16 w-16 text-text-muted mx-auto" aria-hidden="true" />
              <div>
                <h2 className="text-lg font-semibold text-text">Escanear código de barras</h2>
                <p className="text-text-muted mt-1">Apunta la cámara al código de barras del producto</p>
              </div>
              <Button className="btn-primary btn-block btn-lg" onClick={start}>
                <Camera className="h-5 w-5 mr-2" /> Iniciar escáner
              </Button>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center p-4">
              <Button variant="destructive" className="btn-lg" onClick={stop} style={{ minWidth: '160px' }}>
                <X className="h-5 w-5 mr-2" /> Cancelar
              </Button>
            </div>
            {error && <div className="rounded-xl border border-border bg-white shadow-sm p-4"><p className="text-center text-sm text-destructive">{error}</p></div>}
            {started && !error && (
              <div className="rounded-xl border border-border bg-white shadow-sm p-4">
                <p className="text-center text-sm text-text-muted">Apunta el código dentro del marco. Productos: {Object.keys(products).length}</p>
              </div>
            )}
          </div>
        )}
      </div>
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
        <div className="rounded-xl border border-border bg-white shadow-sm py-12 text-center">
          <Camera className="h-16 w-16 text-text-muted mx-auto mb-4" aria-hidden="true" />
          <h3 className="font-semibold text-text mb-1">Sin productos guardados</h3>
          <p className="text-text-muted">Agrega items a tus listas o crea uno nuevo</p>
          <Link to="/products/new" className="btn-primary btn-block mt-4" style={{ maxWidth: '300px', margin: '1rem auto 0' }}>+ Crear producto</Link>
        </div>
      ) : (
        <ul className="rounded-xl border border-border bg-white shadow-sm divide-y divide-border scrollbar-thin">
          {productEntries.map(([barcode, p]: [string, ProductMemory]) => (
            <li key={barcode}>
              <Link to={`/products/${barcode}`} className="flex items-center justify-between gap-2 p-4 border-b border-border last:border-0 group">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate text-text">{p.name}</div>
                  <div className="text-sm text-text-muted flex items-center gap-2 flex-wrap">
                    <span className="font-mono">{barcode}</span>
                    <span>·</span>
                    <span>${p.price.toFixed(2)}</span>
                    <span>·</span>
                    <span>{new Date(p.updatedAt).toLocaleString()}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => { if (confirm('¿Eliminar producto?')) deleteProduct(barcode) }} aria-label="Eliminar producto">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </Button>
              </Link>
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
  const audioContextRef = useRef<AudioContext | null>(null)

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

  const playBeep = () => {
    if ('vibrate' in navigator) navigator.vibrate(50)
    const ctx = audioContextRef.current
    if (!ctx) return
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => playBeepInternal(ctx))
    } else {
      playBeepInternal(ctx)
    }
  }

  const playBeepInternal = (ctx: AudioContext) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 800
    gain.gain.value = 0.3
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
    osc.stop(ctx.currentTime + 0.1)
  }

  const startScan = async () => {
    setScanError('')
    setScanning(true)
    try {
      // Create and unlock AudioContext on user gesture (button click)
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new AudioContext()
      await ctx.resume()
      audioContextRef.current = ctx

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
            playBeep()
          }
          stopScan()
        },
        () => {},
      )
    } catch {
      setScanError('No se pudo acceder a la cámara. Ingrese el código manualmente.')
      setScanning(false)
    }
  }

  const stopScan = () => {
    const scanner = scannerRef.current
    if (scanner) {
      scanner.stop().catch(() => {})
      try { scanner.clear() } catch {}
      scannerRef.current = null
    }
    setScanning(false)
  }

  useEffect(() => () => stopScan(), [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text">{isNew ? 'Nuevo producto' : 'Editar producto'}</h2>
        <Button variant="ghost" size="icon" onClick={() => navigate('/products')} aria-label="Cancelar">
          <X className="h-5 w-5" />
        </Button>
      </div>

      <form className="space-y-4" onSubmit={handleSave}>
        <div className="rounded-xl border border-border bg-white shadow-sm">
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product-barcode" className="block text-sm font-medium text-text mb-1.5">Código de barras</Label>
              <div className="flex gap-2">
                <Input id="product-barcode" placeholder="Código" value={code} onChange={(e) => setCode(e.target.value)} disabled={scanning} className="flex-1" />
                <Button type="button" variant={scanning ? 'destructive' : 'outline'} className="btn-lg" onClick={scanning ? stopScan : startScan}>
                  {scanning ? '✕ Cancelar' : <><Camera className="h-5 w-5 mr-1" /> Escanear</>}
                </Button>
              </div>
              {scanError && <p className="text-sm text-destructive">{scanError}</p>}
              {scanning && <div id="product-scanner" className="w-full aspect-video bg-black rounded-lg overflow-hidden" />}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-name" className="block text-sm font-medium text-text mb-1.5">Nombre *</Label>
              <Input id="product-name" placeholder="Nombre del producto" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-price" className="block text-sm font-medium text-text mb-1.5">Precio</Label>
              <Input id="product-price" placeholder="0.00" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="btn-primary btn-block btn-lg flex-1">{isNew ? 'Crear' : 'Guardar'}</Button>
          {!isNew && <Button type="button" variant="destructive" className="btn-block btn-lg" onClick={handleDelete} style={{ maxWidth: '120px' }}>Eliminar</Button>}
          <Button type="button" variant="outline" className="btn-block btn-lg" onClick={() => navigate('/products')} style={{ maxWidth: '120px' }}>Cancelar</Button>
        </div>
      </form>
    </div>
  )
}

function Settings() {
  const products = useStore((s: State) => s.products)
  const importData = useStore((s: State) => s.importData)
  const exportData = useStore((s: State) => s.exportData)
  const [mergeMode, setMergeMode] = useState(true)
  const [pasteJson, setPasteJson] = useState('')

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        let data: unknown
        if (file.name.endsWith('.json')) {
          data = JSON.parse(ev.target?.result as string)
        } else {
          alert('Formato no soportado. Use .json')
          return
        }
        // Handle both old format (products only) and new format (products + lists)
        const importObj = data as { products?: Record<string, ProductMemory>; lists?: StoreList[] }
        if (importObj.products || importObj.lists) {
          importData({ products: importObj.products || {}, lists: importObj.lists || [] }, mergeMode)
        } else if (typeof data === 'object' && data !== null) {
          // Old format: products only
          importData({ products: data as Record<string, ProductMemory>, lists: [] }, mergeMode)
        }
        alert('Importados correctamente')
        setPasteJson('')
        e.target.value = ''
      } catch {
        alert('Error al importar. Verifique el formato del archivo.')
      }
    }
    reader.readAsText(file)
  }

  const handleImportPaste = () => {
    if (!pasteJson.trim()) return
    try {
      const data = JSON.parse(pasteJson)
      const importObj = data as { products?: Record<string, ProductMemory>; lists?: StoreList[] }
      if (importObj.products || importObj.lists) {
        importData({ products: importObj.products || {}, lists: importObj.lists || [] }, mergeMode)
      } else {
        importData({ products: data as Record<string, ProductMemory>, lists: [] }, mergeMode)
      }
      alert('Importados correctamente')
      setPasteJson('')
    } catch {
      alert('Error al importar. Verifique el formato JSON.')
    }
  }

  const handleExport = () => {
    const json = exportData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lista-de-compra-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyJson = () => {
    const json = exportData()
    navigator.clipboard.writeText(json)
    alert('JSON copiado al portapapeles')
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-text">Ajustes</h2>

      <section className="rounded-xl border border-border bg-white shadow-sm">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-medium text-text">Importar / Exportar (JSON)</h3>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <Label htmlFor="import-merge" className="flex items-center gap-2 text-sm">
              <input type="checkbox" id="import-merge" checked={mergeMode} onChange={(e) => setMergeMode(e.target.checked)} className="h-4 w-4 text-primary rounded border-border" /> Fusionar (no reemplazar)
            </Label>
          </div>
          <div className="space-y-3">
            <Label htmlFor="import-file" className="block text-sm font-medium text-text mb-1.5">Archivo JSON</Label>
            <Input type="file" id="import-file" accept=".json" onChange={handleImportFile} />
            <Button variant="outline" className="btn-block" onClick={handleImportPaste} disabled={!pasteJson.trim()}>Importar desde texto pegado</Button>
          </div>
          <div>
            <Label htmlFor="paste-json" className="block text-sm font-medium text-text mb-1.5">O pegar JSON directamente</Label>
            <Textarea id="paste-json" rows={4} placeholder="Pegue aquí el JSON exportado..." value={pasteJson} onChange={(e) => setPasteJson(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="btn-block sm:flex-1" onClick={handleExport}>Descargar JSON</Button>
            <Button variant="outline" className="btn-block sm:flex-1" onClick={handleCopyJson}>Copiar JSON al portapapeles</Button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-white shadow-sm">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-medium text-text">Información</h3>
        </div>
        <div className="p-4 space-y-2">
          <p className="text-sm text-text-muted">Productos guardados: <span className="font-medium text-text">{Object.keys(products).length}</span></p>
          <p className="text-sm text-text-muted">Listas guardadas: <span className="font-medium text-text">{useStore.getState().lists.length}</span></p>
        </div>
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
  const dropdownRef = useRef<HTMLUListElement>(null)
  const filtered = options.filter((o) => o.toLowerCase().includes(value.toLowerCase()))

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node) &&
          dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onTouchStart = (e: TouchEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node) &&
          dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('touchstart', onTouchStart, { passive: true })
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('touchstart', onTouchStart)
    }
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

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
  }

  return (
    <div className={cn('relative', className)}>
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setHighlighted(0) }}
        onKeyDown={handleKeyDown}
        onFocus={() => { setOpen(true); setHighlighted(0) }}
        autoComplete="off"
      />
      {open && filtered.length && (
        <ul
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 rounded-lg border border-border bg-white shadow-lg max-h-60 overflow-auto scrollbar-thin"
          onPointerDown={handlePointerDown}
        >
          {filtered.map((opt, i) => (
            <li
              key={opt}
              className={cn('px-4 py-3 cursor-pointer', i === highlighted ? 'bg-primary-light' : 'hover:bg-gray-50')}
              onMouseDown={(e) => { e.preventDefault(); onChange(opt); onSelect?.(opt); setOpen(false) }}
              onTouchEnd={(e) => { e.preventDefault(); onChange(opt); onSelect?.(opt); setOpen(false) }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm py-12 text-center">
      <p className="text-text-muted">{text}</p>
    </div>
  )
}

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`