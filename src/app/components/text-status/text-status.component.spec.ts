import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TextStatusComponent } from './text-status.component';

describe('TextStatusComponent', () => {
  let component: TextStatusComponent;
  let fixture: ComponentFixture<TextStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TextStatusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TextStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
