const { createFileRule, header } = require('../_lib/create-file-rule')

function service(options) {
    return createFileRule(options, {
        suffix: 'service',
        classSuffix: 'Service',
        defaultPath: 'src/app/shared/helpers/service',
        render: (className) =>
            `import { Injectable } from '@angular/core'\n\n${header('<what it does>')}` +
            `@Injectable({ providedIn: 'root' })\nexport class ${className} {\n}\n`,
    })
}

exports.service = service
