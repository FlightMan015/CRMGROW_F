import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MaterialsLibComponent } from './materials-lib.component';

describe('MaterialsLibComponent', () => {
  let component: MaterialsLibComponent;
  let fixture: ComponentFixture<MaterialsLibComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MaterialsLibComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MaterialsLibComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
