import { useState, useCallback, useMemo } from 'react'
import TagChip from './TagChip'
import TagSuggestionPanel from './TagSuggestionPanel'
import type { VideoTag, TaxonomyData } from '../../../preload/api'
import type { TagSuggestionResult } from '../../../shared/types/smart-tagging.types'

type VideoTagManagerProps = {
  videoId: string
  videoTitle?: string
  videoDescription?: string
  tags: VideoTag[]
  taxonomy: TaxonomyData | null
  suggestions: TagSuggestionResult | null
  isIndexed: boolean
  isIndexing: boolean
  isSuggesting: boolean
  llmAvailable: boolean
  onIndex: () => void
  onSuggest: (useLLM?: boolean) => void
  onAcceptTag: (tagName: string) => void
  onRejectTag: (tagName: string) => void
  onAddTag: (tagName: string, lock?: boolean) => void
  onRemoveTag: (tagName: string, force?: boolean) => void
  onLockTag: (tagName: string) => void
  onUnlockTag: (tagName: string) => void
  onRegenerate: () => void
}

export default function VideoTagManager({
  videoId,
  videoTitle,
  videoDescription,
  tags,
  taxonomy,
  suggestions,
  isIndexed,
  isIndexing,
  isSuggesting,
  llmAvailable,
  onIndex,
  onSuggest,
  onAcceptTag,
  onRejectTag,
  onAddTag,
  onRemoveTag,
  onLockTag,
  onUnlockTag,
  onRegenerate
}: VideoTagManagerProps): JSX.Element {
  const [showAddTag, setShowAddTag] = useState(false)
  const [tagSearch, setTagSearch] = useState('')
  const [useLLM, setUseLLM] = useState(true)

  // Filter taxonomy tags for autocomplete
  const filteredTaxonomyTags = useMemo(() => {
    if (!taxonomy || !tagSearch) return []

    const existingTagNames = new Set(tags.map((t) => t.name.toLowerCase()))
    const allTags: Array<{ name: string; section: string }> = []

    for (const [section, tagNames] of Object.entries(taxonomy.sections)) {
      for (const name of tagNames) {
        if (!existingTagNames.has(name.toLowerCase())) {
          allTags.push({ name, section })
        }
      }
    }

    const search = tagSearch.toLowerCase()
    return allTags
      .filter((t) => t.name.toLowerCase().includes(search))
      .slice(0, 10)
  }, [taxonomy, tagSearch, tags])

  const handleAddTag = useCallback(
    (tagName: string) => {
      onAddTag(tagName)
      setTagSearch('')
      setShowAddTag(false)
    },
    [onAddTag]
  )

  // Group tags by section
  const tagsBySection = tags.reduce(
    (acc, tag) => {
      const section = tag.section || 'Other'
      if (!acc[section]) acc[section] = []
      acc[section].push(tag)
      return acc
    },
    {} as Record<string, VideoTag[]>
  )

  return (
    <div className="space-y-6">
      {/* Index Status */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Video Analysis</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {isIndexed
                ? 'Video has been indexed for smart tagging'
                : 'Index this video to enable smart tag suggestions'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isIndexed ? (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                Indexed
              </span>
            ) : (
              <button
                type="button"
                onClick={onIndex}
                disabled={isIndexing}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {isIndexing ? 'Indexing...' : 'Index Video'}
              </button>
            )}
          </div>
        </div>

        {/* Suggest Controls */}
        {isIndexed && (
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={useLLM}
                  onChange={(e) => setUseLLM(e.target.checked)}
                  disabled={!llmAvailable}
                  className="rounded border-slate-300"
                />
                Use LLM refinement
                {!llmAvailable && (
                  <span className="text-amber-600">(LM Studio not running)</span>
                )}
              </label>
            </div>
            <button
              type="button"
              onClick={() => onSuggest(useLLM && llmAvailable)}
              disabled={isSuggesting}
              className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-purple-700 disabled:opacity-50"
            >
              {isSuggesting ? 'Analyzing...' : 'Get Suggestions'}
            </button>
          </div>
        )}
      </div>

      {/* Current Tags */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">
            Current Tags
            {tags.length > 0 && (
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500">
                {tags.length}
              </span>
            )}
          </h3>
          <button
            type="button"
            onClick={() => setShowAddTag(!showAddTag)}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
          >
            {showAddTag ? 'Cancel' : '+ Add Tag'}
          </button>
        </div>

        {/* Add Tag Input */}
        {showAddTag && (
          <div className="mt-4 space-y-2">
            <input
              type="text"
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && tagSearch.trim()) {
                  handleAddTag(tagSearch.trim())
                }
              }}
              placeholder="Search or create custom tag..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              autoFocus
            />
            {tagSearch && (
              <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                {/* Custom tag option at the top */}
                {tagSearch.trim() && !filteredTaxonomyTags.some((t) => t.name.toLowerCase() === tagSearch.trim().toLowerCase()) && (
                  <button
                    type="button"
                    onClick={() => handleAddTag(tagSearch.trim())}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-purple-50 border-b border-slate-100 bg-purple-50/50"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-purple-600 font-medium">Create:</span>
                      <span>{tagSearch.trim().toLowerCase().replace(/\s+/g, '-')}</span>
                    </span>
                    <span className="text-xs text-purple-500">Custom</span>
                  </button>
                )}
                {filteredTaxonomyTags.map((tag) => (
                  <button
                    key={tag.name}
                    type="button"
                    onClick={() => handleAddTag(tag.name)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    <span>{tag.name}</span>
                    <span className="text-xs text-slate-400">{tag.section}</span>
                  </button>
                ))}
                {filteredTaxonomyTags.length === 0 && !tagSearch.trim() && (
                  <p className="px-3 py-2 text-sm text-slate-400">
                    No matching tags in taxonomy
                  </p>
                )}
              </div>
            )}
            <p className="text-xs text-slate-500">
              Press Enter to add custom tags. Custom tags will be added to the learning system.
            </p>
          </div>
        )}

        {/* Tags by Section */}
        {tags.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">
            No tags yet. {isIndexed ? 'Get suggestions or add tags manually.' : 'Index the video first.'}
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {Object.entries(tagsBySection).map(([section, sectionTags]) => (
              <div key={section}>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                  {section}
                </p>
                <div className="flex flex-wrap gap-2">
                  {sectionTags.map((tag) => (
                    <TagChip
                      key={tag.name}
                      name={tag.name}
                      section={tag.section}
                      confidence={tag.confidence}
                      isLocked={tag.isLocked}
                      source={tag.source}
                      showConfidence={tag.confidence != null}
                      showLock
                      removable
                      onLock={() => onLockTag(tag.name)}
                      onUnlock={() => onUnlockTag(tag.name)}
                      onRemove={() => {
                        if (tag.isLocked) {
                          if (window.confirm(`"${tag.name}" is locked. Remove anyway?`)) {
                            onRemoveTag(tag.name, true)
                          }
                        } else {
                          onRemoveTag(tag.name, false)
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Suggestions Panel */}
      {suggestions && (
        <TagSuggestionPanel
          result={suggestions}
          isLoading={isSuggesting}
          onAccept={onAcceptTag}
          onReject={onRejectTag}
          onRegenerate={onRegenerate}
        />
      )}
    </div>
  )
}
