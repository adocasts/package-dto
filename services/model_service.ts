import FileService from './file_service.js'
import { generators } from '@adonisjs/core/app'
import string from '@adonisjs/core/helpers/string'
import { ApplicationService } from '@adonisjs/core/types'

export type ModelInfo = {
  name: string
  variable: string
  fileName: string
  filePath: string
  isReadable: boolean
  properties: ModelProperty[]
}

export type ModelProperty = {
  name: string
  types: ModelPropertyType[]
  relation?: ModelPropertyType
}

export type ModelPropertyType = {
  type: string
  dtoType?: string
  model?: string
  dto?: string
  isPlural?: boolean
  isRelationship?: boolean
  isOptionalModifier?: boolean
}

export default class ModelService {
  #relationTypes: string[] = ['BelongsTo', 'HasOne', 'HasMany', 'ManyToMany', 'HasManyThrough']
  #relationTypesPlural: string[] = ['HasMany', 'ManyToMany', 'HasManyThrough']

  constructor(protected app: ApplicationService) {}

  async getModelInfo(modelName: string | undefined, dtoName: string) {
    const name = modelName || dtoName
    const fileName = generators.modelFileName(name)
    const filePath = this.app.modelsPath(fileName)
    const isReadable = await FileService.canRead(filePath)
    const data: ModelInfo = {
      name: generators.modelName(name),
      variable: string.camelCase(name),
      fileName,
      filePath,
      isReadable,
      properties: [],
    }

    if (!isReadable) return data

    data.properties = await this.#getModelProperties(filePath)

    return data
  }

  async #getModelProperties(filePath: string): Promise<ModelProperty[]> {
    const lines = await FileService.readDeclarations(filePath)
    return lines.map((line) => {
      const propertyTypeString = line.replace('declare', '').replace('public', '')
      const [nameString, typeString] = propertyTypeString.split(':')
      const name = nameString.replace('?', '').trim()
      const typesRaw = typeString.split('|').map((type) => type.trim())
      const types = typesRaw.map((type) => this.#parseRelationType(type))

      // when name is suffixed with optional modifier, ensure undefined is in resulting types
      if (nameString.trim().endsWith('?') && !types.some((item) => item.type === 'undefined')) {
        types.push({ type: 'undefined', isOptionalModifier: true })
      }

      return {
        name,
        types,
        relation: types.find((type) => type.isRelationship),
      }
    })
  }

  #parseRelationType(typeRaw: string): ModelPropertyType {
    if (!this.#relationTypes.some((type) => typeRaw.includes(type))) {
      return { type: typeRaw }
    }

    const isPlural = this.#relationTypesPlural.some((type) => typeRaw.includes(type))
    const model = typeRaw.split('typeof').at(1)?.split('>').at(0)?.trim()
    const dto = model?.endsWith('Dto') ? model : model + 'Dto'

    return {
      type: typeRaw,
      dtoType: `${dto}${isPlural ? '[]' : ''}`,
      model,
      dto,
      isPlural,
      isRelationship: true,
    }
  }
}
