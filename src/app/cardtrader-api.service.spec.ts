import { TestBed } from '@angular/core/testing';

import { CardtraderApiService } from './cardtrader-api.service';

describe('CardtraderApiService', () => {
  let service: CardtraderApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CardtraderApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
