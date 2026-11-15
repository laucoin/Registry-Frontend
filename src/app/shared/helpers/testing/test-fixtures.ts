import { HttpErrorResponse } from '@angular/common/http';
import { computed, Signal } from '@angular/core';

import { Observable, throwError } from 'rxjs';

import { ConfigModel } from '@core/config/model/config.model';
import { RegistryConfig } from '@core/config/registry.config';
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';
import { ErrorModel } from '@shared/models/model/error.model';
import { GenericModel } from '@shared/models/model/generic.model';
import { PageModel } from '@shared/models/model/page.model';
import { ProjectModel } from '@shared/models/model/project.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';

export function backendError(status: number, title?: string, message?: string): ErrorModel {
	return new ErrorModel(new HttpErrorResponse({ status, error: { title, detail: message } }));
}

export const ERROR_500: ErrorModel = backendError(500, 'Title', 'Message');
export const ERROR_503: ErrorModel = backendError(503, 'Down', 'Down');

export function pageOf<T extends GenericModel>(content: T[], page = 0): PageModel<T> {
	return {
		page,
		size: 10,
		totalElements: content.length,
		totalPages: 1,
		hasNext: false,
		content,
		lastRefresh: new Date(),
	};
}

export function projectOptionChecker(
	project: () => ProjectModel | undefined,
): (option: ProjectOptionEnum) => Signal<boolean> {
	return (option: ProjectOptionEnum): Signal<boolean> =>
		computed(
			(): boolean =>
				project()?.options?.some(
					(item: SelectOptionModel<ProjectOptionEnum>): boolean => item.value === option,
				) ?? false,
		);
}

export function failing<T = never>(error: ErrorModel): Observable<T> {
	return throwError((): ErrorModel => error);
}

export function provideTestConfig(): void {
	RegistryConfig.config = {
		defaultLanguage: 'fr',
		languages: ['fr', 'en'],
		notification: { duration: { info: 1, success: 1, warn: 1, error: 1, secondary: 1, contrast: 1 } },
	} as unknown as ConfigModel;
}
