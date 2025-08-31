
export interface Person {
  name: string;
  birth_year: string;
  url: string;
  films: string[];
  species: string[];
  starships: string[];
}
export interface Film { title: string; episode_id: number; url: string; }
export interface Species { name: string; url: string; }
export interface Starship { name: string; url: string; }
