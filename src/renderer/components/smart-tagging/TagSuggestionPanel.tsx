import { useState } from 'react'
import TagChip from './TagChip'
import type { TagSuggestionResult, AcceptedTag, SuggestedTag } from '../../../shared/types/smart-tagging.types'

type TagSuggestionPanelProps = {
  result: TagSuggestionResult
  isLoading?: boolean
  onAccept: (tagName: string) => void
  onReject: (tagName: string) => void
  onRegenerate: () => void
}

type TabId = 'accepted' | 'suggested' | 'review' | 'evidence'

export default function TagSuggestionPanel({
  result,
  isLoading = false,
  onAccept,
  onReject,
  onRegenerate
}: TagSuggestionPanelProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabId>('accepted')

  const tabs: Array<{ id: TabId; label: string; count: number }> = [
    { id: 'accepted', label: 'Accepted', count: result.accepted.length },
    { id: 'suggested', label: 'Suggested', count: result.suggestedLowConfidence.length },
    { id: 'review', label: 'Review', count: result.needsReview.length },
    { id: 'evidence', label: 'Evidence', count: result.evidence.similarVideos.length }
  ]

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-slate-900">Tag Suggestions</h3>
          {result.evidence.llmRefined && (
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-700">
              AI Refined
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onRegenerate}
          disabled={isLoading}
          className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
        >
          {isLoading ? 'Generating...' : 'Regenerate'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-100 px-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`
              relative px-3 py-2 text-xs font-medium transition
              ${activeTab === tab.id ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}
            `}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`
                  ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]
                  ${activeTab === tab.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}
                `}
              >
                {tab.count}
              </span>
            )}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-slate-900" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
          </div>
        ) : (
          <>
            {activeTab === 'accepted' && (
              <AcceptedTagsView tags={result.accepted} onReject={onReject} />
            )}
            {activeTab === 'suggested' && (
              <SuggestedTagsView
                tags={result.suggestedLowConfidence}
                onAccept={onAccept}
                onReject={onReject}
              />
            )}
            {activeTab === 'review' && (
              <SuggestedTagsView
                tags={result.needsReview}
                onAccept={onAccept}
                onReject={onReject}
              />
            )}
            {activeTab === 'evidence' && <EvidenceView evidence={result.evidence} />}
          </>
        )}
      </div>
    </div>
  )
}

function AcceptedTagsView({
  tags,
  onReject
}: {
  tags: AcceptedTag[]
  onReject: (tagName: string) => void
}): JSX.Element {
  if (tags.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-slate-400">
        No tags automatically accepted. Check suggested tags.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        These tags passed the confidence threshold and will be applied:
      </p>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <div key={tag.tagName} className="group relative">
            <TagChip
              name={tag.tagName}
              section={tag.section}
              confidence={tag.confidence}
              variant="suggestion"
              showConfidence
            />
            <button
              type="button"
              onClick={() => onReject(tag.tagName)}
              className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white group-hover:flex"
              title="Reject this tag"
            >
              x
            </button>
          </div>
        ))}
      </div>
      {tags.some((t) => t.reason) && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-slate-600">AI Reasoning:</p>
          {tags
            .filter((t) => t.reason)
            .map((tag) => (
              <div key={tag.tagName} className="rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                <span className="font-medium">{tag.tagName}:</span> {tag.reason}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

function SuggestedTagsView({
  tags,
  onAccept,
  onReject
}: {
  tags: SuggestedTag[]
  onAccept: (tagName: string) => void
  onReject: (tagName: string) => void
}): JSX.Element {
  if (tags.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-slate-400">
        No additional suggestions in this category.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">Click to accept or reject these suggestions:</p>
      <div className="space-y-2">
        {tags.map((tag) => (
          <div
            key={tag.tagName}
            className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-2"
          >
            <TagChip
              name={tag.tagName}
              section={tag.section}
              confidence={tag.confidence}
              variant="lowConfidence"
              showConfidence
            />
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => onAccept(tag.tagName)}
                className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-200"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => onReject(tag.tagName)}
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function EvidenceView({
  evidence
}: {
  evidence: TagSuggestionResult['evidence']
}): JSX.Element {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Based on {evidence.candidatesGenerated} tag candidates</span>
        {evidence.llmRefined && (
          <span className="text-purple-600">Refined by local LLM</span>
        )}
      </div>

      {evidence.similarVideos.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-400">
          No similar videos found in your library yet. Tag more videos to improve suggestions.
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-600">Similar Videos:</p>
          {evidence.similarVideos.map((video) => (
            <div
              key={video.videoId}
              className="rounded-lg border border-slate-100 bg-slate-50/50 p-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {video.title || 'Untitled'}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {Math.round(video.similarity * 100)}% similar
                  </p>
                </div>
              </div>
              {video.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {video.tags.slice(0, 8).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                  {video.tags.length > 8 && (
                    <span className="text-[10px] text-slate-400">
                      +{video.tags.length - 8} more
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
