import { CreateGroupViewComponent } from './create-group-view.component';
import { byTextContent, createRoutingFactory, SpectatorRouting, SpectatorRoutingOptions } from '@ngneat/spectator';
import { ManagementModule } from '../../management.module';
import { NotificationService } from '../../../../core/services/notification.service';
import { GroupService } from '../../../../core/services/group.service';
import { fakeAsync, tick } from '@angular/core/testing';
import { of, tap, throwError } from 'rxjs';
import { UserService } from '../../../../core/services/user.service';
import { OperationService } from '../../../../core/services/operation.service';
import { User } from '../../../../core/model/user';
import { Operation } from '../../../../core/model/operation';

function genFactoryOptions(): SpectatorRoutingOptions<CreateGroupViewComponent> {
  return {
    component: CreateGroupViewComponent,
    imports: [
      ManagementModule,
    ],
    mocks: [
      NotificationService,
      GroupService,
      UserService,
      OperationService,
    ],
    detectChanges: false,
  };
}


describe('CreateGroupView', () => {
  let component: CreateGroupViewComponent;
  let spectator: SpectatorRouting<CreateGroupViewComponent>;
  const createComponent = createRoutingFactory(genFactoryOptions());

  const title = 'straw';
  const description = 'egg';
  const operationId = 'skirt';
  const members = ['fly', 'glass', 'combine'];
  const sampleUserData: User[] = [
    {
      id: 'fly',
      username: 'marry',
      firstName: 'well',
      lastName: 'forgive',
      isActive: true,
      isAdmin: false,
    },
    {
      id: 'glass',
      username: 'everyday',
      firstName: 'robbery',
      lastName: 'beak',
      isActive: true,
      isAdmin: false,
    },
    {
      id: 'combine',
      username: 'greet',
      firstName: 'swear',
      lastName: 'real',
      isActive: true,
      isAdmin: false,
    },
  ];
  const sampleOperation: Operation = {
    id: 'skirt',
    title: 'roof',
    description: 'temple',
    start: new Date(),
    is_archived: false,
  };

  beforeEach(async () => {
    spectator = createComponent();
    component = spectator.component;
    spectator.router.navigate = jasmine.createSpy().and.callFake(spectator.router.navigate).and.resolveTo();
    spectator.inject(UserService).getUserById.withArgs('fly').and.returnValue(of(sampleUserData[0]));
    spectator.inject(UserService).getUserById.withArgs('glass').and.returnValue(of(sampleUserData[1]));
    spectator.inject(UserService).getUserById.withArgs('combine').and.returnValue(of(sampleUserData[2]));
    spectator.inject(OperationService).getOperationById.and.returnValue(of(sampleOperation));
    spectator.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should disable group creation without values', () => {
    expect(component.form.valid).toBeFalse();
  });

  it('should disable group creation without title', fakeAsync(() => {
    component.form.setValue({
      title: '',
      description: description,
      operation: operationId,
      members: members,
    });
    tick();
    expect(component.form.valid).toBeFalse();
  }));

  it('should disable group creation without description', fakeAsync(() => {
    component.form.setValue({
      title: title,
      description: '',
      operation: operationId,
      members: members,
    });
    tick();
    expect(component.form.valid).toBeFalse();
  }));

  it('should allow creation with all values set', fakeAsync(() => {
    component.form.setValue({
      title: title,
      description: description,
      operation: operationId,
      members: members,
    });
    tick();
    expect(component.form.valid).toBeTrue();
  }));

  describe('create group', () => {
    it('should fail  without title', fakeAsync(() => {
      component.form.setValue({
        title: '',
        description: description,
        operation: operationId,
        members: members,
      });
      tick();
      expect(component.createGroup).toThrowError();
    }));

    it('should fail  without description', fakeAsync(() => {
      component.form.setValue({
        title: title,
        description: '',
        operation: operationId,
        members: members,
      });
      tick();
      expect(component.createGroup).toThrowError();
    }));

    it('should create group correctly', fakeAsync(() => {
      component.form.setValue({
        title: title,
        description: description,
        operation: operationId,
        members: members,
      });
      tick();
      spectator.inject(GroupService).createGroup.and.returnValue(of({
        id: 'progress',
        title: title,
        description: description,
        operation: operationId,
        members: members,
      }));

      component.createGroup();
      tick();

      expect(spectator.inject(GroupService).createGroup).toHaveBeenCalledOnceWith({
        title: title,
        description: description,
        operation: operationId,
        members: members,
      });
    }));

    it('should show an error message if group creation failed', fakeAsync(() => {
      component.form.setValue(({
        title: title,
        description: description,
        operation: operationId,
        members: members,
      }));
      tick();
      spectator.inject(GroupService).createGroup.and.returnValue(throwError(() => ({})));

      component.createGroup();
      tick();
      expect(spectator.inject(NotificationService).notifyUninvasiveShort).toHaveBeenCalled();
    }));

    it('should show an error message if group creation failed internally', fakeAsync(() => {
      component.form.setValue(({
        title: title,
        description: description,
        operation: operationId,
        members: members,
      }));
      tick();
      spectator.inject(GroupService).createGroup.and.returnValue(of(void 0));

      component.createGroup();
      tick();
      expect(spectator.inject(NotificationService).notifyUninvasiveShort).toHaveBeenCalled();
    }));
  });

  it('searchUser should return empty if no input was given', fakeAsync(() => {
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

  it('searchOperation should return empty if no input was given', fakeAsync(() => {
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

  it('should disable create group button when creation is not allowed', fakeAsync(async () => {
    component.form.setValue({
      title: '',
      description: '',
      operation: '',
      members: [],
    });
    tick();
    spectator.detectComponentChanges();
    await spectator.fixture.whenStable();

    expect(spectator.query(byTextContent('Create Group', { selector: 'button' }))).toBeDisabled();
  }));

  it('should enable create group button when creation is allowed', fakeAsync(async () => {
    component.form.setValue({
      title: title,
      description: description,
      operation: operationId,
      members: members,
    });
    tick();
    spectator.detectComponentChanges();
    await spectator.fixture.whenStable();

    expect(spectator.query(byTextContent('Create Group', { selector: 'button' }))).not.toBeDisabled();
  }));

  it('should create Group when create user button is pressed', fakeAsync(async () => {
    component.form.setValue(({
      title: title,
      description: description,
      operation: operationId,
      members: members,
    }));
    tick();
    spectator.detectComponentChanges();
    await spectator.fixture.whenStable();
    spyOn(component, 'createGroup');

    spectator.click(byTextContent('Create Group', { selector: 'button' }));

    expect(component.createGroup).toHaveBeenCalledOnceWith();
  }));
});
