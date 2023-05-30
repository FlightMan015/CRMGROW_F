import { TestBed } from '@angular/core/testing';

import { PageExitGuard } from './page-exit.guard';

describe('PageExitGuard', () => {
  let guard: PageExitGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(PageExitGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
