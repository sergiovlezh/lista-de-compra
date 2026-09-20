import { useEffect } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'

const qrcodeRegionId = 'html5qr-code-full-region'
type ScannerConfig = ConstructorParameters<typeof Html5QrcodeScanner>[1]

type ScannerV2Props = {
  fps?: number
  qrbox?: number | { width: number; height: number }
  aspectRatio?: number
  disableFlip?: boolean
  verbose?: boolean
  qrCodeSuccessCallback: (decodedText: string, decodedResult: unknown) => void
  qrCodeErrorCallback?: (errorMessage: string, error?: unknown) => void
}

const createConfig = ({ fps, qrbox, aspectRatio, disableFlip }: ScannerV2Props): ScannerConfig => {
  const config: ScannerConfig = { fps: fps ?? 10 }
  if (qrbox !== undefined) config.qrbox = qrbox
  if (aspectRatio !== undefined) config.aspectRatio = aspectRatio
  if (disableFlip !== undefined) config.disableFlip = disableFlip
  return config
}

export default function ScannerV2({
  fps,
  qrbox,
  aspectRatio,
  disableFlip,
  verbose,
  qrCodeSuccessCallback,
  qrCodeErrorCallback,
}: ScannerV2Props) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      qrcodeRegionId,
      createConfig({ fps, qrbox, aspectRatio, disableFlip, qrCodeSuccessCallback }),
      verbose ?? false,
    )

    scanner.render(qrCodeSuccessCallback, qrCodeErrorCallback)

    return () => {
      scanner.clear().catch(() => {})
    }
  }, [])

  return <div id={qrcodeRegionId} />
}
