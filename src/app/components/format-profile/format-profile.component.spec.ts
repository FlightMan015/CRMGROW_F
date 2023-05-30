import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FormatProfileComponent } from './format-profile.component';

describe('FormatProfileComponent', () => {
  let component: FormatProfileComponent;
  let fixture: ComponentFixture<FormatProfileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FormatProfileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormatProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
