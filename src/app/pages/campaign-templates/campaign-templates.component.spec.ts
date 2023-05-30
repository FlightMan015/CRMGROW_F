import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CampaignTemplatesComponent } from './campaign-templates.component';

describe('CampaignTemplatesComponent', () => {
  let component: CampaignTemplatesComponent;
  let fixture: ComponentFixture<CampaignTemplatesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CampaignTemplatesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CampaignTemplatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
