import { ConfigProvider } from '@adonisjs/core/types'
import { QueueConfig } from './types.js'
import { configProvider } from '@adonisjs/core'

export function defineConfig(config: QueueConfig): ConfigProvider<QueueConfig> {
  return configProvider.create(async () => ({
    connection: config.connection,
    queue: config.queue,
    worker: config.worker,
    jobs: config.jobs,
    queueNames: config.queueNames,
    queuePrefix: config.queuePrefix,
  }))
}
