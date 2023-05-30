import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmBulkMaterialsComponent } from './confirm-bulk-materials.component';

describe('ConfirmBulkMaterialsComponent', () => {
  let component: ConfirmBulkMaterialsComponent;
  let fixture: ComponentFixture<ConfirmBulkMaterialsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ConfirmBulkMaterialsComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmBulkMaterialsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
