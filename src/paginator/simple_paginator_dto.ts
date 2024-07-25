import { LucidRow } from '@adonisjs/lucid/types/model'
import {
  SimplePaginatorDtoContract,
  SimplePaginatorDtoMetaContract,
  SimplePaginatorDtoMetaRange,
  StaticDto,
} from '../types.js'
import BaseDto from '../base/base_dto.js'
import { SimplePaginatorContract } from '@adonisjs/lucid/types/querybuilder'

export default class SimplePaginatorDto<Model extends LucidRow, Dto extends BaseDto>
  implements SimplePaginatorDtoContract<Dto>
{
  declare data: Dto[]
  declare meta: SimplePaginatorDtoMetaContract

  /**
   * Constructs a new instance of the SimplePaginatorDto class.
   *
   * @param {SimplePaginatorContract<Model>} paginator - The paginator object containing the data.
   * @param {StaticDto<Model, Dto>} dto - The static DTO class used to map the data.
   * @param {SimplePaginatorDtoMetaRange} [range] - Optional range for the paginator.
   */
  constructor(
    paginator: SimplePaginatorContract<Model>,
    dto: StaticDto<Model, Dto>,
    range?: SimplePaginatorDtoMetaRange
  ) {
    this.data = paginator.all().map((row) => new dto(row))

    this.meta = {
      total: paginator.total,
      perPage: paginator.perPage,
      currentPage: paginator.currentPage,
      lastPage: paginator.lastPage,
      firstPage: paginator.firstPage,
      firstPageUrl: paginator.getUrl(1),
      lastPageUrl: paginator.getUrl(paginator.lastPage),
      nextPageUrl: paginator.getNextPageUrl(),
      previousPageUrl: paginator.getPreviousPageUrl(),
    }

    if (range?.start || range?.end) {
      const start = range?.start || paginator.firstPage
      const end = range?.end || paginator.lastPage

      this.meta.pagesInRange = paginator.getUrlsForRange(start, end)
    }
  }
}
