import { safeStorage } from 'electron'
import { Logger } from '../../utils/logger'

type KeychainPayload = {
  scheme: 'safeStorage' | 'plain'
  payload: string
}

export class KeychainService {
  private readonly logger = new Logger('KeychainService')

  isEncryptionAvailable(): boolean {
    return safeStorage.isEncryptionAvailable()
  }

  async storeSecret(key: string, value: string): Promise<void> {
    this.logger.info('keychain store requested', { key })
    void value
  }

  encryptToJson(value: string): string {
    if (this.isEncryptionAvailable()) {
      const payload = safeStorage.encryptString(value).toString('base64')
      return JSON.stringify({ scheme: 'safeStorage', payload } satisfies KeychainPayload)
    }

    this.logger.warn('safeStorage unavailable; storing secrets in plain text')
    return JSON.stringify({ scheme: 'plain', payload: value } satisfies KeychainPayload)
  }

  decryptFromJson(payload: string): string | null {
    try {
      const parsed = JSON.parse(payload) as KeychainPayload
      if (parsed.scheme === 'safeStorage') {
        const buffer = Buffer.from(parsed.payload, 'base64')
        return safeStorage.decryptString(buffer)
      }
      return parsed.payload
    } catch (error) {
      this.logger.warn('unable to decrypt payload', { error })
      return null
    }
  }
}
