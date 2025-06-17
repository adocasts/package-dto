import { generators } from '@adonisjs/core/app'
import type { ModelInfo, ModelProperty, ModelPropertyType } from './model_service.js'
import string from '@adonisjs/core/helpers/string'
import { ApplicationService } from '@adonisjs/core/types'

export type DtoInfo = {
  entity: { path: string; name: string }
  variable: string
  className: string
  fileName: string
  exportPath: string
  properties: DtoProperty[]
}

export type DtoProperty = {
  name: string
  type: string
  typeRaw: ModelPropertyType[]
  declaration: string
  valueSetter: string
}

export default class DtoService {
  constructor(protected app: ApplicationService) {}

  /**
   * Get DTO file, class, and property info
   * @param name
   * @param model
   */
  getDtoInfo(name: string, model: ModelInfo) {
    const entity = generators.createEntity(this.#getDtoName(name))
    const fileName = generators.modelFileName(entity.name).replace('_dto', '').replace('.ts', '')
    const data: DtoInfo = {
      entity,
      fileName,
      className: generators.modelName(entity.name),
      variable: string.camelCase(name),
      exportPath: this.app.makePath('app/dtos', entity.path, fileName + '.ts'),
      properties: [],
    }

    if (!model.isReadable) return data

    data.properties = this.#getDtoProperties(model)

    return data
  }

  /**
   * Normalize name of the DTO
   * @param name
   * @private
   */
  #getDtoName(name: string) {
    return name.toLowerCase().endsWith('dto') ? name : name + '_dto'
  }

  /**
   * Get DTO's property, type, and constructor value setting info
   * @param model
   * @private
   */
  #getDtoProperties(model: ModelInfo): DtoProperty[] {
    return model.properties.map((property) => {
      const typeRaw = this.#getDtoType(property)
      const type = typeRaw.map((item) => item.dtoType || item.type).join(' | ')
      return {
        name: property.name,
        type,
        typeRaw: typeRaw,
        declaration: this.#getPropertyDeclaration(property, type),
        valueSetter: this.#getValueSetter(property, model),
      }
    })
  }

  /**
   * Get normalized DTO types
   * @param property
   * @private
   */
  #getDtoType(property: ModelProperty) {
    if (property.relation?.dtoType) {
      const types = [property.relation]

      // plural relationships will be normalized to empty array
      // however, singular relationships may be null if not loaded/preloaded regardless of type
      if (!property.relation.isPlural) {
        types.push({ type: 'null' })
      }

      return types
    }

    return property.types.map(({ ...item }) => {
      if (item.type === 'DateTime') {
        item.type = 'string'
      }

      return item
    })
  }

  /**
   * get class declaration string for property
   * @param property
   * @param type
   * @private
   */
  #getPropertyDeclaration(property: ModelProperty, type: string) {
    if (!property.defaultValue) {
      return `declare ${property.name}${property.isOptionallyModified ? '?' : ''}: ${type}`
    }

    return `${property.name}: ${type} = ${property.defaultValue}`
  }

  /**
   * Get value setter for use in the constructor for the property
   * @param property
   * @param model
   * @private
   */
  #getValueSetter(property: ModelProperty, model: ModelInfo) {
    const nullable = property.types.find((item) => item.type === 'null')
    const optional = property.types.find((item) => item.type === 'optional')
    const accessor = `${model.variable}.${property.name}`

    if (property.relation?.model) {
      return property.relation.isPlural
        ? `${property.relation.dto}.fromArray(${accessor})`
        : `${accessor} && new ${property.relation.dto}(${accessor})`
    }

    const dateTimeType = property.types.find((item) => item.type === 'DateTime')

    if (dateTimeType) {
      return optional || nullable
        ? accessor + `?.toISO()${optional ? '' : '!'}`
        : accessor + `.toISO()!`
    }

    return accessor
  }
}
