import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { Body } from '@lib/commons/body/body';
import { Footer } from '@lib/commons/footer/footer';
import { Header } from '@lib/commons/header/header';
import { Tour } from '@lib/commons/tour/tour';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Body, Footer, Tour],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App extends BaseComponent implements OnInit {
  
  private readonly platformId = inject(PLATFORM_ID);

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.featureFlagService.ensureLoaded(this.flowService.token());
  }
}
