import { signal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { By } from '@angular/platform-browser'
import { FieldTree, form } from '@angular/forms/signals'
import { TranslocoPipe } from '@jsverse/transloco'
import { MockBuilder } from 'ng-mocks'
import { PARTICIPANT_DTO } from '@shared/helpers/testing/response-fixtures'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { ParticipantMapper } from '@shared/mappers/participant.mapper'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { SelectElementsFieldComponent } from '@shared/ui/common/select-elements-field/select-elements-field.component'
import { GroupMembersFieldComponent } from './group-members-field.component'

describe( 'GroupMembersFieldComponent', () => {
    let fixture: ComponentFixture<GroupMembersFieldComponent>
    let field: FieldTree<ParticipantModel[]>
    const suggestions: SelectOptionModel<ParticipantModel>[] = [ { label: 'Ada', value: ParticipantMapper.toModel( PARTICIPANT_DTO ) } ]

    async function render (): Promise<void> {
        fixture = TestBed.createComponent( GroupMembersFieldComponent )
        field = TestBed.runInInjectionContext( () => form( signal<ParticipantModel[]>( [] ) ) )
        fixture.componentRef.setInput( 'field', field )
        fixture.componentRef.setInput( 'suggestions', suggestions )
        await fixture.whenStable()
    }

    beforeEach( async () => {
        await MockBuilder( GroupMembersFieldComponent )
            .keep( SelectElementsFieldComponent )
            .mock( TranslocoPipe, (key: string): string => key )
            .mock( PluralTranslationPipe, (key: string): string => key )
    } )

    it( 'should give the suggestions to the selection field', async () => {
        // Arrange
        await render()

        // Act
        const select: SelectElementsFieldComponent<ParticipantModel> = fixture.debugElement.query( By.directive( SelectElementsFieldComponent ) ).componentInstance

        // Assert
        expect( select.suggestions() ).toEqual( suggestions )
    } )

    it( 'should emit the typed query and mark the field as touched', async () => {
        // Arrange
        await render()
        const searched: string[] = []
        fixture.componentInstance.searched.subscribe( (it: string | undefined): void => void searched.push( it! ) )
        const select: SelectElementsFieldComponent<ParticipantModel> = fixture.debugElement.query( By.directive( SelectElementsFieldComponent ) ).componentInstance

        // Act
        select.handleSearch.emit( { query: 'ad' } )

        // Assert
        expect( searched ).toEqual( [ 'ad' ] )
        expect( field().touched() ).toBe( true )
    } )
} )
