import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'studentHelper';
  isLoggedIn = false; // start as false

  // Call this after user successfully logs in
  onLoginSuccess() {
    this.isLoggedIn = true;
  }
}
