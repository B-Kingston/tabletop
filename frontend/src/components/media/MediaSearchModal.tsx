import { useState, useRef, useCallback } from 'react'
import { Search, Plus, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useAddMedia } from '@/hooks/useMedia'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/Dialog'
import type { TMDBSearchResult } from '@/types/models'

interface MediaSearchModalProps {
  open: boolean
  onClose: () => void
  instanceId: string
}

export function MediaSearchModal({ open, onClose, instanceId }: MediaSearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TMDBSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null) as React.MutableRefObject<ReturnType<typeof setTimeout> | null>
  const addMedia = useAddMedia(instanceId)

  const searchTMDB = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      return
    }
    setSearching(true)
    try {
      const { data } = await api.get<{ results: TMDBSearchResult[] }>(
        `/instances/${instanceId}/media/tmdb/search?q=${encodeURIComponent(q)}`
      )
      setResults(data.results || [])
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [instanceId])

  function handleInputChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchTMDB(value), 400)
  }

  function handleAdd(result: TMDBSearchResult) {
    const mediaType = result.media_type === 'tv' ? 'tv' : 'movie'
    const title = result.title || result.name || 'Untitled'
    const releaseDate = result.release_date || result.first_air_date

    addMedia.mutate(
      {
        tmdbId: result.id,
        type: mediaType,
        title,
        overview: result.overview,
        posterPath: result.poster_path || '',
        releaseDate,
      },
      {
        onSuccess: () => {
          setAddedIds((prev) => new Set(prev).add(result.id))
        },
      }
    )
  }

  return (
    <Dialog open={open} onClose={onClose} className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Add Media</DialogTitle>
      </DialogHeader>
      <DialogBody>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Search movies and TV shows..."
            className="pl-10"
            autoFocus
          />
        </div>

        {searching && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
          </div>
        )}

        {!searching && results.length === 0 && query && (
          <p className="text-center text-sm text-neutral-500 py-8">No results found.</p>
        )}

        <div className="max-h-96 space-y-2 overflow-y-auto">
          {results.map((result) => {
            const title = result.title || result.name || 'Untitled'
            const year = (result.release_date || result.first_air_date || '').slice(0, 4)
            const isAdded = addedIds.has(result.id)
            const posterUrl = result.poster_path
              ? `https://image.tmdb.org/t/p/w92${result.poster_path}`
              : null

            return (
              <div
                key={result.id}
                className="flex items-center gap-3 rounded-lg p-3 hover:bg-neutral-50 transition-colors"
              >
                <div className="h-16 w-11 flex-shrink-0 overflow-hidden rounded bg-neutral-100">
                  {posterUrl ? (
                    <img src={posterUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-neutral-300">
                      <Film className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {title}
                    {year && <span className="text-neutral-400 ml-1">({year})</span>}
                  </p>
                  <p className="text-xs text-neutral-500 line-clamp-1">{result.overview}</p>
                </div>
                <Button
                  size="sm"
                  variant={isAdded ? 'secondary' : 'default'}
                  onClick={() => handleAdd(result)}
                  disabled={isAdded || addMedia.isPending}
                >
                  {isAdded ? 'Added' : <Plus className="h-4 w-4" />}
                </Button>
              </div>
            )
          })}
        </div>
      </DialogBody>
    </Dialog>
  )
}

function Film({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
    </svg>
  )
}
