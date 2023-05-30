import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ForwardEmailComponent } from './forward-email.component';

describe('ForwardEmailComponent', () => {
  let component: ForwardEmailComponent;
  let fixture: ComponentFixture<ForwardEmailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ForwardEmailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ForwardEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
