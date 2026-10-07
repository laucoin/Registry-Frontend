import { Routes } from '@angular/router'
import { VehicleComponent } from '@pages/projects/[projectId]/configuration/vehicles/vehicle.component'
import { VehiclesListComponent } from '@pages/projects/[projectId]/configuration/vehicles/vehicles-list/vehicles-list.component'
import { VehicleRoutesEnum } from '@pages/projects/[projectId]/configuration/vehicles/vehicle-routes.enum'
import { VehicleFormComponent } from '@pages/projects/[projectId]/configuration/vehicles/vehicle-form/vehicle-form.component'
import { VehicleMovementsListComponent } from '@pages/projects/[projectId]/configuration/vehicles/vehicle-movements-list/vehicle-movements-list.component'

export const vehicleRoutes: Routes = [
    {
        path: '',
        component: VehicleComponent,
        children: [
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
