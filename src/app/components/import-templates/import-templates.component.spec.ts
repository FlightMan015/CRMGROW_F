import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportTemplatesComponent } from './import-templates.component';

describe('ImportTemplatesComponent', () => {
  let component: ImportTemplatesComponent;
  let fixture: ComponentFixture<ImportTemplatesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ImportTemplatesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportTemplatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
