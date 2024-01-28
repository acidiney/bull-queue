import { Queue, Worker } from 'bullmq'
import type { JobsOptions } from 'bullmq'
import type { Logger } from '@adonisjs/core/logger'
import type { Application } from '@adonisjs/core/app'
import type { DataForJob, JobHandlerContract, JobsList, QueueConfig } from './types.js'
import { ContainerBindings } from '@adonisjs/core/types'

export class BullManager {
  private queues: Map<string, Queue> = new Map()

  constructor(
    private options: QueueConfig,
    private logger: Logger,
    private app: Application<ContainerBindings>
  ) {
    this.queues.set(
      'default',
      new Queue('default', {
        ...this.options.queue,
        connection: this.options.connection,
      })
    )
  }

  dispatch<K extends keyof JobsList | string>(
    job: K,
    payload: DataForJob<K>,
    options: JobsOptions & { queueName?: string } = {}
  ) {
    const queueName = options.queueName || 'default'

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

  process({ queueName }: { queueName?: string }) {
    this.logger.info(`Queue [${queueName || 'default'}] processing started...`)

    let worker = new Worker(
      queueName || 'default',
      async (job) => {
        let jobHandler: JobHandlerContract

        try {
          jobHandler = await this.app.container.make(job.name, [job])
        } catch (e) {
          this.logger.error(`Job handler for ${job.name} not found`)
          return
        }

        this.logger.info(`Job ${job.name} started`)

        await jobHandler.handle(job.data)
        this.logger.info(`Job ${job.name} finished`)
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
        let jobHandler: JobHandlerContract = await this.app.container.make(job.name, [job])
        if (typeof jobHandler.failed === 'function') await jobHandler.failed()
      }
    })

    return this
  }

  async clear<K extends string>(queueName: K) {
    if (!this.queues.has(queueName)) {
      return this.logger.info(`Queue [${queueName}] doesn't exist`)
    }

    const queue = this.queues.get(queueName || 'default')

    await queue!.obliterate().then(() => {
      return this.logger.info(`Queue [${queueName}] cleared`)
    })
  }

  list() {
    return this.queues
  }

  get<K extends string>(queueName: K) {
    if (!this.queues.has(queueName)) {
      return this.logger.info(`Queue [${queueName}] doesn't exist`)
    }

    return this.queues.get(queueName)
  }
}
