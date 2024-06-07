import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import { stubsRoot } from '../stubs/main.js'
import DtoService from '../services/dto_service.js'
import ModelService from '../services/model_service.js'
import { ImportService } from '../services/import_service.js'

export default class MakeDto extends BaseCommand {
  static commandName = 'make:dto'
  static description = "Create a new dto. If a model matches the DTO name, it'll be used by default"
  static options: CommandOptions = {
    strict: true,
  }

  @args.string({ description: 'Name of the DTO' })
  declare name: string

  @flags.string({
    description: 'Specify a model to build the DTO from',
    alias: 'm',
  })
  declare model?: string

  async run() {
    const modelService = new ModelService(this.app)
    const dtoService = new DtoService(this.app)

    const model = await modelService.getModelInfo(this.model, this.name)
    const dto = dtoService.getDtoInfo(this.name, model)
    const codemods = await this.createCodemods()

    if (!model.isReadable && this.model) {
      return this.logger.warning(`[WARN]: Unable to find or read desired model ${model.fileName}`)
    } else if (!model.isReadable) {
      return codemods.makeUsingStub(stubsRoot, 'make/dto/plain.stub', {
        dto,
      })
    }

    const imports = ImportService.getImportStatements(dto)
    return codemods.makeUsingStub(stubsRoot, 'make/dto/main.stub', {
      dto,
      model,
      imports,
    })
  }
}
