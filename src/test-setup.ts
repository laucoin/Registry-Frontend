/**
 * Objectif: Complète l'environnement jsdom utilisé par les tests unitaires.
 * Périmètre: Écarte les avertissements de jsdom sur les feuilles de style des web components qu'il ne sait pas analyser, donne aux custom elements associés aux formulaires de @sgdf/ui les membres d'ElementInternals que jsdom n'a pas, aux éléments de dialogue les méthodes qui les ouvrent et les ferment, la liste d'animations que lisent les web components et un `ResizeObserver` qui n'observe rien.
 * Limites: Simples substituts ; chaque élément est valide, rien n'est validé ni soumis et un dialogue n'est pas affiché dans la top layer.
 */
interface JsdomErrorEmitter {
	removeAllListeners: (event: string) => void;
	on: (event: string, listener: (error: Error & { type?: string }) => void) => void;
}

const jsdomConsole: JsdomErrorEmitter | undefined = (globalThis as { jsdom?: { virtualConsole: JsdomErrorEmitter } })
	.jsdom?.virtualConsole;

jsdomConsole?.removeAllListeners('jsdomError');
jsdomConsole?.on('jsdomError', (error: Error & { type?: string }): void => {
	if (error.type !== 'css-parsing') console.error(error);
});

const attachInternals: typeof HTMLElement.prototype.attachInternals = HTMLElement.prototype.attachInternals;

const INTERNALS_FALLBACKS: Record<string, () => unknown> = {
	setFormValue: (): void => undefined,
	setValidity: (): void => undefined,
	checkValidity: (): boolean => true,
	reportValidity: (): boolean => true,
};

HTMLElement.prototype.attachInternals = function (this: HTMLElement): ElementInternals {
	const internals: ElementInternals = attachInternals.call(this);
	const members: Record<string, unknown> = internals as unknown as Record<string, unknown>;
	for (const [name, fallback] of Object.entries(INTERNALS_FALLBACKS)) members[name] ??= fallback;
	return Object.defineProperties(internals, {
		validity: { value: internals.validity ?? { valid: true } },
		validationMessage: { value: internals.validationMessage ?? '' },
		states: { value: internals.states ?? new Set<string>() },
	});
};

HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement): void {
	this.open = true;
};

HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement): void {
	this.open = false;
};

Element.prototype.getAnimations ??= function (): Animation[] {
	return [];
};

globalThis.ResizeObserver ??= class implements ResizeObserver {
	public observe(): void {
		return undefined;
	}

	public unobserve(): void {
		return undefined;
	}

	public disconnect(): void {
		return undefined;
	}
};
