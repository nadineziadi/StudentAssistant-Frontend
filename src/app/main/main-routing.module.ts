import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SyntheseCoursComponent } from './pages/synthese-cours/synthese-cours.component';
import { RevisionInteractiveComponent } from './pages/revision-interactive/revision-interactive.component';
import { VerificateurOriginaliteComponent } from './pages/verificateur-originalite/verificateur-originalite.component';
import { AssistantRedactionComponent } from './pages/assistant-redaction/assistant-redaction.component';
import { OptimiseurCvComponent } from './pages/optimiseur-cv/optimiseur-cv.component';
import { MainComponent } from './main/main.component';


const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      { path: '', redirectTo: 'synthese-cours', pathMatch: 'full' },
      { path: 'synthese-cours', component: SyntheseCoursComponent },
      { path: 'revision-interactive', component: RevisionInteractiveComponent },
      { path: 'verificateur-originalite', component: VerificateurOriginaliteComponent },
      { path: 'assistant-redaction', component: AssistantRedactionComponent },
      { path: 'optimiseur-cv', component: OptimiseurCvComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MainRoutingModule { }
