import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserflowCongratComponent } from './userflow-congrat.component';

describe('UserflowCongratComponent', () => {
  let component: UserflowCongratComponent;
  let fixture: ComponentFixture<UserflowCongratComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserflowCongratComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserflowCongratComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
