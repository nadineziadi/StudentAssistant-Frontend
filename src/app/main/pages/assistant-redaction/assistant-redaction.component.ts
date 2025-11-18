import { Component, OnInit } from '@angular/core';

import { RedactionService, CorrectionResponse, GrammarCorrectionResponse, TranslationResponse, ParaphraseResponse, Document, StyleAdaptationResponse } from '../../../services/redaction.service';

interface Suggestion {
  type: 'grammar' | 'style' | 'orthography' | 'spelling' | 'punctuation' | 'vocabulary';
  original: string;
  correction: string;
  rule: string;
  position: {
    start: number;
    end: number;
  };
}


@Component({
  selector: 'app-assistant-redaction',
  templateUrl: './assistant-redaction.component.html',
  styleUrls: ['./assistant-redaction.component.css']
})
export class AssistantRedactionComponent implements OnInit {
  // Navigation - Ajout de l'onglet historique


 // Ajouter dans les propriétés existantes
  activeMainTab: 'correction' | 'grammar' | 'translation' | 'paraphrase' | 'history' | 'style' = 'correction';

  // NOUVEAU : Adaptation de style
  styleInputText: string = '';
  selectedStyle: string = 'académique';
  styleAdaptationResults: any = null;
  isStyleAdaptationProcessing: boolean = false;

  // Styles disponibles
  availableStyles = [
    { value: 'académique', label: 'Académique', icon: '🎓', description: 'Formel, précis, vocabulaire avancé' },
    { value: 'créatif', label: 'Créatif', icon: '🎨', description: 'Imaginatif, expressif, original' },
    { value: 'journalistique', label: 'Journalistique', icon: '📰', description: 'Clair, concis, engageant' },
    { value: 'professionnel', label: 'Professionnel', icon: '💼', description: 'Poli, business-like, soigné' },
    { value: 'email', label: 'Email', icon: '📧', description: 'Formel, poli, concis' }
  ];

  // Correction complète
  activeInputTab: 'text' | 'file' = 'text';
  inputText: string = '';
  selectedFile: File | null = null;
  correctedText: string = '';
  suggestions: Suggestion[] = [];
  isProcessing: boolean = false;
  activeTab: 'correction' | 'suggestions' = 'correction';
  currentDocumentId: number | null = null;

  // Correction grammaticale rapide
  grammarInputText: string = '';
  grammarCorrectedText: string = '';
  isGrammarProcessing: boolean = false;

  // Traduction
  translationInputText: string = '';
  translationOutputText: string = '';
  translationDirection: 'en-fr' | 'fr-en' = 'en-fr';
  isTranslationProcessing: boolean = false;

  // Paraphrase
  paraphraseInputText: string = '';
  paraphraseResults: string[] = [];
  isParaphraseProcessing: boolean = false;

  // NOUVEAU : Historique
  documents: Document[] = [];
  filteredDocuments: Document[] = [];
  searchQuery: string = '';
  selectedFilter: 'all' | 'corrected' | 'uncorrected' = 'all';
  isLoadingHistory: boolean = false;

  // NOUVEAU : Toast notifications
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' | 'info' = 'info';

  // NOUVEAU : Modal pour voir les détails
  showDetailModal: boolean = false;
  selectedDocument: Document | null = null;

  constructor(private redactionService: RedactionService) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  // ========================================
  // NOUVEAU : SYSTÈME DE TOAST
  // ========================================
  showToastNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 4000);
  }

  closeToast(): void {
    this.showToast = false;
  }

 adaptStyle(): void {
    if (!this.styleInputText.trim()) {
      this.showToastNotification('Veuillez entrer du texte', 'error');
      return;
    }

    this.isStyleAdaptationProcessing = true;
    this.styleAdaptationResults = null;

    this.redactionService.adaptStyle(this.styleInputText, this.selectedStyle)
      .subscribe({
        next: (response) => {
          this.styleAdaptationResults = response;
          this.isStyleAdaptationProcessing = false;
          this.showToastNotification(`Texte adapté au style ${this.selectedStyle}`, 'success');
        },
        error: (error) => {
          console.error('Error adapting style:', error);
          this.showToastNotification('Erreur lors de l\'adaptation de style', 'error');
          this.isStyleAdaptationProcessing = false;
        }
      });
  }

  copyStyleText(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.showToastNotification('Texte copié', 'success');
    });
  }

  clearStyle(): void {
    this.styleInputText = '';
    this.styleAdaptationResults = null;
    this.selectedStyle = 'académique';
  }

  getStyleIcon(styleValue: string): string {
    const style = this.availableStyles.find(s => s.value === styleValue);
    return style ? style.icon : '🎭';
  }

  getStyleLabel(styleValue: string): string {
    const style = this.availableStyles.find(s => s.value === styleValue);
    return style ? style.label : styleValue;
  }






  // ========================================
  // NOUVEAU : HISTORIQUE DES DOCUMENTS
  // ========================================
  loadHistory(): void {
    this.isLoadingHistory = true;
    this.redactionService.getUserDocuments().subscribe({
      next: (docs) => {
        this.documents = docs;
        this.applyFilters();
        this.isLoadingHistory = false;
      },
      error: (error) => {
        console.error('Error loading history:', error);
        this.showToastNotification('Erreur lors du chargement de l\'historique', 'error');
        this.isLoadingHistory = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.documents];

    // Filtre par texte de recherche
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(query) ||
        doc.originalContent.toLowerCase().includes(query)
      );
    }

    // Filtre par statut
    if (this.selectedFilter === 'corrected') {
      filtered = filtered.filter(doc => doc.isCorrected);
    } else if (this.selectedFilter === 'uncorrected') {
      filtered = filtered.filter(doc => !doc.isCorrected);
    }

    // Trier par date (plus récent d'abord)
    filtered.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    this.filteredDocuments = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(filter: 'all' | 'corrected' | 'uncorrected'): void {
    this.selectedFilter = filter;
    this.applyFilters();
  }

  viewDocumentDetails(doc: Document): void {
    this.selectedDocument = doc;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedDocument = null;
  }

  deleteDocument(docId: number): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    this.redactionService.deleteDocument(docId).subscribe({
      next: () => {
        this.showToastNotification('Document supprimé avec succès', 'success');
        this.loadHistory();
      },
      error: (error) => {
        console.error('Error deleting document:', error);
        this.showToastNotification('Erreur lors de la suppression', 'error');
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  getPreviewText(text: string, maxLength: number = 150): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  getCorrectedCount(): number {
    return this.documents.filter(doc => doc.isCorrected).length;
  }

  getUncorrectedCount(): number {
    return this.documents.filter(doc => !doc.isCorrected).length;
  }

  // ========================================
  // CORRECTION COMPLÈTE - AMÉLIORÉ
  // ========================================
  analyzeText(): void {
    this.isProcessing = true;
    this.correctedText = '';
    this.suggestions = [];

    if (this.activeInputTab === 'text' && this.inputText) {
      this.redactionService.submitDocument(this.inputText, 'Document sans titre')
        .subscribe({
          next: (document) => {
            this.currentDocumentId = document.id;
            this.showToastNotification('Document soumis avec succès', 'success');
            this.correctCurrentDocument();
          },
          error: (error) => {
            console.error('Error submitting document:', error);
            this.showToastNotification('Erreur lors de la soumission', 'error');
            this.isProcessing = false;
          }
        });
    } else if (this.activeInputTab === 'file' && this.selectedFile) {
      this.redactionService.uploadDocument(this.selectedFile)
        .subscribe({
          next: (document) => {
            this.currentDocumentId = document.id;
            this.inputText = document.originalContent;
            this.showToastNotification('Fichier uploadé avec succès', 'success');
            this.correctCurrentDocument();
          },
          error: (error) => {
            console.error('Error uploading document:', error);
            this.showToastNotification('Erreur lors du téléchargement', 'error');
            this.isProcessing = false;
          }
        });
    }
  }

  private correctCurrentDocument(): void {
    if (!this.currentDocumentId) {
      this.isProcessing = false;
      return;
    }

    this.redactionService.correctDocument(this.currentDocumentId)
      .subscribe({
        next: (response: CorrectionResponse) => {
          this.correctedText = response.correctedText;
          this.suggestions = this.mapSuggestions(response.suggestions);
          this.isProcessing = false;
          this.showToastNotification(
            `Correction terminée ! ${response.totalSuggestions} suggestion(s) trouvée(s)`,
            'success'
          );
          this.loadHistory(); // Recharger l'historique
        },
        error: (error) => {
          console.error('Error correcting document:', error);
          this.showToastNotification('Erreur lors de la correction', 'error');
          this.isProcessing = false;
        }
      });
  }

  private mapSuggestions(backendSuggestions: any[]): Suggestion[] {
    return backendSuggestions.map(s => ({
      type: s.type.toLowerCase() as any,
      original: s.original,
      correction: s.correction,
      rule: s.rule,
      position: {
        start: s.startPosition || 0,
        end: s.endPosition || 0
      }
    }));
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        this.showToastNotification('Le fichier est trop volumineux (max 10MB)', 'error');
        return;
      }
      this.selectedFile = file;
      this.showToastNotification(`Fichier "${file.name}" sélectionné`, 'info');

      if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.inputText = e.target.result;
        };
        reader.readAsText(file);
      } else {
        this.inputText = '';
      }
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    if (this.activeInputTab === 'file') {
      this.inputText = '';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  applySuggestion(suggestion: any): void {
    this.inputText = this.inputText.replace(suggestion.original, suggestion.correction);
    this.correctedText = this.correctedText.replace(suggestion.original, suggestion.correction);
    this.suggestions = this.suggestions.filter(s => s !== suggestion);
    this.showToastNotification('Suggestion appliquée', 'success');
  }

  copyText(): void {
    const textToCopy = this.correctedText || this.inputText;
    navigator.clipboard.writeText(textToCopy).then(() => {
      this.showToastNotification('Texte copié dans le presse-papiers', 'success');
    }).catch(() => {
      this.showToastNotification('Erreur lors de la copie', 'error');
    });
  }

  downloadText(): void {
    if (!this.correctedText) return;
    const element = document.createElement('a');
    const file = new Blob([this.correctedText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'texte_corrige.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    this.showToastNotification('Téléchargement démarré', 'success');
  }

  clearText(): void {
    this.inputText = '';
    this.correctedText = '';
    this.suggestions = [];
    this.selectedFile = null;
    this.currentDocumentId = null;
  }

  getTypeIcon(type: string): string {
    const upperType = type?.toUpperCase() || '';
    const icons: any = {
      'GRAMMAR': '📝',
      'STYLE': '✨',
      'ORTHOGRAPHY': '✍️',
      'SPELLING': '🔤',
      'PUNCTUATION': '❗',
      'VOCABULARY': '📚',
      'PARAPHRASE': '🔄'
    };
    return icons[upperType] || '💡';
  }

  getTypeLabel(type: string): string {
    const upperType = type?.toUpperCase() || '';
    const labels: any = {
      'GRAMMAR': 'Grammaire',
      'STYLE': 'Style',
      'ORTHOGRAPHY': 'Orthographe',
      'SPELLING': 'Orthographe',
      'PUNCTUATION': 'Ponctuation',
      'VOCABULARY': 'Vocabulaire',
      'PARAPHRASE': 'Paraphrase'
    };
    return labels[upperType] || 'Suggestion';
  }

  // ========================================
  // CORRECTION GRAMMATICALE RAPIDE
  // ========================================
  correctGrammarQuick(): void {
    if (!this.grammarInputText.trim()) {
      this.showToastNotification('Veuillez entrer du texte', 'error');
      return;
    }

    this.isGrammarProcessing = true;
    this.grammarCorrectedText = '';

    this.redactionService.correctGrammar(this.grammarInputText)
      .subscribe({
        next: (response: GrammarCorrectionResponse) => {
          this.grammarCorrectedText = response.corrected;
          this.isGrammarProcessing = false;
          this.showToastNotification('Correction terminée', 'success');
        },
        error: (error) => {
          console.error('Error correcting grammar:', error);
          this.showToastNotification('Erreur lors de la correction', 'error');
          this.isGrammarProcessing = false;
        }
      });
  }

  copyGrammarText(): void {
    navigator.clipboard.writeText(this.grammarCorrectedText).then(() => {
      this.showToastNotification('Texte copié', 'success');
    });
  }

  clearGrammar(): void {
    this.grammarInputText = '';
    this.grammarCorrectedText = '';
  }

  // ========================================
  // TRADUCTION
  // ========================================
  translateText(): void {
    if (!this.translationInputText.trim()) {
      this.showToastNotification('Veuillez entrer du texte à traduire', 'error');
      return;
    }

    this.isTranslationProcessing = true;
    this.translationOutputText = '';

    const translateMethod = this.translationDirection === 'en-fr'
      ? this.redactionService.translateEnToFr(this.translationInputText)
      : this.redactionService.translateFrToEn(this.translationInputText);

    translateMethod.subscribe({
      next: (response: TranslationResponse) => {
        this.translationOutputText = response.translated;
        this.isTranslationProcessing = false;
        this.showToastNotification('Traduction terminée', 'success');
      },
      error: (error) => {
        console.error('Error translating:', error);
        this.showToastNotification('Erreur lors de la traduction', 'error');
        this.isTranslationProcessing = false;
      }
    });
  }

  swapTranslationDirection(): void {
    this.translationDirection = this.translationDirection === 'en-fr' ? 'fr-en' : 'en-fr';
    const temp = this.translationInputText;
    this.translationInputText = this.translationOutputText;
    this.translationOutputText = temp;
  }

  copyTranslation(): void {
    navigator.clipboard.writeText(this.translationOutputText).then(() => {
      this.showToastNotification('Traduction copiée', 'success');
    });
  }

  clearTranslation(): void {
    this.translationInputText = '';
    this.translationOutputText = '';
  }

  // ========================================
  // PARAPHRASE
  // ========================================
  paraphraseText(): void {
    if (!this.paraphraseInputText.trim()) {
      this.showToastNotification('Veuillez entrer du texte à paraphraser', 'error');
      return;
    }

    this.isParaphraseProcessing = true;
    this.paraphraseResults = [];

    this.redactionService.paraphrase(this.paraphraseInputText)
      .subscribe({
        next: (response: ParaphraseResponse) => {
          this.paraphraseResults = response.reformulations;
          this.isParaphraseProcessing = false;
          this.showToastNotification(
            `${response.reformulations.length} paraphrases générées`,
            'success'
          );
        },
        error: (error) => {
          console.error('Error paraphrasing:', error);
          this.showToastNotification('Erreur lors de la paraphrase', 'error');
          this.isParaphraseProcessing = false;
        }
      });
  }

  copyParaphrase(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.showToastNotification('Paraphrase copiée', 'success');
    });
  }

  clearParaphrase(): void {
    this.paraphraseInputText = '';
    this.paraphraseResults = [];
  }


}
