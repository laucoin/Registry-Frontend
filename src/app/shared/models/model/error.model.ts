import { HttpErrorResponse } from '@angular/common/http'

export class ErrorModel extends Error {
    public status?: number
    public override name: string
    public code?: string
    public title?: string
    public override message: string

    public constructor (error: HttpErrorResponse) {
        super()

        this.status = error.error?.status ?? error.status
        this.name = error.name
        this.code = error.error?.code
        this.title = error.error?.title
        this.message = error.error?.detail ?? error.message
    }

    public static of (title: string, message: string): ErrorModel {
        return new ErrorModel( new HttpErrorResponse( { status: 0, error: { title: title, detail: message } } ) )
    }
}
