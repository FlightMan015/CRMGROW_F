import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactMergeLabelComponent } from './contact-merge-label.component';

describe('ContactMergeLabelComponent', () => {
  let component: ContactMergeLabelComponent;
  let fixture: ComponentFixture<ContactMergeLabelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ContactMergeLabelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContactMergeLabelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
