import { CommonModule } from "@angular/common";
import {HttpClient} from "@angular/common/http";
import {Component, Inject, computed, signal} from "@angular/core";
import {MatTooltipModule} from "@angular/material/tooltip";
import {RouterLink} from "@angular/router";
import {FaIconComponent} from "@fortawesome/angular-fontawesome";
import { faChevronDown, faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import {faCircleNotch} from "@fortawesome/free-solid-svg-icons/faCircleNotch";
import {faWineBottle} from "@fortawesome/free-solid-svg-icons/faWineBottle";

interface Participant {
    user_id: string;
    display_name: string;
    drink_days: number;
    total_days: number;
    total_score: number;
}

@Component({
    standalone: true,
    imports: [
        FaIconComponent,
        RouterLink,
        MatTooltipModule,
        CommonModule,
    ],
    templateUrl: "./leaderboard.component.html",
    styleUrl: "./leaderboard.component.scss",
})
export class LeaderboardComponent {
    public bottleIcon = faWineBottle;
    public loadingIcon = faCircleNotch;
    public infoIcon = faQuestionCircle;
    public sortIcon = faChevronDown;

    public loading = signal(true);
    public sortBy = signal<"drink_days" | "average" | "total_score">("drink_days");

    private participants = signal<Participant[]>([]);
    public sortedParticipants = computed(() => {
        if (this.loading()) {
            return [];
        }

        const participants = this.participants();
        const sortBy = this.sortBy();
        if (sortBy == "average") {
            return participants.sort((a, b) => b.drink_days / b.total_days - a.drink_days / a.total_days);
        } else {
            return participants.sort((a, b) => b[sortBy] - a[sortBy]);
        }
    });

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
