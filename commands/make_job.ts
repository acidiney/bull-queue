import { CommandOptions } from '@adonisjs/core/types/ace'
import { stubsRoot } from '../stubs/main.js'
import { BaseCommand, args } from '@adonisjs/core/ace'

export default class MakeJob extends BaseCommand {
  static commandName = 'make:job'
  static description = 'Make a new dispatch-able job'

  @args.string({ description: 'Name of the job class' })
  name!: string

  static options: CommandOptions = {
    startApp: true,
    staysAlive: false,
  }

  async run() {
    const codemods = await this.createCodemods()
    await codemods.makeUsingStub(stubsRoot, 'jobs/main.stub', {
      job: this.app.generators.createEntity(this.name),
    })
  }
}
