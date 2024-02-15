/**
 * @acidiney/bull-queue
 *
 * @license MIT
 * @copyright Romain Lanz <acidineydias@gmail.com>
 */

import { BaseCommand, flags } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'

export default class QueueListener extends BaseCommand {
  static commandName = 'queue:listen'
  static description = 'Listen to one or multiple queues'

  @flags.array({ alias: 'q', description: 'The queue(s) to listen on' })
  queue: string[] = []

  static options: CommandOptions = {
    startApp: true,
    staysAlive: true,
  }

  async run() {
    const Queue = await this.app.container.make('bull_queue')

    const router = await this.app.container.make('router')
    router.commit()

    Queue.processBulk(this.queue)
  }
}
