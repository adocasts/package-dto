import { generators } from '@adonisjs/core/app'
import type { ModelInfo, ModelProperty, ModelPropertyType } from './model_service.js'
import string from '@adonisjs/core/helpers/string'
import { ApplicationService } from '@adonisjs/core/types'

export type ValidatorInfo = {
  entity: { path: string; name: string }
  variable: string
  className: string
  fileName: string
  exportPath: string
  properties: ValidatorProperty[]
}

export type ValidatorProperty = {
  name: string
  type: string
  typeRaw: ModelPropertyType[]
  validationRule: string
}

export default class ValidatorService {
  constructor(protected app: ApplicationService) {}

  /**
   * Get validator file, class, and property info
   * @param name
   * @param model
   */
  getValidatorInfo(name: string, model: ModelInfo) {
    const entity = generators.createEntity(this.#getValidatorName(name))
    const fileName = generators
      .modelFileName(entity.name)
      .replace('_validator', '')
      .replace('.ts', '')

    const data: ValidatorInfo = {
      entity,
      fileName,
      className: generators.modelName(entity.name),
      variable: string.camelCase(name) + 'Validator',
      exportPath: this.app.makePath('app/validators', entity.path, fileName + '.ts'),
      properties: [],
    }

    if (!model.isReadable) return data

    data.properties = this.#getValidatorProperties(model)

    return data
  }

  /**
   * Normalize name of the validator
   * @param name
   * @private
   */
  #getValidatorName(name: string) {
    return name.toLowerCase().endsWith('validator') ? name : name + '_validator'
  }

  /**
   * Get validator's property, type, and validation rule info
   * @param model
   * @private
   */
  #getValidatorProperties(model: ModelInfo): ValidatorProperty[] {
    return model.properties.map((property) => {
      const typeRaw = this.#getValidatorType(property)
      const type = typeRaw.map((item) => item.type).join(' | ')
      return {
        name: property.name,
        type,
        typeRaw: typeRaw,
        validationRule: this.#getValidationRule(property, typeRaw),
      }
    })
  }

  /**
   * Get normalized validator types
   * @param property
   * @private
   */
  #getValidatorType(property: ModelProperty) {
    if (property.relation?.isRelationship) {
      const types = [{ ...property.relation }]

      // Add null type for non-plural relationships that might be null
      if (!property.relation.isPlural) {
        types.push({ type: 'null' })
      }

      return types
    }

    return property.types
  }

  /**
   * Get VineJS validation rule for property
   * @param property
   * @param types
   * @private
   */
  #getValidationRule(property: ModelProperty, types: ModelPropertyType[]): string {
    // Handle relationships
    if (property.relation?.isRelationship) {
      return property.relation.isPlural ? `vine.array(vine.object({}))` : `vine.object({})`
    }

    // Check if property is optional
    const isOptional =
      property.isOptionallyModified ||
      types.some((type) => type.type === 'null' || type.type === 'undefined')

    // Get base rule based on primary type
    const primaryType = types.find((type) => !['null', 'undefined', 'optional'].includes(type.type))

    let rule = ''

    if (!primaryType) {
      // Default to string if no primary type found
      rule = 'vine.string()'
    } else if (primaryType.type === 'string') {
      rule = 'vine.string().trim()'
    } else if (primaryType.type === 'number') {
      rule = 'vine.number()'
    } else if (primaryType.type === 'boolean') {
      rule = 'vine.boolean()'
    } else if (primaryType.type === 'Date') {
      rule = 'vine.date()'
    } else if (primaryType.type === 'DateTime') {
      rule = 'vine.string().datetime()'
    } else if (primaryType.type.includes('[]')) {
      rule = 'vine.array()'
    } else {
      // Default to string for unknown types
      rule = 'vine.string()'
    }

    // Add optional modifier if needed
    if (isOptional) {
      rule += '.optional()'
    }

    return rule
  }
}
