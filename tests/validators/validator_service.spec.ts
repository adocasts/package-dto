import { test } from '@japa/runner'
import { ApplicationService } from '@adonisjs/core/types'
import ValidatorService from '../../services/validator_service.js'
import { ModelInfo, ModelProperty } from '../../services/model_service.js'

test.group('ValidatorService', () => {
  test('should get validator info with correct name and path', ({ assert }) => {
    const app = {
      makePath: (base: string, path: string, file: string) => `${base}/${path}/${file}`,
    } as unknown as ApplicationService

    const validatorService = new ValidatorService(app)
    const model: ModelInfo = {
      name: 'User',
      variable: 'user',
      fileName: 'user.ts',
      filePath: 'app/models/user.ts',
      isReadable: true,
      properties: [],
    }

    const validator = validatorService.getValidatorInfo('User', model)

    assert.equal(validator.className, 'UserValidator')
    assert.equal(validator.variable, 'userValidator')
    assert.equal(validator.fileName, 'user')
    assert.equal(
      validator.exportPath.replace(/\.\//g, '').replace('.ts', '').replace(/\/\//g, '/'),
      'app/validators/user'
    )
  })

  test('should normalize validator name', ({ assert }) => {
    const app = {
      makePath: (base: string, path: string, file: string) => `${base}/${path}/${file}`,
    } as unknown as ApplicationService

    const validatorService = new ValidatorService(app)
    const model: ModelInfo = {
      name: 'User',
      variable: 'user',
      fileName: 'user.ts',
      filePath: 'app/models/user.ts',
      isReadable: true,
      properties: [],
    }

    const validator1 = validatorService.getValidatorInfo('User', model)
    const validator2 = validatorService.getValidatorInfo('UserValidator', model)

    assert.equal(validator1.className, 'UserValidator')
    assert.equal(validator2.className, 'UserValidator')
  })

  test('should map string property to string validator rule', ({ assert }) => {
    const app = {
      makePath: (base: string, path: string, file: string) => `${base}/${path}/${file}`,
    } as unknown as ApplicationService

    const validatorService = new ValidatorService(app)
    const model: ModelInfo = {
      name: 'User',
      variable: 'user',
      fileName: 'user.ts',
      filePath: 'app/models/user.ts',
      isReadable: true,
      properties: [
        {
          name: 'name',
          types: [{ type: 'string' }],
          isOptionallyModified: false,
        } as ModelProperty,
      ],
    }

    const validator = validatorService.getValidatorInfo('User', model)

    assert.equal(validator.properties[0].name, 'name')
    assert.equal(validator.properties[0].type, 'string')
    assert.equal(validator.properties[0].validationRule, 'vine.string().trim()')
  })

  test('should map number property to number validator rule', ({ assert }) => {
    const app = {
      makePath: (base: string, path: string, file: string) => `${base}/${path}/${file}`,
    } as unknown as ApplicationService

    const validatorService = new ValidatorService(app)
    const model: ModelInfo = {
      name: 'User',
      variable: 'user',
      fileName: 'user.ts',
      filePath: 'app/models/user.ts',
      isReadable: true,
      properties: [
        {
          name: 'age',
          types: [{ type: 'number' }],
          isOptionallyModified: false,
        } as ModelProperty,
      ],
    }

    const validator = validatorService.getValidatorInfo('User', model)

    assert.equal(validator.properties[0].name, 'age')
    assert.equal(validator.properties[0].type, 'number')
    assert.equal(validator.properties[0].validationRule, 'vine.number()')
  })

  test('should map boolean property to boolean validator rule', ({ assert }) => {
    const app = {
      makePath: (base: string, path: string, file: string) => `${base}/${path}/${file}`,
    } as unknown as ApplicationService

    const validatorService = new ValidatorService(app)
    const model: ModelInfo = {
      name: 'User',
      variable: 'user',
      fileName: 'user.ts',
      filePath: 'app/models/user.ts',
      isReadable: true,
      properties: [
        {
          name: 'isActive',
          types: [{ type: 'boolean' }],
          isOptionallyModified: false,
        } as ModelProperty,
      ],
    }

    const validator = validatorService.getValidatorInfo('User', model)

    assert.equal(validator.properties[0].name, 'isActive')
    assert.equal(validator.properties[0].type, 'boolean')
    assert.equal(validator.properties[0].validationRule, 'vine.boolean()')
  })

  test('should add optional modifier for optional properties', ({ assert }) => {
    const app = {
      makePath: (base: string, path: string, file: string) => `${base}/${path}/${file}`,
    } as unknown as ApplicationService

    const validatorService = new ValidatorService(app)
    const model: ModelInfo = {
      name: 'User',
      variable: 'user',
      fileName: 'user.ts',
      filePath: 'app/models/user.ts',
      isReadable: true,
      properties: [
        {
          name: 'name',
          types: [{ type: 'string' }, { type: 'null' }],
          isOptionallyModified: true,
        } as ModelProperty,
      ],
    }

    const validator = validatorService.getValidatorInfo('User', model)

    assert.equal(validator.properties[0].name, 'name')
    assert.equal(validator.properties[0].type, 'string | null')
    assert.equal(validator.properties[0].validationRule, 'vine.string().trim().optional()')
  })

  test('should handle relationship properties', ({ assert }) => {
    const app = {
      makePath: (base: string, path: string, file: string) => `${base}/${path}/${file}`,
    } as unknown as ApplicationService

    const validatorService = new ValidatorService(app)
    const model: ModelInfo = {
      name: 'User',
      variable: 'user',
      fileName: 'user.ts',
      filePath: 'app/models/user.ts',
      isReadable: true,
      properties: [
        {
          name: 'posts',
          types: [],
          relation: {
            type: 'HasMany<typeof Post>',
            model: 'Post',
            isPlural: true,
            isRelationship: true,
          },
          isOptionallyModified: false,
        } as ModelProperty,
      ],
    }

    const validator = validatorService.getValidatorInfo('User', model)

    assert.equal(validator.properties[0].name, 'posts')
    assert.equal(validator.properties[0].validationRule, 'vine.array(vine.object({}))')
  })
})
