import app from '@adonisjs/core/services/app'
import { BullManager } from '../src/queue.js'

let queue: BullManager

/**
 * Returns a singleton instance of the Auth manager class
 */
await app.booted(async () => {
  queue = await app.container.make('bull_queue')
})

export { queue }
