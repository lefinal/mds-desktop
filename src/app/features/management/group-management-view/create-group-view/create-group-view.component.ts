import { Component } from '@angular/core';
import { Loader } from '../../../../core/util/loader';
import { GroupService } from '../../../../core/services/group.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MDSError, MDSErrorCode } from '../../../../core/util/errors';
import { Group } from '../../../../core/model/group';
import { UserService } from '../../../../core/services/user.service';
import { User } from '../../../../core/model/user';
import { Observable, of } from 'rxjs';
import { SearchResult } from '../../../../core/util/store';
import { Operation } from '../../../../core/model/operation';
import { OperationService } from '../../../../core/services/operation.service';
import { map } from 'rxjs/operators';

/**
 * View to create a group.
 */
@Component({
  selector: 'app-create-group-view',
  templateUrl: './create-group-view.component.html',
  styleUrls: ['./create-group-view.component.scss'],
})
export class CreateGroupViewComponent {
  /**
   * Loader for when creating a new group and awaiting the response.
   */
  creatingGroup = new Loader();

  form = this.fb.nonNullable.group({
    title: this.fb.nonNullable.control<string>('', [Validators.required]),
    description: this.fb.nonNullable.control<string>('', [Validators.required]),
    operation: this.fb.nonNullable.control<string | undefined>(undefined),
    members: this.fb.nonNullable.control<string[]>([]),
  });

  constructor(private groupService: GroupService, private notificationService: NotificationService, private fb: FormBuilder,
              private router: Router, private route: ActivatedRoute, private userService: UserService, private operationService: OperationService) {
  };

  createGroup(): void {
    const title = this.form.value.title;
    if (title === undefined) {
      throw new MDSError(MDSErrorCode.AppError, 'title control is not set.');
    }
    const description = this.form.value.description;
    if (description === undefined) {
      throw new MDSError(MDSErrorCode.AppError, 'description control is not set.');
    }
    const operation = this.form.value.operation;
    if (operation === undefined) {
      throw new MDSError(MDSErrorCode.AppError, 'operation control is not set.');
    }
    const members = this.form.value.members;
    if (members === undefined) {
      throw new MDSError(MDSErrorCode.AppError, 'members control is not set.');
    }
    this.groupService.createGroup({
      title: title,
      description: description,
      operation: operation,
      members: members,
    }).subscribe({
      next: (newGroup: Group): void => {
        if (!newGroup) {
          this.notificationService.notifyUninvasiveShort($localize`Group creation failed.`);
          return;
        }
        this.cancel();
      },
      error: _ => {
        this.notificationService.notifyUninvasiveShort($localize`Group creation failed.`);
      },
    });
  }

  getUserById(id: string): Observable<User> {
    return this.userService.getUserById(id);
  }

  getOperationById(id: string): Observable<Operation> {
    return this.operationService.getOperationById(id);
  }

  searchOperation(query: string): Observable<Operation[]> {
    if (query === '') {
      return of([]);
    }
    return this.operationService.searchOperations({
        query: query,
        limit: 5,
        offset: 0,
      }, {},
    ).pipe(
      map((res: SearchResult<Operation>): Operation[] => {
        return res.hits;
      }));
  }

  searchUser(query: string): Observable<User[]> {
    if (query === '') {
      return of([]);
    }
    return this.userService.searchUsers({
      query: query,
      limit: 5,
      offset: 0,
    }, true).pipe(
      map((res: SearchResult<User>): User[] => {
        return res.hits;
      }));

  }

  asUser(entity: User): User {
    return entity;
  }

  asOperation(entity: Operation): Operation {
    return entity;
  }

  cancel() {
    this.router.navigate(['..'], { relativeTo: this.route }).then();
  }
}
