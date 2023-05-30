import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DealContactComponent } from './deal-contact.component';

describe('DealContactComponent', () => {
  let component: DealContactComponent;
  let fixture: ComponentFixture<DealContactComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DealContactComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DealContactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
