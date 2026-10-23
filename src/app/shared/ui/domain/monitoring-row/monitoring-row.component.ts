import '@sgdf/ui/avatar'
import '@sgdf/ui/checkbox'
import '@sgdf/ui/icon'
import '@sgdf/ui/list-item'
import '@sgdf/ui/tag'
import { Component, CUSTOM_ELEMENTS_SCHEMA, input, InputSignal, output, OutputEmitterRef } from '@angular/core'
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';
import { MonitoringRowModel } from '@shared/models/model/monitoring-row.model'

/**
 * Purpose: List item presenting the presence status of a participant or a vehicle; used as an attribute of `sgdf-list-item`.
 * Scope: Puts the status first, through the color of the avatar and a tag with the status label, then the title and the description. Offers a checkbox in front of the row when it is selectable, to count the participants during a roll call.
 * Limits: Receives a ready-made row and holds no state, the checked state included; it neither loads nor edits anything.
 */
@Component({
	selector: 'sgdf-list-item[appMonitoringRow], app-monitoring-row',
	imports: [TranslocoPipe],
	providers: [provideTranslocoScope('project-home')],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './monitoring-row.component.html',
})
export class MonitoringRowComponent {
	public readonly row: InputSignal<MonitoringRowModel> = input.required<MonitoringRowModel>()
	public readonly selectable: InputSignal<boolean> = input(false)
	public readonly checked: InputSignal<boolean> = input(false)

	public readonly checkedChange: OutputEmitterRef<boolean> = output()
}
