import { test } from '@japa/runner'
import { BaseDto, BaseModelDto } from '../../src/base/main.js'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { SimplePaginator } from '@adonisjs/lucid/database'
import SimplePaginatorDto from '../../src/paginator/simple_paginator_dto.js'

test.group('Internal DTOs', (group) => {
  group.each.teardown(async ({ context }) => {
    delete process.env.ADONIS_ACE_CWD
    await context.fs.remove('app/dtos')
  })

  test('should add type-safe fromArray utility on BaseDto', async ({ assert }) => {
    class Test {
      declare id: number
      constructor(id: number) {
        this.id = id
      }
    }

    class TestDto extends BaseDto {
      declare id: number
      constructor(instance: Test) {
        super()
        this.id = instance.id
      }
    }

    const dtoArray = TestDto.fromArray([new Test(1), new Test(2), new Test(3)])

    assert.isArray(dtoArray)

    dtoArray.map((dto) => assert.instanceOf(dto, TestDto))
  })

  test('should add type-safe fromArray utility on BaseModelDto', async ({ assert }) => {
    class Test extends BaseModel {
      @column()
      declare id: number
    }

    class TestDto extends BaseModelDto {
      declare id: number
      constructor(instance: Test) {
        super()
        this.id = instance.id
      }
    }

    const test1 = new Test().merge({ id: 1 })
    const test2 = new Test().merge({ id: 2 })
    const test3 = new Test().merge({ id: 3 })

    const dtoArray = TestDto.fromArray([test1, test2, test3])

    assert.isArray(dtoArray)

    dtoArray.map((dto) => assert.instanceOf(dto, TestDto))
  })

  test('should allow conversion to SimplePaginatorDto for Lucid Models', async ({ assert }) => {
    class Test extends BaseModel {
      @column()
      declare id: number
    }

    class TestDto extends BaseModelDto {
      declare id: number
      constructor(instance: Test) {
        super()
        this.id = instance.id
      }
    }

    const test1 = new Test().merge({ id: 1 })
    const test2 = new Test().merge({ id: 2 })
    const test3 = new Test().merge({ id: 3 })

    const paginator = new SimplePaginator(3, 2, 1, test1, test2, test3)
    const paginatorDto = TestDto.fromPaginator(paginator, { start: 1, end: 2 })

    assert.instanceOf(paginatorDto, SimplePaginatorDto)
    assert.isArray(paginatorDto.data)
    assert.lengthOf(paginatorDto.meta.pagesInRange!, 2)

    paginatorDto.data.map((dto) => assert.instanceOf(dto, TestDto))
  })
})
