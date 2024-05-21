import { Queue, Worker } from 'bullmq'
import type { JobsOptions } from 'bullmq'
import type { Logger } from '@adonisjs/core/logger'
import type { Application } from '@adonisjs/core/app'
import type { DataForJob, JobHandlerContract, JobsList, QueueConfig } from './types.js'
import { ContainerBindings } from '@adonisjs/core/types'

import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js'
import { H3Adapter } from '@bull-board/h3'
import { createApp, createRouter, toNodeListener } from 'h3'
import { createServer } from 'node:http'

export class BullManager {
  private queues: Map<string, Queue> = new Map()

  constructor(
    private options: QueueConfig,
    private logger: Logger,
    private app: Application<ContainerBindings>
  ) {
    this.queues.set(
      this.prefix('default'),
      new Queue(this.prefix('default'), {
        ...this.options.queue,
        connection: this.options.connection,
      })
    )
  }

  prefix(queueName: string): string {
    return this.options.queuePrefix + queueName.replace(this.options.queuePrefix, '')
  }

  dispatch<K extends keyof JobsList | string>(
    job: K,
    payload: DataForJob<K>,
    options: JobsOptions & { queueName?: string } = {}
  ) {
    const queueName = this.prefix(options.queueName || 'default')

    if (!this.queues.has(queueName)) {
      this.queues.set(
        queueName,
        new Queue(queueName, {
          ...this.options.queue,
          connection: this.options.connection,
        })
      )
    }

    return this.queues.get(queueName)!.add(job, payload, {
      ...this.options.jobs,
      ...options,
    })
  }

  process({ queueName: _queueName }: { queueName?: string }) {
    let queueName = this.prefix(_queueName || 'default')

    this.logger.info(`Queue [${queueName}] processing started...`)

    let worker = new Worker(
      queueName,
      async (job) => {
        let jobHandler: JobHandlerContract<any>

        try {
          jobHandler = await this.app.container.make(job.name)
        } catch (e) {
          this.logger.error(`Job handler for ${job.name} not found`)
          return
        }

        // this.logger.info(`Job ${job.name} started`)

        await jobHandler.handle(job)
        // this.logger.info(`Job ${job.name} finished`)
      },
      {
        ...this.options.worker,
        connection: this.options.connection,
      }
    )

    worker.on('failed', async (job, error) => {
      this.logger.error(error.message, [])

      // If removeOnFail is set to true in the job options, job instance may be undefined.
      // This can occur if worker maxStalledCount has been reached and the removeOnFail is set to true.
      if (job && (job.attemptsMade === job.opts.attempts || job.finishedOn)) {
        // Call the failed method of the handler class if there is one
        let jobHandler: JobHandlerContract<any> = await this.app.container.make(job.name)
        if (typeof jobHandler.failed === 'function') await jobHandler.failed(job)
      }
    })

    return this
  }

  async clear<K extends string>(_queueName: K) {
    let queueName = this.prefix(_queueName)

    if (!this.queues.has(queueName)) {
      return this.logger.info(`Queue [${queueName}] doesn't exist`)
    }

    const queue = this.queues.get(queueName || 'default')

    await queue!.obliterate().then(() => {
      return this.logger.info(`Queue [${queueName}] cleared`)
    })
  }

  private resolveQueueNames(queuesNames?: string[]): string[] {
    return queuesNames ?? Array.from(this.queues.keys())
  }

  async clearBulk(queuesNames?: string[]) {
    const queues = this.resolveQueueNames(queuesNames)

    // Add the rest of the clearBulk logic here...

    for (const queueName of queues) {
      await this.clear(queueName)
    }
  }

  async processBulk(queuesNames?: string[]) {
    const queues = this.resolveQueueNames(queuesNames)

    for (const queueName of queues) {
      await this.process({ queueName })
    }
  }

  list() {
    return this.queues
  }

  get<K extends string>(_queueName: K) {
    let queueName = this.prefix(_queueName)

    if (!this.queues.has(queueName)) {
      return this.logger.info(`Queue [${queueName}] doesn't exist`)
    }

    return this.queues.get(queueName)
  }

  async ui(port = 9999, queue: string[]) {
    const serverAdapter = new H3Adapter()
    serverAdapter.setBasePath('/admin')

    const app = createApp()

    const h3Router = createRouter()

    let queues = [...this.list().values()]

    if (queue) {
      queues = queues.filter((q) => queue.includes(q.name))
    }

    createBullBoard({
      queues: queues.map((q) => new BullMQAdapter(q)),
      serverAdapter,
    })

    app.use(h3Router)
    app.use(serverAdapter.registerHandlers())

    await this.processBulk(queue || this.queues.keys())

    createServer(toNodeListener(app)).listen(port)
    this.logger.info(`BullBoard started on port :${port}`)
  }
}
