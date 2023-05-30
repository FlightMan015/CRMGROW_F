import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewsletterEditorComponent } from './newsletter-editor.component';

describe('NewsletterEditorComponent', () => {
  let component: NewsletterEditorComponent;
  let fixture: ComponentFixture<NewsletterEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewsletterEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewsletterEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
