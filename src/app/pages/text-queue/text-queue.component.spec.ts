import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TextQueueComponent } from './text-queue.component';

describe('TextQueueComponent', () => {
  let component: TextQueueComponent;
  let fixture: ComponentFixture<TextQueueComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TextQueueComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TextQueueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
