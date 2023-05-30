import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AutomationShowFullComponent } from './automation-show-full.component';

describe('AutomationShowFullComponent', () => {
  let component: AutomationShowFullComponent;
  let fixture: ComponentFixture<AutomationShowFullComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AutomationShowFullComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutomationShowFullComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
