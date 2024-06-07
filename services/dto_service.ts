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
  valueSetter: string
}

export default class DtoService {
  constructor(protected app: ApplicationService) {}
  getDtoInfo(name: string, model: ModelInfo) {
    const entity = generators.createEntity(this.#getDtoName(name))
    const fileName = generators.modelFileName(entity.name).replace('_dto', '')
    const data: DtoInfo = {
      entity,
      fileName,
      className: generators.modelName(entity.name),
      variable: string.camelCase(name),
      exportPath: this.app.makePath('app/dtos', entity.path, fileName),
      properties: [],
    }

    if (!model.isReadable) return data

    data.properties = this.#getDtoProperties(model)

    return data
  }

  #getDtoName(name: string) {
    return name.toLowerCase().endsWith('dto') ? name : name + '_dto'
  }

  #getDtoProperties(model: ModelInfo): DtoProperty[] {
    return model.properties.map((property) => {
      const type = this.#getDtoType(property)
      return {
        name: property.name,
        type: type.map((item) => item.dtoType || item.type).join(' | '),
        typeRaw: type,
        valueSetter: this.#getValueSetter(property, model),
      }
    })
  }

  #getDtoType(property: ModelProperty) {
    if (property.relation?.dtoType) {
      return [property.relation]
    }

    return property.types.map(({ ...item }) => {
      if (item.type === 'DateTime') {
        item.type = 'string'
      }

      return item
    })
  }

  #getValueSetter(property: ModelProperty, model: ModelInfo) {
    const accessor = `${model.variable}.${property.name}`

    if (property.relation?.model) {
      return property.relation.isPlural
        ? `${property.relation.dto}.fromArray(${accessor})`
        : `new ${property.relation.dto}(${accessor})`
    }

    const dateTimeType = property.types.find((item) => item.type === 'DateTime')

    if (dateTimeType) {
      const nullable = property.types.find((item) => item.type === 'null')
      const optional = property.types.find((item) => item.type === 'optional')

      if (optional || nullable) {
        return accessor + `?.toISO()${optional ? '' : '!'}`
      }

      return accessor + `.toISO()!`
    }

    return accessor
  }
}
