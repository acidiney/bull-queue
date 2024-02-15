/**
 * @acidiney/bull-queue
 *
 * @license MIT
 * @copyright Romain Lanz <acidineydias@gmail.com>
 */

import { BaseCommand, flags } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'

export default class QueueListener extends BaseCommand {
  static commandName = 'queue:listen:ui'
  static description = 'Listen to one or multiple queues'

  @flags.array({ alias: 'q', description: 'The queue(s) to listen on' })
  queue: string[] = []

  @flags.number({ alias: 'p', description: 'The application port' })
  port: number = 9999

  static options: CommandOptions = {
    startApp: true,
    staysAlive: true,
  }

  async run() {
    const Queue = await this.app.container.make('bull_queue')

    const router = await this.app.container.make('router')
    router.commit()

    await Queue.ui(this.port || 9999, this.queue)
  }
}
