import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import { stubsRoot } from '../stubs/main.js'
import DtoService from '../services/dto_service.js'
import ModelService from '../services/model_service.js'
import { ImportService } from '../services/import_service.js'
import ValidatorService from '../services/validator_service.js'

export default class MakeDto extends BaseCommand {
  static commandName = 'make:dto'
  static description = 'Create a new dto'
  static options: CommandOptions = {
    strict: true,
  }

  @args.string({
    description:
      "Name of the DTO. If a model matches the provided name, it'll be used to generate the DTO",
  })
  declare name: string

  @flags.string({
    description: 'Specify a model to build the DTO from',
    alias: 'm',
  })
  declare model?: string

  @flags.boolean({
    description: 'Generate a validator alongside the DTO',
    alias: 'v',
  })
  declare validator: boolean

  async run() {
    const modelService = new ModelService(this.app)
    const dtoService = new DtoService(this.app)
    const validatorService = this.validator ? new ValidatorService(this.app) : null

    const { model, modelFileLines } = await modelService.getModelInfo(this.model, this.name)
    const dto = dtoService.getDtoInfo(this.name, model)
    const validator = validatorService?.getValidatorInfo(this.name, model)
    const codemods = await this.createCodemods()

    if (!model.isReadable && this.model) {
      // wanted to generate from model, but model couldn't be found or read? cancel with error
      this.logger.error(`Unable to find or read desired model ${model.fileName}`)
      this.exitCode = 1
      return
    } else if (!model.isReadable) {
      // model not specifically wanted and couldn't be found or read? create plain DTO
      await codemods.makeUsingStub(stubsRoot, 'make/dto/plain.stub', {
        dto,
      })

      // If validator flag is set, also create a plain validator
      if (this.validator && validator) {
        await codemods.makeUsingStub(stubsRoot, 'make/validator/plain.stub', {
          validator,
        })
      }

      return
    }

    const imports = ImportService.getImportStatements(dto, modelFileLines)

    // Create the DTO
    await codemods.makeUsingStub(stubsRoot, 'make/dto/main.stub', {
      dto,
      model,
      imports,
    })

    // If validator flag is set, also create a validator
    if (this.validator && validator) {
      const validatorImports = ImportService.getImportStatements(validator, modelFileLines)
      await codemods.makeUsingStub(stubsRoot, 'make/validator/main.stub', {
        validator,
        model,
        imports: validatorImports,
      })
    }
  }
}
