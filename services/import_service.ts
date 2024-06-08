import { DtoInfo, DtoProperty } from './dto_service.js'
import string from '@adonisjs/core/helpers/string'
import UtilService from './util_service.js'

export type ImportMap = {
  name: string
  namespace: string
  isDefault: boolean
}

export type ImportLine = {
  name: string
  names: string[]
  namespace: string
  line: string
}

export class ImportService {
  /**
   * Get grouped import statements from generated DTO type information
   * @param dto
   */
  static getImportStatements(dto: DtoInfo, modelFileLines: string[]) {
    const imports: ImportMap[] = []
    const importLines = this.#getImportFileLines(modelFileLines)

    for (let property of dto.properties) {
      // get imports for relationship DTOs
      for (let item of property.typeRaw) {
        if (item.isRelationship && item.dto) {
          imports.push({
            name: item.dto,
            namespace: '#dtos/' + string.snakeCase(item.dto).replace('_dto', ''),
            isDefault: true,
          })
        }
      }

      const importMatch = this.#findImportLineMatch(property, importLines)

      if (importMatch) {
        imports.push(importMatch)
      }
    }

    // don't try to import the DTO we're generating
    const nonSelfReferencingImports = imports.filter((imp) => imp.name !== dto.className)

    // join default and named imports into a single import statement for the namespace
    return this.#buildImportStatements(nonSelfReferencingImports)
  }

  static #buildImportStatements(imports: ImportMap[]) {
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

  /**
   * groups imports by namespace
   * @param imports
   * @private
   */
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

  static #getImportFileLines(fileLines: string[]): ImportLine[] {
    const lines = fileLines.filter((line) => line.startsWith('import '))
    return lines.map((line) => {
      const part = line.replace('import ', '').replace('type ', '').split('from ').at(0)
      const namespace = line.split('from ').at(1) || ''
      const [defaultPart = '', namedPart = ''] = part?.split('{') || []
      const names =
        namedPart
          .split('}')
          .at(0)
          ?.split(',')
          .map((name) => name.trim()) || []

      return {
        name: UtilService.cleanDefinition(defaultPart),
        names: names.filter((name) => name !== ''),
        namespace,
        line,
      }
    })
  }

  static #findImportLineMatch(property: DtoProperty, lines: ImportLine[]) {
    const types = property.type.split('|').map((type) => type.trim())
    const defaultMatch = lines.find((line) => types.includes(line.name))

    if (defaultMatch) {
      return {
        name: defaultMatch.name,
        namespace: UtilService.cleanDefinition(defaultMatch.namespace),
        isDefault: true,
      }
    }

    let namedMatch: { name: string; namespace: string } | undefined

    for (const line of lines) {
      const name = line.names.find((item) => types.includes(item))
      if (!name) continue
      namedMatch = { name, namespace: line.namespace }
      break
    }

    if (!namedMatch) return

    return {
      name: namedMatch.name,
      namespace: UtilService.cleanDefinition(namedMatch.namespace),
      isDefault: false,
    }
  }
}
