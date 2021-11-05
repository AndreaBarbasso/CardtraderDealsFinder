import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {environment} from '../environments/environment';
import {map} from 'rxjs/operators';
import {forkJoin, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CardtraderApiService {

  readonly GAME_ID = 1;
  readonly CATEGORY_ID = 1;
  readonly HTTP_HEADERS: HttpHeaders = new HttpHeaders({
    Authorization: environment.authToken,
    Accept: 'application/json'
  });
  readonly HOST = 'https://api.cardtrader.com/api/v2';

  constructor(private http: HttpClient) {
  }

  getInfo(): Observable<GameExpansion[]> {
    return this.http.get<any>(this.HOST + '/info', {headers: this.HTTP_HEADERS});
  }

  getExpansions(): Observable<GameExpansion[]> {
    return this.http.get<GameExpansion[]>(this.HOST + '/expansions', {headers: this.HTTP_HEADERS})
      .pipe(map(r => r.filter(e => e.game_id === this.GAME_ID)
        .sort((e1, e2) => e1.name.localeCompare(e2.name))));
  }

  getMarketplaceProducts(expansionId: number): Observable<MarketplaceProducts> {
    return this.http.get<MarketplaceProducts>(this.HOST + '/marketplace/products?expansion_id=' + expansionId,
      {headers: this.HTTP_HEADERS})
      .pipe(map(r => {
        for (const item in r) {
          if (r.hasOwnProperty(item)) {
            r[item] = r[item].sort((i1, i2) => i1.price.cents - i2.price.cents);
          } else {
            delete r[item];
          }
        }
        return r;
      }));
  }

  getBlueprints(expansionId: number): Observable<Blueprint[]> {
    return this.http.get<Blueprint[]>(this.HOST + '/blueprints/export?expansion_id=' + expansionId,
      {headers: this.HTTP_HEADERS});
  }

  getSingleCardsOfExpansion(expansionId: number): Observable<ProductsWithBlueprints> {
    return forkJoin([this.getMarketplaceProducts(expansionId), this.getBlueprints(expansionId)])
      .pipe(map(([marketplaceProducts, blueprints]) => {
        const response: ProductsWithBlueprints = {};
        for (const blueprint of blueprints) {
          if (blueprint.category_id === this.CATEGORY_ID && !!marketplaceProducts[blueprint.id]) {
            response[blueprint.id] = {
              product: marketplaceProducts[blueprint.id],
              blueprint
            };
          }
        }
        return response;
      }));
  }


}

export interface ProductWithBlueprint {
  product: MarketplaceProduct[];
  blueprint: Blueprint;
}

export interface ProductsWithBlueprints {
  [id: string]: ProductWithBlueprint;
}

export interface GameExpansion {
  id: number;
  game_id: number;
  code: string;
  name: string;
}

export interface MarketplaceProducts {
  [id: string]: MarketplaceProduct[];
}

export interface MarketplaceProduct {
  id: number;
  blueprint_id: number;
  name_en: string;
  quantity: number;
  price: {
    cents: number;
    currency: string;
    formatted: string;
  };
  description: string;
  properties_hash: {
    condition: string,
    signed: boolean,
    mtg_foil: boolean,
    mtg_language: string,
    altered: boolean
  };
  expansion: {
    id: number;
    code: string;
    name_en: string;
  };
  user: {
    id: number,
    username: string,
    can_sell_via_hub: boolean,
    country_code: string,
    user_type: string,
    max_sellable_in24h_quantity: number
  };
  graded: boolean;
  on_vacation: boolean;
  bundle_size: number;
}

export interface Blueprint {
  id: number;
  name: string;
  version: string;
  game_id: number;
  category_id: number;
  expansion_id: number;
  editable_properties: string;
  card_market_id: number;
  tcg_player_id: null;
  scryfall_id: string;
}
