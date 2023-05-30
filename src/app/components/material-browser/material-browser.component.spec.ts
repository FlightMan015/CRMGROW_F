import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MaterialBrowserComponent } from './material-browser.component';

describe('MaterialBrowserComponent', () => {
  let component: MaterialBrowserComponent;
  let fixture: ComponentFixture<MaterialBrowserComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MaterialBrowserComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MaterialBrowserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
