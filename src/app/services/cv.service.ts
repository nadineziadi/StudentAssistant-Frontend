import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CvService {
  private apiUrl = 'http://localhost:8020/api/cv'; // Backend Spring Boot

  constructor(private http: HttpClient) {}

  // Analyse du texte du CV
  analyzeCvText(text: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/analyze`, { text });
  }

  // Analyse d'un fichier PDF, DOCX ou TXT
  analyzeCvFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<any>(`${this.apiUrl}/analyze-file`, formData);
  }
}
