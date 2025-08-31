import { Component, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SwapiService } from '../services/swapi.service';
import type { Person, Film, Species } from '../models/swapi.models';

@Component({
  selector: 'app-character-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './character-list.component.html',
  styleUrls: ['./character-list.component.css']
})
export class CharacterListComponent {
  people = signal<Person[]>([]);
  films = signal<Film[]>([]);
  species = signal<Species[]>([]);
  searchTerm = signal('');
  selectedFilmUrl = signal<string>('');
  selectedSpeciesUrl = signal<string>('');
  minYear = signal<number | null>(null);
  maxYear = signal<number | null>(null);
  currentPage = signal(1);
  pageSize = signal(10);

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const film = this.selectedFilmUrl();
    const species = this.selectedSpeciesUrl();
    const min = this.minYear();
    const max = this.maxYear();
    return this.people().filter(p => {
      if (term && !p.name.toLowerCase().includes(term)) return false;
      if (film && !p.films.includes(film)) return false;
      if (species && !p.species.includes(species)) return false;
      const parsed = this.swapi.parseBirthYear(p.birth_year);
      if (min !== null && parsed !== null && parsed < min) return false;
      if (max !== null && parsed !== null && parsed > max) return false;
      if ((min !== null || max !== null) && parsed === null) return false;

      return true;
    });
  });
  paginated = computed(() => {
    const all = this.filtered();
    const size = this.pageSize();
    const start = (this.currentPage() - 1) * size;
    return all.slice(start, start + size);
  });
  totalPages = computed(() => {
    return Math.ceil(this.filtered().length / this.pageSize()) || 1;
  });
  pages = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });
  constructor(private swapi: SwapiService, private router: Router) {
    this.swapi.getAllPeople().subscribe(all => {
      this.people.set(all);
      this.swapi.prefetchForFilters(all).subscribe(([films, species]) => {
        this.films.set([...films].sort((a, b) => a.episode_id - b.episode_id));
        this.species.set([...species].sort((a, b) => a.name.localeCompare(b.name)));
      });
    });
    effect(() => {
      this.searchTerm();
      this.selectedFilmUrl();
      this.selectedSpeciesUrl();
      this.minYear();
      this.maxYear();
      this.pageSize();
      this.filtered();
      this.currentPage.set(1);
    },{ allowSignalWrites: true });
  }
  open(p: Person) {
    const id = this.swapi.idFromUrl(p.url);
    this.router.navigate(['/characters', id]);
  }
  clearFilters() {
    this.selectedFilmUrl.set('');
    this.selectedSpeciesUrl.set('');
    this.minYear.set(null);
    this.maxYear.set(null);
    this.searchTerm.set('');
    this.currentPage.set(1);
  }
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }
  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(v => v + 1);
    }
  }
  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(v => v - 1);
    }
  }
  goToFirstPage() {
    this.currentPage.set(1);
  }
  goToLastPage() {
    this.currentPage.set(this.totalPages());
  }
}
