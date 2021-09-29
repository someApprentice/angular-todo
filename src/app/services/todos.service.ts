import { Injectable } from '@angular/core';

import { Observable, from, of, concat, zip, throwError } from 'rxjs';
import { switchMap, concatMap, map, tap, filter, first, ignoreElements } from 'rxjs/operators';

import { Firestore, collection, doc, query, getDoc, getDocs, deleteDoc, onSnapshot, writeBatch, serverTimestamp  } from "firebase/firestore"; 
import { User, UserCredential } from "firebase/auth";

import { FirebaseService } from './firebase.service';

import { Todo } from '../models/todo.model';
import { Item } from '../models/item.model';

@Injectable({
  providedIn: 'root'
})
export class TodosService {
  todos: Todo[] = [];

  constructor(public firebaseService: FirebaseService) { }

  addTodo(todo: Todo): Observable<Todo> {
    return zip(
      this.firebaseService.db$,
      this.firebaseService.onAuthStateChanged$.pipe(
        filter(user => !!user),
        first(),
        map(user => user!)
      )
    ).pipe(
      switchMap(([ db, user ]: [ Firestore, User ]) => {
        const batch = writeBatch(db);

        const todoRef = doc(collection(db, "todos"));

        const timestamp = serverTimestamp();

        batch.set(todoRef, {
          title: todo.title,
          createdAt: timestamp,
          createdBy: user.uid
        });

        for (let item of todo.items!) {
          let itemRef = doc(collection(db, "todos", todoRef.id, "items"));
          batch.set(itemRef, { name: item.name, completed: item.completed });
        }

        todo.id = todoRef.id;
        todo.createdBy = user.uid;

        // @TODO fill with timestamp
        // todo.createdAt = timestamp.seconds;

        return concat(
          from(batch.commit()).pipe(ignoreElements()),
          of(todo)
        );
      })
    );
  }

  getTodos$(): Observable<Todo[]> {
    return this.firebaseService.db$.pipe(
      switchMap(db => {
        const q = query(collection(db, "todos"));

        return (new Observable<Todo[]>(subscriber => {
          const unsubscribe = onSnapshot(
            q,
            (querySnapShot) => {
              const todos: Todo[] = [];

              querySnapShot.forEach(doc => {
                let todo: Todo = {
                  id: doc.id,
                  title: doc.data().title,
                  createdBy: doc.data().createdBy,
                  createdAt: doc.data().createdAt.seconds
                }

                if (doc.data().updatedBy) {
                  todo.updatedBy = doc.data().updatedBy;
                }

                if (doc.data().updatedAt) {
                  todo.updatedAt = doc.data().updatedAt.seconds;
                }

                todos.push(todo);
              })

              subscriber.next(todos);
            },
            error => {
              subscriber.error(error);
            },
            () => {
              subscriber.complete()
            }
          )

          return () => {
            unsubscribe();
          }
        }))
      })
    );
  }

  getTodo(id: string): Observable<Todo> {
    return this.firebaseService.db$.pipe(
      switchMap(db => {
        return zip(
          from(getDoc(doc(db, "todos", id))).pipe(
            switchMap(doc => {
              if (!doc.exists()) {
                return throwError("Todo wasn't found")
              }

              let todo: Todo = {
                id: doc.id,
                title: doc.data()!.title,
                createdBy: doc.data()!.createdBy,
                createdAt: doc.data()!.createdAt.seconds
              }

              if (doc.data()!.updatedBy) {
                todo.updatedBy = doc.data().updatedBy;
              }

              if (doc.data()!.updatedAt) {
                todo.updatedAt = doc.data().updatedAt.seconds;
              }

              return of(todo);
            })
          ),
          from(getDocs(query(collection(db, "todos", id, "items")))).pipe(
            map(querySnapShot => {
              let items: Item[] = [];

              querySnapShot.forEach(doc => {
                let item: Item = {
                  id: doc.id,
                  name: doc.data().name,
                  completed: doc.data().completed
                }

                items.push(item);
              });

              return items;
            })
          )
        ).pipe(
          map(([ todo, items ]: [ Todo, Item[] ]) => {
            todo.items = items;

            return todo;
          })
        );
      })
    );
  }

  getTodo$(id: string): Observable<Todo> {
    return this.firebaseService.db$.pipe(
      switchMap(db => {
        return (new Observable<Todo>(subscriber => {
            const unsubscribe = onSnapshot(
              doc(db, "todos", id),
              doc => {
                if (!doc.exists()) {
                  subscriber.error("Todo wasn't found");
                }

                let todo: Todo = {
                  id: doc.id,
                  title: doc.data()!.title,
                  createdBy: doc.data()!.createdBy,
                  createdAt: doc.data()!.createdAt.seconds
                }

                if (doc.data()!.updatedBy) {
                  todo.updatedBy = doc.data()!.updatedBy;
                }

                if (doc.data()!.updatedAt) {
                  todo.updatedAt = doc.data()!.updatedAt.seconds;
                }

                subscriber.next(todo);
              },
              error => {
                subscriber.error(error);
              },
              () => {
                subscriber.complete();
              }
            );

            return () => {
              unsubscribe();
            }
          }));
      }),
      switchMap((todo: Todo) => {
        return this.firebaseService.db$.pipe(
          switchMap(db => {
            return from(getDocs(query(collection(db, "todos", id, "items")))).pipe(
              map(querySnapShot => {
                let items: Item[] = [];

                querySnapShot.forEach(doc => {
                  let item: Item = {
                    id: doc.id,
                    name: doc.data().name,
                    completed: doc.data().completed
                  }

                  items.push(item);
                });

                return items;
              }),
              map((items: Item[]) => {
                todo.items = items;

                return todo;
              })
            )
          })
        );
      })
    );
  }

  updateTodo(todo: Todo) {
    return zip(
      this.firebaseService.db$,
      this.firebaseService.onAuthStateChanged$.pipe(
        filter(user => !!user),
        first(),
        map(user => user!)
      )
    ).pipe(
      switchMap(([ db, user ]: [ Firestore, User ]) => {
        const batch = writeBatch(db);

        const todoRef = doc(db, "todos", todo.id!);
        batch.update(todoRef, {
          title: todo.title,
          updatedBy: user.uid,
          updatedAt: serverTimestamp()
        });

        for (let item of todo.items!) {
          let itemRef;

          if (!('id' in item)) {
            itemRef = doc(collection(db, "todos", todoRef.id, "items"));

            batch.set(itemRef, { name: item.name, completed: item.completed });
          }

          if ('id' in item) {
            itemRef = doc(db, "todos", todoRef.id, "items", item.id!);

            batch.update(itemRef, { name: item.name, completed: item.completed });
          }
        }

        return from(batch.commit());
      })
    );
  }

  deleteTodo(id: string) {
    return this.firebaseService.db$.pipe(
      switchMap(db => from(deleteDoc(doc(db, "todos", id))))
    );
  }
}
