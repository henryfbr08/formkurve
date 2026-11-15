import { useEffect, useRef, useState } from 'react'
import type { Food } from '../data/nutrition'
import { lookupBarcode } from '../lib/off'

interface Props {
  onClose: () => void
  /** Produkt gefunden → zurück an Essen-Ansicht */
  onFound: (food: Food) => void
}

type Status = 'starting' | 'scanning' | 'loading' | 'notfound' | 'error'

export default function Scanner({ onClose, onFound }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<Status>('starting')
  const [manual, setManual] = useState('')
  const [lastCode, setLastCode] = useState('')
  const busy = useRef(false)

  async function handleCode(code: string) {
    if (busy.current) return
    busy.current = true
    setLastCode(code)
    setStatus('loading')
    try {
      const food = await lookupBarcode(code)
      if (food) {
        onFound(food)
        return
      }
      setStatus('notfound')
    } catch {
      setStatus('error')
    }
    // nach 2 s weiterscannen
    setTimeout(() => {
      busy.current = false
      setStatus('scanning')
    }, 2000)
  }

  useEffect(() => {
    let stream: MediaStream | null = null
    let timer: number | undefined
    let cancelled = false

    async function start() {
      try {
        // Scanner-Bibliothek erst bei Bedarf laden
        const { BarcodeDetector } = await import('barcode-detector/ponyfill')
        const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] })
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 } },
          audio: false,
        })
        if (cancelled) return
        const video = videoRef.current!
        video.srcObject = stream
        await video.play()
        setStatus('scanning')
        const tick = async () => {
          if (cancelled) return
          if (!busy.current && video.readyState >= 2) {
            try {
              const codes = await detector.detect(video)
              if (codes[0]?.rawValue) handleCode(codes[0].rawValue)
            } catch {
              /* einzelner Frame fehlgeschlagen */
            }
          }
          timer = window.setTimeout(tick, 250)
        }
        tick()
      } catch {
        if (!cancelled) setStatus('error')
      }
    }
    start()

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      stream?.getTracks().forEach((t) => t.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="overlay">
      <div className="scanner">
        <div className="scanner-head">
          <h2>Barcode scannen</h2>
          <button className="ghost small" onClick={onClose}>
            Schließen
          </button>
        </div>
        <div className="video-wrap">
          <video ref={videoRef} playsInline muted />
          <div className="scan-line" />
        </div>
        <p className="hint">
          {status === 'starting' && 'Kamera wird gestartet …'}
          {status === 'scanning' && 'Barcode in den Rahmen halten.'}
          {status === 'loading' && `Suche Produkt ${lastCode} …`}
          {status === 'notfound' && `Produkt ${lastCode} nicht gefunden – bitte als eigenen Eintrag erfassen.`}
          {status === 'error' && 'Kamera nicht verfügbar. Zugriff erlauben oder Nummer unten eintippen.'}
        </p>
        <div className="row">
          <input inputMode="numeric" placeholder="Barcode-Nummer eintippen" value={manual} onChange={(e) => setManual(e.target.value)} />
          <button className="primary" onClick={() => manual && handleCode(manual.trim())}>
            Suchen
          </button>
        </div>
        <p className="hint small">Daten: Open Food Facts (offene Datenbank). Werte bitte kurz prüfen.</p>
      </div>
    </div>
  )
}
