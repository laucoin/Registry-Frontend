import '@sgdf/ui/icon-button'
import { Component, CUSTOM_ELEMENTS_SCHEMA, input, InputSignal, output, OutputEmitterRef } from '@angular/core'
import { TranslocoPipe } from '@jsverse/transloco'

/**
 * Purpose: Star button that tells whether a project is a favorite and toggles it.
 * Scope: Shows a filled amber star for a favorite and an outlined neutral one otherwise, with an accessible name and pressed state, and emits when the user clicks it.
 * Limits: Holds no state and calls no api; the parent runs the command and passes the new state back.
 */
@Component({
	selector: 'app-favorite-toggle',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [TranslocoPipe],
	templateUrl: './favorite-toggle.component.html',
})
export class FavoriteToggleComponent {
	public readonly favorite: InputSignal<boolean> = input.required<boolean>()
	public readonly name: InputSignal<string> = input.required<string>()
	public readonly toggled: OutputEmitterRef<void> = output<void>()
}
