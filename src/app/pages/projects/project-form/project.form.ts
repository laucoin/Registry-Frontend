import { WritableSignal } from '@angular/core';
import { FieldTree, form, SchemaPathTree } from '@angular/forms/signals';

import { FormModelHelper } from '@shared/helpers/form/form-model.helper';
import { RegistrySchemas } from '@shared/helpers/form/registry.schemas';
import { ProjectDto } from '@shared/models/dto/project.dto';
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model';
import { ProjectModel } from '@shared/models/model/project.model';
import { ProjectOptionModel } from '@shared/models/model/project-option.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';

export interface ProjectFormModel {
	name: string;
	beginDateTime: CustomDatetimeModel | null;
	endDateTime: CustomDatetimeModel | null;
}

export type ProjectOptionsFormModel = Record<string, boolean>;

export function toProjectFormModel(project?: ProjectModel): ProjectFormModel {
	return {
		name: FormModelHelper.orEmpty(project?.name),
		beginDateTime: FormModelHelper.orNull(project?.begin),
		endDateTime: FormModelHelper.orNull(project?.end),
	};
}

export function toProjectOptionsFormModel(
	available: ProjectOptionModel[],
	selected: SelectOptionModel<ProjectOptionEnum>[] | undefined,
): ProjectOptionsFormModel {
	const selectedValues: string[] = (selected ?? []).map((option): string => option.value);
	return Object.fromEntries(
		available.map((option): [string, boolean] => [option.value, selectedValues.includes(option.value)]),
	);
}

export function withAllOptions(options: ProjectOptionsFormModel, checked: boolean): ProjectOptionsFormModel {
	return Object.fromEntries(Object.keys(options).map((key) => [key, checked]));
}

export function selectedOptionsState(options: ProjectOptionsFormModel): boolean | undefined {
	const values = Object.values(options);
	const selected = values.filter((active) => active).length;
	if (selected === 0) return false;
	return selected === values.length ? true : undefined;
}

export function toProjectDto(model: ProjectFormModel, options: ProjectOptionsFormModel): ProjectDto {
	return {
		name: model.name,
		begin: model.beginDateTime ?? undefined,
		end: model.endDateTime ?? undefined,
		options: Object.keys(options).filter((key) => options[key]),
	};
}

export function createProjectForm(model: WritableSignal<ProjectFormModel>): FieldTree<ProjectFormModel> {
	return form(model, (path: SchemaPathTree<ProjectFormModel>) => {
		RegistrySchemas.requiredText(path.name, 150);
		RegistrySchemas.dateRequiredForTime(path.beginDateTime);
		RegistrySchemas.dateRequiredForTime(path.endDateTime);
		RegistrySchemas.beginDateBeforeEndDate(path.beginDateTime, path.endDateTime);
	});
}

export function createProjectOptionsForm(
	model: WritableSignal<ProjectOptionsFormModel>,
	available: () => ProjectOptionModel[],
): FieldTree<ProjectOptionsFormModel> {
	return form(model, (path: SchemaPathTree<ProjectOptionsFormModel>) =>
		RegistrySchemas.preRequiredOptions(path, available),
	);
}
