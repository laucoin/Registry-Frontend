const { createFileRule } = require('../_lib/create-file-rule')

function dto(options) {
    return createFileRule(options, {
        suffix: 'response.dto',
        classSuffix: 'ResponseDto',
        defaultPath: 'src/app/shared/models/dto/response',
        render: (className) => `export interface ${className} {\n}\n`,
    })
}

exports.dto = dto
