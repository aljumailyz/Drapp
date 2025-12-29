import { readFile, watch } from 'node:fs/promises'
import { FSWatcher } from 'node:fs'
import type { TaxonomyConfig, TaxonomyTag, TaxonomySection } from '../../../shared/types/smart-tagging.types'

export class TaxonomyService {
  private config: TaxonomyConfig | null = null
  private taxonomyPath: string
  private fileWatcher: FSWatcher | null = null

  constructor(taxonomyPath: string) {
    this.taxonomyPath = taxonomyPath
  }

  async load(): Promise<TaxonomyConfig> {
    const content = await readFile(this.taxonomyPath, 'utf-8')
    this.config = this.parse(content)
    return this.config
  }

  parse(content: string): TaxonomyConfig {
    const lines = content.split('\n')

    let defaultMinConf = 0.65
    let lowConfidencePolicy: 'omit' | 'suggest' | 'ask' = 'suggest'
    const sections = new Map<string, TaxonomySection>()
    const allTags = new Map<string, TaxonomyTag>()

    let currentSectionName = 'Uncategorized'
    let currentSectionMinConf = defaultMinConf

    for (const rawLine of lines) {
      const line = rawLine.trim()

      // Skip empty lines and comments
      if (!line || line.startsWith('#')) continue

      // Global directives
      if (line.startsWith('@default_min_conf')) {
        const match = line.match(/@default_min_conf\s*=\s*([\d.]+)/)
        if (match) {
          defaultMinConf = parseFloat(match[1])
          currentSectionMinConf = defaultMinConf
        }
        continue
      }

      if (line.startsWith('@low_confidence_policy')) {
        const match = line.match(/@low_confidence_policy\s*=\s*(\w+)/)
        if (match) {
          const policy = match[1].toLowerCase()
          if (policy === 'omit' || policy === 'suggest' || policy === 'ask') {
            lowConfidencePolicy = policy
          }
        }
        continue
      }

      // Section header
      if (line.startsWith('[') && line.includes(']')) {
        const match = line.match(/\[([^\]]+)\]/)
        if (match) {
          currentSectionName = match[1].trim()
          currentSectionMinConf = defaultMinConf

          if (!sections.has(currentSectionName)) {
            sections.set(currentSectionName, {
              name: currentSectionName,
              minConfidence: currentSectionMinConf,
              tags: []
            })
          }
        }
        continue
      }

      // Section-level min_conf directive
      if (line.startsWith('@min_conf')) {
        const match = line.match(/@min_conf\s*=\s*([\d.]+)/)
        if (match) {
          currentSectionMinConf = parseFloat(match[1])
          const section = sections.get(currentSectionName)
          if (section) {
            section.minConfidence = currentSectionMinConf
          }
        }
        continue
      }

      // Skip other @ directives we don't recognize
      if (line.startsWith('@')) continue

      // Tag definition (possibly with inline override)
      const parts = line.split('|')
      const tagPart = parts[0].trim()

      // Skip if tag part is empty or looks like a header
      if (!tagPart || tagPart.includes('=') || tagPart.includes('[')) continue

      const tagName = this.normalizeTagName(tagPart)

      // Skip invalid tag names
      if (!tagName || tagName.length === 0) continue

      let tagMinConf = currentSectionMinConf

      // Parse inline options (e.g., "tag-name | min_conf=0.80")
      for (let i = 1; i < parts.length; i++) {
        const opt = parts[i].trim()
        const optMatch = opt.match(/min_conf\s*=\s*([\d.]+)/)
        if (optMatch) {
          tagMinConf = parseFloat(optMatch[1])
        }
      }

      const tag: TaxonomyTag = {
        name: tagName,
        section: currentSectionName,
        minConfidence: tagMinConf
      }

      // Ensure section exists
      if (!sections.has(currentSectionName)) {
        sections.set(currentSectionName, {
          name: currentSectionName,
          minConfidence: currentSectionMinConf,
          tags: []
        })
      }

      sections.get(currentSectionName)!.tags.push(tag)
      allTags.set(tagName, tag)
    }

    this.config = { defaultMinConf, lowConfidencePolicy, sections, allTags }
    return this.config
  }

  normalizeTagName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
  }

  getConfig(): TaxonomyConfig {
    if (!this.config) {
      throw new Error('Taxonomy not loaded. Call load() first.')
    }
    return this.config
  }

  isValidTag(tagName: string): boolean {
    if (!this.config) return false
    return this.config.allTags.has(this.normalizeTagName(tagName))
  }

  getTagConfig(tagName: string): TaxonomyTag | undefined {
    if (!this.config) return undefined
    return this.config.allTags.get(this.normalizeTagName(tagName))
  }

  getAllowedTags(): string[] {
    if (!this.config) return []
    return Array.from(this.config.allTags.keys())
  }

  getTagsBySection(): Map<string, string[]> {
    if (!this.config) return new Map()

    const result = new Map<string, string[]>()
    for (const [sectionName, section] of this.config.sections) {
      result.set(sectionName, section.tags.map(t => t.name))
    }
    return result
  }

  getSections(): string[] {
    if (!this.config) return []
    return Array.from(this.config.sections.keys())
  }

  getTagCount(): number {
    return this.config?.allTags.size ?? 0
  }

  getLowConfidencePolicy(): 'omit' | 'suggest' | 'ask' {
    return this.config?.lowConfidencePolicy ?? 'suggest'
  }

  getDefaultMinConf(): number {
    return this.config?.defaultMinConf ?? 0.65
  }

  // Watch for file changes and reload
  async watchForChanges(onChange: () => void): Promise<void> {
    try {
      const watcher = watch(this.taxonomyPath)
      for await (const event of watcher) {
        if (event.eventType === 'change') {
          try {
            await this.load()
            onChange()
          } catch (error) {
            console.error('Failed to reload taxonomy:', error)
          }
        }
      }
    } catch (error) {
      console.error('Failed to watch taxonomy file:', error)
    }
  }

  stopWatching(): void {
    // The async iterator approach handles cleanup automatically
    // but we can track state if needed
  }

  // Serialize to a plain object for IPC
  toJSON(): { sections: Record<string, string[]>; config: { defaultMinConf: number; policy: string } } {
    const sections: Record<string, string[]> = {}
    for (const [name, tags] of this.getTagsBySection()) {
      sections[name] = tags
    }

    return {
      sections,
      config: {
        defaultMinConf: this.getDefaultMinConf(),
        policy: this.getLowConfidencePolicy()
      }
    }
  }
}
