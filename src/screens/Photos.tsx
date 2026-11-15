import { useEffect, useRef, useState } from 'react'
import { formatShort, todayKey } from '../lib/dates'
import { uid } from '../lib/store'

interface Photo {
  id: string
  date: string
  dataUrl: string
}

/* Fotos liegen in der IndexedDB des Geräts (zu groß für den normalen Speicher) */
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('formkurve-photos', 1)
    req.onupgradeneeded = () => req.result.createObjectStore('photos', { keyPath: 'id' })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction('photos', mode).objectStore('photos'))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** Bild verkleinern, damit der Speicher nicht vollläuft */
async function shrink(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.82)
}

export default function Photos() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [view, setView] = useState<Photo | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function reload() {
    try {
      const all = await tx<Photo[]>('readonly', (s) => s.getAll())
      setPhotos(all.sort((a, b) => (a.date < b.date ? -1 : 1)))
    } catch {
      setError('Fotos können auf diesem Gerät nicht gespeichert werden.')
    }
  }

  useEffect(() => {
    reload()
  }, [])

  async function add(file: File) {
    try {
      const dataUrl = await shrink(file)
      await tx('readwrite', (s) => s.put({ id: uid(), date: todayKey(), dataUrl }))
      reload()
    } catch {
      setError('Das Foto konnte nicht gespeichert werden.')
    }
  }

  async function remove(id: string) {
    await tx('readwrite', (s) => s.delete(id))
    setView(null)
    reload()
  }

  const first = photos[0]
  const last = photos[photos.length - 1]

  return (
    <section className="card">
      <div className="meal-head">
        <h2>Fortschrittsfotos</h2>
        <button className="ghost small" onClick={() => fileRef.current?.click()}>
          + Foto
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) add(f)
          e.target.value = ''
        }}
      />
      {error && <p className="hint">{error}</p>}
      {photos.length === 0 && (
        <p className="muted small">
          Mach alle 4 Wochen ein Foto: gleiches Licht, gleiche Pose, gleiche Uhrzeit. Die Fotos bleiben nur auf diesem Gerät und sind nicht im
          Backup enthalten.
        </p>
      )}
      {photos.length >= 2 && (
        <div className="compare">
          <figure onClick={() => setView(first)}>
            <img src={first.dataUrl} alt="Erstes Foto" />
            <figcaption>Start · {formatShort(first.date)}</figcaption>
          </figure>
          <figure onClick={() => setView(last)}>
            <img src={last.dataUrl} alt="Aktuelles Foto" />
            <figcaption>Aktuell · {formatShort(last.date)}</figcaption>
          </figure>
        </div>
      )}
      {photos.length > 0 && (
        <div className="photo-grid">
          {photos.map((p) => (
            <figure key={p.id} onClick={() => setView(p)}>
              <img src={p.dataUrl} alt={`Foto vom ${formatShort(p.date)}`} />
              <figcaption>{formatShort(p.date)}</figcaption>
            </figure>
          ))}
        </div>
      )}
      {view && (
        <div className="overlay" onClick={() => setView(null)}>
          <div className="scanner" onClick={(e) => e.stopPropagation()}>
            <div className="scanner-head">
              <h2>{formatShort(view.date)}</h2>
              <button className="ghost small" onClick={() => setView(null)}>
                Schließen
              </button>
            </div>
            <img src={view.dataUrl} alt="" style={{ width: '100%', borderRadius: 12, display: 'block' }} />
            <button className="ghost wide" onClick={() => remove(view.id)}>
              Foto löschen
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
