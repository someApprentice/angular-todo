import { Component, OnInit } from '@angular/core';

import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Inject  } from '@angular/core';

import { Todo } from '../../../models/todo.model';

@Component({
  selector: 'app-update-dialog',
  templateUrl: './update-dialog.component.html',
  styleUrls: ['./update-dialog.component.css']
})
export class UpdateDialogComponent implements OnInit {
  updatedTodo?: Todo;
  todo?: Todo;
  differences?: string[];
  

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
    if ('updatedTodo' in this.data) {
      this.updatedTodo = this.data.updatedTodo as Todo;
    }

    if ('todo' in this.data) {
      this.todo = this.data.todo as Todo;
    }

    if ('differences' in this.data) {
      this.differences = this.data.differences;
    }
  }

  findUpdatedTodoById(id: string) {
    return this.updatedTodo!.items!.find(item => item.id === id);
  }

  filterDeletedItems() {
    return this.updatedTodo!.items!.filter(item => (
      this.differences!.find(id => item.id!) &&
      !this.todo!.items!.find(i => i.id! === item.id!)
    ));
  }
}
