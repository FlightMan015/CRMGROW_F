import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InputTagComponent } from './input-tag.component';

describe('InputTagComponent', () => {
  let component: InputTagComponent;
  let fixture: ComponentFixture<InputTagComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InputTagComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputTagComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
