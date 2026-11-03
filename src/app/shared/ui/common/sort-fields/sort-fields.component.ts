import '@sgdf/ui/option'
import '@sgdf/ui/select'
import { Component, CUSTOM_ELEMENTS_SCHEMA, input, InputSignal } from '@angular/core'
import { FieldTree, FormField } from '@angular/forms/signals'
import { TranslocoPipe } from '@jsverse/transloco'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { SortDirection } from '@shared/helpers/search/sort-query'

/**
 * Purpose: Champs « Trier par » et « Ordre » du formulaire de recherche d'une liste.
 * Scope: Lie un select de champ de tri, parmi la liste donnée, et un select de sens aux champs `sortBy` et `sortDirection` du formulaire ; s'insère dans la grille du formulaire.
 * Limits: Ne détient aucun état, ne lance aucune recherche et ne connaît pas l'URL ; la page applique le tri à la soumission.
 */
@Component({
    selector: 'app-sort-fields',
    imports: [FormField, SgdfFieldDirective, TranslocoPipe],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    styles: ':host { display: contents; }',
    templateUrl: './sort-fields.component.html',
})
export class SortFieldsComponent {
    public readonly sortBy: InputSignal<FieldTree<string>> = input.required<FieldTree<string>>()
    public readonly sortDirection: InputSignal<FieldTree<SortDirection>> = input.required<FieldTree<SortDirection>>()
    public readonly fields: InputSignal<readonly string[]> = input.required<readonly string[]>()
}
