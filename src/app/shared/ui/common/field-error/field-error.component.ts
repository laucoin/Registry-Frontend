import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input, InputSignal, Signal } from '@angular/core'
import '@sgdf/ui/callout'
import { TranslocoService } from '@jsverse/transloco'
import { FieldErrorHelper } from '@shared/helpers/form/field-error.helper'
import { FieldErrorState } from '@shared/helpers/form/field-state.helper'

/**
 * Purpose: Affiche la première erreur d'un champ de signal form.
 * Scope: Traduit le type d'erreur sous le préfixe donné avec ses paramètres une fois le champ touché ou modifié ; utilisé pour ce qui n'a pas de champ `@sgdf/ui` pour porter l'erreur (une plage, un formulaire entier).
 * Limits: N'affiche rien pour un champ valide ou vierge et non touché. Un champ `@sgdf/ui` affiche sa propre erreur avec la directive `appFieldError`.
 */
@Component({
    selector: 'app-field-error',
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './field-error.component.html',
})
export class FieldErrorComponent {
    private readonly translateService: TranslocoService = inject(TranslocoService)

    public readonly field: InputSignal<() => FieldErrorState> = input.required()
    public readonly translationPrefix: InputSignal<string> = input.required()
    public readonly translationArgs: InputSignal<object> = input({})

    protected readonly errorText: Signal<string | undefined> = computed((): string | undefined =>
        FieldErrorHelper.text(
            this.field(),
            this.translationPrefix(),
            this.translationArgs(),
            (key: string, params: object): string => this.translateService.translate( key, params ),
        ),
    )
}
