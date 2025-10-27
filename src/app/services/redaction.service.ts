import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Document {
  id: number;
  userId: number;
  username: string;
  title: string;
  originalContent: string;
  correctedContent?: string;
  fileName?: string;
  createdAt: string;
  lastCorrectedAt?: string;
  isCorrected: boolean;
  totalSuggestions?: number;
}

export interface Suggestion {
  type: 'GRAMMAR' | 'SPELLING' | 'PUNCTUATION' | 'STYLE' | 'VOCABULARY';
  original: string;
  correction: string;
  rule: string;
  startPosition: number;
  endPosition: number;
}

export interface CorrectionResponse {
  documentId: number;
  originalText: string;
  correctedText: string;
  totalSuggestions: number;
  suggestions: Suggestion[];
  status: string;
}

export interface GrammarCorrectionResponse {
  original: string;
  corrected: string;
}

export interface TranslationResponse {
  original: string;
  translated: string;
}

export interface ParaphraseResponse {
  original: string;
  reformulations: string[];
}

@Injectable({
  providedIn: 'root'
})
export class RedactionService {
  private apiUrl = 'http://localhost:8222/api/redaction';

  constructor(private http: HttpClient) {}

  // Get headers with JWT token
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Submit text document
  submitDocument(text: string, title: string): Observable<Document> {
    const headers = this.getHeaders();
    return this.http.post<Document>(
      `${this.apiUrl}/documents/submit`,
      { text, title },
      { headers }
    );
  }

  // Upload file document
  uploadDocument(file: File): Observable<Document> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<Document>(
      `${this.apiUrl}/documents/upload`,
      formData,
      { headers }
    );
  }

  // Correct document
  correctDocument(documentId: number): Observable<CorrectionResponse> {
    const headers = this.getHeaders();
    return this.http.post<CorrectionResponse>(
      `${this.apiUrl}/documents/${documentId}/correct`,
      {},
      { headers }
    );
  }

  // Get all user documents
  getUserDocuments(): Observable<Document[]> {
    const headers = this.getHeaders();
    return this.http.get<Document[]>(
      `${this.apiUrl}/documents`,
      { headers }
    );
  }

  // Get document report
  getDocumentReport(documentId: number): Observable<CorrectionResponse> {
    const headers = this.getHeaders();
    return this.http.get<CorrectionResponse>(
      `${this.apiUrl}/documents/${documentId}/report`,
      { headers }
    );
  }

  // Delete document
  deleteDocument(documentId: number): Observable<void> {
    const headers = this.getHeaders();
    return this.http.delete<void>(
      `${this.apiUrl}/documents/${documentId}`,
      { headers }
    );
  }

  // Direct grammar correction (no auth needed)
  correctGrammar(text: string): Observable<GrammarCorrectionResponse> {
    return this.http.post<GrammarCorrectionResponse>(
      `${this.apiUrl}/grammar`,
      { text }
    );
  }

  // Translate EN to FR
  translateEnToFr(text: string): Observable<TranslationResponse> {
    return this.http.post<TranslationResponse>(
      `${this.apiUrl}/translate/en-fr`,
      { text }
    );
  }

  // Translate FR to EN
  translateFrToEn(text: string): Observable<TranslationResponse> {
    return this.http.post<TranslationResponse>(
      `${this.apiUrl}/translate/fr-en`,
      { text }
    );
  }

  // Paraphrase text
  paraphrase(text: string): Observable<ParaphraseResponse> {
    return this.http.post<ParaphraseResponse>(
      `${this.apiUrl}/paraphrase`,
      { text }
    );
  }
}
