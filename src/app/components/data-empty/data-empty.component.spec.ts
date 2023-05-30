import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DataEmptyComponent } from './data-empty.component';

describe('DataEmptyComponent', () => {
  let component: DataEmptyComponent;
  let fixture: ComponentFixture<DataEmptyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DataEmptyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DataEmptyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
