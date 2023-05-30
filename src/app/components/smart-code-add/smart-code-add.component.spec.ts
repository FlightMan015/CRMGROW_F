import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SmartCodeAddComponent } from './smart-code-add.component';

describe('SmartCodeAddComponent', () => {
  let component: SmartCodeAddComponent;
  let fixture: ComponentFixture<SmartCodeAddComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SmartCodeAddComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SmartCodeAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
