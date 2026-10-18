import '@sgdf/ui/avatar'
import '@sgdf/ui/icon'
import '@sgdf/ui/list-item'
import '@sgdf/ui/tag'
import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input, InputSignal } from '@angular/core'
import { MonitoringRowModel } from '@shared/models/model/monitoring-row.model'

/**
 * Purpose: List item presenting the presence status of a participant or a vehicle; used as an attribute of `sgdf-list-item`.
 * Scope: Puts the status first, through the color of the avatar and a tag with the status label, then the title and the description.
 * Limits: Receives a ready-made row and holds no state; it neither loads nor edits anything.
 */
@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'sgdf-list-item[appMonitoringRow], app-monitoring-row',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './monitoring-row.component.html',
})
export class MonitoringRowComponent {
	public readonly row: InputSignal<MonitoringRowModel> = input.required<MonitoringRowModel>()
}
