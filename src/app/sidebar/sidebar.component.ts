import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

interface SidebarItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  activeItem = '';
  constructor(private authService: AuthService, private router: Router) {}
  sidebarItems: SidebarItem[] = [
    {
      id: 'synthese',
      title: 'Synthèse de cours',
      description: 'Résume tes documents en quelques secondes',
      icon: '📚',
      route: '/app/synthese-cours'
    },
    {
      id: 'revision',
      title: 'Révision interactive',
      description: 'Crée des questions pour réviser efficacement',
      icon: '✨',
      route: '/app/revision-interactive'
    },
    {
      id: 'originalite',
      title: 'Vérificateur d\'originalité',
      description: 'Détecte les similitudes dans tes textes',
      icon: '🔍',
      route: '/app/verificateur-originalite'
    },
    {
      id: 'redaction',
      title: 'Assistant rédaction',
      description: 'Améliore ton style et corrige tes erreurs',
      icon: '✍️',
      route: '/app/assistant-redaction'
    },
    {
      id: 'cv',
      title: 'Optimiseur de CV',
      description: 'Perfectionne ton CV pour chaque opportunité',
      icon: '🎯',
      route: '/app/optimiseur-cv'
    }
  ];

  selectItem(id: string): void {
    this.activeItem = id;
  }

    logout() {
    this.authService.logout(); // remove JWT
    this.router.navigate(['/login']); // redirect to login
  }
}
