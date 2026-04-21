import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppHeaderComponent } from './shared/ui/app-header/app-header.component';
import { NetworkService } from './shared/infrastructure/network.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppHeaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected readonly title = signal('recetapps');

  private readonly networkService = inject(NetworkService);

  ngOnInit(): void {
    this.networkService.initialize();
  }
}
