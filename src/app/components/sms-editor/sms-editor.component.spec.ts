import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SmsEditorComponent } from './sms-editor.component';

describe('SmsEditorComponent', () => {
  let component: SmsEditorComponent;
  let fixture: ComponentFixture<SmsEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SmsEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SmsEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
