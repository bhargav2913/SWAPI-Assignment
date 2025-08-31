
import { Routes } from '@angular/router';
import { CharacterListComponent } from './components/character-list.component';
import { CharacterDetailComponent } from './components/character-detail.component';

export const routes: Routes = [
  { path: '', redirectTo: 'characters', pathMatch: 'full' },
  { path: 'characters', component: CharacterListComponent },
  { path: 'characters/:id', component: CharacterDetailComponent }
];
