import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamMaterialShareComponent } from './team-material-share.component';

describe('TeamMaterialShareComponent', () => {
  let component: TeamMaterialShareComponent;
  let fixture: ComponentFixture<TeamMaterialShareComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TeamMaterialShareComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TeamMaterialShareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
