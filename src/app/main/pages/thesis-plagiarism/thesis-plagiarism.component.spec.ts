import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThesisPlagiarismComponent } from './thesis-plagiarism.component';

describe('ThesisPlagiarismComponent', () => {
  let component: ThesisPlagiarismComponent;
  let fixture: ComponentFixture<ThesisPlagiarismComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ThesisPlagiarismComponent]
    });
    fixture = TestBed.createComponent(ThesisPlagiarismComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
