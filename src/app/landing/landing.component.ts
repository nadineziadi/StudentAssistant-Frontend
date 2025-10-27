import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent {
  features = [
    {
      icon: '📚',
      title: 'Synthèse de cours',
      description: 'Transforme tes notes en résumés clairs et concis',
      color: '#667eea'
    },
    {
      icon: '✨',
      title: 'Révision interactive',
      description: 'Génère des questions pour mieux réviser',
      color: '#f093fb'
    },
    {
      icon: '🔍',
      title: 'Vérificateur d\'originalité',
      description: 'Assure l\'authenticité de tes travaux',
      color: '#4facfe'
    },
    {
      icon: '✍️',
      title: 'Assistant rédaction',
      description: 'Améliore ton style et corrige tes erreurs',
      color: '#43e97b'
    },
    {
      icon: '🎯',
      title: 'Optimiseur de CV',
      description: 'Crée un CV professionnel qui se démarque',
      color: '#fa709a'
    }
  ];

  stats = [
    { value: '5', label: 'Outils disponibles' },
    { value: '100%', label: 'Gratuit' },
    { value: '24/7', label: 'Disponible' }
  ];
}
