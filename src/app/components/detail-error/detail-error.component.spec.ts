import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailErrorComponent } from './detail-error.component';

describe('DetailErrorComponent', () => {
  let component: DetailErrorComponent;
  let fixture: ComponentFixture<DetailErrorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DetailErrorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
