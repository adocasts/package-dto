import { access, constants, readFile } from 'node:fs/promises'
import string from '@adonisjs/core/helpers/string'

export default class FileService {
  /**
   * Determines whether the provided file path exists and has allow-read permissions
   * @param filePath
   */
  static async canRead(filePath: string) {
    try {
      await access(filePath, constants.R_OK)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get's a files property declarations lines (declare | public)
   * @param filePath
   */
  static async readDeclarations(filePath: string) {
    const contents = await readFile(filePath, 'utf8')
    const fileLines = contents.split('\n')
    const classStartIndex = fileLines.findIndex((line) => line.includes('export default class '))
    const classEndIndex = fileLines.findLastIndex((line) => string.condenseWhitespace(line) === '}')

    const classLines = fileLines
      .slice(classStartIndex + 1, classEndIndex)
      .map((line) => string.condenseWhitespace(line))

    let isInBlock: boolean = false
    const definitions = classLines.filter((line) => {
      const propertyMatch = line.match(/^(declare |public |get |[0-9A-z])+/)
      const isDefinition = propertyMatch && !isInBlock

      if (line.endsWith('{')) isInBlock = true
      if (line.startsWith('}') && isInBlock) isInBlock = false

      return isDefinition
    })

    return { definitions, fileLines }
  }
}
