import type { ApplicationService } from '@adonisjs/core/types'

import { BullManager } from '../src/bull_manager.js'
import { RuntimeException } from '@adonisjs/core/exceptions'
import { configProvider } from '@adonisjs/core'

/**
 * Extending AdonisJS types
 */
declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    bull_queue: BullManager
  }
}

export default class QueueProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Register bindings to the container
   */
  register() {
    this.app.container.singleton('bull_queue', async (resolver) => {
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

  async shutdown() {
    const bullQueue = await this.app.container.make('bull_queue')

    bullQueue.list().forEach(async (queue) => {
      await queue.close()
    })
  }
}
