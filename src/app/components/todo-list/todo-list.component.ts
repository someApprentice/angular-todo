import { Component, OnInit } from '@angular/core';

import { Observable } from 'rxjs';

import { TodosService } from '../../services/todos.service';

import { Todo } from '../../models/todo.model';

@Component({
  selector: 'app-todo-list',
  templateUrl: './todo-list.component.html',
  styleUrls: ['./todo-list.component.css']
})
export class TodoListComponent implements OnInit {
  todos$?: Observable<Todo[]>;

  constructor(private todosService: TodosService) { }

  ngOnInit(): void {
    this.todos$ = this.todosService.getTodos$();
  }
}
