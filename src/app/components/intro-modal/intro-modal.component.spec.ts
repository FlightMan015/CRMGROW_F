import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IntroModalComponent } from './intro-modal.component';

describe('IntroModalComponent', () => {
  let component: IntroModalComponent;
  let fixture: ComponentFixture<IntroModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IntroModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IntroModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
