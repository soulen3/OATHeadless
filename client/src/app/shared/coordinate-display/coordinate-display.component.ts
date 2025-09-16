import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-coordinate-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './coordinate-display.component.html',
  styleUrl: './coordinate-display.component.sass',
})
export class CoordinateDisplayComponent {
  @Input() ra: string = '';
  @Input() dec: string = '';
}
