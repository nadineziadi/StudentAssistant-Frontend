import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SyntheseCoursComponent } from './synthese-cours.component';

describe('SyntheseCoursComponent', () => {
  let component: SyntheseCoursComponent;
  let fixture: ComponentFixture<SyntheseCoursComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SyntheseCoursComponent]
    });
    fixture = TestBed.createComponent(SyntheseCoursComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
