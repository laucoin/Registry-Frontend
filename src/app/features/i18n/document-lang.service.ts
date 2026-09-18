import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

@Injectable({ providedIn: 'root' })
export class DocumentLangService {
	private readonly document: Document = inject(DOCUMENT);
	private readonly translationService: TranslocoService = inject(TranslocoService);

	public constructor() {
		effect(() => {
			this.document.documentElement.lang = this.translationService.activeLang();
		});
	}
}
