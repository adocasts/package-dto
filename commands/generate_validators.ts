import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import ValidatorService from '../services/validator_service.js'
import ModelService from '../services/model_service.js'
import { stubsRoot } from '../stubs/main.js'
import { ImportService } from '../services/import_service.js'

export default class GenerateValidators extends BaseCommand {
  static commandName = 'generate:validators'
  static description = 'Reads, converts, and generates validators from all Lucid Models'
  static options: CommandOptions = {
    strict: true,
  }

  async run() {
    const modelService = new ModelService(this.app)
    const validatorService = new ValidatorService(this.app)

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
      const validator = validatorService.getValidatorInfo(file.model.name, file.model)
      const codemods = await this.createCodemods()
      const imports = ImportService.getImportStatements(validator, file.modelFileLines)

      await codemods.makeUsingStub(stubsRoot, 'make/validator/main.stub', {
        model: file.model,
        validator,
        imports,
      })
    }
  }
}
