import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormArray, Validators } from '@angular/forms';

import { Observable, Subscription, Subject, of } from 'rxjs';
import { switchMap, map, tap, first, skip, filter, delayWhen, takeUntil } from 'rxjs/operators';

import { isEqual, reduce } from 'lodash';

import { User } from 'firebase/auth';

import { MatDialog } from '@angular/material/dialog';

import { TouchedErrorStateMatcher } from '../../services/touched-error-state-matcher.service';

import { FirebaseService } from '../../services/firebase.service';
import { TodosService } from '../../services/todos.service';

import { Todo } from '../../models/todo.model';
import { Item } from '../../models/item.model';

import { UpdateDialogComponent } from './update-dialog/update-dialog.component';

@Component({
  selector: 'app-todo',
  templateUrl: './todo.component.html',
  styleUrls: ['./todo.component.css']
})
export class TodoComponent implements OnInit {
  private unsubscribe$ = new Subject<void>();

  form = this.fb.group({
    title: ['', Validators.required],
    items: this.fb.array([])
  });

  matcher = new TouchedErrorStateMatcher(); 

  user$?: Observable<User|null>;
  user?: User|null;

  todo$?: Observable<Todo>;
  todo?: Todo;

  isUpdated = false;

  constructor(
    private firebaseService: FirebaseService,
    private todosService: TodosService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    public dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.user$ = this.firebaseService.onAuthStateChanged$;

    this.todo$ = this.route.paramMap.pipe(
      switchMap(params => this.todosService.getTodo$(params.get('id')!)),
    );

    this.user$.pipe(
      filter((user: User|null) => !!user),
      first(),
      map((user: User|null) => user as User),
      tap((user: User) => this.user = user),
      switchMap(() => this.todo$!),
      first(),
      tap((todo: Todo) => {
        this.todo = todo;

        this.reset();
      }),
      switchMap(() => this.todo$!),
      skip(1),
      filter((todo: Todo) => todo.updatedBy !== this.user!.uid),
      tap((todo: Todo) => {
        console.log(todo);

        this.todo = todo;

        this.isUpdated = true;
      }),
      takeUntil(this.unsubscribe$)
    ).subscribe();
  }

  get items() {
    return this.form.get('items') as FormArray;
  }

  openUpdateDialog(updatedTodo: Todo, todo: Todo, differences: string[] = []) {
    const dialogRef = this.dialog.open(
      UpdateDialogComponent,
      {
        data: {
          updatedTodo,
          todo,
          differences
        }
      }
    );

    dialogRef.afterClosed().pipe(
      switchMap(result => {
        if (result) {
          return this.todosService.updateTodo(todo).pipe(
            tap(() => {
              this.todo = todo;

              this.reset();
            })
          );
        }

        return of(result);
      }),
      takeUntil(this.unsubscribe$)
    ).subscribe();
  }

  onSubmit() {
    let todo: Todo = { ...this.todo! }
    todo.title = this.form.value.title;

    let items: Item[] = [];

    for (let item of this.form.value.items) {
      let { id, ...i } = item;

      if (id) {
        i.id = id;
      }

      items.push(i);
    }

    todo.items = items;

    if (!this.isUpdated) {
      return this.todosService.updateTodo(todo).pipe(
        tap(() => {
          this.todo = todo;

          this.reset();
        })
      ).subscribe();
    }

    return this.openUpdateDialog(
      this.todo!,
      todo,
      this.itemDifferences(todo.items!, this.todo!.items!)
    );
  }

  addItem(id: string = '', name: string = '', completed: boolean = false) {
    this.items.push(this.fb.group({
      id: [ id ],
      name: [ name, Validators.required ],
      completed: [ completed, Validators.required ]
    }));
  }

  delete() {

  }

  // This function compares two arrays of Items for differences
  // between two Items with the same id.
  // If there are missing Items in one of the arrays,
  // then they will also be added to the result.
  //
  // The result is an array with the id of the Items
  // in which the differences were found.
  // 
  // https://stackoverflow.com/a/31686152
  // https://stackoverflow.com/a/33034768
  itemDifferences(a: Item[], b: Item[]): string[] {
    console.log(b);

    let differences = reduce(a, (result, value, key) => {
      return (
        "id" in value &&
        isEqual(value, b.find(i => i?.id === value.id))
      )
        ? result
        : result.concat(value.id!);
    }, [] as string[]);

    return reduce(b, (result, value, key) => {
      return (
        ("id" in value) &&
        !(value.id! in result) &&
        !a.find(i => i?.id === value.id)
      )
        ? result.concat(value.id!)
        : result;
    }, differences)
  }

  reset() {
    this.isUpdated = false;

    (this.form.controls.items as FormArray).clear();

    this.form.reset();

    this.form.controls.title.setValue(this.todo!.title);

    for (let item of this.todo!.items!) {
      this.addItem(item.id, item.name, item.completed)
    }
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
