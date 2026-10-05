import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'

@Component({
	selector: 'app-vehicle',
	imports: [RouterOutlet],
	template: '<router-outlet/>',
	changeDetection: ChangeDetectionStrategy.Eager,
})
export class VehicleComponent {
}
