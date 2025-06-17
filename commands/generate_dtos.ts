import { BaseCommand, flags } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import DtoService from '../services/dto_service.js'
import ModelService from '../services/model_service.js'
import { stubsRoot } from '../stubs/main.js'
import { ImportService } from '../services/import_service.js'
import ValidatorService from '../services/validator_service.js'

export default class GererateDtos extends BaseCommand {
  static commandName = 'generate:dtos'
  static description = 'Reads, converts, and generates DTOs from all Lucid Models'
  static options: CommandOptions = {
    strict: true,
  }

  @flags.boolean({
    description: 'Generate validators alongside DTOs',
    alias: 'v',
  })
  declare validator: boolean

  async run() {
    const modelService = new ModelService(this.app)
    const dtoService = new DtoService(this.app)
    const validatorService = this.validator ? new ValidatorService(this.app) : null

    const files = await modelService.getFromFiles()
    const unreadable = files.filter((file) => !file.model.isReadable)

    if (unreadable.length) {
      this.logger.error(
        `Unable to find or read one or more models: ${unreadable.map((file) => file.model.name).join(', ')}`
      )
      this.exitCode = 1
      return
    }

    for (const file of files) {
      const dto = dtoService.getDtoInfo(file.model.name, file.model)
      const validator = validatorService?.getValidatorInfo(file.model.name, file.model)
      const codemods = await this.createCodemods()
      const imports = ImportService.getImportStatements(dto, file.modelFileLines)

      // Create the DTO
      await codemods.makeUsingStub(stubsRoot, 'make/dto/main.stub', {
        model: file.model,
        dto,
        imports,
      })

      // If validator flag is set, also create a validator
      if (this.validator && validator) {
        const validatorImports = ImportService.getImportStatements(validator, file.modelFileLines)
        await codemods.makeUsingStub(stubsRoot, 'make/validator/main.stub', {
          model: file.model,
          validator,
          imports: validatorImports,
        })
      }
    }
  }
}
