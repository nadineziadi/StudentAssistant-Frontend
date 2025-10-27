import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerificateurOriginaliteComponent } from './verificateur-originalite.component';

describe('VerificateurOriginaliteComponent', () => {
  let component: VerificateurOriginaliteComponent;
  let fixture: ComponentFixture<VerificateurOriginaliteComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VerificateurOriginaliteComponent]
    });
    fixture = TestBed.createComponent(VerificateurOriginaliteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
