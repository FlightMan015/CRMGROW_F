import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AssistantRemoveComponent } from './assistant-remove.component';

describe('AssistantRemoveComponent', () => {
  let component: AssistantRemoveComponent;
  let fixture: ComponentFixture<AssistantRemoveComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AssistantRemoveComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssistantRemoveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
