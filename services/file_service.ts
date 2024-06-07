import { access, constants, readFile } from 'node:fs/promises'

export default class FileService {
  static async canRead(filePath: string) {
    try {
      await access(filePath, constants.R_OK)
      return true
    } catch {
      return false
    }
  }

  static async readDeclarations(filePath: string) {
    const contents = await readFile(filePath, 'utf8')
    return contents
      .split('\n')
      .filter((line) => line.includes('declare ') || line.includes('public '))
  }
}
