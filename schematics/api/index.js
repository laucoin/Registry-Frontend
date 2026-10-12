const { createFileRule, header } = require('../_lib/create-file-rule')

function api(options) {
    return createFileRule(options, {
        suffix: 'api',
        classSuffix: 'Api',
        defaultPath: 'src/app/pages/<name>/data/state',
        render: (className, base, dashed) =>
            `import { Injectable } from '@angular/core'\nimport { GenericApi } from '@shared/helpers/api/generic.api'\n\n` +
            `${header('Sends the HTTP requests of the ' + dashed + ' domain.')}` +
            `@Injectable({ providedIn: 'root' })\nexport class ${className} extends GenericApi {\n` +
            `    public constructor () {\n        super('/api/v1/${dashed}')\n    }\n}\n`,
    })
}

exports.api = api
