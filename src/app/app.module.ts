import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AngularFireModule  } from '@angular/fire/compat';
import { environment } from '../environments/environment';

import { PERSISTENCE  } from '@angular/fire/compat/auth';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    AngularFireModule.initializeApp(environment.firebase)
  ],
  providers: [
    { provide: PERSISTENCE, useValue: 'local'  },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
