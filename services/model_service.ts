import FileService from './file_service.js'
import { generators } from '@adonisjs/core/app'
import string from '@adonisjs/core/helpers/string'
import { ApplicationService } from '@adonisjs/core/types'
import { fsReadAll } from '@adonisjs/core/helpers'
import UtilService from './util_service.js'

export type ModelMap = {
  name: string
  filePath: string
}

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
  defaultValue?: string
  isOptionallyModified: boolean
}

export type ModelPropertyType = {
  type: string
  dtoType?: string
  model?: string
  dto?: string
  isPlural?: boolean
  isRelationship?: boolean
}

export default class ModelService {
  #relationTypes: string[] = ['BelongsTo', 'HasOne', 'HasMany', 'ManyToMany', 'HasManyThrough']
  #relationTypesPlural: string[] = ['HasMany', 'ManyToMany', 'HasManyThrough']

  constructor(protected app: ApplicationService) {}

  async getFromFiles() {
    const modelsPath = this.app.modelsPath()
    const modelFilePaths = await fsReadAll(modelsPath, { pathType: 'absolute' })
    const promises = modelFilePaths.map(async (filePath) => {
      const name = generators.modelName(filePath.split('/').pop()!)
      return this.getModelInfo({ name, filePath }, name)
    })

    return await Promise.all(promises)
  }

  /**
   * Get model's validity, file, class, and property information
   * @param modelName
   * @param dtoName
   */
  async getModelInfo(modelName: ModelMap | string | undefined, dtoName: string) {
    const name = (typeof modelName === 'object' ? modelName.name : modelName) || dtoName
    const fileName = generators.modelFileName(name)
    const filePath =
      typeof modelName === 'object' ? modelName.filePath : this.app.modelsPath(fileName)

    const isReadable = await FileService.canRead(filePath)
    const data: ModelInfo = {
      name: generators.modelName(name),
      variable: string.camelCase(name),
      fileName,
      filePath,
      isReadable,
      properties: [],
    }

    if (!isReadable) return { model: data, modelFileLines: [] }

    const { definitions, fileLines } = await FileService.readDeclarations(filePath)

    data.properties = await this.#getModelProperties(definitions)

    return { model: data, modelFileLines: fileLines }
  }

  /**
   * Get model property, relationship, and type info
   * @param definitions
   * @private
   */
  async #getModelProperties(definitions: string[]): Promise<ModelProperty[]> {
    return definitions.map((definition) => {
      const propertyTypeString = definition.replace('declare', '').replace('public', '')
      const [propertyLeft, propertyRight = ''] = propertyTypeString.split(':')
      const name = UtilService.cleanDefinition(propertyLeft)
      let { typeString, valueString } = UtilService.getTypeAndValue(propertyRight)

      if (!typeString) {
        typeString = UtilService.getDefaultType(name)
      }

      const typesRaw = typeString.split('|').map((type) => type.trim())
      const types = typesRaw.map((type) => this.#parseRelationType(type))
      const defaultValue = valueString?.trim()
      const relation = types.find((type) => type.isRelationship)
      const isOptionallyModified =
        propertyLeft.trim().endsWith('?') && !types.some((item) => item.type === 'undefined')

      return {
        name,
        types,
        defaultValue,
        relation,
        isOptionallyModified,
      }
    })
  }

  /**
   * Gets relationship type information from raw type string
   * @param typeRaw
   * @private
   */
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
