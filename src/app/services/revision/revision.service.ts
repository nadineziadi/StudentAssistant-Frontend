import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RevisionService {

  private baseUrl = 'http://localhost:8085/api/questions';

  constructor(private http: HttpClient) {}

  /**
   * Sends a file (PDF, DOCX, or TXT) to the backend to generate questions.
   * @param file The course file to upload
   */
  generateQuestions(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.baseUrl}/generate`, formData);
  }
}
