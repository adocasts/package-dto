import { test } from '@japa/runner'
import { AceFactory } from '@adonisjs/core/factories'
import GenerateValidators from '../../commands/generate_validators.js'

test.group('GenerateValidators', (group) => {
  group.each.teardown(async ({ context }) => {
    delete process.env.ADONIS_ACE_CWD
    await context.fs.remove('app/validators')
  })

  test('generate validators for all models', async ({ fs, assert }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(GenerateValidators, [])
    await command.exec()

    // Check that validators were created for test models
    command.assertLog('green(DONE:)    create app/validators/test.ts')
    command.assertLog('green(DONE:)    create app/validators/account.ts')
    command.assertLog('green(DONE:)    create app/validators/user.ts')

    // Check test validator content
    await assert.fileContains(
      'app/validators/test.ts',
      'export const testValidator = vine.compile('
    )
    await assert.fileContains('app/validators/test.ts', "import Test from '#models/test'")

    // Check account validator content
    await assert.fileContains(
      'app/validators/account.ts',
      'export const accountValidator = vine.compile('
    )
    await assert.fileContains('app/validators/account.ts', "import Account from '#models/account'")

    // Check user validator content
    await assert.fileContains(
      'app/validators/user.ts',
      'export const userValidator = vine.compile('
    )
    await assert.fileContains('app/validators/user.ts', "import User from '#models/user'")
  })
})
