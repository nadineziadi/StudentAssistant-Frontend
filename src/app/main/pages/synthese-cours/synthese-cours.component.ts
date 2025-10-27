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

  // Handle file selection
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  // Remove selected file
  removeFile(): void {
    this.selectedFile = null;
  }

  // Convert bytes to readable size (e.g. MB)
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Generate summary (mock function for now)
  generateSummary(): void {
    this.isGenerating = true;
    this.summary = null;

    // simulate an API call delay
    setTimeout(() => {
      if (this.inputText || this.selectedFile) {
        this.summary = `
          <p><strong>Résumé généré :</strong></p>
          <p>Ce document présente les points essentiels du cours.
          Il aborde les concepts clés, les notions importantes et les idées principales.</p>
          <ul>
            <li>✔️ Concepts principaux bien résumés</li>
            <li>📘 Structure claire et lisible</li>
            <li>✨ Convient pour une révision rapide</li>
          </ul>
        `;
      }
      this.isGenerating = false;
    }, 2000);
  }

  // Copy summary text to clipboard
  copySummary(): void {
    if (!this.summary) return;

    const tempElement = document.createElement('div');
    tempElement.innerHTML = this.summary;
    const text = tempElement.innerText;

    navigator.clipboard.writeText(text).then(() => {
      alert('Synthèse copiée dans le presse-papiers 📋');
    });
  }

  // Download summary as text file
  downloadSummary(): void {
    if (!this.summary) return;

    const element = document.createElement('a');
    const text = this.summary.replace(/<[^>]*>/g, ''); // strip HTML tags
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'synthese.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
}
