import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { Foto } from '../content/site'

export type MediaItem =
  | { type: 'image'; src: string; alt: string; posicao?: string }
  | { type: 'video'; src: string }

/**
 * Junta as fotos (que vêm do painel) com os vídeos (que ficam no código),
 * intercalando: foto, vídeo, foto, vídeo… e o que sobrar no fim.
 */
export function juntarMidias(fotos: Foto[], videos: string[]): MediaItem[] {
  const items: MediaItem[] = []
  const max = Math.max(fotos.length, videos.length)
  for (let i = 0; i < max; i++) {
    const f = fotos[i]
    if (f) items.push({ type: 'image', src: f.src, alt: f.alt, posicao: f.posicao })
    if (videos[i]) items.push({ type: 'video', src: videos[i] })
  }
  return items
}

function VideoTile({ src, heightClass = 'h-auto' }: { src: string; heightClass?: string }) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.play().catch(() => {}); else el.pause() },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <video
      ref={ref}
      src={src}
      muted
      loop
      playsInline
      className={`w-full ${heightClass} object-cover group-hover:scale-105 transition-transform duration-700`}
    />
  )
}

function Lightbox({ item, onClose }: { item: MediaItem; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.type === 'image' ? item.alt || 'Foto ampliada' : 'Vídeo ampliado'}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-carbon/90 backdrop-blur-md p-4"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-5 right-6 text-sand hover:text-cream transition-colors z-10"
        aria-label="Fechar"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="5" y1="5" x2="19" y2="19" />
          <line x1="19" y1="5" x2="5" y2="19" />
        </svg>
      </button>

      {/* Media — stop propagation so clicking it doesn't close */}
      <div
        className="max-w-4xl w-full max-h-[90vh] flex items-center justify-center"
        onClick={e => e.stopPropagation()}
      >
        {item.type === 'image' ? (
          <img
            src={item.src}
            alt={item.alt}
            className="max-w-full max-h-[90vh] object-contain"
          />
        ) : (
          <video
            src={item.src}
            autoPlay
            controls
            playsInline
            className="max-w-full max-h-[90vh]"
          />
        )}
      </div>
    </div>
  )
}

/** Masonry media grid with click-to-open lightbox. Reveals its own tiles on scroll. */
export function MediaGallery({
  items,
  columns = 'columns-2 lg:columns-3',
  layout = 'masonry',
  grid = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  aspect = 'aspect-[3/4]',
}: {
  items: MediaItem[]
  columns?: string
  /** 'masonry' keeps native ratios; 'grid' makes every tile the same size;
      'responsive' is masonry on phones (< sm) and a uniform grid from sm up. */
  layout?: 'masonry' | 'grid' | 'responsive'
  /** Grid column classes (layout='grid' only). */
  grid?: string
  /** Tile aspect ratio for uniform tiles (layout='grid' only). */
  aspect?: string
}) {
  const [selected, setSelected] = useState<MediaItem | null>(null)

  const containerClass =
    layout === 'grid'
      ? `${grid} gap-3`
      : layout === 'responsive'
      ? 'columns-2 gap-3 [&>*]:mb-3 sm:[&>*]:mb-0 sm:grid sm:grid-cols-2 lg:grid-cols-3'
      : `${columns} gap-3 [&>*]:mb-3`

  const tileClass =
    layout === 'grid'
      ? aspect
      : layout === 'responsive'
      ? 'break-inside-avoid sm:aspect-[3/4]'
      : 'break-inside-avoid'

  const mediaHeight =
    layout === 'grid' ? 'h-full' : layout === 'responsive' ? 'h-auto sm:h-full' : 'h-auto'
  const gridRef = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setSelected(null), [])

  // Tiles can mount after the global App observer ran (e.g. the gallery
  // appears below the fold later) — reveal them with a local observer.
  useEffect(() => {
    const root = gridRef.current
    if (!root || items.length === 0) return
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('visible')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.08 }
    )
    root.querySelectorAll('.fade-up').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [items.length])

  return (
    <>
      <div ref={gridRef} className={containerClass}>
        {items.map((item, i) => (
          <div
            key={i}
            role="button"
            tabIndex={0}
            aria-label={item.type === 'image' ? `Ampliar foto: ${item.alt}` : 'Ampliar vídeo'}
            onClick={() => setSelected(item)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setSelected(item)
              }
            }}
            data-revelar="foto"
            className={`overflow-hidden group cursor-pointer relative focus-visible:outline focus-visible:outline-1 focus-visible:outline-gold ${tileClass}`}
          >
            {item.type === 'image' ? (
              <img
                src={item.src}
                alt={item.alt}
                loading="lazy"
                className={`w-full ${mediaHeight} object-cover group-hover:scale-105 transition-transform duration-700`}
                style={item.posicao ? { objectPosition: item.posicao } : undefined}
              />
            ) : (
              <VideoTile src={item.src} heightClass={mediaHeight} />
            )}

            {/* Play icon hint for videos */}
            {item.type === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-carbon/60 backdrop-blur-sm flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-cream translate-x-0.5">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Portal to <body> so the fixed overlay escapes any transformed
          ancestor (e.g. a .fade-up parent) and covers the full viewport. */}
      {selected && createPortal(<Lightbox item={selected} onClose={close} />, document.body)}
    </>
  )
}
