import { Injectable } from '@angular/core';

import { Observable, from } from 'rxjs';
import { shareReplay, switchMap } from 'rxjs/operators';

import { initializeApp  } from "firebase/app"
import { Firestore, getFirestore  } from "firebase/firestore"
import { getAuth, signInAnonymously, onAuthStateChanged, Auth, User, setPersistence, inMemoryPersistence } from "firebase/auth";

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

      setPersistence(auth, inMemoryPersistence);

      subscriber.next(auth);
      subscriber.complete();
    }))),
    shareReplay(1)
  )

  onAuthStateChanged$ = this.auth$.pipe(
    switchMap((auth: Auth) => {
      return new Observable<User|null>(subscriber => {
        const unsubscribe = onAuthStateChanged(
          auth,
          (user: User|null) => {
            subscriber.next(user);
          },
          err => {
            subscriber.error(err);
          },
          () => {
            subscriber.complete();
          }
        );

        return () => {
          unsubscribe();
        };
      });
    })
  );

  db$ = this.firebaseApp$.pipe(
    switchMap(firebaseApp => (new Observable<Firestore>(subscriber => {
      const db = getFirestore();

      subscriber.next(db);
      subscriber.complete();
    }))),
    shareReplay(1)
  );

  constructor() { }

  signInAnonymously() {
    return this.auth$.pipe(
      switchMap((auth: Auth) => {
        return from(signInAnonymously(auth));
      })
    );
  }
}
