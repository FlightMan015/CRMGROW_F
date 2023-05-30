import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactBulkComponent } from './contact-bulk.component';

describe('ContactBulkComponent', () => {
  let component: ContactBulkComponent;
  let fixture: ComponentFixture<ContactBulkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ContactBulkComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContactBulkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
