import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AutomationTreeOverlayComponent } from './automation-tree-overlay.component';

describe('AutomationTreeOverlayComponent', () => {
  let component: AutomationTreeOverlayComponent;
  let fixture: ComponentFixture<AutomationTreeOverlayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AutomationTreeOverlayComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutomationTreeOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
