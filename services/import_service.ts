import { DtoInfo } from './dto_service.js'
import string from '@adonisjs/core/helpers/string'

export type ImportMap = {
  name: string
  namespace: string
  isDefault: boolean
}

export class ImportService {
  static getImportStatements(dto: DtoInfo) {
    const imports: ImportMap[] = []

    for (let property of dto.properties) {
      for (let item of property.typeRaw) {
        if (item.isRelationship && item.dto) {
          imports.push({
            name: item.dto,
            namespace: '#dtos/' + string.snakeCase(item.dto).replace('_dto', ''),
            isDefault: true,
          })
        }
      }
    }

    const groups = this.#getGroupedImportNamespaces(imports)

    return Object.values(groups).map((items) => {
      const defaultImport = items.find((item) => item.isDefault)?.name
      const namedImports = items
        .filter((item) => !item.isDefault)
        .map((item) => item.name)
        .join(', ')

      const names = [defaultImport, namedImports && `{ ${namedImports} }`]
        .filter(Boolean)
        .join(', ')

      return `import ${names} from '${items[0].namespace}'`
    })
  }

  static #getGroupedImportNamespaces(imports: ImportMap[]) {
    return imports.reduce<Record<string, ImportMap[]>>((groups, item) => {
      const group = groups[item.namespace] || []

      if (!group.some((map) => map.name === item.name)) {
        group.push(item)
      }

      groups[item.namespace] = group

      return groups
    }, {})
  }
}
