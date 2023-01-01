import { Component, OnDestroy, OnInit } from '@angular/core';
import { Loader } from '../../../../core/util/loader';
import { FormBuilder, Validators } from '@angular/forms';
import { GroupService } from '../../../../core/services/group.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService, UserSort } from '../../../../core/services/user.service';
import { OperationService } from '../../../../core/services/operation.service';
import { MDSError, MDSErrorCode } from '../../../../core/util/errors';
import { forkJoin, Observable, of, Subscription, switchMap, tap } from 'rxjs';
import { User } from '../../../../core/model/user';
import { Operation } from '../../../../core/model/operation';
import { OrderDir, orderDirFromSort, SearchResult } from '../../../../core/util/store';
import { map } from 'rxjs/operators';
import { Sort } from '@angular/material/sort';

@Component({
  selector: 'app-edit-group-view',
  templateUrl: './edit-group-view.component.html',
  styleUrls: ['./edit-group-view.component.scss'],
})
export class EditGroupViewComponent implements OnInit, OnDestroy {
  updatingGroup = new Loader();

  showMemberSelection = false;
  /**
   * Id of the currently loaded group.
   */
  groupId = '';

  private s: Subscription[] = [];

  columnsToDisplay = ['lastName', 'firstName', 'username', 'props', 'remove'];

  /**
   * Fully loaded members.
   */
  members: User [] = [];

  ngOnDestroy(): void {
    this.s.forEach(s => s.unsubscribe());
  }

  ngOnInit(): void {
    this.s.push(this.route.params.pipe(
      // Get group with the id within the route.
      switchMap(params => {
        this.groupId = params['groupId'];
        this.members = [];
        return this.groupService.getGroupById(this.groupId);
      }),
      // Patch the form values.
      tap((currentGroup) => {
        this.form.patchValue({
          title: currentGroup.title,
          description: currentGroup.description,
          operation: currentGroup.operation,
          members: currentGroup.members,
        });
      }),
      // Retrieve the user-data for all members.
      switchMap(currentGroup => forkJoin(currentGroup.members.map(memberId => this.userService.getUserById(memberId)))),
      // Add the users to the members array.
      tap(currentGroupMembers => {
        this.members = currentGroupMembers;
      }),
    ).subscribe());
    this.s.push(
      this.form.controls.members.valueChanges.pipe(
        switchMap(members => {
          this.members = [];
          return forkJoin(members.map(memberId => this.userService.getUserById(memberId)));
        }),
        tap(currentGroupMembers => {
          this.members = currentGroupMembers;
        }),
      ).subscribe());
  }

  form = this.fb.nonNullable.group({
    title: this.fb.nonNullable.control<string>('', [Validators.required]),
    description: this.fb.nonNullable.control<string>('', [Validators.required]),
    operation: this.fb.nonNullable.control<string | undefined>(undefined),
    members: this.fb.nonNullable.control<string[]>([]),
  });

  constructor(private groupService: GroupService, private notificationService: NotificationService, private fb: FormBuilder,
              private router: Router, private route: ActivatedRoute, private userService: UserService, private operationService: OperationService) {
  };

  updateGroup(): void {
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
    this.groupService.updateGroup({
      id: this.groupId,
      title: title,
      description: description,
      operation: operation,
      members: members,
    }).subscribe({
      next: _ => {
        this.close();
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
    return entity as User;
  }

  asOperation(entity: Operation): Operation {
    return entity as Operation;
  }

  /**
   * Goes back to 'groups/'.
   */
  close() {
    this.router.navigate(['..'], { relativeTo: this.route }).then();
  }

  /**
   * Removes a member.
   * @param memberId
   */
  removeMember(memberId: string): void {
    this.form.controls.members.patchValue(this.form.controls.members.value.filter(item => item != memberId));
  }

  private static mapOrderBy(s: string): UserSort | undefined {
    switch (s) {
      case 'lastName':
        return UserSort.ByLastName;
      case 'firstName':
        return UserSort.ByFirstName;
      case 'username':
        return UserSort.ByUsername;
      case '':
        return undefined;
      default:
        throw new MDSError(MDSErrorCode.AppError, `unsupported order-by: ${ s }`);
    }
  }

  /**
   * Called when sort changes.
   * @param sort New sort.
   */
  sortChange(sort: Sort): void {
    let sortedMembers = this.members.map(x => x);
    switch (EditGroupViewComponent.mapOrderBy(sort.active)) {
      case UserSort.ByLastName:
        if (orderDirFromSort(sort) === OrderDir.Asc) {
          sortedMembers.sort((a, b) => a.lastName.localeCompare(b.lastName));
        } else {
          sortedMembers.sort((a, b) => b.lastName.localeCompare(a.lastName));
        }
        break;
      case UserSort.ByFirstName:
        if (orderDirFromSort(sort) === OrderDir.Asc) {
          sortedMembers.sort((a, b) => a.firstName.localeCompare(b.firstName));
        } else {
          sortedMembers.sort((a, b) => b.firstName.localeCompare(a.firstName));
        }
        break;
      case UserSort.ByUsername:
        if (orderDirFromSort(sort) === OrderDir.Asc) {
          sortedMembers.sort((a, b) => a.username.localeCompare(b.username));
        } else {
          sortedMembers.sort((a, b) => b.username.localeCompare(a.username));
        }
        break;
    }
    this.members = sortedMembers;
  }
}
