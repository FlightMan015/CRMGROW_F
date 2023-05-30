import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RemoveFolderComponent } from './remove-folder.component';

describe('RemoveFolderComponent', () => {
  let component: RemoveFolderComponent;
  let fixture: ComponentFixture<RemoveFolderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RemoveFolderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RemoveFolderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
