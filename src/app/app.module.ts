import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Standalone components
import { SidebarComponent } from './sidebar/sidebar.component';
import { LandingComponent } from './landing/landing.component';

@NgModule({
  declarations: [
    AppComponent  // Only declare non-standalone components
  ],
  imports: [
    BrowserModule,
    HttpClientModule, // Provides HttpClient for AuthService
    AppRoutingModule,
    SidebarComponent,  // ✅ Import standalone component
    LandingComponent   // ✅ Import standalone component
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
