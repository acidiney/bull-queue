import { configProvider } from '@adonisjs/core'
import { BaseCommand, flags } from '@adonisjs/core/ace'

export default class QueueListener extends BaseCommand {
  static commandName = 'queue:clear'
  static description = 'Clears a queue of Jobs'

  @flags.array({ alias: 'q', description: 'The queue(s) to clear' })
  queue: string[] = []

  static settings = {
    loadApp: true,
    stayAlive: false,
  }

  async run() {
    const Queue = await this.app.container.make('@acidiney/bull-queue')
    const queueConfigProvider = await this.app.config.get('queue')
    const config = await configProvider.resolve<any>(this.app, queueConfigProvider)

    if (this.queue.length === 0) this.queue = config.queueNames

    await Promise.all(
      this.queue.map(async (queue) => {
        await Queue.clear(queue)
      })
    )
  }
}