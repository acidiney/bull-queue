/**
 * @rlanz/bull-queue
 *
 * @license MIT
 * @copyright Romain Lanz <romain.lanz@pm.me>
 */

import type {
  ConnectionOptions,
  WorkerOptions,
  QueueOptions,
  JobsOptions,
  Job,
  Queue as BullQueue,
} from 'bullmq'

export type DataForJob<K extends string> = K extends keyof JobsList
  ? JobsList[K]
  : Record<string, unknown>

export type DispatchOptions = JobsOptions & {
  queueName?: 'default' | string
}

export type QueueConfig = {
  connection: ConnectionOptions
  queue: QueueOptions | {}
  worker: WorkerOptions | {}
  jobs: JobsOptions
  queueNames: ['default', string]
}

export interface QueueContract {
  dispatch<K extends keyof JobsList>(
    job: K,
    payload: DataForJob<K>,
    options?: DispatchOptions
  ): Promise<Job>
  dispatch<K extends string>(
    job: K,
    payload: DataForJob<K>,
    options?: DispatchOptions
  ): Promise<Job>
  process(): Promise<void>
  clear<K extends string>(queue: K): Promise<void>
  list(): Promise<Map<string, BullQueue>>
  get(): Promise<BullQueue>
}

export interface JobHandlerContract<T> {
  handle(job: Job<T>): Promise<void>
  failed(job: Job<T>): Promise<void>
}

/**
 * An interface to define typed queues/jobs
 */
export interface JobsList {}

export { Job }
