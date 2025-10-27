import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';

interface Essay {
  id: number;
  userId: number;
  username: string;
  subject: string;
  language: string;
  title: string;
  content: string;
  submittedAt: string;
  isPlagiarismChecked: boolean;
}

interface MatchDetail {
  matchedEssayId: number;
  matchedStudentId: string;
  similarityScore: number;
  title: string;
  subject?: string;
  language?: string;
}

interface ReformulationExample {
  original: string;
  reformulated: string;
  explanation: string;
}

interface PlagiarismCheckResponse {
  essayId: number;
  overallPlagiarismScore: number;
  riskLevel: string;
  matches: MatchDetail[];
  matchesFound: number;
  totalEssaysCompared: number;
  status: string;
  recommendations?: string[];
  reformulationExamples?: ReformulationExample[];
}

@Component({
  selector: 'app-verificateur-originalite',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verificateur-originalite.component.html',
  styleUrls: ['./verificateur-originalite.component.css']
})
export class VerificateurOriginaliteComponent implements OnInit {
  private apiUrl = 'http://localhost:8222/api/plagiarism';

  // Dropdowns
  subjects: string[] = [
    'Mathématiques',
    'Physique',
    'Chimie',
    'Biologie',
    'Informatique',
    'Littérature',
    'Histoire',
    'Géographie',
    'Philosophie',
    'Économie',
    'Autre'
  ];

  languages = [
    { code: 'fr', name: 'Français' },
    { code: 'en', name: 'Anglais' },
    { code: 'ar', name: 'Arabe' },
    { code: 'es', name: 'Espagnol' },
    { code: 'de', name: 'Allemand' }
  ];

  // Form data
  subject: string = '';
  language: string = 'fr';
  title: string = '';
  content: string = '';

  // State
  isSubmitting: boolean = false;
  isChecking: boolean = false;
  isLoading: boolean = false;

  // Data
  essays: Essay[] = [];
  filteredEssays: Essay[] = [];
  currentEssay: Essay | null = null;
  plagiarismResult: PlagiarismCheckResponse | null = null;

  // Filters
  filterSubject: string = '';
  filterChecked: string = '';

  // UI State
  activeTab: 'submit' | 'history' = 'submit';
  showResult: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' | 'info' = 'info';

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadEssays();
  }

  private showToastMessage(message: string, type: 'success' | 'error' | 'info', duration: number = 5000): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges();
    }, duration);
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  loadEssays(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.get<Essay[]>(`${this.apiUrl}/essays`, { headers: this.getHeaders() })
      .subscribe({
        next: (data) => {
          this.essays = data.sort((a, b) =>
            new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
          );
          this.applyFilters();
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = 'Erreur lors du chargement des essais';
          console.error('Error loading essays:', error);
          this.isLoading = false;
        }
      });
  }

  applyFilters(): void {
    this.filteredEssays = this.essays.filter(essay => {
      const matchesSubject = !this.filterSubject || essay.subject === this.filterSubject;
      const matchesChecked = !this.filterChecked ||
        (this.filterChecked === 'checked' && essay.isPlagiarismChecked) ||
        (this.filterChecked === 'unchecked' && !essay.isPlagiarismChecked);

      return matchesSubject && matchesChecked;
    });
  }

  getWordCount(): number {
    if (!this.content) return 0;
    return this.content.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  submitEssay(): void {
    if (!this.subject || !this.language || !this.title || !this.content) {
      this.showToastMessage('Veuillez remplir tous les champs', 'error');
      return;
    }

    if (this.getWordCount() < 50) {
      this.showToastMessage('Le contenu doit contenir au moins 50 mots', 'error');
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      subject: this.subject,
      language: this.language,
      title: this.title,
      content: this.content
    };

    this.http.post<Essay>(`${this.apiUrl}/essays/submit`, payload, { headers: this.getHeaders() })
      .subscribe({
        next: (essay) => {
          this.showToastMessage('Essai soumis avec succès!', 'success', 3000);
          this.currentEssay = essay;
          this.resetForm();
          this.loadEssays();
          this.isSubmitting = false;
          this.cdr.detectChanges();

          // Auto check plagiarism after submission
          setTimeout(() => {
            this.checkPlagiarism(essay.id);
          }, 1000);
        },
        error: (error) => {
          console.log('Full error object:', error);
          console.log('error.error:', error.error);
          console.log('error.error.message:', error.error?.message);

          // Extract error message from response
          let errorMsg = 'Erreur lors de la soumission';
          if (error.error && error.error.message) {
            errorMsg = error.error.message;
            console.log('Setting errorMessage to:', errorMsg);
          } else if (error.error && typeof error.error === 'string') {
            errorMsg = error.error;
            console.log('Setting errorMessage to (string):', errorMsg);
          } else if (error.message) {
            errorMsg = error.message;
            console.log('Setting errorMessage to (error.message):', errorMsg);
          }

          this.isSubmitting = false;
          console.log('Final errorMessage value:', errorMsg);
          console.log('isSubmitting:', this.isSubmitting);

          // Show toast with error
          this.showToastMessage(errorMsg, 'error', 8000);
        }
      });
  }

  checkPlagiarism(essayId: number): void {
    this.isChecking = true;
    this.errorMessage = '';
    this.plagiarismResult = null;

    this.http.post<PlagiarismCheckResponse>(
      `${this.apiUrl}/essays/${essayId}/check`,
      {},
      { headers: this.getHeaders() }
    ).subscribe({
      next: (result) => {
        this.plagiarismResult = result;
        this.showResult = true;
        this.isChecking = false;
        this.loadEssays();

        // Log reformulation examples for debugging
        if (result.reformulationExamples && result.reformulationExamples.length > 0) {
          console.log('Reformulation examples received:', result.reformulationExamples);
        } else {
          console.log('No reformulation examples in response');
        }
      },
      error: (error) => {
        this.isChecking = false;
        this.showToastMessage('Erreur lors de la vérification', 'error', 3000);
        console.error('Error checking plagiarism:', error);
      }
    });
  }

  deleteEssay(essayId: number, event: Event): void {
    event.stopPropagation();

    if (!confirm('Êtes-vous sûr de vouloir supprimer cet essai ?')) {
      return;
    }

    this.http.delete(`${this.apiUrl}/essays/${essayId}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: () => {
        this.showToastMessage('Essai supprimé avec succès', 'success', 3000);
        this.loadEssays();
      },
      error: (error) => {
        console.error('Delete error:', error);
        this.showToastMessage('Erreur lors de la suppression', 'error', 3000);
      }
    });
  }

  navigateToThesis(): void {
    this.router.navigate(['/app/thesis-plagiarism'], { relativeTo: this.route });
  }

  getRiskColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'CRITICAL': return '#dc2626';
      case 'HIGH': return '#ea580c';
      case 'MODERATE': return '#ca8a04';
      case 'LOW': return '#16a34a';
      case 'NONE': return '#059669';
      default: return '#6b7280';
    }
  }

  getRiskIcon(riskLevel: string): string {
    switch (riskLevel) {
      case 'CRITICAL': return '🚨';
      case 'HIGH': return '⚠️';
      case 'MODERATE': return '⚡';
      case 'LOW': return '✓';
      case 'NONE': return '✨';
      default: return '❓';
    }
  }

  getRiskLabel(riskLevel: string): string {
    switch (riskLevel) {
      case 'CRITICAL': return 'Critique';
      case 'HIGH': return 'Élevé';
      case 'MODERATE': return 'Modéré';
      case 'LOW': return 'Faible';
      case 'NONE': return 'Aucun';
      default: return 'Inconnu';
    }
  }

  resetForm(): void {
    this.subject = '';
    this.language = 'fr';
    this.title = '';
    this.content = '';
  }

  closeResult(): void {
    this.showResult = false;
    this.plagiarismResult = null;
  }

  switchTab(tab: 'submit' | 'history'): void {
    this.activeTab = tab;
    this.errorMessage = '';
    this.successMessage = '';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getScorePercentage(score: number): number {
    return Math.round(score * 100);
  }
}
