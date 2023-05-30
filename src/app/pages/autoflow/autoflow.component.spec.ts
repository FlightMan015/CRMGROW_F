import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoflowComponent } from './autoflow.component';

describe('AutoflowComponent', () => {
  let component: AutoflowComponent;
  let fixture: ComponentFixture<AutoflowComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AutoflowComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutoflowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
