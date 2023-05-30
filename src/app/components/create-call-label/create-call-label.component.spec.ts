import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateCallLabelComponent } from './create-call-label.component';

describe('CreateCallLabelComponent', () => {
  let component: CreateCallLabelComponent;
  let fixture: ComponentFixture<CreateCallLabelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateCallLabelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateCallLabelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
