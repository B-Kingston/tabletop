import { useState, useRef, useCallback } from 'react'
import { Film, Search, Plus, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useAddMedia } from '@/hooks/useMedia'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/Dialog'
import type { OMDBSearchResponse, OMDBSearchResult } from '@/types/models'

interface MediaSearchModalProps {
  open: boolean
  onClose: () => void
  instanceId: string
}

export function MediaSearchModal({ open, onClose, instanceId }: MediaSearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<OMDBSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null) as React.MutableRefObject<ReturnType<typeof setTimeout> | null>
  const addMedia = useAddMedia(instanceId)

  const searchOMDB = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      return
    }
    setSearching(true)
    try {
      const { data } = await api.get<{ data: OMDBSearchResponse }>(
        `/instances/${instanceId}/omdb/search?q=${encodeURIComponent(q)}`
      )
      setResults(data.data.results || [])
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [instanceId])

  function handleInputChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchOMDB(value), 2000)
  }

  function handleAdd(result: OMDBSearchResult) {
    addMedia.mutate(
      {
        omdbId: result.omdbId,
        type: result.type,
        title: result.title,
        overview: '',
        releaseYear: result.releaseYear,
      },
      {
        onSuccess: () => {
          setAddedIds((prev) => new Set(prev).add(result.omdbId))
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
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
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
            <Loader2 className="h-6 w-6 animate-spin text-muted" />
          </div>
        )}

        {!searching && results.length === 0 && query && (
          <p className="text-center text-sm text-muted py-8">Nothing found on the shelf</p>
        )}

        <div className="max-h-96 space-y-2 overflow-y-auto">
          {results.map((result) => {
            const isAdded = addedIds.has(result.omdbId)

            return (
              <div
                key={result.omdbId}
                className="flex items-center gap-3 rounded-2xl p-3 hover:bg-surface-secondary/50 transition-colors"
              >
                <div className="h-16 w-11 flex-shrink-0 overflow-hidden rounded bg-surface-secondary">
                  <div className="flex h-full items-center justify-center text-muted">
                    <Film className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">
                    {result.title}
                    {result.releaseYear && <span className="text-muted ml-1">({result.releaseYear})</span>}
                  </p>
                  <p className="text-xs text-text-secondary capitalize">{result.type}</p>
                </div>
                <Button
                  size="sm"
                  variant={isAdded ? 'secondary' : 'default'}
                  onClick={() => handleAdd(result)}
                  disabled={isAdded || addMedia.isPending}
                  aria-label={isAdded ? `${result.title} added` : `Add ${result.title}`}
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
