import { test } from '@japa/runner'
import { AceFactory } from '@adonisjs/core/factories'
import MakeDto from '../../commands/make_dto.js'
import GererateDtos from '../../commands/generate_dtos.js'

test.group('DTO Validator Integration', (group) => {
  group.each.teardown(async ({ context }) => {
    delete process.env.ADONIS_ACE_CWD
    await context.fs.remove('app/dtos')
    await context.fs.remove('app/validators')
  })

  test('make:dto with validator flag should generate both DTO and validator', async ({
    fs,
    assert,
  }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakeDto, ['Test', '--validator'])
    await command.exec()

    // Check that both DTO and validator were created
    command.assertLog('green(DONE:)    create app/dtos/test.ts')
    command.assertLog('green(DONE:)    create app/validators/test.ts')

    // Check DTO content
    await assert.fileContains(
      'app/dtos/test.ts',
      'export default class TestDto extends BaseModelDto {'
    )
    await assert.fileContains('app/dtos/test.ts', "import Test from '#models/test'")

    // Check validator content
    await assert.fileContains(
      'app/validators/test.ts',
      'export const testValidator = vine.compile('
    )
    await assert.fileContains('app/validators/test.ts', "import Test from '#models/test'")
  })

  test('make:dto with validator flag should generate plain DTO and validator when model not found', async ({
    fs,
    assert,
  }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakeDto, ['NonExistent', '--validator'])
    await command.exec()

    // Check that both plain DTO and validator were created
    command.assertLog('green(DONE:)    create app/dtos/non_existent.ts')
    command.assertLog('green(DONE:)    create app/validators/non_existent.ts')

    // Check DTO content
    await assert.fileContains(
      'app/dtos/non_existent.ts',
      'export default class NonExistentDto extends BaseDto {'
    )

    // Check validator content
    await assert.fileContains(
      'app/validators/non_existent.ts',
      'export const nonExistentValidator = vine.compile('
    )
  })

  test('generate:dtos with validator flag should generate both DTOs and validators', async ({
    fs,
    assert,
  }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(GererateDtos, ['--validator'])
    await command.exec()

    // Check that both DTOs and validators were created for test models
    command.assertLog('green(DONE:)    create app/dtos/test.ts')
    command.assertLog('green(DONE:)    create app/validators/test.ts')
    command.assertLog('green(DONE:)    create app/dtos/account.ts')
    command.assertLog('green(DONE:)    create app/validators/account.ts')
    command.assertLog('green(DONE:)    create app/dtos/user.ts')
    command.assertLog('green(DONE:)    create app/validators/user.ts')

    // Check test DTO and validator content
    await assert.fileContains(
      'app/dtos/test.ts',
      'export default class TestDto extends BaseModelDto {'
    )
    await assert.fileContains(
      'app/validators/test.ts',
      'export const testValidator = vine.compile('
    )

    // Check account DTO and validator content
    await assert.fileContains(
      'app/dtos/account.ts',
      'export default class AccountDto extends BaseModelDto {'
    )
    await assert.fileContains(
      'app/validators/account.ts',
      'export const accountValidator = vine.compile('
    )

    // Check user DTO and validator content
    await assert.fileContains(
      'app/dtos/user.ts',
      'export default class UserDto extends BaseModelDto {'
    )
    await assert.fileContains(
      'app/validators/user.ts',
      'export const userValidator = vine.compile('
    )
  })
})
