import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfEditComponent } from './pdf-edit.component';

describe('PdfEditComponent', () => {
  let component: PdfEditComponent;
  let fixture: ComponentFixture<PdfEditComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PdfEditComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PdfEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
