import { useEffect, useRef, useState } from 'react'
import type { Food } from '../data/nutrition'

interface Props {
  onClose: () => void
  /** Produkt gefunden → zurück an Essen-Ansicht */
  onFound: (food: Food) => void
}

type Status = 'starting' | 'scanning' | 'loading' | 'notfound' | 'error'

/** Nährwerte über Open Food Facts (kostenlos, ohne Konto) */
async function lookup(code: string): Promise<Food | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,product_name_de,brands,nutriments,serving_quantity`
  const res = await fetch(url)
  if (!res.ok) return null
  const json = await res.json()
  if (json.status !== 1 || !json.product) return null
  const p = json.product
  const n = p.nutriments ?? {}
  const kcal = n['energy-kcal_100g'] ?? (n['energy_100g'] ? n['energy_100g'] / 4.184 : null)
  if (kcal == null) return null
  const name = [p.brands?.split(',')[0], p.product_name_de || p.product_name].filter(Boolean).join(' – ') || `Produkt ${code}`
  const r1 = (v: unknown) => Math.round((Number(v) || 0) * 10) / 10
  return {
    id: `ean-${code}`,
    name,
    kcal: Math.round(kcal),
    protein: r1(n['proteins_100g']),
    carbs: r1(n['carbohydrates_100g']),
    fat: r1(n['fat_100g']),
    fiber: r1(n['fiber_100g']),
    sugar: r1(n['sugars_100g']),
    salt: Math.round((Number(n['salt_100g']) || 0) * 100) / 100,
    portion: Math.round(Number(p.serving_quantity) || 100),
  }
}

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
      const food = await lookup(code)
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
