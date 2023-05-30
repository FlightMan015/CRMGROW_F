import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CallRequestDetailComponent } from './call-request-detail.component';

describe('CallRequestDetailComponent', () => {
  let component: CallRequestDetailComponent;
  let fixture: ComponentFixture<CallRequestDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CallRequestDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CallRequestDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
