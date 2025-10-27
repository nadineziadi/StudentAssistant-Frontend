import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';

interface Thesis {
  id: number;
  userId: number;
  username: string;
  title: string;
  fileName: string;
  uploadedAt: string;
  lastChecked?: string;
  similarityScore?: number;
  lastCheckScore?: number;  // Changed from similarityScore
  lastCheckedAt?: string;   // Changed from lastChecked
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

interface ChunkPosition {
  start: number;
  end: number;
  chunkIndex: number;
}

interface ChunkMatch {
  text1Chunk: string;
  text2Chunk: string;
  similarity: number;
  position1: ChunkPosition;
  position2: ChunkPosition;
  wordCount1: number;
  wordCount2: number;
}

interface DetailedSimilarityResponse {
  overallSimilarity: number;
  totalComparisons: number;
  matchesFound: number;
  chunks: ChunkMatch[];
}

type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'score-desc' | 'score-asc';
type FilterOption = 'all' | 'checked' | 'unchecked' | 'high-risk' | 'medium-risk' | 'low-risk';

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
  filteredTheses: Thesis[] = [];
  currentReport: ThesisReport | null = null;
  detailedAnalysis: DetailedSimilarityResponse | null = null;
  currentMatchedThesisId: number | null = null;
  
  // Filter and search
  searchQuery = '';
  selectedFilter: FilterOption = 'all';
  selectedSort: SortOption = 'date-desc';
  
  activeTab: 'upload' | 'history' = 'upload';
  isUploading = false;
  isChecking = false;
  isLoading = false;
  isLoadingDetails = false;
  showResult = false;
  showDetailedAnalysis = false;
  
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
    const maxSize = 50 * 1024 * 1024;
    
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

  viewDetailedAnalysis(match: ThesisMatch): void {
    if (!this.currentReport) return;

    this.isLoadingDetails = true;
    this.currentMatchedThesisId = match.matchedThesisId;

    const params = {
      thesisId1: this.currentReport.thesisId.toString(),
      thesisId2: match.matchedThesisId.toString()
    };

    this.http.get<DetailedSimilarityResponse>(
      `${this.apiUrl}/detailed-analysis`,
      { 
        headers: this.getHeaders(),
        params: params
      }
    ).subscribe({
      next: (analysis) => {
        this.detailedAnalysis = analysis;
        this.showDetailedAnalysis = true;
        this.isLoadingDetails = false;
      },
      error: (error) => {
        console.error('Detailed analysis error:', error);
        this.errorMessage = 'Erreur lors du chargement de l\'analyse détaillée';
        this.isLoadingDetails = false;
      }
    });
  }

  closeDetailedAnalysis(): void {
    this.showDetailedAnalysis = false;
    this.detailedAnalysis = null;
    this.currentMatchedThesisId = null;
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
          this.theses = response.body;
          // Load reports for each thesis to get similarity scores
          this.loadThesesWithReports();
        } else {
          this.theses = [];
          this.filteredTheses = [];
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Load error:', error);
        if (error.status === 200) {
          this.theses = [];
          this.filteredTheses = [];
          this.errorMessage = '';
        } else {
          this.errorMessage = 'Erreur lors du chargement des rapports';
        }
        this.isLoading = false;
      }
    });
  }

  private loadThesesWithReports(): void {
    // Load reports for all theses to get similarity scores
    const reportRequests = this.theses.map(thesis =>
      lastValueFrom(
        this.http.get<ThesisReport>(`${this.apiUrl}/${thesis.id}/report`, {
          headers: this.getHeaders()
        })
      ).catch(() => null) // Return null if no report exists
    );

    Promise.all(reportRequests).then(reports => {
      // Attach similarity scores to theses
      this.theses.forEach((thesis, index) => {
        const report = reports[index];
        if (report) {
          thesis.similarityScore = report.overallSimilarityScore;
          thesis.lastChecked = report.checkedAt;
        }
      });
      
      this.applyFiltersAndSort();
      this.isLoading = false;
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

  // Filter and Sort Methods
  onSearchChange(): void {
    this.applyFiltersAndSort();
  }

  onFilterChange(filter: FilterOption): void {
    this.selectedFilter = filter;
    this.applyFiltersAndSort();
  }

  onSortChange(sort: SortOption): void {
    this.selectedSort = sort;
    this.applyFiltersAndSort();
  }

  applyFiltersAndSort(): void {
    let result = [...this.theses];

    // Apply search
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(query) ||
        t.fileName.toLowerCase().includes(query)
      );
    }

    // Apply filter
    result = result.filter(thesis => {
      switch (this.selectedFilter) {
        case 'checked':
          return thesis.similarityScore !== undefined;
        case 'unchecked':
          return thesis.similarityScore === undefined;
        case 'high-risk':
          return thesis.similarityScore !== undefined && thesis.similarityScore >= 0.7;
        case 'medium-risk':
          return thesis.similarityScore !== undefined && thesis.similarityScore >= 0.5 && thesis.similarityScore < 0.7;
        case 'low-risk':
          return thesis.similarityScore !== undefined && thesis.similarityScore < 0.5;
        default:
          return true;
      }
    });

    // Apply sort
    result.sort((a, b) => {
      switch (this.selectedSort) {
        case 'date-desc':
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
        case 'date-asc':
          return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
        case 'name-asc':
          return a.title.localeCompare(b.title);
        case 'name-desc':
          return b.title.localeCompare(a.title);
        case 'score-desc':
          return (b.similarityScore || 0) - (a.similarityScore || 0);
        case 'score-asc':
          return (a.similarityScore || 0) - (b.similarityScore || 0);
        default:
          return 0;
      }
    });

    this.filteredTheses = result;
  }

  getFilterCount(filter: FilterOption): number {
    switch (filter) {
      case 'checked':
        return this.theses.filter(t => t.similarityScore !== undefined).length;
      case 'unchecked':
        return this.theses.filter(t => t.similarityScore === undefined).length;
      case 'high-risk':
        return this.theses.filter(t => t.similarityScore !== undefined && t.similarityScore >= 0.7).length;
      case 'medium-risk':
        return this.theses.filter(t => t.similarityScore !== undefined && t.similarityScore >= 0.5 && t.similarityScore < 0.7).length;
      case 'low-risk':
        return this.theses.filter(t => t.similarityScore !== undefined && t.similarityScore < 0.5).length;
      default:
        return this.theses.length;
    }
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedFilter = 'all';
    this.selectedSort = 'date-desc';
    this.applyFiltersAndSort();
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

  getChunkColor(similarity: number): string {
    if (similarity >= 0.95) return '#dc2626';
    if (similarity >= 0.85) return '#ea580c';
    if (similarity >= 0.75) return '#ca8a04';
    return '#16a34a';
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