import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ZapierDialogComponent } from './zapier-dialog.component';

describe('ZapierDialogComponent', () => {
  let component: ZapierDialogComponent;
  let fixture: ComponentFixture<ZapierDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ZapierDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ZapierDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
