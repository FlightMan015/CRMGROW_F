import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmShareContactsComponent } from './confirm-share-contacts.component';

describe('DealStageCreateComponent', () => {
  let component: ConfirmShareContactsComponent;
  let fixture: ComponentFixture<ConfirmShareContactsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ConfirmShareContactsComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmShareContactsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
