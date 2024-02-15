/**
 * @acidiney/bull-queue
 *
 * @license MIT
 * @copyright Romain Lanz <acidineydias@gmail.com>
 */

import { BaseCommand, flags } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'

export default class QueueListener extends BaseCommand {
  static commandName = 'queue:clear'
  static description = 'Clears a queue of Jobs'

  @flags.array({ alias: 'q', description: 'The queue(s) to clear' })
  queue: string[] = []

  static options: CommandOptions = {
    startApp: true,
    staysAlive: false,
  }

  async run() {
    const Queue = await this.app.container.make('bull_queue')

    await Queue.clearBulk(this.queue)
  }
}
