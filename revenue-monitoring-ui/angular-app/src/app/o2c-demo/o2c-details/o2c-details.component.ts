import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-o2c-details',
  templateUrl: './o2c-details.component.html',
  styleUrls: ['./o2c-details.component.css'],
})
export class O2cDetailsComponent implements OnInit {
  orderId: string | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.orderId = params.get('orderId');
      console.log('Received order ID:', this.orderId);
    });
  }
}
