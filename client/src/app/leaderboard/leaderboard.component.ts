import {HttpClient} from "@angular/common/http";
import {Component, Inject, signal} from "@angular/core";
import {MatTooltipModule} from "@angular/material/tooltip";
import {RouterLink} from "@angular/router";
import {FaIconComponent} from "@fortawesome/angular-fontawesome";
import {faCircleNotch} from "@fortawesome/free-solid-svg-icons/faCircleNotch";
import {faWineBottle} from "@fortawesome/free-solid-svg-icons/faWineBottle";

interface Participant {
    user_id: string;
    display_name: string;
    drink_days: number;
    total_days: number;
}

@Component({
    standalone: true,
    imports: [
        FaIconComponent,
        RouterLink,
        MatTooltipModule,
    ],
    templateUrl: "./leaderboard.component.html",
    styleUrl: "./leaderboard.component.scss",
})
export class LeaderboardComponent {
    public bottleIcon = faWineBottle;
    public loadingIcon = faCircleNotch;

    public loading = signal(true);
    public participants = signal<Participant[]>([]);

    public constructor(@Inject("apiUrl")
                       apiUrl: string,
                       http: HttpClient) {

        const year = new Date().getFullYear();

        http.get<Participant[]>(`${apiUrl}/leaderboard/${year}`)
            .subscribe((participants: any[]) => {
                this.participants.set(participants);
                this.loading.set(false);
            });
    }
}
