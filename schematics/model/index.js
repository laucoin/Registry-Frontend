const { createFileRule } = require('../_lib/create-file-rule')

function model(options) {
    return createFileRule(options, {
        suffix: 'model',
        classSuffix: 'Model',
        defaultPath: 'src/app/shared/models/model',
        render: (className) => `export interface ${className} {\n}\n`,
    })
}

exports.model = model
