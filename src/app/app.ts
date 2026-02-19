import { AfterViewInit, Component } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `<div id="map" style="height:100vh;width:100%"></div>`,
})
export class App implements AfterViewInit {
  ngAfterViewInit(): void {
    const map = L.map('map').setView([35.681236, 139.767125], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
  }
}
