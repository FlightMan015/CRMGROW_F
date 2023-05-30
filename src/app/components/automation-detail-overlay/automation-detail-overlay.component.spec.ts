import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AutomationDetailOverlayComponent } from './automation-detail-overlay.component';

describe('AutomationDetailOverlayComponent', () => {
  let component: AutomationDetailOverlayComponent;
  let fixture: ComponentFixture<AutomationDetailOverlayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AutomationDetailOverlayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutomationDetailOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
