import { HttpErrorResponse } from '@angular/common/http';

export class ErrorModel extends Error {
	public status?: number;
	public override name: string;
	public code?: string;
	public title?: string;
	public override message: string;

	constructor(error: HttpErrorResponse) {
		super();

		const body: Partial<ErrorModel> & { detail?: string } = error.error ?? {};
		this.status = body.status ?? error.status;
		this.name = error.name;
		this.code = body.code;
		this.title = body.title;
		this.message = body.detail ?? error.message;
	}

	public static of(title: string, message: string): ErrorModel {
		return new ErrorModel(new HttpErrorResponse({ status: 0, error: { title: title, detail: message } }));
	}
}
