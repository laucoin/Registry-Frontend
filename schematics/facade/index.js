const { createFileRule, header } = require('../_lib/create-file-rule')

function facade(options) {
    return createFileRule(options, {
        suffix: 'facade',
        classSuffix: 'Facade',
        defaultPath: 'src/app/pages/<name>/data/state',
        render: (className, base, dashed) =>
            `import { inject, Injectable } from '@angular/core'\n` +
            `import { GenericFacade } from '@shared/helpers/facade/generic.facade'\n` +
            `import { ${base}Store } from './${dashed}.store'\n\n` +
            `${header('Public entry point of the ' + base + ' domain for pages, components and guards.')}` +
            `@Injectable()\nexport class ${className} extends GenericFacade {\n` +
            `    private readonly store: InstanceType<typeof ${base}Store> = inject( ${base}Store )\n}\n`,
    })
}

exports.facade = facade
