import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MainRoutingModule } from './main-routing.module';
import { SyntheseCoursComponent } from './pages/synthese-cours/synthese-cours.component';
import { RevisionInteractiveComponent } from './pages/revision-interactive/revision-interactive.component';
import { VerificateurOriginaliteComponent } from './pages/verificateur-originalite/verificateur-originalite.component';
import { AssistantRedactionComponent } from './pages/assistant-redaction/assistant-redaction.component';
import { OptimiseurCvComponent } from './pages/optimiseur-cv/optimiseur-cv.component';
import { MainComponent } from './main/main.component';
import { SidebarComponent } from "src/app/sidebar/sidebar.component";
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    SyntheseCoursComponent,
    RevisionInteractiveComponent,
    VerificateurOriginaliteComponent,
    AssistantRedactionComponent,
    OptimiseurCvComponent,
    MainComponent
  ],
  imports: [
    CommonModule,
    MainRoutingModule,
    SidebarComponent,
    FormsModule
]
})
export class MainModule { }
