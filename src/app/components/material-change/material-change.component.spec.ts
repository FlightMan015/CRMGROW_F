import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MaterialChangeComponent } from './material-change.component';

describe('MaterialChangeComponent', () => {
  let component: MaterialChangeComponent;
  let fixture: ComponentFixture<MaterialChangeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MaterialChangeComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MaterialChangeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
