import { computed, Directive, inject, input, InputSignal, Signal } from '@angular/core'
import { TranslocoService } from '@jsverse/transloco'
import { FieldErrorHelper } from '@shared/helpers/form/field-error.helper'
import { FieldErrorState } from '@shared/helpers/form/field-state.helper'

/**
 * Purpose: Affiche l'erreur d'un champ de signal form sous le champ `@sgdf/ui` qui l'édite.
 * Scope: Appliquée sous la forme `[appFieldError]="form.x"` avec un `translationPrefix` ; positionne l'attribut `error` de l'élément, qui dessine le message sous le champ et le marque invalide.
 * Limits: Cible un élément qui possède une propriété `error` ; n'affiche rien pour un champ valide ou vierge et non touché.
 */
@Directive({
    selector: '[appFieldError]',
    host: { '[attr.error]': 'message() ?? ""' },
})
export class FieldErrorDirective {
    private readonly translateService: TranslocoService = inject(TranslocoService)

    public readonly field: InputSignal<() => FieldErrorState> = input.required({ alias: 'appFieldError' })
    public readonly translationPrefix: InputSignal<string> = input.required()
    public readonly translationArgs: InputSignal<object> = input({})

    protected readonly message: Signal<string | undefined> = computed((): string | undefined =>
        FieldErrorHelper.text(
            this.field(),
            this.translationPrefix(),
            this.translationArgs(),
            (key: string, params: object): string => this.translateService.translate( key, params ),
        ),
    )
}
