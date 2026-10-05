import { Directive, inject, input, InputSignal, TemplateRef } from '@angular/core'

@Directive({
	selector: '[appTemplate]',
})
export class RegistryTemplateDirective {
	public appTemplate: InputSignal<string | undefined> = input.required()
	public template: TemplateRef<unknown> = inject(TemplateRef)
}
