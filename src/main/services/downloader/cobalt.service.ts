import { Logger } from '../../utils/logger'

export type CobaltRequest = {
  url: string
}

export class CobaltService {
  private readonly logger = new Logger('CobaltService')

  async fetch(request: CobaltRequest): Promise<void> {
    this.logger.info('cobalt fetch requested', { url: request.url })
    // TODO: integrate cobalt API.
  }
}
