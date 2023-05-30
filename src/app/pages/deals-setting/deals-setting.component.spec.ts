import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DealsSettingComponent } from './deals-setting.component';

describe('DealsSettingComponent', () => {
  let component: DealsSettingComponent;
  let fixture: ComponentFixture<DealsSettingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DealsSettingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DealsSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
