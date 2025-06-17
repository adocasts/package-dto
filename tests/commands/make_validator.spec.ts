import { test } from '@japa/runner'
import { AceFactory } from '@adonisjs/core/factories'
import MakeValidator from '../../commands/make_validator.js'

test.group('MakeValidator', (group) => {
  group.each.teardown(async ({ context }) => {
    delete process.env.ADONIS_ACE_CWD
    await context.fs.remove('app/validators')
  })

  test('make a plain validator not referencing a model', async ({ fs, assert }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakeValidator, ['Plain'])
    await command.exec()

    command.assertLog('green(DONE:)    create app/validators/plain.ts')
    await assert.fileContains(
      'app/validators/plain.ts',
      'export const plainValidator = vine.compile('
    )
  })

  test('make a validator referencing a model', async ({ fs, assert }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakeValidator, ['Test'])
    await command.exec()

    command.assertLog('green(DONE:)    create app/validators/test.ts')
    await assert.fileContains(
      'app/validators/test.ts',
      'export const testValidator = vine.compile('
    )
    await assert.fileContains(
      'app/validators/test.ts',
      'import Test from \'#models/test\''
    )
  })

  test('make a validator referencing a model with a different name', async ({ fs, assert }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakeValidator, ['some_test', '--model=test'])
    await command.exec()

    command.assertLog('green(DONE:)    create app/validators/some_test.ts')
    await assert.fileContains(
      'app/validators/some_test.ts',
      'export const someTestValidator = vine.compile('
    )
    await assert.fileContains(
      'app/validators/some_test.ts',
      'import Test from \'#models/test\''
    )
  })

  test('make a validator from a model with various property types', async ({
    fs,
    assert,
  }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakeValidator, ['account'])
    await command.exec()

    command.assertLog('green(DONE:)    create app/validators/account.ts')
    await assert.fileContains(
      'app/validators/account.ts',
      'export const accountValidator = vine.compile('
    )
    await assert.fileContains(
      'app/validators/account.ts',
      'import Account from \'#models/account\''
    )

    // Check for string validation
    await assert.fileContains(
      'app/validators/account.ts',
      'name: vine.string().trim(),'
    )

    // Check for optional validation
    await assert.fileContains(
      'app/validators/account.ts',
      '.optional()'
    )
  })
})
