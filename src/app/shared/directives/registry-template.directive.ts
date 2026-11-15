import { Directive, inject, input, InputSignal, TemplateRef } from '@angular/core';

/**
 * Objectif: Nomme un template pour qu'un composant parent puisse le choisir par son nom.
 * Périmètre: Expose la référence du template sous un nom donné.
 * Limites: N'affiche pas le template lui-même.
 */
@Directive({
	selector: '[appTemplate]',
})
export class RegistryTemplateDirective {
	public appTemplate: InputSignal<string | undefined> = input.required();
	public template: TemplateRef<unknown> = inject(TemplateRef);
}
