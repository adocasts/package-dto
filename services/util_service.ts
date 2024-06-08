export default class UtilService {
  static cleanDefinition(part: string) {
    return part
      .replace('get ', '')
      .replace('(', '')
      .replace(')', '')
      .replace('?', '')
      .replace('{', '')
      .replace('}', '')
      .replaceAll("'", '')
      .replaceAll('"', '')
      .trim()
  }

  static getTypeAndValue(part: string) {
    let [typeString = '', valueString = ''] = part
      .split('=')
      .map((t) => (t.trim() === '' ? undefined : t))
      .filter(Boolean)

    typeString = this.cleanDefinition(typeString)

    return {
      typeString,
      valueString: valueString.trim(),
    }
  }

  static getDefaultType(name: string) {
    if (name.startsWith('is')) {
      return 'boolean'
    }

    return 'string'
  }
}
