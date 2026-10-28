const { createFileRule, header } = require('../_lib/create-file-rule')

function helper(options) {
    return createFileRule(options, {
        suffix: 'helper',
        classSuffix: 'Helper',
        defaultPath: 'src/app/shared/helpers',
        render: (className) => `${header('<what it does>')}export class ${className} {\n}\n`,
    })
}

exports.helper = helper
