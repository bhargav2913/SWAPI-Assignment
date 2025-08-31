
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SwapiService } from '../services/swapi.service';
import type { Person, Film, Species, Starship } from '../models/swapi.models';

@Component({
  selector: 'app-character-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './character-detail.component.html',
  styleUrls: ['./character-detail.component.css']
})
export class CharacterDetailComponent {
  person = signal<Person | null>(null);
  films = signal<Film[]>([]);
  species = signal<Species[]>([]);
  starships = signal<Starship[]>([]);

  constructor(route: ActivatedRoute, private swapi: SwapiService) {
    const id = Number(route.snapshot.paramMap.get('id'));
    this.swapi.getPersonById(id).subscribe(p => {
      this.person.set(p);
      if (p.films.length) forkJoin(p.films.map(u=>this.swapi.getFilm(u))).subscribe(f=>this.films.set(f));
      if (p.species.length) forkJoin(p.species.map(u=>this.swapi.getSpecies(u))).subscribe(s=>this.species.set(s));
      if (p.starships.length) forkJoin(p.starships.map(u=>this.swapi.getStarship(u))).subscribe(s=>this.starships.set(s));
    });
  }
}
