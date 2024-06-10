import { test } from '@japa/runner'
import { AceFactory } from '@adonisjs/core/factories'
import MakeDto from '../../commands/make_dto.js'

test.group('MakeAction', (group) => {
  group.each.teardown(async ({ context }) => {
    delete process.env.ADONIS_ACE_CWD
    await context.fs.remove('app/dtos')
  })

  test('make a plain dto not referencing a model', async ({ fs, assert }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakeDto, ['Plain'])
    await command.exec()

    command.assertLog('green(DONE:)    create app/dtos/plain.ts')
    await assert.fileContains('app/dtos/plain.ts', 'export default class PlainDto {}')
  })

  test('make a dto referencing a model', async ({ fs, assert }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakeDto, ['Test'])
    await command.exec()

    const expectedContents = await fs.contents('expectations/test.txt')

    command.assertLog('green(DONE:)    create app/dtos/test.ts')
    await assert.fileContains('app/dtos/test.ts', 'export default class TestDto {')
    await assert.fileEquals('app/dtos/test.ts', expectedContents.trim())
  })

  test('make a dto referencing a model with a different name', async ({ fs, assert }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakeDto, ['some_test', '--model=test'])
    await command.exec()

    const expectedContents = await fs.contents('expectations/some_test.txt')

    command.assertLog('green(DONE:)    create app/dtos/some_test.ts')
    await assert.fileContains('app/dtos/some_test.ts', 'export default class SomeTestDto {')
    await assert.fileEquals('app/dtos/some_test.ts', expectedContents.trim())
  })

  test('make a dto from a model with unmapped properties, getters, and default values', async ({
    fs,
    assert,
  }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakeDto, ['account'])
    await command.exec()

    const expectedContents = await fs.contents('expectations/account.txt')

    command.assertLog('green(DONE:)    create app/dtos/account.ts')
    await assert.fileContains('app/dtos/account.ts', 'export default class AccountDto {')
    await assert.fileEquals('app/dtos/account.ts', expectedContents.trim())
  })

  test('make a dto from a model additional definitions outside the model', async ({
    fs,
    assert,
  }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(MakeDto, ['user'])
    await command.exec()

    const expectedContents = await fs.contents('expectations/user.txt')

    command.assertLog('green(DONE:)    create app/dtos/user.ts')
    await assert.fileContains('app/dtos/user.ts', 'export default class UserDto {')
    await assert.fileEquals('app/dtos/user.ts', expectedContents.trim())
  })
})
