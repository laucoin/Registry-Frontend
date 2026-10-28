const { strings, SchematicsException } = require('@angular-devkit/schematics')

/**
 * Purpose: Construit la règle de schematic qui crée un fichier source nommé d'après le nom demandé.
 * Scope: Résout le chemin cible, le nom de fichier en kebab-case et le nom de classe en PascalCase.
 * Limits: Crée un seul fichier et n'écrase jamais un fichier existant.
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
 * Construit l'en-tête JSDoc de fichier requis sur toute unité non triviale.
 */
function header(purpose) {
    return `/**\n * Purpose: ${purpose}\n * Scope: <ce qu'il possède / dont il est responsable>\n * Limits: <ce qu'il ne fait volontairement pas>\n */\n`
}

exports.createFileRule = createFileRule
exports.header = header
