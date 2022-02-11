import {Component, OnInit} from '@angular/core';
import {
  CardtraderApiService,
  GameExpansion,
  MarketplaceProduct,
  ProductsWithBlueprints
} from './cardtrader-api.service';
import {forkJoin} from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  readonly cardtraderBaseUrl = 'https://cardtrader.com/cards/';
  readonly mkmBaseUrl = 'https://www.cardmarket.com/it/Magic/Products/Singles/';
  readonly goBananasLength = 50;
  readonly conditionsValues = {
    Poor: 0,
    'Heavily Played': 1,
    Played: 2,
    'Moderately Played': 3,
    'Slightly Played': 4,
    'Near Mint': 5,
    Mint: 6
  };
  readonly conditionsSelect = [{
    label: 'Poor',
    value: 0
  }, {
    label: 'Heavily Played',
    value: 1
  }, {
    label: 'Played',
    value: 2
  }, {
    label: 'Moderately Played',
    value: 3
  }, {
    label: 'Slightly Played',
    value: 4
  }, {
    label: 'Near Mint',
    value: 5
  }, {
    label: 'Mint',
    value: 6
  }];

  maxQuotient = .6;
  maxCents = 10000;
  minCents = 50;
  maxCards = 1;

  expansions: GameExpansion[] = [];
  excludedExpansions = ['cei', 'ced'];
  selectedExpansion = -1;
  selectedMinCondition = 4;
  showNothingToDo = false;

  response: { bestItem: MarketplaceProduct, quotient: number, zero: boolean, mkmId: number }[];
  goBananasSets: { min: number, max: number }[] = [];
  alreadyDidBananas = {};

  constructor(private cardtraderApiService: CardtraderApiService) {
  }

  ngOnInit(): void {
    this.cardtraderApiService.getInfo().subscribe();
    this.cardtraderApiService.getExpansions().subscribe(r => {
      this.expansions = r.filter(e => !this.excludedExpansions.includes(e.code));
      for (let i = 0; i < this.expansions.length; i += this.goBananasLength) {
        this.goBananasSets.push({min: i, max: Math.min(i + this.goBananasLength, this.expansions.length)});
      }
    });
  }

  goBananas(min: number, max: number): void {
    this.alreadyDidBananas[min] = true;
    const calls$ = this.expansions.slice(min, max).map(e => this.cardtraderApiService.getSingleCardsOfExpansion(e.id));
    this.response = [];
    forkJoin(calls$).subscribe(results => {
      this.showNothingToDo = false;
      results.forEach(result => {
        this.handleDealsResponse(result);
      });
      this.sortResponse();
    });
  }

  getDealsForExpansion(): void {
    this.response = [];
    this.cardtraderApiService.getSingleCardsOfExpansion(this.selectedExpansion).subscribe(r => {
      this.showNothingToDo = false;
      this.handleDealsResponse(r);
      this.sortResponse();
    });
  }

  sortResponse(): void {
    if (this.response.length) {
      this.response.sort((i1, i2) => i1.quotient - i2.quotient);
    } else {
      this.showNothingToDo = true;
    }
  }

  handleDealsResponse(r: ProductsWithBlueprints): void {
    for (const id in r) {
      if (r.hasOwnProperty(id)) {
        const cards = r[id].product;
        const max = Math.min(this.maxCards, cards.length);
        for (let i = 0; i < max; i++) {
          const currCard = cards[i];
          const nextCard = cards[i + 1];
          if (currCard && nextCard && currCard.price.cents < this.maxCents && currCard.price.cents > this.minCents &&
            (currCard.price.cents) < (nextCard.price.cents * this.maxQuotient) &&
            this.conditionsValues[currCard.properties_hash.condition] >= this.selectedMinCondition) {
            const returnItems = cards.slice(0, i + 1)
              .filter(c => this.conditionsValues[c.properties_hash.condition] >= this.selectedMinCondition);
            this.response.push({
              bestItem: returnItems[0],
              quotient: returnItems[0].price.cents / nextCard.price.cents,
              zero: returnItems.some(item => item.user.can_sell_via_hub),
              mkmId: r[id].blueprint.card_market_id
            });
            break;
          }
        }
      }
    }
  }
}
