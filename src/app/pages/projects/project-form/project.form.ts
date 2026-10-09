import { WritableSignal } from '@angular/core'
import { FieldTree, form, SchemaPathTree } from '@angular/forms/signals'
import { SelectItem } from 'primeng/api'
import { ProjectDto } from '@pages/projects/data/dto/project.dto'
import { RegistrySchemas } from '@shared/helpers/form/registry.schemas'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { ProjectOptionModel } from '@shared/models/model/project-option.model'
import { ProjectModel } from '@shared/models/model/project.model'

export interface ProjectFormModel {
    name: string
    beginDateTime: CustomDatetimeModel | null
    endDateTime: CustomDatetimeModel | null
}

export type ProjectOptionsFormModel = Record<string, boolean>

export function toProjectFormModel (project?: ProjectModel): ProjectFormModel {
    return {
        name: project?.name ?? '',
        beginDateTime: project?.begin ?? null,
        endDateTime: project?.end ?? null,
    }
}

export function toProjectOptionsFormModel (
    available: ProjectOptionModel[],
    selected: SelectItem<ProjectOptionEnum>[] | undefined,
): ProjectOptionsFormModel {
    const selectedValues: string[] = (selected ?? []).map( (option: SelectItem<ProjectOptionEnum>): string => option.value )
    return Object.fromEntries( available.map( (option: ProjectOptionModel): [ string, boolean ] =>
        [ option.value, selectedValues.includes( option.value ) ] ) )
}

export function withAllOptions (options: ProjectOptionsFormModel, checked: boolean): ProjectOptionsFormModel {
    return Object.fromEntries( Object.keys( options ).map( (key: string): [ string, boolean ] => [ key, checked ] ) )
}

export function selectedOptionsState (options: ProjectOptionsFormModel): boolean | undefined {
    const values: boolean[] = Object.values( options )
    const selected: number = values.filter( (active: boolean): boolean => active ).length
    if (selected === 0) return false
    return selected === values.length ? true : undefined
}

export function toProjectDto (model: ProjectFormModel, options: ProjectOptionsFormModel): ProjectDto {
    return {
        name: model.name,
        begin: model.beginDateTime ?? undefined,
        end: model.endDateTime ?? undefined,
        options: Object.keys( options ).filter( (key: string): boolean => options[ key ] ),
    }
}

export function createProjectForm (model: WritableSignal<ProjectFormModel>): FieldTree<ProjectFormModel> {
    return form( model, (path: SchemaPathTree<ProjectFormModel>): void => {
        RegistrySchemas.requiredText( path.name, 150 )
        RegistrySchemas.dateRequiredForTime( path.beginDateTime )
        RegistrySchemas.dateRequiredForTime( path.endDateTime )
        RegistrySchemas.beginDateBeforeEndDate( path )
    } )
}

export function createProjectOptionsForm (
    model: WritableSignal<ProjectOptionsFormModel>,
    available: () => ProjectOptionModel[],
): FieldTree<ProjectOptionsFormModel> {
    return form( model, (path: SchemaPathTree<ProjectOptionsFormModel>): void => {
        RegistrySchemas.preRequiredOptions( path, available )
    } )
}
