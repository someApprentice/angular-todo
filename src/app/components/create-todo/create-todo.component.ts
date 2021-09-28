import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { Observable, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';

import { User } from 'firebase/auth';

import { TouchedErrorStateMatcher } from '../../services/touched-error-state-matcher.service';

import { FirebaseService } from '../../services/firebase.service';
import { TodosService } from '../../services/todos.service';

import { Todo } from '../../models/todo.model';
import { Item } from '../../models/item.model';


@Component({
  selector: 'app-create-todo',
  templateUrl: './create-todo.component.html',
  styleUrls: ['./create-todo.component.css']
})
export class CreateTodoComponent implements OnInit {
  form = this.fb.group({
    title: ['', Validators.required],
    items: this.fb.array([
      this.fb.control('', Validators.required)
    ])
  });

  matcher = new TouchedErrorStateMatcher(); 

  user$?: Observable<User|null>;

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private todosService: TodosService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.user$ = this.firebaseService.onAuthStateChanged$;
  }

  get items() {
    return this.form.get('items') as FormArray;
  }

  addItem() {
    this.items.push(this.fb.control('', Validators.required));
  }

  onSubmit() {
    let todo: Todo = {
      title: this.form.value.title,
      items: [],
    };

    for (let item of this.form.value.items) {
      let i: Item = {
        name: item,
        completed: false
      };

      todo.items!.push(i);
    }

    this.todosService.addTodo(todo).pipe(
      tap((todo: Todo) => {
        this.router.navigate(['todo', todo.id!]);
      })
    ).subscribe();
  }

  clear() {
    (this.form.controls.items as FormArray).clear();
    
    this.form.reset();
  
    this.addItem();
  }
}
