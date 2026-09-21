import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'

const FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.QR_CODE,
]

async function unlockAudio(): Promise<AudioContext> {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext
  const ctx = new AudioContext()
  await ctx.resume().catch(() => {})
  return ctx
}

function beep(ctx: AudioContext) {
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

// ponytail: vibrate always fires, audio needs unlocked context from button click
function playBeep(ctx: AudioContext | null) {
  if ('vibrate' in navigator) navigator.vibrate(50)
  if (!ctx) return
  if (ctx.state === 'suspended') {
    ctx.resume().then(() => beep(ctx)).catch(() => {})
  } else {
    beep(ctx)
  }
}

function stopScanner(ref: { current: Html5Qrcode | null }) {
  const scanner = ref.current
  ref.current = null
  if (scanner) {
    scanner.stop().catch(() => {})
    try {
      scanner.clear()
    } catch {}
  }
}

export function Scanner({
  elementId,
  onScan,
  onStop,
}: {
  elementId: string
  onScan: (code: string) => void
  onStop: () => void
}) {
  const [started, setStarted] = useState(false)
  const [error, setError] = useState('')
  // ponytail: native range + hardware zoom only, hidden when unsupported
  const [zoom, setZoom] = useState<{ min: number; max: number; step: number; value: number } | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scannedRef = useRef('')
  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(
    () => () => {
      stopScanner(scannerRef)
    },
    [],
  )

  const setZoomValue = (v: number) => {
    setZoom((prev) => (prev ? { ...prev, value: v } : prev))
    scannerRef.current?.applyVideoConstraints({ advanced: [{ zoom: v } as MediaTrackConstraintSet] }).catch(() => {})
  }

  const start = async () => {
    setError('')
    setZoom(null)
    try {
      audioContextRef.current = await unlockAudio()
      const qr = new Html5Qrcode(elementId, { formatsToSupport: FORMATS, verbose: false })
      scannerRef.current = qr
      scannedRef.current = ''
      setStarted(true)
      await qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 300, height: 300 } },
        (code) => {
          if (scannedRef.current === code) return
          scannedRef.current = code
          playBeep(audioContextRef.current)
          stopScanner(scannerRef)
          setStarted(false)
          setZoom(null)
          onScan(code)
        },
        () => {},
      )
      try {
        const caps = qr.getRunningTrackCapabilities()
        const z = (caps as unknown as { zoom?: { min?: number; max?: number; step?: number } }).zoom
        if (z && typeof z.min === 'number' && typeof z.max === 'number' && z.max > 1) {
          const settings = qr.getRunningTrackSettings() as MediaTrackSettings & { zoom?: number }
          setZoom({ min: z.min, max: z.max, step: z.step ?? 0.1, value: typeof settings.zoom === 'number' ? settings.zoom : z.min })
        }
      } catch {
        setZoom(null)
      }
    } catch {
      scannerRef.current = null
      setZoom(null)
      setError('Sin cámara. Revisa permisos o usa entrada manual.')
      setStarted(false)
    }
  }

  const stop = () => {
    stopScanner(scannerRef)
    setStarted(false)
    setZoom(null)
    onStop()
  }

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div
        className="w-full aspect-video bg-black relative overflow-hidden rounded-xl border border-border"
        style={{ minHeight: '300px', maxHeight: '50vh' }}
      >
        <div id={elementId} className="absolute inset-0" />
        {started && (
          <div className="scanner-cutout">
            <div className="scanner-line" />
          </div>
        )}
        {!started && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black/60 rounded-xl">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-white mb-2">Escanear código de barras</h2>
              <p className="text-white/70 mb-6">Apunta la cámara al código de barras del producto</p>
            </div>
            <button className="btn-primary btn-block btn-lg w-full max-w-xs" onClick={() => void start()}>
              Iniciar escáner
            </button>
            {error && <p className="text-sm text-red-400 mt-4">{error}</p>}
          </div>
        )}
        {started && zoom && (
          <div className="absolute bottom-0 inset-x-0 px-4 py-2 bg-black/60">
            <label htmlFor={`${elementId}-zoom`} className="block text-xs text-white/80 mb-1">
              Zoom {zoom.value.toFixed(1)}x
            </label>
            <input
              id={`${elementId}-zoom`}
              type="range"
              min={zoom.min}
              max={zoom.max}
              step={zoom.step}
              value={zoom.value}
              onChange={(e) => setZoomValue(parseFloat(e.target.value))}
              className="w-full touch-manipulation"
            />
          </div>
        )}
      </div>
      {started && (
        <div className="flex justify-center">
          <button className="btn-destructive btn-lg" onClick={stop} style={{ minWidth: '160px' }}>
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}
