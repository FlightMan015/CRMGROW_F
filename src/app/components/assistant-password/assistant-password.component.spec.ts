import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AssistantPasswordComponent } from './assistant-password.component';

describe('AssistantPasswordComponent', () => {
  let component: AssistantPasswordComponent;
  let fixture: ComponentFixture<AssistantPasswordComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AssistantPasswordComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssistantPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
