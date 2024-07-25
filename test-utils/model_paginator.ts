import { SimplePaginator } from '@adonisjs/lucid/database'
import { CherryPick, ModelPaginatorContract } from '@adonisjs/lucid/types/model'

export class ModelPaginator extends SimplePaginator implements ModelPaginatorContract<any> {
  /**
   * Serialize models
   */
  serialize(cherryPick?: CherryPick) {
    return {
      meta: this.getMeta(),
      data: this.all().map((row) => row.serialize(cherryPick)),
    }
  }
}
