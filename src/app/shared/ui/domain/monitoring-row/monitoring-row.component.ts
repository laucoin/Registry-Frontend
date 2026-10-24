import '@sgdf/ui/avatar'
import '@sgdf/ui/checkbox'
import '@sgdf/ui/icon'
import '@sgdf/ui/list-item'
import '@sgdf/ui/tag'
import { Component, CUSTOM_ELEMENTS_SCHEMA, input, InputSignal, output, OutputEmitterRef } from '@angular/core'
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';
import { MonitoringRowModel } from '@shared/models/model/monitoring-row.model'
import { EllipsisDirective } from '@shared/directives/ellipsis.directive'

/**
 * Purpose: Élément de liste présentant le statut de présence d'un participant ou d'un véhicule ; utilisé comme attribut de `sgdf-list-item`.
 * Scope: Place le statut en premier, via la couleur de l'avatar et un tag avec le libellé du statut, puis le titre et la description. Offre une case à cocher devant la ligne quand elle est sélectionnable, pour compter les participants pendant un appel.
 * Limits: Reçoit une ligne toute prête et ne détient aucun état, y compris l'état coché ; ne charge ni ne modifie rien.
 */
@Component({
	selector: 'sgdf-list-item[appMonitoringRow], app-monitoring-row',
	imports: [EllipsisDirective, TranslocoPipe],
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
