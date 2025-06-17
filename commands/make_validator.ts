import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import { stubsRoot } from '../stubs/main.js'
import ValidatorService from '../services/validator_service.js'
import ModelService from '../services/model_service.js'
import { ImportService } from '../services/import_service.js'

export default class MakeValidator extends BaseCommand {
  static commandName = 'make:dto:validator'
  static description = 'Create a new validator'
  static options: CommandOptions = {
    strict: true,
  }

  @args.string({
    description:
      "Name of the validator. If a model matches the provided name, it'll be used to generate the validator",
  })
  declare name: string

  @flags.string({
    description: 'Specify a model to build the validator from',
    alias: 'm',
  })
  declare model?: string

  async run() {
    const modelService = new ModelService(this.app)
    const validatorService = new ValidatorService(this.app)

    const { model, modelFileLines } = await modelService.getModelInfo(this.model, this.name)
    const validator = validatorService.getValidatorInfo(this.name, model)
    const codemods = await this.createCodemods()

    if (!model.isReadable && this.model) {
      // wanted to generate from model, but model couldn't be found or read? cancel with error
      this.logger.error(`Unable to find or read desired model ${model.fileName}`)
      this.exitCode = 1
      return
    } else if (!model.isReadable) {
      // model not specifically wanted and couldn't be found or read? create plain validator
      return codemods.makeUsingStub(stubsRoot, 'make/validator/plain.stub', {
        validator,
      })
    }

    const imports = ImportService.getImportStatements(validator, modelFileLines)

    return codemods.makeUsingStub(stubsRoot, 'make/validator/main.stub', {
      validator,
      model,
      imports,
    })
  }
}
