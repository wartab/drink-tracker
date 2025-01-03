import {HttpClient} from "@angular/common/http";
import {Component, computed, Inject, signal} from "@angular/core";
import {FaIconComponent} from "@fortawesome/angular-fontawesome";
import {faCircleNotch} from "@fortawesome/free-solid-svg-icons/faCircleNotch";

interface Participant {
    user_id: string;
    display_name: string;
    drink_days: number;
    total_days: number;
    total_score: number;
}

@Component({
    imports: [
        FaIconComponent,
    ],
    templateUrl: "./dashboard.component.html",
    styleUrl: "./dashboard.component.scss",
})
export class DashboardComponent {
    public loadingIcon = faCircleNotch;

    public loading = signal(true);
    public participants = signal<Participant[]>([]);
    public champions = computed(() => this.participants().filter(p => p.drink_days > 0));

    public constructor(@Inject("apiUrl")
                           apiUrl: string,
                       http: HttpClient) {

        http.get<Participant[]>(`${apiUrl}/yesterday-stats`)
            .subscribe((participants: any[]) => {
                this.participants.set(participants);
                this.loading.set(false);
            });
    }
}
