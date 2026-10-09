const { externalSchematic } = require('@angular-devkit/schematics')

function page(options) {
    return externalSchematic('@schematics/angular', 'component', {
        name: options.name,
        project: options.project,
        path: options.path ?? 'src/app/pages',
        skipTests: options.skipTests ?? false,
        style: 'css',
        type: 'page',
        changeDetection: 'OnPush',
        skipSelector: true,
    })
}

exports.page = page
