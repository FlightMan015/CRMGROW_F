import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AutomationsLibComponent } from './automations-lib.component';

describe('AutomationsListComponent', () => {
  let component: AutomationsLibComponent;
  let fixture: ComponentFixture<AutomationsLibComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AutomationsLibComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutomationsLibComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
