import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeFolderComponent } from './change-folder.component';

describe('ChangeFolderComponent', () => {
  let component: ChangeFolderComponent;
  let fixture: ComponentFixture<ChangeFolderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChangeFolderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangeFolderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
