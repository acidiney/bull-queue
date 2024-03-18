# @acidiney/bull-queue

`@acidiney/bull-queue` is a powerful queue system designed specifically for AdonisJS applications, leveraging the reliability and scalability of BullMQ, a Redis-based queue for Node.js. Derived from `@rlanz/bull-queue`, it offers enhanced functionality tailored to AdonisJS's ecosystem.

## Table of Contents

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Usage](#usage)
   - [Job Dispatching](#job-dispatching)
   - [Job Creation](#job-creation)
   - [Job Lifecycle](#job-lifecycle)
4. [Advanced Features](#advanced-features)
   - [Job Attempts and Retries](#job-attempts-and-retries)
   - [Running the Queue Worker](#running-the-queue-worker)
5. [Dependencies](#dependencies)

## Installation <a id="installation"></a>

Begin by installing `@acidiney/bull-queue` using npm:

```bash
npm install @acidiney/bull-queue
```

## Configuration <a id="configuration"></a>

After installation, configure the package to adapt it to your AdonisJS project:

```bash
node ace configure @acidiney/bull-queue
```

## Usage <a id="usage"></a>

### Job Dispatching <a id="job-dispatching"></a>

Utilize the `dispatch` method provided by the `bull` provider to enqueue jobs.
Example:

> Please note that #app is an alia that was created by me, and isn't in adonis by default... So if you want to use it, you will need to add it in your tsconfig and package.json

```typescript
import app from '@adonisjs/core/services/app'
import bull from '@acidiney/bull-queue/services/main'
import RegisterStripeCustomer, {
  RegisterStripeCustomerPayload,
} from '#app/jobs/register_stripe_customer'

await app.booted(async () => {
  bull.dispatch(RegisterStripeCustomer.name, { userId: '123456' } as RegisterStripeCustomerPayload)
})
```

### Job Creation <a id="job-creation"></a>

Generate new job classes using the `node ace make:job {job}` command.

Example:

```ts
// app/jobs/register_stripe_customer.ts
import { JobHandlerContract, Job } from '@acidiney/bull-queue/types'

export type RegisterStripeCustomerPayload = {
  userId: string
}

export default class RegisterStripeCustomer
  implements JobHandlerContract<RegisterStripeCustomerPayload>
{
  public async handle(job: Job<RegisterStripeCustomerPayload>) {
    // Logic to register a Stripe customer
    const { userId } = job.data
    // Perform Stripe registration process
  }

  public async failed(job: Job<RegisterStripeCustomerPayload>) {
    // Logic to handle failed job attempts
    const { userId } = job.data
    // Send notification or log failure
  }
}
```

Register the new job into `start/jobs.ts`

```ts
// start/jobs.ts
import RegisterStripeCustomer from '#app/jobs/register_stripe_customer'
const jobs: Record<string, Function> = {
  [RegisterStripeCustomer.name]: () => import('#app/jobs/register_stripe_customer'),
}

export { jobs }
```

### Job Lifecycle <a id="job-lifecycle"></a>

Define the `handle` method to execute job logic and the `failed` method to handle failed attempts.

## Advanced Features <a id="advanced-features"></a>

### Job Attempts and Retries <a id="job-attempts-and-retries"></a>

- Customize the retry setting for jobs, configurable in the `config/queue.ts` file.
- Adjust attempts and delays per job or globally.

### Running the Queue Worker <a id="running-the-queue-worker"></a>

Initiate the queue worker using the `node ace queue:listen` command.

- Specify queues or run the UI for monitoring and managing queues.

Example:

```bash
node ace queue:listen:ui
```

By default, the UI will be accessible at `localhost:9999/admin`. You can specify a different port using the `--port` option:

```bash
node ace queue:listen:ui --port=3939
```

Additionally, you can specify the queues to listen to:

```bash
node ace queue:listen:ui --queue=stripe
```

In case you want to start a custom queue, do not forget to name it when you `dispatching` it

```ts
import app from '@adonisjs/core/services/app'
import bull from '@acidiney/bull-queue/services/main'
import RegisterStripeCustomer, {
  RegisterStripeCustomerPayload,
} from '#app/jobs/register_stripe_customer'

await app.booted(async () => {
  bull.dispatch(
    RegisterStripeCustomer.name,
    { userId: '123456' } as RegisterStripeCustomerPayload,
    {
      queueName: 'stripe',
    }
  )
})
```

This command starts the queue worker and launches the UI for convenient management and monitoring of your queues.

## Dependencies <a id="dependencies"></a>

- **@bull-board/api**: Provides API endpoints for monitoring and managing queues.
- **@bull-board/h3**: UI components for Bull queue management.
- **bullmq**: The core library for handling queues.
- **h3**: A library for generating unique hash codes.

# Author

Acidiney Dias
