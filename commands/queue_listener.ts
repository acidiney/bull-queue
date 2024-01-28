/**
 * @rlanz/bull-queue
 *
 * @license MIT
 * @copyright Romain Lanz <romain.lanz@pm.me>
 */

import { configProvider } from '@adonisjs/core'
import { BaseCommand, flags } from '@adonisjs/core/ace'

export default class QueueListener extends BaseCommand {
  static commandName = 'queue:listen'
  static description = 'Listen to one or multiple queues'

  @flags.array({ alias: 'q', description: 'The queue(s) to listen on' })
  queue: string[] = []

  static settings = {
    loadApp: true,
    stayAlive: true,
  }

  async run() {
    const Queue = await this.app.container.make('@acidiney/bull-queue')
    const queueConfigProvider = await this.app.config.get('queue')
    const config = await configProvider.resolve<any>(this.app, queueConfigProvider)

    const router = await this.app.container.make('router')
    router.commit()

    if (this.queue.length === 0) this.queue = config.queueNames

    await Promise.all(
      this.queue.map((queue) =>
        Queue.process({
          queueName: queue,
        })
      )
    )
  }
}