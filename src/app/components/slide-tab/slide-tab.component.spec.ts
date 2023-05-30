import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SlideTabComponent } from './slide-tab.component';

describe('SlideTabComponent', () => {
  let component: SlideTabComponent;
  let fixture: ComponentFixture<SlideTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SlideTabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SlideTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
