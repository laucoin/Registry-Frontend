import { Directive, inject, input, InputSignal, TemplateRef } from '@angular/core'

/**
 * Purpose: Names a template so that a parent component can pick it by name.
 * Scope: Exposes the template reference under a given name.
 * Limits: Does not render the template itself.
 */
@Directive( {
    selector: '[appTemplate]',
} )
export class RegistryTemplateDirective {
    public appTemplate: InputSignal<string | undefined> = input.required()
    public template: TemplateRef<unknown> = inject( TemplateRef )
}
