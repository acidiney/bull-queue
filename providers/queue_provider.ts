import type { ApplicationService } from '@adonisjs/core/types'

import { BullManager } from '../src/bull_manager.js'
import { RuntimeException } from '@adonisjs/core/exceptions'
import { configProvider } from '@adonisjs/core'
import fs from 'node:fs/promises'

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

  async boot() {
    const files = await fs.readdir(this.app.startPath())

    const jobFile = files.find((e) => /^jobs/.test(e))

    if (!jobFile) {
      throw new Error('[@acidiney/bull-queue]> #start/job file missing!')
    }

    const { jobs } = await import(this.app.startPath(jobFile))
    const logger = await this.app.container.make('logger')
    const jobNames = Object.keys(jobs)

    for (const job of jobNames) {
      const { default: jobModule } = await jobs[job]()

      if (!jobModule) {
        throw new Error(`[@acidiney/bull-queue]> ${job} export default missing!`)
      }

      this.app.container.singleton<any>(job, () => new jobModule())

      logger.info(`[@acidiney/bull-queue]> ${job} loaded!`)
    }
  }

  async shutdown() {
    const logger = await this.app.container.make('logger')

    logger.info(`[@acidiney/bull-queue]> Shutting down!`)

    const bullQueue = await this.app.container.make('bull_queue')

    bullQueue.list().forEach(async (queue) => {
      await queue.close()
    })
  }
}
