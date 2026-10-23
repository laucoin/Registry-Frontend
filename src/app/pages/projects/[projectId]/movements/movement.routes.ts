import { Routes } from '@angular/router'
import { MovementPage } from '@pages/projects/[projectId]/movements/movement.page'
import { MovementsListPage } from '@pages/projects/[projectId]/movements/movements-list/movements-list.page'
import { MovementRoutesEnum } from '@pages/projects/[projectId]/movements/movement-routes.enum'
import { RegisteredMovementFormPage } from '@pages/projects/[projectId]/movements/movement-form/registered/registered-movement-form.page'
import { GuestMovementFormPage } from '@pages/projects/[projectId]/movements/movement-form/guest/guest-movement-form.page'

export const movementRoutes: Routes = [
    {
        path: '',
        component: MovementPage,
        children: [
            {
                path: '', title: 'seo.movements.list', component: MovementsListPage,
            },
            {
                path: MovementRoutesEnum.CREATE_REGISTERED, title: 'seo.movements.createRegistered', component: RegisteredMovementFormPage,
            },
            {
                path: MovementRoutesEnum.EDIT_REGISTERED, title: 'seo.movements.editRegistered', component: RegisteredMovementFormPage,
            },
            {
                path: MovementRoutesEnum.CREATE_GUEST, title: 'seo.movements.createGuest', component: GuestMovementFormPage,
            },
            {
                path: MovementRoutesEnum.EDIT_GUEST, title: 'seo.movements.editGuest', component: GuestMovementFormPage,
            },
        ],
    },
]
