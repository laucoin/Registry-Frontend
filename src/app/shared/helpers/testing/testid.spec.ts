import { describe, expect, it } from 'vitest'

interface FsApi {
    readdirSync: (path: string, options: { withFileTypes: true }) => { name: string, isDirectory: () => boolean }[]
    readFileSync: (path: string, encoding: 'utf8') => string
}

interface TemplateTag {
    tag: string
    attributes: string
}

const TEST_ID_PATTERN: RegExp = /^[a-z0-9]+(-[a-z0-9]+)+$/
const INTERACTIVE_TAGS: ReadonlySet<string> = new Set( [
    'sgdf-button', 'sgdf-icon-button', 'sgdf-input', 'sgdf-select', 'sgdf-textarea', 'sgdf-date-time-picker', 'sgdf-switch',
    'sgdf-checkbox', 'sgdf-number-input', 'sgdf-duration-picker', 'sgdf-copy-button', 'sgdf-nav-item', 'sgdf-menu-item',
    'sgdf-tab', 'sgdf-tile', 'sgdf-dialog', 'sgdf-drawer', 'form', 'button', 'app-list', 'app-section-error', 'app-load-more',
    'app-form-dialog', 'app-form-actions', 'app-element-actions', 'app-favorite-toggle', 'app-select-elements-field',
    'app-number-range-field',
] )

function processCwd (): string {
    return (globalThis as unknown as { process: { cwd: () => string } }).process.cwd()
}

async function templatePaths (fs: FsApi, directory: string): Promise<string[]> {
    const entries: { name: string, isDirectory: () => boolean }[] = fs.readdirSync( directory, { withFileTypes: true } )
    const nested: string[][] = await Promise.all( entries.map( async (entry: { name: string, isDirectory: () => boolean }): Promise<string[]> => {
        const path: string = `${ directory }/${ entry.name }`
        if (entry.isDirectory()) return templatePaths( fs, path )
        return entry.name.endsWith( '.html' ) ? [ path ] : []
    } ) )
    return nested.flat()
}

function tagsOf (template: string): TemplateTag[] {
    const tags: TemplateTag[] = []
    for (const match of template.matchAll( /<([a-z][a-z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g )) {
        tags.push( { tag: match[ 1 ], attributes: match[ 2 ] } )
    }
    return tags
}

function testIdsOf (tags: TemplateTag[]): string[] {
    return tags
        .map( (it: TemplateTag): string | undefined => /\sdata-testid="([^"]+)"/.exec( it.attributes )?.[ 1 ] )
        .filter( (it: string | undefined): it is string => it !== undefined )
}

describe( 'data-testid of the templates', () => {
    let templates: Record<string, string>

    async function load (): Promise<Record<string, string>> {
        const fs: FsApi = await import( /* @vite-ignore */ 'node:fs' as string ) as unknown as FsApi
        const paths: string[] = await templatePaths( fs, `${ processCwd() }/src` )
        return Object.fromEntries( paths.map( (path: string): [ string, string ] => [ path, fs.readFileSync( path, 'utf8' ) ] ) )
    }

    it( 'marks every interactive element', async () => {
        // Arrange
        templates = await load()

        // Act
        const missing: string[] = Object.entries( templates ).flatMap( ([ path, template ]: [ string, string ]): string[] =>
            tagsOf( template )
                .filter( (it: TemplateTag): boolean => INTERACTIVE_TAGS.has( it.tag ) && !/\sdata-testid="/.test( it.attributes ) )
                .map( (it: TemplateTag): string => `${ path } <${ it.tag }>` ) )

        // Assert
        expect( Object.keys( templates ).length ).toBeGreaterThan( 50 )
        expect( missing ).toEqual( [] )
    } )

    it( 'never repeats a test id inside a template', async () => {
        // Arrange
        templates = await load()

        // Act
        const duplicated: string[] = Object.entries( templates ).flatMap( ([ path, template ]: [ string, string ]): string[] => {
            const ids: string[] = testIdsOf( tagsOf( template ) )
            return ids.filter( (id: string, index: number): boolean => ids.indexOf( id ) !== index ).map( (id: string): string => `${ path } ${ id }` )
        } )

        // Assert
        expect( duplicated ).toEqual( [] )
    } )

    it( 'writes every test id as lowercase kebab words', async () => {
        // Arrange
        templates = await load()

        // Act
        const invalid: string[] = Object.values( templates )
            .flatMap( (template: string): string[] => testIdsOf( tagsOf( template ) ) )
            .filter( (id: string): boolean => !TEST_ID_PATTERN.test( id ) )

        // Assert
        expect( invalid ).toEqual( [] )
    } )
} )
