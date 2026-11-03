import { effect, inject, Signal, untracked, WritableSignal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, ParamMap, Params, Router } from '@angular/router'
import { BooleanChoice } from '@shared/helpers/form/boolean-choice'

export type SearchQueryFieldKind = 'text' | 'choice' | 'date' | readonly string[]

export type SearchQuerySchema<T> = { [K in keyof T]?: SearchQueryFieldKind }

const BOOLEAN_CHOICES: readonly string[] = [ 'true', 'false' ] satisfies BooleanChoice[]

/**
 * Purpose: Convertit les query params d'une URL en valeurs du formulaire de recherche d'une liste.
 * Scope: Lit chaque champ du schéma ; une valeur absente ou invalide (choix inconnu, date illisible) prend la valeur par défaut.
 * Limits: Un champ dont le type est une liste de valeurs n'accepte que ces valeurs. Ne lit que les champs du schéma (un champ absent du schéma reste hors de l'URL) et ne valide pas les valeurs de texte libre (statuts, types) ; le backend reste l'autorité.
 */
export function parseSearchQuery<T extends object> (schema: SearchQuerySchema<T>, defaults: T, query: ParamMap): T {
    const parsed: T = { ...defaults }
    for (const key of Object.keys(schema) as (keyof T & string)[]) {
        const raw: string | null = query.get(key)
        if (raw !== null) {
            parsed[key] = parseField<T[typeof key]>(schema[key]!, raw, defaults[key])
        }
    }
    return parsed
}

/**
 * Purpose: Convertit les valeurs du formulaire de recherche d'une liste en query params.
 * Scope: Renvoie `null` pour un champ égal à sa valeur par défaut, ce qui le retire de l'URL lors d'une navigation en mode « merge ».
 * Limits: Ne navigue pas ; ne touche pas aux query params hors schéma.
 */
export function serializeSearchQuery<T extends object> (schema: SearchQuerySchema<T>, defaults: T, model: T): Params {
    const params: Params = {}
    for (const key of Object.keys(schema) as (keyof T & string)[]) {
        const value: string = serializeField(schema[key]!, model[key])
        params[key] = value === serializeField(schema[key]!, defaults[key]) ? null : value
    }
    return params
}

function parseField<V> (kind: SearchQueryFieldKind, raw: string, fallback: V): V {
    if (typeof kind !== 'string') {
        return (kind.includes(raw) ? raw : fallback) as V
    }
    if (kind === 'choice') {
        return (BOOLEAN_CHOICES.includes(raw) ? raw : fallback) as V
    }
    if (kind === 'date') {
        const date: Date = new Date(raw)
        return (Number.isNaN(date.getTime()) ? fallback : date) as V
    }
    return raw as V
}

function serializeField (kind: SearchQueryFieldKind, value: unknown): string {
    if (kind === 'date') {
        return value instanceof Date ? value.toISOString() : ''
    }
    return String(value ?? '')
}

export interface SearchQueryExtra<T> {
    read (query: ParamMap, parsed: T): T
    write (model: T): Params
}

export interface SearchQueryOptions<T extends object> {
    schema: SearchQuerySchema<T>
    defaults: T
    model: WritableSignal<T>
    apply: (model: T, initial: boolean) => void
    extra?: SearchQueryExtra<T>
}

export interface SearchQuery {
    write (): void
}

/**
 * Purpose: Garde le formulaire de recherche d'une liste et l'URL alignés, l'URL faisant foi.
 * Scope: Charge le formulaire depuis les query params à la création, le réaligne à chaque changement d'URL (retour arrière, lien modifié) et écrit le formulaire dans l'URL à la demande, sans empiler d'historique.
 * Limits: Doit être appelé dans un contexte d'injection ; `extra` ajoute les query params qui ne correspondent pas champ à champ au formulaire (tri). `apply` porte l'application des valeurs au store et le chargement (`initial` vaut true à la création), il n'est pas rappelé quand l'URL reflète déjà le formulaire.
 */
export function injectSearchQuery<T extends object> (options: SearchQueryOptions<T>): SearchQuery {
    const route: ActivatedRoute = inject(ActivatedRoute)
    const router: Router = inject(Router)
    const query: Signal<ParamMap> = toSignal(route.queryParamMap, { initialValue: route.snapshot.queryParamMap })

    options.model.set(readQuery(options, route.snapshot.queryParamMap))
    options.apply(options.model(), true)
    effect((): void => realign(options, readQuery(options, query())))

    return { write: (): void => writeQuery(options, router, route) }
}

function readQuery<T extends object> (options: SearchQueryOptions<T>, query: ParamMap): T {
    const parsed: T = parseSearchQuery(options.schema, options.defaults, query)
    return options.extra ? options.extra.read(query, parsed) : parsed
}

function queryParamsOf<T extends object> (options: SearchQueryOptions<T>, model: T): Params {
    return { ...serializeSearchQuery(options.schema, options.defaults, model), ...options.extra?.write(model) }
}

function queryKey<T extends object> (options: SearchQueryOptions<T>, model: T): string {
    return JSON.stringify(queryParamsOf(options, model))
}

function realign<T extends object> (options: SearchQueryOptions<T>, fromUrl: T): void {
    untracked((): void => {
        if (queryKey(options, fromUrl) !== queryKey(options, options.model())) {
            options.model.set(fromUrl)
            options.apply(fromUrl, false)
        }
    })
}

function writeQuery<T extends object> (options: SearchQueryOptions<T>, router: Router, route: ActivatedRoute): void {
    router.navigate([], {
        relativeTo: route,
        queryParams: queryParamsOf(options, options.model()),
        queryParamsHandling: 'merge',
        replaceUrl: true,
    }).then()
}
