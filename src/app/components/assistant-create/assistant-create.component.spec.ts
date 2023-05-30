import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AssistantCreateComponent } from './assistant-create.component';

describe('AssistantCreateComponent', () => {
  let component: AssistantCreateComponent;
  let fixture: ComponentFixture<AssistantCreateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AssistantCreateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssistantCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
