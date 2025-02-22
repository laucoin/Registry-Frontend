import { Routes } from '@angular/router'
import { VehicleComponent } from './vehicle.component'
import { VehiclesListComponent } from './vehicles-list/vehicles-list.component'
import { VehicleRoutesEnum } from './vehicle-routes.enum'
import { VehicleFormComponent } from './vehicle-form/vehicle-form.component'
import { VehicleMovementsListComponent } from './vehicle-movements-list/vehicle-movements-list.component'

export const vehicleRoutes: Routes = [
    {
        path: '', component: VehicleComponent, children: [
            {
                path: '', component: VehiclesListComponent,
            },
            {
                path: VehicleRoutesEnum.CREATE, component: VehicleFormComponent,
            },
            {
                path: VehicleRoutesEnum.EDIT, component: VehicleFormComponent,
            },
            {
                path: VehicleRoutesEnum.MOVEMENTS, component: VehicleMovementsListComponent,
            },
        ],
    },
]
