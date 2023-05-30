import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplatesBrowserComponent } from './templates-browser.component';

describe('TemplatesBrowserComponent', () => {
  let component: TemplatesBrowserComponent;
  let fixture: ComponentFixture<TemplatesBrowserComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TemplatesBrowserComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TemplatesBrowserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
