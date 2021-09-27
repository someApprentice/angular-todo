import { Injectable } from '@angular/core';

import { Observable, from } from 'rxjs';
import { shareReplay, switchMap } from 'rxjs/operators';

import { initializeApp  } from "firebase/app"
import { getFirestore  } from "firebase/firestore"
import { getAuth, signInAnonymously, onAuthStateChanged, Auth, User  } from "firebase/auth";

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  firebaseApp$ = (new Observable(subscriber => {
    const firebaseApp = initializeApp(environment.firebase); 

    subscriber.next(firebaseApp);
    subscriber.complete();
  })).pipe(
    shareReplay(1)
  );

  auth$ = this.firebaseApp$.pipe(
    switchMap(firebaseApp => (new Observable<Auth>(subscriber => {
      const auth = getAuth();

      subscriber.next(auth);
      subscriber.complete();
    }))),
    shareReplay(1)
  );

  db$ = this.firebaseApp$.pipe(
    switchMap(firebaseApp => (new Observable(subscriber => {
      const db = getFirestore();

      subscriber.next(db);
      subscriber.complete();
    }))),
    shareReplay(1)
  );

  constructor() { }

  onAuthStateChanged() {
    return this.auth$.pipe(
      switchMap((auth: Auth) => {
        return new Observable<User|null>(subscriber => {
          onAuthStateChanged(auth, (user: User|null) => {
            subscriber.next(user);
            subscriber.complete();
          })
        });
      })
    );
  }

  signInAnonymously() {
    return this.auth$.pipe(
      switchMap((auth: Auth) => {
        return from(signInAnonymously(auth));
      })
    );
  }
}
