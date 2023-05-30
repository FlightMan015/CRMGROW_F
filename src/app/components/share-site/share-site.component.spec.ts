import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShareSiteComponent } from './share-site.component';

describe('ShareSiteComponent', () => {
  let component: ShareSiteComponent;
  let fixture: ComponentFixture<ShareSiteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShareSiteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShareSiteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
