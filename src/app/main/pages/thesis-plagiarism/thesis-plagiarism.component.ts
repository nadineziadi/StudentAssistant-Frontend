import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface Thesis {
  id: number;
  userId: number;
  username: string;
  title: string;
  fileName: string;
  uploadedAt: string;
}

interface ThesisMatch {
  matchedThesisId: number;
  matchedThesisTitle: string;
  matchedStudentId: string;
  similarityScore: number;
}

interface ThesisReport {
  id: number;
  thesisId: number;
  overallSimilarityScore: number;
  checkedAt: string;
  status: string;
  matches: ThesisMatch[];
}

@Component({
  selector: 'app-thesis-plagiarism',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './thesis-plagiarism.component.html',
  styleUrls: ['./thesis-plagiarism.component.css']
})
export class ThesisPlagiarismComponent implements OnInit {
  private apiUrl = 'http://localhost:8222/api/thesis';
  
  selectedFile: File | null = null;
  theses: Thesis[] = [];
  currentReport: ThesisReport | null = null;
  
  activeTab: 'upload' | 'history' = 'upload';
  isUploading = false;
  isChecking = false;
  isLoading = false;
  showResult = false;
  
  successMessage = '';
  errorMessage = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadTheses();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    if (file && file.type === 'application/pdf') {
      if (file.size > maxSize) {
        this.errorMessage = 'Le fichier est trop volumineux (max 50MB)';
        this.selectedFile = null;
        return;
      }
      this.selectedFile = file;
      this.errorMessage = '';
    } else {
      this.errorMessage = 'Veuillez sélectionner un fichier PDF';
      this.selectedFile = null;
    }
  }

  removeFile(): void {
    this.selectedFile = null;
  }

  uploadThesis(): void {
    if (!this.selectedFile) return;

    this.isUploading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    });

    this.http.post<Thesis>(`${this.apiUrl}/upload`, formData, {
      headers: headers
    }).subscribe({
      next: (thesis) => {
        this.successMessage = 'Rapport importé avec succès!';
        this.selectedFile = null;
        this.loadTheses();
        this.isUploading = false;
        
        setTimeout(() => {
          this.checkThesis(thesis.id);
        }, 1000);
      },
      error: (error) => {
        console.error('Upload error:', error);
        this.errorMessage = 'Erreur lors de l\'importation du rapport';
        this.isUploading = false;
      }
    });
  }

  checkThesis(thesisId: number): void {
    this.isChecking = true;
    this.errorMessage = '';

    this.http.post<ThesisReport>(`${this.apiUrl}/${thesisId}/check`, {}, {
      headers: this.getHeaders()
    }).subscribe({
      next: (report) => {
        this.currentReport = report;
        this.showResult = true;
        this.loadTheses();
        this.isChecking = false;
      },
      error: (error) => {
        console.error('Check error:', error);
        this.errorMessage = 'Erreur lors de la vérification';
        this.isChecking = false;
      }
    });
  }

  viewReport(thesisId: number): void {
    this.http.get<ThesisReport>(`${this.apiUrl}/${thesisId}/report`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (report) => {
        this.currentReport = report;
        this.showResult = true;
      },
      error: (error) => {
        console.error('Report error:', error);
        this.errorMessage = 'Aucun rapport trouvé pour ce document';
      }
    });
  }

  loadTheses(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.get<Thesis[]>(`${this.apiUrl}/my-theses`, {
      headers: this.getHeaders(),
      observe: 'response'
    }).subscribe({
      next: (response) => {
        if (response.body) {
          this.theses = response.body.sort((a, b) =>
            new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
          );
        } else {
          this.theses = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Load error:', error);
        if (error.status === 200) {
          this.theses = [];
          this.errorMessage = '';
        } else {
          this.errorMessage = 'Erreur lors du chargement des rapports';
        }
        this.isLoading = false;
      }
    });
  }

  deleteThesis(thesisId: number, event: Event): void {
    event.stopPropagation();
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) {
      return;
    }

    this.http.delete(`${this.apiUrl}/${thesisId}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: () => {
        this.successMessage = 'Rapport supprimé avec succès';
        this.loadTheses();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Delete error:', error);
        this.errorMessage = 'Erreur lors de la suppression';
      }
    });
  }

  getColor(score: number): string {
    if (score >= 0.9) return '#f56565';
    if (score >= 0.8) return '#ed8936';
    if (score >= 0.7) return '#ecc94b';
    return '#48bb78';
  }

  getLabel(score: number): string {
    if (score >= 0.9) return 'Très élevé';
    if (score >= 0.8) return 'Élevé';
    if (score >= 0.7) return 'Modéré';
    return 'Faible';
  }

  getScorePercentage(score: number): number {
    return Math.round(score * 100);
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

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  closeResult(): void {
    this.showResult = false;
  }

  switchTab(tab: 'upload' | 'history'): void {
    this.activeTab = tab;
    this.errorMessage = '';
    this.successMessage = '';
  }
}