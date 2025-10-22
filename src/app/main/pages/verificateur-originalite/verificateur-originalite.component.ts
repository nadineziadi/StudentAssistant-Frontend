import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';

interface Essay {
  id: number;
  userId: number;
  username: string;
  assignmentId: string;
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
}

interface PlagiarismCheckResponse {
  essayId: number;
  overallPlagiarismScore: number;
  matches: MatchDetail[];
  status: string;
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
  
  // Form data
  assignmentId: string = '';
  title: string = '';
  content: string = '';
  
  // State
  isSubmitting: boolean = false;
  isChecking: boolean = false;
  isLoading: boolean = false;
  
  // Data
  essays: Essay[] = [];
  currentEssay: Essay | null = null;
  plagiarismResult: PlagiarismCheckResponse | null = null;
  
  // UI State
  activeTab: 'submit' | 'history' = 'submit';
  showResult: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

constructor(private http: HttpClient,    private router: Router  // Ajoute ça
,    private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.loadEssays();
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
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = 'Erreur lors du chargement des essais';
          console.error('Error loading essays:', error);
          this.isLoading = false;
        }
      });
  }

  submitEssay(): void {
    if (!this.assignmentId || !this.title || !this.content) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      assignmentId: this.assignmentId,
      title: this.title,
      content: this.content
    };

    this.http.post<Essay>(`${this.apiUrl}/essays/submit`, payload, { headers: this.getHeaders() })
      .subscribe({
        next: (essay) => {
          this.successMessage = 'Essai soumis avec succès!';
          this.currentEssay = essay;
          this.resetForm();
          this.loadEssays();
          this.isSubmitting = false;
          
          // Auto check plagiarism after submission
          setTimeout(() => {
            this.checkPlagiarism(essay.id);
          }, 1000);
        },
        error: (error) => {
          this.errorMessage = 'Erreur lors de la soumission';
          console.error('Error submitting essay:', error);
          this.isSubmitting = false;
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
        this.loadEssays(); // Refresh to update isPlagiarismChecked status
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors de la vérification';
        console.error('Error checking plagiarism:', error);
        this.isChecking = false;
      }
    });
  }

  // Ajoute cette méthode
  navigateToThesis(): void {
    this.router.navigate(['/app/thesis-plagiarism'], { relativeTo: this.route });
  }


  getSimilarityColor(score: number): string {
    if (score >= 0.9) return '#f56565';
    if (score >= 0.8) return '#ed8936';
    if (score >= 0.7) return '#ecc94b';
    return '#48bb78';
  }

  getSimilarityLabel(score: number): string {
    if (score >= 0.9) return 'Très élevé';
    if (score >= 0.8) return 'Élevé';
    if (score >= 0.7) return 'Modéré';
    return 'Faible';
  }

  resetForm(): void {
    this.assignmentId = '';
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
