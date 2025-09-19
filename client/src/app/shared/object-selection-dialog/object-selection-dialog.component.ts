import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

interface MessierObject {
  id: string;
  ngc: string;
  name: string;
  type: string;
  constellation: string;
  magnitude: number;
  ra: number;
  dec: number;
}

interface CatalogObject {
  name: string;
  ra: string;
  dec: string;
  type: string;
  magnitude: number;
  constellation?: string;
}

@Component({
  selector: 'app-object-selection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './object-selection-dialog.component.html',
  styleUrl: './object-selection-dialog.component.css'
})
export class ObjectSelectionDialogComponent implements OnInit {
  displayedColumns: string[] = ['name', 'type', 'magnitude', 'coordinates', 'action'];
  catalogObjects: CatalogObject[] = [];
  filteredObjects: CatalogObject[] = [];
  searchTerm: string = '';

  constructor(
    public dialogRef: MatDialogRef<ObjectSelectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadMessierCatalog();
  }

  loadMessierCatalog() {
    console.log('Loading Messier catalog...');
    this.http.get<MessierObject[]>('static/messier.json').subscribe({
      next: (messierData) => {
        console.log('Raw Messier data:', messierData);
        this.catalogObjects = messierData.map(obj => ({
          name: obj.name && obj.name.trim() ? `${obj.id} (${obj.name})` : obj.id,
          ra: this.decimalToHMS(obj.ra),
          dec: this.decimalToDMS(obj.dec),
          type: obj.type,
          magnitude: obj.magnitude,
          constellation: obj.constellation
        }));
        this.filteredObjects = [...this.catalogObjects];
        console.log('Loaded', this.catalogObjects.length, 'Messier objects');
      },
      error: (error) => {
        console.error('Failed to load Messier catalog:', error);
        // Fallback to a few sample objects if catalog fails to load
        this.catalogObjects = [
          { name: 'M31 (Andromeda Galaxy)', ra: '00:42:44', dec: '+41:16:09', type: 'Galaxy', magnitude: 3.44, constellation: 'Andromeda' },
          { name: 'M42 (Orion Nebula)', ra: '05:35:17', dec: '-05:23:14', type: 'Nebula', magnitude: 4.0, constellation: 'Orion' },
          { name: 'M13 (Hercules Cluster)', ra: '16:41:41', dec: '+36:27:37', type: 'Globular cluster', magnitude: 5.8, constellation: 'Hercules' }
        ];
        this.filteredObjects = [...this.catalogObjects];
        console.log('Using fallback objects');
      }
    });
  }

  filterObjects() {
    if (!this.searchTerm.trim()) {
      this.filteredObjects = [...this.catalogObjects];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredObjects = this.catalogObjects.filter(obj =>
      obj.name.toLowerCase().includes(term) ||
      obj.type.toLowerCase().includes(term) ||
      (obj.constellation && obj.constellation.toLowerCase().includes(term))
    );
  }

  private decimalToHMS(decimal: number): string {
    const hours = Math.floor(decimal);
    const minutes = Math.floor((decimal - hours) * 60);
    const seconds = Math.floor(((decimal - hours) * 60 - minutes) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  private decimalToDMS(decimal: number): string {
    const sign = decimal < 0 ? '-' : '+';
    const abs = Math.abs(decimal);
    const degrees = Math.floor(abs);
    const minutes = Math.floor((abs - degrees) * 60);
    const seconds = Math.floor(((abs - degrees) * 60 - minutes) * 60);
    return `${sign}${degrees.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  selectObject(object: CatalogObject) {
    this.dialogRef.close(object);
  }

  close() {
    this.dialogRef.close();
  }
}
