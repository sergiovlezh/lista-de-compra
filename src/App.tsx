import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, useLocation, Outlet } from 'react-router-dom'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { listTotal, useStore, type State } from './store'
import type { ProductMemory, Item, StoreList } from './types'

const input = 'w-full rounded border border-gray-300 px-2 py-1.5 text-sm'
const btn = 'rounded px-3 py-1.5 text-sm font-medium'
const primary = `${btn} bg-gray-900 text-white`
const ghost = `${btn} border border-gray-300`
const danger = `${btn} bg-red-600 text-white`

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
    <main className="mx-auto max-w-xl min-h-screen p-4">
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
  const [store, setStore] = useState('')
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)

  if (!lists.length)
    return (
      <div>
        <Empty text="Sin listas todavía. Crea la primera abajo." />
        <NewList store={store} setStore={setStore} date={date} setDate={setDate} createList={createList} />
      </div>
    )

  return (
    <div className="space-y-3">
      {lists.map((l) => (
        <Link key={l.id} to={`/lists/${l.id}`} className="w-full rounded border p-3 text-left block">
          <div className="font-medium">{l.store || 'Sin tienda'}</div>
          <div className="text-sm text-gray-500">
            {l.date} · {l.items.filter((i) => i.checked).length}/{l.items.length}{' '}
            · ${listTotal(l).toFixed(2)}
          </div>
        </Link>
      ))}
      <NewList store={store} setStore={setStore} date={date} setDate={setDate} createList={createList} />
    </div>
  )
}

function NewList({
  store,
  setStore,
  date,
  setDate,
  createList,
}: {
  store: string
  setStore: (v: string) => void
  date: string
  setDate: (v: string) => void
  createList: (store: string, date: string) => void
}) {
  const navigate = useNavigate()
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        const id = createList(store.trim() || 'Sin tienda', date)
        setStore('')
        navigate(`/lists/${id}`)
      }}
    >
      <input className={input} placeholder="Tienda" value={store} onChange={(e) => setStore(e.target.value)} />
      <input className={input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <button className={primary} type="submit">+</button>
    </form>
  )
}

function Detail() {
  const { listId } = useParams<{ listId: string }>()
  const navigate = useNavigate()
  const list = useStore((s: State) => s.lists.find((l) => l.id === listId))
  const updateList = useStore((s: State) => s.updateList)
  const deleteList = useStore((s: State) => s.deleteList)
  const addItem = useStore((s: State) => s.addItem)
  const toggleItem = useStore((s: State) => s.toggleItem)
  const removeItem = useStore((s: State) => s.removeItem)
  const products = useStore((s: State) => s.products)
  const [barcode, setBarcode] = useState('')
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [qty, setQty] = useState(1)
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

  const updateItemQty = (itemId: string, delta: number) => {
    const item = list.items.find((i) => i.id === itemId)
    if (!item) return
    const newQty = item.qty + delta
    if (newQty < 1) {
      removeItem(listId!, itemId)
    } else {
      addItem(listId!, { ...item, qty: newQty })
      removeItem(listId!, itemId)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input className={input} value={list.store} onChange={(e) => updateList(listId!, { store: e.target.value })} placeholder="Tienda" />
        <input className={input} type="date" value={list.date} onChange={(e) => updateList(listId!, { date: e.target.value })} />
      </div>

      {list.items.length === 0 && <Empty text="Lista vacía. Agrega abajo o escanea." />}
      <ul className="divide-y rounded border">
        {list.items.map((i: Item) => (
          <li key={i.id} className="flex items-center gap-2 p-2">
            <input type="checkbox" className="h-5 w-5" checked={i.checked} onChange={() => toggleItem(listId!, i.id)} />
            <div className="flex-1 min-w-0">
              <div className={i.checked ? 'line-through text-gray-400' : ''}>{i.name}</div>
              <div className="text-xs text-gray-500">{i.barcode} · ${i.price.toFixed(2)}</div>
            </div>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 rounded border text-sm" onClick={() => updateItemQty(i.id, -1)}>−</button>
              <span className="w-10 text-center">{i.qty}</span>
              <button className="w-8 h-8 rounded border text-sm" onClick={() => updateItemQty(i.id, 1)}>+</button>
            </div>
            <button className="text-sm text-red-600" onClick={() => { if (confirm(`¿Quitar "${i.name}"?`)) removeItem(listId!, i.id) }}>✕</button>
          </li>
        ))}
      </ul>

      <div className="text-right font-semibold">Total: ${listTotal(list).toFixed(2)}</div>

      <form className="flex gap-2 flex-wrap" onSubmit={submit}>
        <input className={input} placeholder="Código" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
        <Autocomplete value={name} onChange={setName} options={productNames} placeholder="Nombre" onSelect={onNameSelect} />
        <input className={input} placeholder="$" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        <input className={input} type="number" min="1" max="99" value={qty} onChange={(e) => setQty(parseInt(e.target.value) || 1)} style={{ width: '70px' }} />
        <button className={primary} type="submit">+</button>
      </form>

      <button className={`${primary} w-full py-2`} onClick={() => navigate(`/lists/${listId}/scanner`)}>📷 Escanear</button>

      <textarea className={input} rows={2} placeholder="Notas" value={list.note} onChange={(e) => updateList(listId!, { note: e.target.value })} />
      <button className="text-sm text-red-600" onClick={() => { if (confirm('¿Eliminar esta lista?')) { deleteList(listId!); navigate('/') } }}>Eliminar lista</button>
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

  if (miss)
    return (
      <form className="space-y-2" onSubmit={(e) => {
        e.preventDefault()
        addItem(listId, { barcode: miss.barcode, name: missName.trim() || miss.barcode, price: parseFloat(missPrice) || 0, qty: 1 })
        navigate(`/lists/${listId}`)
      }}>
        <p className="text-sm">Código nuevo: {miss.barcode}</p>
        <input className={input} placeholder="Nombre" value={missName} onChange={(e) => setMissName(e.target.value)} autoFocus />
        <input className={input} placeholder="Precio" inputMode="decimal" value={missPrice} onChange={(e) => setMissPrice(e.target.value)} />
        <button className={`${primary} w-full py-2`} type="submit">Guardar y agregar</button>
      </form>
    )

  return (
    <div className="space-y-2">
      <div id="reader" className="overflow-hidden rounded border" />
      {!started && <button className={`${primary} w-full py-2`} onClick={start}>Iniciar cámara</button>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {started && <p className="text-sm text-gray-500">Apunta al código. Conocidos: {Object.keys(products).length}</p>}
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
        <Empty text="Sin productos guardados. Agregue items a listas o cree uno nuevo." />
      ) : (
        <ul className="divide-y rounded border">
          {productEntries.map(([barcode, p]: [string, ProductMemory]) => (
            <li key={barcode} className="flex items-center gap-2 p-2">
              <Link to={`/products/${barcode}`} className="flex-1 min-w-0">
                <div className="font-medium truncate">{p.name}</div>
                <div className="text-xs text-gray-500">{barcode} · ${p.price.toFixed(2)} · {new Date(p.updatedAt).toLocaleString()}</div>
              </Link>
              <button className={danger} onClick={() => { if (confirm('¿Eliminar producto?')) deleteProduct(barcode) }}>Eliminar</button>
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
        (code) => {
          setCode(code)
          const known = useStore.getState().products[code]
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

      <form className="space-y-3" onSubmit={handleSave}>
        <div>
          <label className="block text-sm mb-1">Código de barras</label>
          <div className="flex gap-2">
            <input className={input} placeholder="Código" value={code} onChange={(e) => setCode(e.target.value)} disabled={scanning} />
            <button type="button" className={scanning ? danger : ghost} onClick={scanning ? stopScan : startScan}>
              {scanning ? '✕ Cancelar' : '📷 Escanear'}
            </button>
          </div>
          {scanError && <p className="text-sm text-red-600 mt-1">{scanError}</p>}
          {scanning && <div id="product-scanner" className="mt-2 rounded border overflow-hidden" />}
        </div>

        <div>
          <label className="block text-sm mb-1">Nombre *</label>
          <input className={input} placeholder="Nombre del producto" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </div>

        <div>
          <label className="block text-sm mb-1">Precio</label>
          <input className={input} placeholder="0.00" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>

        <div className="flex gap-2">
          <button className={primary} type="submit">{isNew ? 'Crear' : 'Guardar'}</button>
          {!isNew && <button type="button" className={danger} onClick={handleDelete}>Eliminar</button>}
          <button type="button" className={ghost} onClick={() => navigate('/products')}>Cancelar</button>
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
          <label className="flex items-center gap-2"><input type="radio" name="importMode" checked={importMode === 'products'} onChange={() => setImportMode('products')} /> Productos</label>
          <label className="flex items-center gap-2"><input type="radio" name="importMode" checked={importMode === 'lists'} onChange={() => setImportMode('lists')} /> Listas</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={mergeMode} onChange={(e) => setMergeMode(e.target.checked)} /> Fusionar</label>
        </div>
        <input type="file" accept=".json,.csv" onChange={handleImport} className="text-sm" />
        <div className="flex gap-2 flex-wrap">
          <button className={ghost} onClick={() => handleExport(false)}>Exportar productos (JSON)</button>
          <button className={ghost} onClick={() => handleExport(true)}>Exportar todo (JSON)</button>
          <button className={ghost} onClick={handleExportCSV}>Exportar productos (CSV)</button>
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
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder: string
  onSelect?: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const filtered = options.filter((o) => o.toLowerCase().includes(value.toLowerCase()))

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
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
    <div className="relative" onClick={() => setOpen(true)}>
      <input ref={inputRef} className={input} placeholder={placeholder} value={value} onChange={(e) => { onChange(e.target.value); setOpen(true); setHighlighted(0) }} onKeyDown={handleKeyDown} autoComplete="off" />
      {open && filtered.length && (
        <ul className="absolute z-10 w-full mt-1 rounded border border-gray-300 bg-white shadow-md max-h-48 overflow-auto">
          {filtered.map((opt, i) => (
            <li key={opt} className={`px-2 py-1.5 cursor-pointer ${i === highlighted ? 'bg-gray-100' : ''}`} onClick={() => { onChange(opt); onSelect?.(opt); setOpen(false) }}>{opt}</li>
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