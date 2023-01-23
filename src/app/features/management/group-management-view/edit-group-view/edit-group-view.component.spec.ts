import { byTextContent, createRoutingFactory, SpectatorRouting, SpectatorRoutingOptions } from '@ngneat/spectator';
import { ManagementModule } from '../../management.module';
import { NotificationService } from '../../../../core/services/notification.service';
import { GroupService } from '../../../../core/services/group.service';
import { of, tap, throwError } from 'rxjs';
import { UserService, UserSort } from '../../../../core/services/user.service';
import { OperationService } from '../../../../core/services/operation.service';
import { User } from '../../../../core/model/user';
import { Operation } from '../../../../core/model/operation';
import { EditGroupViewComponent } from './edit-group-view.component';
import { Group } from '../../../../core/model/group';
import { fakeAsync, tick } from '@angular/core/testing';

function genFactoryOptions(): SpectatorRoutingOptions<EditGroupViewComponent> {
  return {
    component: EditGroupViewComponent,
    imports: [
      ManagementModule,
    ],
    mocks: [
      NotificationService,
      GroupService,
      UserService,
      OperationService,
    ],
    params: {
      groupId: 'defend',
    },
    detectChanges: false,
  };
}


describe('EditGroupView', () => {
  let component: EditGroupViewComponent;
  let spectator: SpectatorRouting<EditGroupViewComponent>;
  const createComponent = createRoutingFactory(genFactoryOptions());

  const sampleGroup: Group = {
    id: 'defend',
    title: 'open',
    description: 'match',
    operation: 'drop',
    members: ['fly', 'glass'],
  };
  const title = 'straw';
  const description = 'egg';
  const operationId = 'skirt';
  const members = ['fly', 'glass', 'combine'];
  const sampleUserData: User[] = [
    {
      id: 'fly',
      username: 'b marry',
      firstName: 'b well',
      lastName: 'b forgive',
      isActive: true,
      isAdmin: false,
    },
    {
      id: 'glass',
      username: 'c everyday',
      firstName: 'c robbery',
      lastName: 'c beak',
      isActive: true,
      isAdmin: false,
    },
    {
      id: 'combine',
      username: 'a greet',
      firstName: 'a swear',
      lastName: 'areal',
      isActive: true,
      isAdmin: false,
    },
  ];
  const sampleOperations: Operation[] = [
    {
      id: 'skirt',
      title: 'roof',
      description: 'temple',
      start: new Date(),
      is_archived: false,
    },
    {
      id: 'drop',
      title: 'garden',
      description: 'excite',
      start: new Date(),
      is_archived: false,
    },
  ];

  beforeEach(async () => {
    spectator = createComponent();
    component = spectator.component;
    spectator.router.navigate = jasmine.createSpy().and.callFake(spectator.router.navigate).and.resolveTo();
    spectator.inject(GroupService).getGroupById.and.returnValue(of(sampleGroup));
    spectator.inject(UserService).getUserById.withArgs('fly').and.returnValue(of(sampleUserData[0]));
    spectator.inject(UserService).getUserById.withArgs('glass').and.returnValue(of(sampleUserData[1]));
    spectator.inject(UserService).getUserById.withArgs('combine').and.returnValue(of(sampleUserData[2]));
    spectator.inject(OperationService).getOperationById.withArgs('skirt').and.returnValue(of(sampleOperations[0]));
    spectator.inject(OperationService).getOperationById.withArgs('drop').and.returnValue(of(sampleOperations[1]));
    spectator.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should go to /groups/ when click close', fakeAsync(() => {
    spectator.click(byTextContent('Cancel', { selector: 'button' }));
    tick();
    expect(spectator.router.navigate).toHaveBeenCalledOnceWith(['..'], { relativeTo: spectator.activatedRouteStub });
  }));

  it('should disable group update without required values', () => {
    component.form.setValue({
      title: '',
      description: '',
      operation: operationId,
      members: members,
    });
    expect(component.form.valid).toBeFalse();
  });

  it('should disable group update without title', fakeAsync(() => {
    component.form.setValue({
      title: '',
      description: description,
      operation: operationId,
      members: members,
    });
    tick();
    expect(component.form.valid).toBeFalse();
  }));

  it('should disable group update without description', fakeAsync(() => {
    component.form.setValue({
      title: title,
      description: '',
      operation: operationId,
      members: members,
    });
    tick();
    expect(component.form.valid).toBeFalse();
  }));

  describe('updateGroup', () => {
    it('should fail without title', fakeAsync(() => {
      component.form.setValue({
        title: '',
        description: description,
        operation: operationId,
        members: members,
      });
      tick();
      expect(component.updateGroup).toThrowError();
    }));

    it('should fail without description', fakeAsync(() => {
      component.form.setValue({
        title: title,
        description: '',
        operation: operationId,
        members: members,
      });
      tick();
      expect(component.updateGroup).toThrowError();
    }));

    it('should update group correctly', fakeAsync(() => {
      component.form.setValue({
        title: title,
        description: description,
        operation: operationId,
        members: members,
      });
      tick();
      spectator.inject(GroupService).updateGroup.and.returnValue(of(void 0));

      component.updateGroup();
      tick();
      expect(spectator.inject(GroupService).updateGroup).toHaveBeenCalledOnceWith({
        id: sampleGroup.id,
        title: title,
        description: description,
        operation: operationId,
        members: members,
      });
    }));

    it('should show an error message if group update failed', fakeAsync(() => {
      component.form.setValue({
        title: title,
        description: description,
        operation: operationId,
        members: members,
      });
      tick();
      spectator.inject(GroupService).updateGroup.and.returnValue(throwError(() => ({})));

      component.updateGroup();
      tick();
      expect(spectator.inject(NotificationService).notifyUninvasiveShort).toHaveBeenCalled();
    }));
  });

  xit('searchUser should return empty if no input was given', fakeAsync(() => {
    component.searchUser('').pipe(tap(retVal =>{
      expect(retVal).toBe([]);
    }));
  }));

  it('searchUser should call UserService when search is unequal to empty string', fakeAsync(()  => {
    spectator.inject(UserService).searchUsers.and.returnValue(of([]));
    component.searchUser("dive");
    expect(spectator.inject(UserService).searchUsers).toHaveBeenCalledOnceWith({
      query: "dive",
      limit: 5,
      offset: 0
    }, true);
  }));

  xit('searchOperation should return empty if no input was given', fakeAsync(() => {
    component.searchOperation('').pipe(tap(retVal =>{
      expect(retVal).toBe([]);
    }));
  }));

  it('searchOperation should call OperationService when search is unequal to empty string', fakeAsync(()  => {
    spectator.inject(OperationService).searchOperations.and.returnValue(of([]));
    component.searchOperation("dive");
    expect(spectator.inject(OperationService).searchOperations).toHaveBeenCalledOnceWith({
      query: "dive",
      limit: 5,
      offset: 0
    }, {});
  }));

  it('should disable update group button when update is not allowed', fakeAsync(async () => {
    component.form.setValue({
      title: '',
      description: '',
      operation: operationId,
      members: [],
    });
    tick();
    spectator.detectComponentChanges();
    await spectator.fixture.whenStable();

    expect(spectator.query(byTextContent('Update Group', { selector: 'button' }))).toBeDisabled();
  }));

  it('should load data of members when form value changes', fakeAsync(async () => {
    component.form.setValue({
      title: title,
      description: description,
      operation: operationId,
      members: members,
    });
    tick();
    spectator.detectComponentChanges();
    await spectator.fixture.whenStable();

    expect(spectator.inject(UserService).getUserById).toHaveBeenCalled();
  }));

  it('should show data of members in table', fakeAsync(async () => {
    component.form.setValue({
      title: title,
      description: description,
      operation: operationId,
      members: members,
    });
    tick();
    spectator.detectComponentChanges();
    await spectator.fixture.whenStable();

    sampleUserData.forEach(expectMember => {
      const attributes = [expectMember.username, expectMember.firstName, expectMember.lastName];
      attributes.forEach(expectAttribute => {
        expect(spectator.query(byTextContent(expectAttribute, {
          exact: false,
          selector: 'td',
        }))).withContext(`should show group attribute ${ expectAttribute } from group ${ expectMember.id }`).toBeVisible();
      });
    });
  }));

  describe('order-by', () => {
    const tests: {
      column: string,
      orderBy: UserSort,
    }[] = [
      {
        column: 'Last name',
        orderBy: UserSort.ByLastName,
      },
      {
        column: 'First name',
        orderBy: UserSort.ByFirstName,
      },
      {
        column: 'Username',
        orderBy: UserSort.ByUsername,
      },
    ];
    tests.forEach(tt => {
      it(`should order by ${ tt.column } correctly`, fakeAsync(async () => {
        component.form.setValue({
          title: title,
          description: description,
          operation: operationId,
          members: members,
        });
        await spectator.fixture.whenStable();
        const columnHeader = byTextContent(tt.column, {
          exact: false,
          selector: 'tr th',
        });
        spectator.click(columnHeader);
        await spectator.fixture.whenStable();
        expect(component.members[0].id === 'combine').toBeTrue();
        spectator.click(columnHeader);
        await spectator.fixture.whenStable();
        expect(component.members[0].id === 'glass').toBeTrue();
      }));
    });
  });

  it('should enable update group button when update is allowed', fakeAsync(async () => {
    component.form.setValue({
      title: title,
      description: description,
      operation: operationId,
      members: members,
    });
    tick();
    spectator.detectComponentChanges();
    await spectator.fixture.whenStable();

    expect(spectator.query(byTextContent('Update Group', { selector: 'button' }))).not.toBeDisabled();
  }));

  it('should  update group when update group button is pressed', fakeAsync(async () => {
    component.form.setValue(({
      title: title,
      description: description,
      operation: operationId,
      members: members,
    }));
    tick();
    spectator.detectComponentChanges();
    await spectator.fixture.whenStable();
    spyOn(component, 'updateGroup');

    spectator.click(byTextContent('Update Group', { selector: 'button' }));

    expect(component.updateGroup).toHaveBeenCalledOnceWith();
  }));
});
