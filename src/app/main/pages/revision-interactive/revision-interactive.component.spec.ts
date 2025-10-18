import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevisionInteractiveComponent } from './revision-interactive.component';

describe('RevisionInteractiveComponent', () => {
  let component: RevisionInteractiveComponent;
  let fixture: ComponentFixture<RevisionInteractiveComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RevisionInteractiveComponent]
    });
    fixture = TestBed.createComponent(RevisionInteractiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
