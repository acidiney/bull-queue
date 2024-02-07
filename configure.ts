/*
|--------------------------------------------------------------------------
| Configure hook
|--------------------------------------------------------------------------
|
| The configure hook is called when someone runs "node ace configure <package>"
| command. You are free to perform any operations inside this function to
| configure the package.
|
| To make things easier, you have access to the underlying "ConfigureCommand"
| instance and you can use codemods to modify the source files.
|
*/

import ConfigureCommand from '@adonisjs/core/commands/configure'
import { stubsRoot } from './stubs/main.js'

export async function configure(command: ConfigureCommand) {
  const codemods = await command.createCodemods()

  /**
   * Publish config file
   */
  await codemods.makeUsingStub(stubsRoot, 'config/queue.stub', {})
  await codemods.makeUsingStub(stubsRoot, 'start/jobs.stub', {})

  /**
   * Register provider
   */
  await codemods.updateRcFile((rcFile) => {
    rcFile.addProvider('@acidiney/bull-queue/queue_provider')
    rcFile.addCommand('@acidiney/bull-queue/commands')
  })

  /**
   * Add environment variables
   */
  await codemods.defineEnvVariables({
    REDIS_HOST: '127.0.0.1',
    REDIS_PORT: '6379',
    REDIS_PASSWORD: '',
  })

  /**
   * Validate environment variables
   */
  await codemods.defineEnvValidations({
    variables: {
      REDIS_HOST: `Env.schema.string({ format: 'host' })`,
      REDIS_PORT: 'Env.schema.number()',
    },
  })
}
