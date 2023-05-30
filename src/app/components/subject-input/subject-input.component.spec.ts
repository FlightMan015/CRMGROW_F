import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SubjectInputComponent } from './subject-input.component';

describe('SubjectInputComponent', () => {
  let component: SubjectInputComponent;
  let fixture: ComponentFixture<SubjectInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SubjectInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubjectInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
