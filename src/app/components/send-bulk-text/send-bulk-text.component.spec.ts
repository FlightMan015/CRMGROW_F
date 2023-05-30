import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SendBulkTextComponent } from './send-bulk-text.component';

describe('SendBulkTextComponent', () => {
  let component: SendBulkTextComponent;
  let fixture: ComponentFixture<SendBulkTextComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SendBulkTextComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SendBulkTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
