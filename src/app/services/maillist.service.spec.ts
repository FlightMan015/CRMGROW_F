import { TestBed } from '@angular/core/testing';

import { MailListService } from './maillist.service';

describe('MailListService', () => {
  let service: MailListService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MailListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
