import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssistantRedactionComponent } from './assistant-redaction.component';

describe('AssistantRedactionComponent', () => {
  let component: AssistantRedactionComponent;
  let fixture: ComponentFixture<AssistantRedactionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AssistantRedactionComponent]
    });
    fixture = TestBed.createComponent(AssistantRedactionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
