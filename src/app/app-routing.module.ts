import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CreateTodoComponent } from './components/create-todo/create-todo.component';
import { TodoListComponent } from './components/todo-list/todo-list.component';
import { TodoComponent } from './components/todo/todo.component';

const routes: Routes = [
  { path: 'create', component: CreateTodoComponent },
  { path: 'todos', component: TodoListComponent },
  { path: 'todo/:id', component: TodoComponent },
  { path: '',   redirectTo: '/create', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
