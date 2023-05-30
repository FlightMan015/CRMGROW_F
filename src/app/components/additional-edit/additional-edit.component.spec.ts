import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdditionalEditComponent } from './additional-edit.component';

describe('AdditionalEditComponent', () => {
  let component: AdditionalEditComponent;
  let fixture: ComponentFixture<AdditionalEditComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdditionalEditComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdditionalEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
