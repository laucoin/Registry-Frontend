const { createFileRule } = require('../_lib/create-file-rule')

function mapper(options) {
    return createFileRule(options, {
        suffix: 'mapper',
        classSuffix: 'Mapper',
        defaultPath: 'src/app/shared/mappers',
        render: (className, base, dashed) =>
            `import { ${base}Model } from '@shared/models/model/${dashed}.model'\n` +
            `import { ${base}ResponseDto } from '@shared/models/dto/response/${dashed}.response.dto'\n\n` +
            `export class ${className} {\n` +
            `    public static toModel (dto: ${base}ResponseDto): ${base}Model {\n` +
            `        return {\n        }\n    }\n}\n`,
    })
}

exports.mapper = mapper
