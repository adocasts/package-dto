import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import DtoService from '../services/dto_service.js'
import ModelService from '../services/model_service.js'
import { stubsRoot } from '../stubs/main.js'
import { ImportService } from '../services/import_service.js'

export default class GererateDtos extends BaseCommand {
  static commandName = 'generate:dtos'
  static description = 'Reads, converts, and generates DTOs from all Lucid Models'
  static options: CommandOptions = {
    strict: true,
  }

  async run() {
    const modelService = new ModelService(this.app)
    const dtoService = new DtoService(this.app)

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
      const codemods = await this.createCodemods()
      const imports = ImportService.getImportStatements(dto, file.modelFileLines)

      await codemods.makeUsingStub(stubsRoot, 'make/dto/main.stub', {
        model: file.model,
        dto,
        imports,
      })
    }
  }
}
