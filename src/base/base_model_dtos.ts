import { LucidRow } from '@adonisjs/lucid/types/model'
import { SimplePaginatorDtoMetaRange, StaticDto } from '../types.js'
import SimplePaginatorDto from '../paginator/simple_paginator_dto.js'
import BaseDto from './base_dto.js'
import { SimplePaginatorContract } from '@adonisjs/lucid/types/querybuilder'

export default class BaseModelDto extends BaseDto {
  /**
   * Creates a new instance of the SimplePaginatorDto class using the provided paginator and DTO.
   *
   * @template Model - The type of the LucidRow model.
   * @template Dto - The type of the BaseDto.
   * @param {SimplePaginatorContract<Model>} paginator - The paginator to use for the SimplePaginatorDto.
   * @param {SimplePaginatorDtoMetaRange} [range] - The range of pages to include in the SimplePaginatorDto.
   * @return {SimplePaginatorDto<Model, Dto>} - The created SimplePaginatorDto.
   */
  static fromPaginator<Model extends LucidRow, Dto extends BaseDto>(
    this: StaticDto<Model, Dto>,
    paginator: SimplePaginatorContract<Model>,
    range?: SimplePaginatorDtoMetaRange
  ) {
    return new SimplePaginatorDto(paginator, this, range)
  }
}
