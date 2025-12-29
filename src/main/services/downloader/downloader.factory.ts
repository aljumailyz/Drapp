import { CobaltService } from './cobalt.service'
import { YtDlpService } from './ytdlp.service'

export type DownloaderType = 'yt-dlp' | 'cobalt'

export function createDownloader(type: DownloaderType): CobaltService | YtDlpService {
  if (type === 'cobalt') {
    return new CobaltService()
  }

  return new YtDlpService()
}
