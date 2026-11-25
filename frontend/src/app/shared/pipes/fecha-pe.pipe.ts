import { Pipe, PipeTransform } from '@angular/core';
import { formatFechaPe } from '../utils/fecha';

@Pipe({ name: 'fechaPe', standalone: true })
export class FechaPePipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    return formatFechaPe(value);
  }
}
