import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionsHeaderComponent } from './actions-header.component';

describe('ActionsHeaderComponent', () => {
  let component: ActionsHeaderComponent;
  let fixture: ComponentFixture<ActionsHeaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ActionsHeaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActionsHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
