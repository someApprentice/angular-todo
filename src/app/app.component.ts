import { Component, OnInit, OnDestroy } from '@angular/core';

import { AngularFireAuth  } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import { User } from 'firebase/auth';

import { Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'angular-todo';

  user$?: Subscription;

  constructor(public auth: AngularFireAuth) {
  }

  ngOnInit() {
    this.user$ = this.auth.user.pipe(
      tap(user => {
        if (!user) {
          this.auth.signInAnonymously()
        }
      }) 
    ).subscribe();
  }

  ngOnDestroy() {
    if (this.user$) {
      this.user$.unsubscribe();
    }
  }
}
