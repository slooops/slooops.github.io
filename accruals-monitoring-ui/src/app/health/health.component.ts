import { Component, OnInit } from '@angular/core';
import { HealthService } from '../providers/health.service';

@Component({
  selector: 'app-health',
  templateUrl: './health.component.html',
  styleUrls: ['./health.component.css']
})
export class HealthComponent implements OnInit {

  health: string = '';

  constructor( private healthService : HealthService) { }

  ngOnInit(): void {
    console.log('init');
    this.showHealth();
  }

  showHealth(): void {
    console.log('health check');
    this.healthService.checkHealth()
      .subscribe((res: any) => this.health = res.message);
  }
  

}
