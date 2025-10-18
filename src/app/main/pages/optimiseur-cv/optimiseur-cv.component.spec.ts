import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptimiseurCvComponent } from './optimiseur-cv.component';

describe('OptimiseurCvComponent', () => {
  let component: OptimiseurCvComponent;
  let fixture: ComponentFixture<OptimiseurCvComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OptimiseurCvComponent]
    });
    fixture = TestBed.createComponent(OptimiseurCvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
