import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionImpossibleNotificationComponent } from './action-impossible-notification.component';

describe('ActionImpossibleNotificationComponent', () => {
  let component: ActionImpossibleNotificationComponent;
  let fixture: ComponentFixture<ActionImpossibleNotificationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ActionImpossibleNotificationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActionImpossibleNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
