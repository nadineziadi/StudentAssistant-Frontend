import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ResumeService {

  // Base URL of your Spring Boot API
  private apiUrl = 'http://localhost:8084/api/summarizer';

  constructor(private http: HttpClient) { }

summarizeText(text: string): Observable<any> {
  const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  return this.http.post(`${this.apiUrl}/text`, { text }, { headers });
}


summarizeFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post(`${this.apiUrl}/file`, formData);
}


}
