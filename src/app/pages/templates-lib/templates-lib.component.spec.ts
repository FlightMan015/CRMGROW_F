import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplatesLibComponent } from './templates-lib.component';

describe('TemplatesComponent', () => {
  let component: TemplatesLibComponent;
  let fixture: ComponentFixture<TemplatesLibComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TemplatesLibComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TemplatesLibComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
