import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MaterialSendComponent } from './material-send.component';

describe('MaterialSendComponent', () => {
  let component: MaterialSendComponent;
  let fixture: ComponentFixture<MaterialSendComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MaterialSendComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MaterialSendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
