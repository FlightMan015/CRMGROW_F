import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmBulkTemplatesComponent } from './confirm-bulk-templates.component';

describe('ConfirmBulkMaterialsComponent', () => {
  let component: ConfirmBulkTemplatesComponent;
  let fixture: ComponentFixture<ConfirmBulkTemplatesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ConfirmBulkTemplatesComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmBulkTemplatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
