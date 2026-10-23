const { strings, SchematicsException } = require('@angular-devkit/schematics')

/**
 * Purpose: Builds the schematic rule that creates one source file named after the requested name.
 * Scope: Resolves the target path, the dasherized file name and the classified class name.
 * Limits: Creates a single file and never overwrites an existing one.
 */
function createFileRule(options, { suffix, classSuffix, defaultPath, render }) {
    const dasherizedName = strings.dasherize(options.name)
    const folder = (options.path ?? defaultPath).replace('<name>', dasherizedName)
    const targetPath = `${folder}/${dasherizedName}.${suffix}.ts`
    const classifiedName = `${strings.classify(options.name)}${classSuffix}`

    return (tree) => {
        if (tree.exists(targetPath)) {
            throw new SchematicsException(`File ${targetPath} already exists.`)
        }
        tree.create(targetPath, render(classifiedName, strings.classify(options.name), dasherizedName))
        return tree
    }
}

/**
 * Builds the file-level JSDoc header required on every non-trivial unit.
 */
function header(purpose) {
    return `/**\n * Purpose: ${purpose}\n * Scope: <what it owns / is responsible for>\n * Limits: <what it deliberately does not do>\n */\n`
}

exports.createFileRule = createFileRule
exports.header = header
