import { Injectable } from "@angular/core";
import { ApiHttpService } from "./http.service";
import { Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class HealthService {
    constructor ( private http: ApiHttpService ) {}

    checkHealth(): Observable<ArrayBuffer> {
        console.log('check health in service');
        return this.http.get(this.http.getHostUrl() + 'health');
    }
}