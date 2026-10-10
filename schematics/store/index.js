const { createFileRule, header } = require('../_lib/create-file-rule')

function store(options) {
    return createFileRule(options, {
        suffix: 'store',
        classSuffix: 'Store',
        defaultPath: 'src/app/pages/<name>/data/state',
        render: (className, base) =>
            `import { signalStore, withMethods, withState } from '@ngrx/signals'\n\n` +
            `interface ${base}StoreModel {\n}\n\n` +
            `${header('Holds the state of the ' + base + ' domain.')}` +
            `export const ${className} = signalStore(\n    { providedIn: 'root' },\n` +
            `    withState<${base}StoreModel>( {} ),\n    withMethods( () => ({}) ),\n)\n`,
    })
}

exports.store = store
