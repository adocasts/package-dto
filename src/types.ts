export type StaticDto<Model, Dto> = { new (model: Model): Dto }

export interface SimplePaginatorDtoContract<Dto> {
  data: Dto[]
  meta: SimplePaginatorDtoMetaContract
}

export interface SimplePaginatorDtoMetaContract {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
  firstPage: number
  firstPageUrl: string
  lastPageUrl: string
  nextPageUrl: string | null
  previousPageUrl: string | null
  pagesInRange?: {
    url: string
    page: number
    isActive: boolean
  }[]
}

export type SimplePaginatorDtoMetaRange = {
  start: number
  end: number
}
