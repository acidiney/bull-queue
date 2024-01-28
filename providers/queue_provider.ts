import type { ApplicationService } from '@adonisjs/core/types'

import { BullManager } from '../src/queue.js'
import { RuntimeException } from '@adonisjs/core/exceptions'
import { configProvider } from '@adonisjs/core'

/**
 * Extending AdonisJS types
 */
declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    '@acidiney/bull-queue': BullManager
  }
}

export default class TwoFactorAuthProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Register bindings to the container
   */
  register() {
    this.app.container.singleton('@acidiney/bull-queue', async (resolver) => {
      const queueConfigProvider = await this.app.config.get('queue')
      const config = await configProvider.resolve<any>(this.app, queueConfigProvider)

      if (!config) {
        throw new RuntimeException(
          'Invalid config exported from "config/queue.ts" file. Make sure to use the defineConfig method'
        )
      }

      const logger = await resolver.make('logger')
      const app = await resolver.make('app')

      return new BullManager(config, logger, app)
    })
  }
}
