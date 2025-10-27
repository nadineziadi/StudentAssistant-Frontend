// import { Component } from '@angular/core';
// import { CvService } from '../../../services/cv.service';

// @Component({
//   selector: 'app-optimiseur-cv',
//   templateUrl: './optimiseur-cv.component.html',
//   styleUrls: ['./optimiseur-cv.component.css']
// })
// export class OptimiseurCvComponent {
//   cvText: string = '';
//   selectedFile: File | null = null;
//   result: any = null;
//   loading: boolean = false;
//   error: string = '';

//   constructor(private cvService: CvService) {}

//   onFileSelected(event: any) {
//     this.selectedFile = event.target.files[0];
//   }

//   submitText() {
//     if (!this.cvText.trim()) {
//       this.error = 'Veuillez saisir un texte';
//       return;
//     }

//     this.loading = true;
//     this.error = '';
//     this.result = null;

//     this.cvService.analyzeCvText(this.cvText).subscribe({
//       next: (res: any) => {
//         console.log('Réponse reçue:', res);
//         this.result = res;
//         this.loading = false;
//       },
//       error: (err: any) => {
//         console.error('Erreur:', err);
//         this.error = 'Erreur lors de l\'analyse: ' + (err.message || 'Erreur inconnue');
//         this.loading = false;
//       }
//     });
//   }

//   submitFile() {
//     if (!this.selectedFile) {
//       this.error = 'Veuillez sélectionner un fichier';
//       return;
//     }

//     this.loading = true;
//     this.error = '';
//     this.result = null;

//     this.cvService.analyzeCvFile(this.selectedFile).subscribe({
//       next: (res: any) => {
//         console.log('Réponse reçue:', res);
//         this.result = res;
//         this.loading = false;
//       },
//       error: (err: any) => {
//         console.error('Erreur:', err);
//         this.error = 'Erreur lors de l\'analyse: ' + (err.message || 'Erreur inconnue');
//         this.loading = false;
//       }
//     });
//   }

//   // Méthodes utilitaires pour le template
//   getErrors(): any[] {
//     if (!this.result?.analysis?.errors) return [];

//     const errors = this.result.analysis.errors;

//     // Si errors est un objet avec des catégories
//     if (typeof errors === 'object' && !Array.isArray(errors)) {
//       const allErrors: any[] = [];
//       Object.keys(errors).forEach(category => {
//         if (Array.isArray(errors[category])) {
//           errors[category].forEach((err: any) => {
//             allErrors.push({
//               category: category,
//               ...err
//             });
//           });
//         }
//       });
//       return allErrors;
//     }

//     // Si errors est déjà un tableau
//     return Array.isArray(errors) ? errors : [];
//   }

//   getSuggestions(): any[] {
//     if (!this.result?.analysis?.suggestions) return [];

//     const suggestions = this.result.analysis.suggestions;

//     // Si suggestions est un objet avec des catégories
//     if (typeof suggestions === 'object' && !Array.isArray(suggestions)) {
//       const allSuggestions: any[] = [];
//       Object.keys(suggestions).forEach(category => {
//         if (Array.isArray(suggestions[category])) {
//           suggestions[category].forEach((sug: any) => {
//             allSuggestions.push({
//               category: category,
//               ...sug
//             });
//           });
//         }
//       });
//       return allSuggestions;
//     }

//     // Si suggestions est déjà un tableau
//     return Array.isArray(suggestions) ? suggestions : [];
//   }

//   getOptimizedText(): string {
//     if (!this.result?.analysis?.optimized_text) return '';

//     const opt = this.result.analysis.optimized_text;

//     // Si c'est une string, la retourner directement
//     if (typeof opt === 'string') return opt;

//     // Si c'est un objet, le formater joliment
//     if (typeof opt === 'object') {
//       return JSON.stringify(opt, null, 2);
//     }

//     return '';
//   }

//   hasErrors(): boolean {
//     return this.getErrors().length > 0;
//   }

//   hasSuggestions(): boolean {
//     return this.getSuggestions().length > 0;
//   }

//   hasOptimizedText(): boolean {
//     return this.getOptimizedText().trim().length > 0;
//   }
// }
import { Component } from '@angular/core';
import { CvService } from '../../../services/cv.service';

@Component({
  selector: 'app-optimiseur-cv',
  templateUrl: './optimiseur-cv.component.html',
  styleUrls: ['./optimiseur-cv.component.css']
})
export class OptimiseurCvComponent {
  cvText: string = '';
  selectedFile: File | null = null;
  result: any = null;
  loading: boolean = false;
  error: string = '';

  constructor(private cvService: CvService) {}

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
      this.error = '';
    }
  }

  submitText() {
    if (!this.cvText.trim()) {
      this.error = 'Veuillez saisir un texte';
      return;
    }

    this.loading = true;
    this.error = '';
    this.result = null;

    console.log('📤 Envoi du texte au backend...');

    this.cvService.analyzeCvText(this.cvText).subscribe({
      next: (res: any) => {
        console.log('✅ Réponse reçue:', res);
        this.result = res;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('❌ Erreur:', err);
        this.error = this.formatError(err);
        this.loading = false;
      }
    });
  }

  submitFile() {
    if (!this.selectedFile) {
      this.error = 'Veuillez sélectionner un fichier';
      return;
    }

    this.loading = true;
    this.error = '';
    this.result = null;

    console.log('📤 Envoi du fichier:', this.selectedFile.name);

    this.cvService.analyzeCvFile(this.selectedFile).subscribe({
      next: (res: any) => {
        console.log('✅ Réponse reçue:', res);
        this.result = res;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('❌ Erreur:', err);
        this.error = this.formatError(err);
        this.loading = false;
      }
    });
  }

  private formatError(err: any): string {
    if (err.error && typeof err.error === 'string') {
      return err.error;
    }
    if (err.message) {
      return err.message;
    }
    if (err.status === 0) {
      return 'Impossible de contacter le serveur. Vérifiez que Spring Boot est démarré.';
    }
    return `Erreur ${err.status || 'inconnue'}`;
  }

  // Récupérer le texte de l'analyse
  getAnalysisText(): string {
    if (!this.result || !this.result.analysis) {
      return '';
    }
    return this.result.analysis.text || '';
  }

  hasAnalysis(): boolean {
    return this.getAnalysisText().trim().length > 0;
  }

  copyToClipboard() {
    const text = this.getAnalysisText();
    if (!text) {
      alert('Aucun texte à copier');
      return;
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        alert('✅ Analyse copiée !');
      }).catch(err => {
        console.error('Erreur copie:', err);
        this.fallbackCopy(text);
      });
    } else {
      this.fallbackCopy(text);
    }
  }

  private fallbackCopy(text: string) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();

    try {
      document.execCommand('copy');
      alert('✅ Analyse copiée !');
    } catch (err) {
      alert('❌ Erreur lors de la copie');
    }

    document.body.removeChild(textArea);
  }

  downloadAnalysis() {
    const text = this.getAnalysisText();
    if (!text) {
      alert('Aucun texte à télécharger');
      return;
    }

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'analyse_cv_' + new Date().getTime() + '.txt';
    link.click();
    window.URL.revokeObjectURL(url);

    alert('✅ Analyse téléchargée !');
  }
}
