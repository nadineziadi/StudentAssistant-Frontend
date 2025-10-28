import { Component } from '@angular/core';
import { RevisionService } from '../../../services/revision/revision.service'; // ✅ import your service

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  userAnswer?: number;
}

interface Chapter {
  chapter: string;
  questions: Question[];
}

@Component({
  selector: 'app-revision-interactive',
  templateUrl: './revision-interactive.component.html',
  styleUrls: ['./revision-interactive.component.css']
})
export class RevisionInteractiveComponent {
  // File upload properties
  selectedFile: File | null = null;
  isGenerating = false;

  // Quiz properties
  chapters: Chapter[] = [];
  currentChapterIndex = 0;
  currentQuestionIndex = 0;
  showResults = false;
  score = 0;

  constructor(private revisionService: RevisionService) {} // ✅ inject service instead of HttpClient

  // ================================
  // File handling
  // ================================
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert('Le fichier est trop volumineux. Taille maximale : 10MB');
        return;
      }
      this.selectedFile = file;
    }
  }

  removeFile(): void {
    this.selectedFile = null;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  // ================================
  // Generate Questions (via backend)
  // ================================
  generateQuestions(): void {
    if (!this.selectedFile) return;

    this.isGenerating = true;

this.revisionService.generateQuestions(this.selectedFile)
  .subscribe({
    next: (response) => {
      this.chapters = this.parseChapters(response.chapters); // <-- parse here
      this.isGenerating = false;
      this.currentChapterIndex = 0;
      this.currentQuestionIndex = 0;
      this.showResults = false;
    },
    error: (error) => {
      console.error(error);
      this.isGenerating = false;
      alert('Erreur lors de la génération des questions.');
    }
  });


  }

  // ================================
  // Parse backend response
  // ================================
  parseChapters(rawChapters: any[]): Chapter[] {
    return rawChapters.map((chapter, chapterIdx) => {
      const questionsText = chapter.questions;
      const questions = this.parseQuestions(questionsText, chapterIdx);
      return {
        chapter: chapter.chapter,
        questions: questions
      };
    });
  }

parseQuestions(text: string, chapterIdx: number): Question[] {
  const questions: Question[] = [];

  // Split by lines that start with a number and a dot
  const rawQuestions = text.split(/\n(?=\d+\.)/);

  rawQuestions.forEach((qBlock, idx) => {
    const lines = qBlock.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length < 2) return;

    const questionLine = lines[0].replace(/^\d+\.\s*/, '');
    const options: string[] = [];
    let correctAnswer = 0;

    lines.slice(1).forEach(line => {
      const match = line.match(/^([a-dA-D])[)\.:]\s*(.*)/);
      if (match) {
        options.push(match[2].trim());
      } else if (line.toLowerCase().startsWith('answer:')) {
        const answerLetter = line.split(' ')[1]?.trim()?.[0].toUpperCase();
        correctAnswer = ['A', 'B', 'C', 'D'].indexOf(answerLetter);
      }
    });

    if (options.length >= 2) {
      questions.push({
        id: chapterIdx * 100 + idx,
        question: questionLine,
        options: options,
        correctAnswer: correctAnswer
      });
    }
  });

  return questions;
}


  // ================================
  // Quiz Navigation
  // ================================
  get currentChapter(): Chapter | null {
    return this.chapters[this.currentChapterIndex] || null;
  }

  get currentQuestion(): Question | null {
    const chapter = this.currentChapter;
    return chapter ? chapter.questions[this.currentQuestionIndex] : null;
  }

  selectAnswer(optionIndex: number): void {
    const question = this.currentQuestion;
    if (question) {
      question.userAnswer = optionIndex;
    }
  }

  nextQuestion(): void {
    const chapter = this.currentChapter;
    if (!chapter) return;

    if (this.currentQuestionIndex < chapter.questions.length - 1) {
      this.currentQuestionIndex++;
    } else if (this.currentChapterIndex < this.chapters.length - 1) {
      this.currentChapterIndex++;
      this.currentQuestionIndex = 0;
    } else {
      this.calculateScore();
      this.showResults = true;
    }
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    } else if (this.currentChapterIndex > 0) {
      this.currentChapterIndex--;
      const prevChapter = this.currentChapter;
      if (prevChapter) {
        this.currentQuestionIndex = prevChapter.questions.length - 1;
      }
    }
  }

  // ================================
  // Score and Progress
  // ================================
  calculateScore(): void {
    let correct = 0;
    let total = 0;
    this.chapters.forEach(chapter => {
      chapter.questions.forEach(q => {
        total++;
        if (q.userAnswer === q.correctAnswer) {
          correct++;
        }
      });
    });
    this.score = total > 0 ? Math.round((correct / total) * 100) : 0;
  }

  restartQuiz(): void {
    this.currentChapterIndex = 0;
    this.currentQuestionIndex = 0;
    this.showResults = false;
    this.chapters.forEach(chapter => {
      chapter.questions.forEach(q => {
        delete q.userAnswer;
      });
    });
  }

  get progress(): number {
    let totalQuestions = 0;
    let answeredQuestions = 0;
    this.chapters.forEach(chapter => {
      chapter.questions.forEach(q => {
        totalQuestions++;
        if (q.userAnswer !== undefined) {
          answeredQuestions++;
        }
      });
    });
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  }



}
