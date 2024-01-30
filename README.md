# @acidiney/bull-queue

`@acidiney/bull-queue` is a queue system based on [BullMQ](https://github.com/taskforcesh/bullmq)
for [AdonisJS](https://adonisjs.com/).

> **Note**
>
> You must have a Redis server running on your machine.
>
> It's is a fork from [@rlanz/bull-queue](https://github.com/RomainLanz/adonis-bull-queue)

---

## Getting Started

This package is available in the npm registry.

```bash
npm install @acidiney/bull-queue
```

Next, configure the package by running the following command.

```bash
node ace configure @acidiney/bull-queue
```

and... Voilà!

## Usage

The `bull` provider gives you access to the `dispatch` method.
It will dispatch the linked job to the queue with the given payload.

```ts
import bull from '@acidiney/bull-queue/services/main'
```

> **Note**
>
> The `bull` instance will exist only when application is `booted`
>
> If you need to run `bull` outside of the application lifecycle... You will need to run `app.booted`
>
> Hint: You can find `app` in `@adonisjs/core/services/app`

You can create a job by running `node ace make:job {job}`.
This will create the job within your `app/jobs` directory.

The `handle` method is what gets called when the jobs is processed while
the `failed` method is called when the max attempts of the job has been reached.

Since the job instance is passed to the method, you can easily send notifications with the `failed` method. See [this page](https://api.docs.bullmq.io/classes/Job.html) for full documentation on the job instance.

Example job file:

```ts
// app/jobs/register_stripe_customer.ts
import { JobHandlerContract, Job } from '@acidiney/bull-queue/types'

export type RegisterStripeCustomerPayload = {
  userId: string;
};

export class RegisterStripeCustomer implements JobHandlerContract<RegisterStripeCustomerPayload> {

  public async handle(job: Job<RegisterStripeCustomerPayload>) {
    // ...
  }

  public async failed(job: Job<RegisterStripeCustomerPayload>) {
    // ...
  }

  public static instance (): 'RegisterStripeCustomer' {
    app.container.singleton('RegisterStripeCustomer', () => new RegisterStripeCustomer())

    return 'RegisterStripeCustomer'
  }
}
```

### The inject method

We need to make an IoC inject of `RegisterStripeCustomer`, not necessary you need to use it in there, but you will need to do it.

Now we can `dispatch` an eg.

```ts
// test_relay_service.ts
import app from '@adonisjs/core/services/app'
import bull from '@acidiney/bull-queue/services/main'

import { RegisterStripeCustomer } from '#app/jobs/register_stripe_customer.js'

await app.booted(async () => {
  bull.dispatch(
    RegisterStripeCustomer.instance(),
    {},
  )
})

```

#### Job Attempts

By default, all jobs have a retry of 3 and this is set within your `config/queue.ts` under the `jobs` object.

You can also set the attempts on a call basis by passing the overide as shown below:

```ts
bull.dispatch('RegisterStripeCustomer', {...}, { attempts: 3 })
```

#### Delayed retries

If you need to add delays inbetween retries, you can either set it globally via by adding this to your `config/queue.ts`:

```ts
// config/queue.ts
  ...
  jobs: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  }
```

Or... you can also do it per job:

```ts
Queue.dispatch('RegisterStripeCustomer', {...}, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 }
})
```

With that configuration above, BullMQ will first add a 5s delay before the first retry, 20s before the 2nd, and 40s for the 3rd.

You can visit [this page](https://docs.bullmq.io/guide/retrying-failing-jobs) on further explanation / other retry options.

#### Running the queue

Run the queue worker with the following ace command:

```bash
node ace queue:listen

# or

node ace queue:listen --queue=stripe

# or

node ace queue:listen --queue=stripe,cloudflare

# or

node ace queue:listen:ui
# default port is 9999 -> localhost:9999/ui


# or

node ace queue:listen:ui --port=3939

or 
node ace queue:listen:ui --queue=stripe

```

Once done, you will see the message `Queue processing started`.

## Typings

You can define the payload's type for a given job inside the `config/queue.ts` file.

```ts
import { RegisterStripeCustomer } from '#app/jobs/register_stripe_customer.js'

declare module '@adonisjs/core/types' {
  interface ContainerBindings {
    RegisterStripeCustomer: RegisterStripeCustomer
  }
}
```

### Dependences

```json
  "dependencies": {
    "@bull-board/api": "^5.14.0",
    "@bull-board/h3": "^5.14.0",
    "bullmq": "^5.1.5",
    "h3": "^1.10.1"
  }
```
