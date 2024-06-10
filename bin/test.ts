import { assert } from '@japa/assert'
import { configure, processCLIArgs, run } from '@japa/runner'
import { fileSystem } from '@japa/file-system'

processCLIArgs(process.argv.splice(2))

configure({
  files: ['tests/**/*.spec.ts'],
  plugins: [
    assert(),
    fileSystem({ basePath: new URL('../test-files', import.meta.url), autoClean: false }),
  ],
})

run()
