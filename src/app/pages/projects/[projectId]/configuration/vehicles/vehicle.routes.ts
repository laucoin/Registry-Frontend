import { Routes } from '@angular/router'
import { VehiclePage } from '@pages/projects/[projectId]/configuration/vehicles/vehicle.page'
import { VehiclesListPage } from '@pages/projects/[projectId]/configuration/vehicles/vehicles-list/vehicles-list.page'
import { VehicleRoutesEnum } from '@pages/projects/[projectId]/configuration/vehicles/vehicle-routes.enum'
import { VehicleFormPage } from '@pages/projects/[projectId]/configuration/vehicles/vehicle-form/vehicle-form.page'
import { VehicleMovementsListPage } from '@pages/projects/[projectId]/configuration/vehicles/vehicle-movements-list/vehicle-movements-list.page'

export const vehicleRoutes: Routes = [
    {
        path: '',
        component: VehiclePage,
        children: [
            {
                path: '', component: VehiclesListPage,
            },
            {
                path: VehicleRoutesEnum.CREATE, component: VehicleFormPage,
            },
            {
                path: VehicleRoutesEnum.EDIT, component: VehicleFormPage,
            },
            {
                path: VehicleRoutesEnum.MOVEMENTS, component: VehicleMovementsListPage,
            },
        ],
    },
]
