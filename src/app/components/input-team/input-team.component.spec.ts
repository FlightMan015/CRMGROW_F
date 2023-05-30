import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InputTeamComponent } from './input-team.component';

describe('InputTeamComponent', () => {
  let component: InputTeamComponent;
  let fixture: ComponentFixture<InputTeamComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InputTeamComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputTeamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
