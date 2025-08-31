
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, switchMap } from 'rxjs/operators';
import { forkJoin, Observable, of } from 'rxjs';
import type { Person, Film, Species, Starship } from '../models/swapi.models';

@Injectable({ providedIn: 'root' })
export class SwapiService {
  private base = 'https://swapi.py4e.com/api';
  private personCache = new Map<number, Person>();
  private filmCache = new Map<string, Film>();
  private speciesCache = new Map<string, Species>();
  private starshipCache = new Map<string, Starship>();

  constructor(private http: HttpClient) {}

  idFromUrl(url: string): number {
    const m = url.match(/\/(\d+)\/?$/);
    return m ? +m[1] : NaN;
  }

parseBirthYear(value: string | number | null): number | null {
  if (value === null || value === '' || value === 'unknown') return null;

  if (typeof value === 'number') return value;

  const num = parseFloat(value);
  if (isNaN(num)) return null;

  if (value.toUpperCase().endsWith('BBY')) return -num;
  if (value.toUpperCase().endsWith('ABY')) return num;

  return num;
}

  getAllPeople(): Observable<Person[]> {
    const first$ = this.http.get<any>(`${this.base}/people/?page=1`);
    return first$.pipe(
      switchMap(first => {
        const total = first.count as number;
        const pageSize = first.results.length as number;
        const pages = Math.ceil(total / pageSize);
        const reqs = [of(first), ...Array.from({ length: pages - 1 }, (_, i) =>
          this.http.get<any>(`${this.base}/people/?page=${i + 2}`)
        )];
        return forkJoin(reqs);
      }),
      map(chunks => chunks.flatMap(c => c.results as Person[])),
      map(all => {
        all.forEach(p => {
          const id = this.idFromUrl(p.url);
          if (!Number.isNaN(id)) this.personCache.set(id, p);
        });
        return all;
      })
    );
  }

  getPersonById(id: number): Observable<Person> {
    const hit = this.personCache.get(id);
    if (hit) return of(hit);
    return this.http.get<Person>(`${this.base}/people/${id}/`).pipe(map(p => { this.personCache.set(id,p); return p; }));
  }

  private getEntity<T>(url: string, cache: Map<string, T>, fetcher: (u:string)=>Observable<T>): Observable<T> {
    const hit = cache.get(url);
    if (hit) return of(hit);
    return fetcher(url).pipe(map(e => (cache.set(url, e), e)));
  }

  getFilm(url: string) { return this.getEntity<Film>(url, this.filmCache, (u)=>this.http.get<Film>(u)); }
  getSpecies(url: string) { return this.getEntity<Species>(url, this.speciesCache, (u)=>this.http.get<Species>(u)); }
  getStarship(url: string) { return this.getEntity<Starship>(url, this.starshipCache, (u)=>this.http.get<Starship>(u)); }

  prefetchForFilters(people: Person[]) {
    const filmUrls = Array.from(new Set(people.flatMap(p => p.films)));
    const speciesUrls = Array.from(new Set(people.flatMap(p => p.species)));
    const film$ = filmUrls.length ? forkJoin(filmUrls.map(u => this.getFilm(u))) : of([] as Film[]);
    const species$ = speciesUrls.length ? forkJoin(speciesUrls.map(u => this.getSpecies(u))) : of([] as Species[]);
    return forkJoin([film$, species$]);
  }
}
