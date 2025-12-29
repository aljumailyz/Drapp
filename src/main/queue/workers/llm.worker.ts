import { Logger } from '../../utils/logger'

export class LlmWorker {
  private readonly logger = new Logger('LlmWorker')

  async run(): Promise<void> {
    this.logger.info('llm worker tick')
    // TODO: pull LLM jobs and execute.
  }
}
