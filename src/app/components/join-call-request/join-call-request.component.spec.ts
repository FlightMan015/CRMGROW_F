import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinCallRequestComponent } from './join-call-request.component';

describe('JoinCallRequestComponent', () => {
  let component: JoinCallRequestComponent;
  let fixture: ComponentFixture<JoinCallRequestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JoinCallRequestComponent ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JoinCallRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
