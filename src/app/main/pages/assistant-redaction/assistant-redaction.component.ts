import { Component } from '@angular/core';
import { RedactionService, CorrectionResponse, GrammarCorrectionResponse, TranslationResponse, ParaphraseResponse } from '../../../services/redaction.service';

interface Suggestion {
  type: 'grammar' | 'style' | 'orthography';
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
export class AssistantRedactionComponent {
  // Navigation
  activeMainTab: 'correction' | 'grammar' | 'translation' | 'paraphrase' = 'correction';

  // Correction complète (existant)
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

  constructor(private redactionService: RedactionService) {}

  // ========================================
  // CORRECTION COMPLÈTE (EXISTANT)
  // ========================================

  analyzeText(): void {
    this.isProcessing = true;
    this.correctedText = '';
    this.suggestions = [];

    if (this.activeInputTab === 'text' && this.inputText) {
      this.redactionService.submitDocument(this.inputText, 'Document sans titre')
        .subscribe({
          next: (document) => {
            console.log('Document submitted:', document);
            this.currentDocumentId = document.id;
            this.correctCurrentDocument();
          },
          error: (error) => {
            console.error('Error submitting document:', error);
            alert('Erreur lors de la soumission du document.');
            this.isProcessing = false;
          }
        });
    } else if (this.activeInputTab === 'file' && this.selectedFile) {
      this.redactionService.uploadDocument(this.selectedFile)
        .subscribe({
          next: (document) => {
            console.log('File uploaded:', document);
            this.currentDocumentId = document.id;
            this.inputText = document.originalContent;
            this.correctCurrentDocument();
          },
          error: (error) => {
            console.error('Error uploading document:', error);
            alert('Erreur lors du téléchargement du fichier.');
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
          console.log('Correction response:', response);
          this.correctedText = response.correctedText;
          this.suggestions = this.mapSuggestions(response.suggestions);
          this.isProcessing = false;
        },
        error: (error) => {
          console.error('Error correcting document:', error);
          alert('Erreur lors de la correction du document.');
          this.isProcessing = false;
        }
      });
  }

  private mapSuggestions(backendSuggestions: any[]): Suggestion[] {
    return backendSuggestions.map(s => ({
      type: s.type.toLowerCase() as 'grammar' | 'style' | 'orthography',
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
      this.selectedFile = file;
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
  }

  copyText(): void {
    const textToCopy = this.correctedText || this.inputText;
    navigator.clipboard.writeText(textToCopy).then(() => {
      alert('Texte copié dans le presse-papiers 📋');
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
    switch(upperType) {
      case 'GRAMMAR': return '📝';
      case 'STYLE': return '✨';
      case 'ORTHOGRAPHY': return '✍️';
      case 'PARAPHRASE': return '🔄';
      default: return '💡';
    }
  }

  getTypeLabel(type: string): string {
    const upperType = type?.toUpperCase() || '';
    switch(upperType) {
      case 'GRAMMAR': return 'Grammaire';
      case 'STYLE': return 'Style';
      case 'ORTHOGRAPHY': return 'Orthographe';
      case 'PARAPHRASE': return 'Paraphrase';
      default: return 'Suggestion';
    }
  }

  // ========================================
  // CORRECTION GRAMMATICALE RAPIDE
  // ========================================

  correctGrammarQuick(): void {
    if (!this.grammarInputText.trim()) {
      alert('Veuillez entrer du texte');
      return;
    }

    this.isGrammarProcessing = true;
    this.grammarCorrectedText = '';

    this.redactionService.correctGrammar(this.grammarInputText)
      .subscribe({
        next: (response: GrammarCorrectionResponse) => {
          console.log('Grammar correction:', response);
          this.grammarCorrectedText = response.corrected;
          this.isGrammarProcessing = false;
        },
        error: (error) => {
          console.error('Error correcting grammar:', error);
          alert('Erreur lors de la correction grammaticale');
          this.isGrammarProcessing = false;
        }
      });
  }

  copyGrammarText(): void {
    navigator.clipboard.writeText(this.grammarCorrectedText).then(() => {
      alert('Texte copié 📋');
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
      alert('Veuillez entrer du texte à traduire');
      return;
    }

    this.isTranslationProcessing = true;
    this.translationOutputText = '';

    const translateMethod = this.translationDirection === 'en-fr'
      ? this.redactionService.translateEnToFr(this.translationInputText)
      : this.redactionService.translateFrToEn(this.translationInputText);

    translateMethod.subscribe({
      next: (response: TranslationResponse) => {
        console.log('Translation:', response);
        this.translationOutputText = response.translated;
        this.isTranslationProcessing = false;
      },
      error: (error) => {
        console.error('Error translating:', error);
        alert('Erreur lors de la traduction');
        this.isTranslationProcessing = false;
      }
    });
  }

  swapTranslationDirection(): void {
    this.translationDirection = this.translationDirection === 'en-fr' ? 'fr-en' : 'en-fr';
    // Swap input and output
    const temp = this.translationInputText;
    this.translationInputText = this.translationOutputText;
    this.translationOutputText = temp;
  }

  copyTranslation(): void {
    navigator.clipboard.writeText(this.translationOutputText).then(() => {
      alert('Traduction copiée 📋');
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
      alert('Veuillez entrer du texte à paraphraser');
      return;
    }

    this.isParaphraseProcessing = true;
    this.paraphraseResults = [];

    this.redactionService.paraphrase(this.paraphraseInputText)
      .subscribe({
        next: (response: ParaphraseResponse) => {
          console.log('Paraphrase:', response);
          this.paraphraseResults = response.reformulations;
          this.isParaphraseProcessing = false;
        },
        error: (error) => {
          console.error('Error paraphrasing:', error);
          alert('Erreur lors de la paraphrase');
          this.isParaphraseProcessing = false;
        }
      });
  }

  copyParaphrase(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      alert('Paraphrase copiée 📋');
    });
  }

  clearParaphrase(): void {
    this.paraphraseInputText = '';
    this.paraphraseResults = [];
  }
}
