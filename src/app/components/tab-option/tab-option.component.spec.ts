import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabOptionComponent } from './tab-option.component';

describe('TabOptionComponent', () => {
  let component: TabOptionComponent;
  let fixture: ComponentFixture<TabOptionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TabOptionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TabOptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
