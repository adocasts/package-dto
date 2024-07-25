import { StaticDto } from '../types.js'

export default class BaseDto {
  /**
   * Creates an array of DTO objects from an array of source objects.
   *
   * @template SourceObject - The type of the source objects.
   * @template Dto - The type of the DTO objects.
   * @param {StaticDto<SourceObject, Dto>} this - The static DTO class.
   * @param {SourceObject[]} sources - The array of source objects.
   * @return {Dto[]} An array of DTO objects.
   */
  static fromArray<SourceObject, Dto extends BaseDto>(
    this: StaticDto<SourceObject, Dto>,
    sources: SourceObject[]
  ) {
    if (!sources) return []
    return sources.map((source) => new this(source))
  }
}
