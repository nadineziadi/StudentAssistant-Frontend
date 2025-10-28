import { ResumeService } from './../../../services/resume/resume.service';
import { Component } from '@angular/core';

@Component({
  selector: 'app-synthese-cours',
  templateUrl: './synthese-cours.component.html',
  styleUrls: ['./synthese-cours.component.css']
})
export class SyntheseCoursComponent {
  activeTab: 'text' | 'file' = 'text';
  inputText: string = '';
  selectedFile: File | null = null;
  summary: string | null = null;
  isGenerating: boolean = false;
  expanded: boolean = false;
  modelUsed: string = '';
  originalLength: number | null = null;

  constructor(private ResumeService: ResumeService) {}

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) this.selectedFile = file;
  }

  removeFile(): void {
    this.selectedFile = null;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  generateSummary(): void {
    if (!this.inputText && !this.selectedFile) return;

    this.isGenerating = true;
    this.summary = null;

    if (this.activeTab === 'text' && this.inputText) {
      this.ResumeService.summarizeText(this.inputText).subscribe({
        next: (res: any) => {
          this.summary = res.summary || 'Pas de résumé généré';
          this.modelUsed = res.model || 'Inconnu';
          this.originalLength = res.original_length || this.inputText.length;
          this.isGenerating = false;
        },
        error: (err) => {
          console.error(err);
          this.summary = 'Erreur lors de la génération du résumé';
          this.isGenerating = false;
        }
      });
    } else if (this.activeTab === 'file' && this.selectedFile) {
      this.ResumeService.summarizeFile(this.selectedFile).subscribe({
        next: (res: any) => {
          this.summary = res.summary || 'Pas de résumé généré';
          this.modelUsed = res.model || 'Inconnu';
          this.originalLength = res.original_length || null;
          this.isGenerating = false;
        },
        error: (err) => {
          console.error(err);
          this.summary = 'Erreur lors de la génération du résumé';
          this.isGenerating = false;
        }
      });
    }
  }

  copySummary(): void {
    if (!this.summary) return;
    navigator.clipboard.writeText(this.summary.replace(/<[^>]*>/g, '')).then(() => {
      alert('Synthèse copiée dans le presse-papiers 📋');
    });
  }

  downloadSummary(): void {
    if (!this.summary) return;
    const element = document.createElement('a');
    const file = new Blob([this.summary.replace(/<[^>]*>/g, '')], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'synthese.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  toggleExpand(): void {
    this.expanded = !this.expanded;
  }
}
