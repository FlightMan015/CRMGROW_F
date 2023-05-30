import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AutomationBrowserComponent } from './automation-browser.component';

describe('AutomationBrowserComponent', () => {
  let component: AutomationBrowserComponent;
  let fixture: ComponentFixture<AutomationBrowserComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AutomationBrowserComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutomationBrowserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
