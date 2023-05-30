import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneralProfileComponent } from './general-profile.component';

describe('GeneralProfileComponent', () => {
  let component: GeneralProfileComponent;
  let fixture: ComponentFixture<GeneralProfileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GeneralProfileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GeneralProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
