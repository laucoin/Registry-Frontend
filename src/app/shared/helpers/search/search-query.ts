import { effect, inject, untracked, WritableSignal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Params, Router } from '@angular/router';

import { debounceTime } from 'rxjs';

import { DEFAULT_LIST_CONFIG } from '@core/config/model/config.model';
import { RegistryConfig } from '@core/config/registry.config';
import { BooleanChoice } from '@shared/helpers/form/boolean-choice';

export type SearchQueryFieldKind = 'text' | 'choice' | 'date' | readonly string[];

export type SearchQuerySchema<T> = { [K in keyof T]?: SearchQueryFieldKind };

const BOOLEAN_CHOICES: readonly string[] = ['true', 'false'] satisfies BooleanChoice[];

/**
 * Purpose: Convertit les query params d'une URL en valeurs du formulaire de recherche d'une liste.
 * Scope: Lit chaque champ du schéma ; une valeur absente ou invalide (choix inconnu, date illisible) prend la valeur par défaut.
 * Limits: Un champ dont le type est une liste de valeurs n'accepte que ces valeurs. Ne lit que les champs du schéma (un champ absent du schéma reste hors de l'URL) et ne valide pas les valeurs de texte libre (statuts, types) ; le backend reste l'autorité.
 */
export function parseSearchQuery<T extends object>(schema: SearchQuerySchema<T>, defaults: T, query: ParamMap): T {
	const parsed = { ...defaults };
	for (const key of Object.keys(schema) as (keyof T & string)[]) {
		const kind: SearchQueryFieldKind | undefined = schema[key];
		const raw = query.get(key);
		if (kind && raw !== null) {
			parsed[key] = parseField<T[typeof key]>(kind, raw, defaults[key]);
		}
	}
	return parsed;
}

/**
 * Purpose: Convertit les valeurs du formulaire de recherche d'une liste en query params.
 * Scope: Renvoie `null` pour un champ égal à sa valeur par défaut, ce qui le retire de l'URL lors d'une navigation en mode « merge ».
 * Limits: Ne navigue pas ; ne touche pas aux query params hors schéma.
 */
export function serializeSearchQuery<T extends object>(schema: SearchQuerySchema<T>, defaults: T, model: T): Params {
	const params: Params = {};
	for (const key of Object.keys(schema) as (keyof T & string)[]) {
		const kind: SearchQueryFieldKind | undefined = schema[key];
		if (!kind) continue;
		const value = serializeField(kind, model[key]);
		params[key] = value === serializeField(kind, defaults[key]) ? null : value;
	}
	return params;
}

function parseField<V>(kind: SearchQueryFieldKind, raw: string, fallback: V): V {
	if (typeof kind !== 'string') return oneOf(kind, raw, fallback) as V;
	if (kind === 'choice') return oneOf(BOOLEAN_CHOICES, raw, fallback) as V;
	if (kind === 'date') return parseDate(raw, fallback) as V;
	return raw as V;
}

function oneOf<V>(allowed: readonly string[], raw: string, fallback: V): V | string {
	return allowed.includes(raw) ? raw : fallback;
}

function parseDate<V>(raw: string, fallback: V): V | Date {
	const date = new Date(raw);
	return Number.isNaN(date.getTime()) ? fallback : date;
}

function serializeField(kind: SearchQueryFieldKind, value: unknown): string {
	if (kind === 'date') {
		return value instanceof Date ? value.toISOString() : '';
	}
	return String(value ?? '');
}

export interface SearchQueryExtra<T> {
	read(query: ParamMap, parsed: T): T;
	write(model: T): Params;
}

export interface SearchQueryOptions<T extends object> {
	schema: SearchQuerySchema<T>;
	defaults: T;
	model: WritableSignal<T>;
	apply: (model: T, initial: boolean) => void;
	search: (model: T) => void;
	extra?: SearchQueryExtra<T>;
}

export interface SearchQuery<T extends object = object> {
	write(model?: T): void;
	submit(): void;
}

class AppliedSearch<T extends object> {
	public model: T;
	public key: string | undefined;

	constructor(model: T, key: string | undefined) {
		this.model = model;
		this.key = key;
	}

	public record(model: T, key: string | undefined): void {
		this.model = model;
		this.key = key;
	}
}

const TEXT_SEARCH_KEY = 'q';

/**
 * Purpose: Garde le formulaire de recherche d'une liste et l'URL alignés, l'URL faisant foi.
 * Scope: Charge le formulaire depuis les query params à la création, le réaligne à chaque changement d'URL (retour arrière, lien modifié), écrit la recherche appliquée dans l'URL à la demande, sans empiler d'historique, et lance `search` après un délai quand le formulaire change ; `submit` lance `search` tout de suite avec le formulaire tel quel.
 * Limits: Doit être appelé dans un contexte d'injection ; `extra` ajoute les query params qui ne correspondent pas champ à champ au formulaire (tri). `apply` porte l'application des valeurs au store et le chargement (`initial` vaut true à la création), il n'est pas rappelé quand l'URL reflète déjà la recherche appliquée. `search` reçoit le modèle recherché et doit le passer à `write` : lors d'une recherche automatique, un texte `q` plus court que le seuil configuré garde sa dernière valeur appliquée. Aucune recherche n'est lancée si le modèle recherché égale la dernière recherche appliquée.
 */
export function injectSearchQuery<T extends object>(options: SearchQueryOptions<T>): SearchQuery<T> {
	const route = inject(ActivatedRoute);
	const router = inject(Router);
	const query = toSignal(route.queryParamMap, { initialValue: route.snapshot.queryParamMap });

	options.model.set(readQuery(options, route.snapshot.queryParamMap));
	options.apply(options.model(), true);
	const applied = new AppliedSearch(options.model(), safeQueryKey(options, options.model()));
	effect(() => realign(options, readQuery(options, query()), applied));
	searchOnChange(options, applied);

	return {
		write: (model: T = options.model()) => {
			applied.model = model;
			applied.key = safeQueryKey(options, model);
			writeQuery(options, router, route, model);
		},
		submit: () => searchIfChanged(options, applied, true),
	};
}

function searchOnChange<T extends object>(options: SearchQueryOptions<T>, applied: AppliedSearch<T>): void {
	toObservable(options.model)
		.pipe(debounceTime((RegistryConfig.config?.list ?? DEFAULT_LIST_CONFIG).searchDebounce), takeUntilDestroyed())
		.subscribe(() => searchIfChanged(options, applied, false));
}

function searchIfChanged<T extends object>(
	options: SearchQueryOptions<T>,
	applied: AppliedSearch<T>,
	forced: boolean,
): void {
	const model =
		forced || isTextSearchable(options.model()) ? options.model() : withAppliedText(options.model(), applied.model);
	const key = safeQueryKey(options, model);
	if (key !== undefined && key !== applied.key) {
		options.search(model);
	}
}

function isTextSearchable(model: object): boolean {
	const text = (model as Record<string, unknown>)[TEXT_SEARCH_KEY];
	const minLength = (RegistryConfig.config?.list ?? DEFAULT_LIST_CONFIG).searchMinLength;
	return typeof text !== 'string' || text.length === 0 || text.length >= minLength;
}

function withAppliedText<T extends object>(model: T, appliedModel: T): T {
	return { ...model, [TEXT_SEARCH_KEY]: (appliedModel as Record<string, unknown>)[TEXT_SEARCH_KEY] };
}

function safeQueryKey<T extends object>(options: SearchQueryOptions<T>, model: T): string | undefined {
	try {
		return queryKey(options, model);
	} catch {
		return undefined;
	}
}

function readQuery<T extends object>(options: SearchQueryOptions<T>, query: ParamMap): T {
	const parsed = parseSearchQuery(options.schema, options.defaults, query);
	return options.extra ? options.extra.read(query, parsed) : parsed;
}

function queryParamsOf<T extends object>(options: SearchQueryOptions<T>, model: T): Params {
	return { ...serializeSearchQuery(options.schema, options.defaults, model), ...options.extra?.write(model) };
}

function queryKey<T extends object>(options: SearchQueryOptions<T>, model: T): string {
	return JSON.stringify(queryParamsOf(options, model));
}

function realign<T extends object>(options: SearchQueryOptions<T>, fromUrl: T, applied: AppliedSearch<T>): void {
	untracked(() => {
		if (queryKey(options, fromUrl) !== applied.key) {
			options.model.set(fromUrl);
			applied.record(fromUrl, safeQueryKey(options, fromUrl));
			options.apply(fromUrl, false);
		}
	});
}

function writeQuery<T extends object>(
	options: SearchQueryOptions<T>,
	router: Router,
	route: ActivatedRoute,
	model: T,
): void {
	router
		.navigate([], {
			relativeTo: route,
			queryParams: queryParamsOf(options, model),
			queryParamsHandling: 'merge',
			replaceUrl: true,
		})
		.then();
}
