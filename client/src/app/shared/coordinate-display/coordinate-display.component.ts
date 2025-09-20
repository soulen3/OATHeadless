import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-coordinate-display',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './coordinate-display.component.html',
  styleUrl: './coordinate-display.component.sass',
})
export class CoordinateDisplayComponent {
  @Input() ra: string = '';
  @Input() dec: string = '';
}
