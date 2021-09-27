import { Component, OnInit, OnDestroy } from '@angular/core';

import { User, UserCredential } from 'firebase/auth'

import { FirebaseService } from './services/firebase.service';

import { Subscription, of } from 'rxjs';
import { first, tap, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'angular-todo';

  user$?: Subscription;

  constructor(public firebaseService: FirebaseService) {
  }

  ngOnInit() {
    this.user$ = this.firebaseService.onAuthStateChanged().pipe(
      switchMap((user: User|null) => {
        if (!user) {
          return this.firebaseService.signInAnonymously();
        }

        return of(user);
      }),
    ).subscribe();
  }

  ngOnDestroy() {
    this.user$!.unsubscribe();
  }
}
