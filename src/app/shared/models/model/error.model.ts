import { HttpErrorResponse } from '@angular/common/http'

export class ErrorModel extends Error {
    public status?: number
    public override name: string
    public code?: string
    public title?: string
    public override message: string

    public constructor (error: HttpErrorResponse) {
        super()

        this.status = error.error?.statusCode ?? error.status
        this.name = error.error?.statusName ?? error.name
        this.code = error.error?.code
        this.title = error.error?.title
        this.message = error.error?.message
    }
}
