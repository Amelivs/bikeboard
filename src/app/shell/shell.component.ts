import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { environment } from 'src/environments/environment';


@Component({
  selector: 'app-shell',
  standalone: true,
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  imports: [CommonModule, IonicModule]
})
export class ShellComponent implements OnInit {
  private readonly router = inject(Router);

  ngOnInit() {
    setTimeout(() => {
      this.router.navigateByUrl('/app', { replaceUrl: true });
    }, environment.production ? 0 : 1000)
  }
}
