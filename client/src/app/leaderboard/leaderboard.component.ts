import {CommonModule} from "@angular/common";
import {HttpClient} from "@angular/common/http";
import {Component, computed, Inject, Resource, Signal, signal} from "@angular/core";
import {rxResource, toSignal} from "@angular/core/rxjs-interop";
import {MatMenu, MatMenuItem, MatMenuTrigger} from "@angular/material/menu";
import {MatTooltipModule} from "@angular/material/tooltip";
import {ActivatedRoute, RouterLink} from "@angular/router";
import {FaIconComponent} from "@fortawesome/angular-fontawesome";
import {faChevronDown} from "@fortawesome/free-solid-svg-icons/faChevronDown";
import {faCircleNotch} from "@fortawesome/free-solid-svg-icons/faCircleNotch";
import {faQuestionCircle} from "@fortawesome/free-solid-svg-icons/faQuestionCircle";
import {faWineBottle} from "@fortawesome/free-solid-svg-icons/faWineBottle";
import {map} from "rxjs";

interface Participant {
    user_id: string;
    display_name: string;
    drink_days: number;
    total_days: number;
    total_score: number;
}

@Component({
    imports: [
        CommonModule,
        FaIconComponent,
        MatMenu,
        MatMenuItem,
        MatTooltipModule,
        RouterLink,
        MatMenuTrigger,
    ],
    templateUrl: "./leaderboard.component.html",
    styleUrl: "./leaderboard.component.scss",
})
export class LeaderboardComponent {
    public bottleIcon = faWineBottle;
    public loadingIcon = faCircleNotch;
    public infoIcon = faQuestionCircle;
    public chevronDownIcon = faChevronDown;

    public allYears: number[];

    public sortBy = signal<"drink_days" | "average" | "total_score">("drink_days");

    public selectedYear: Signal<number>;

    public participants: Resource<Participant[]>;

    public sortedParticipants = computed(() => {
        if (!this.participants.hasValue()) {
            return [];
        }

        const participants = this.participants.value()!;
        const sortBy = this.sortBy();
        if (sortBy === "average") {
            return participants.toSorted((a, b) => b.drink_days / b.total_days - a.drink_days / a.total_days);
        } else {
            return participants.toSorted((a, b) => b[sortBy] - a[sortBy]);
        }
    });

    public constructor(
        @Inject("apiUrl") apiUrl: string,
        route: ActivatedRoute,
        http: HttpClient,
    ) {
        const firstYear = 2024;
        const currentYear = new Date().getFullYear();

        this.allYears = Array(currentYear - firstYear + 1);

        for (let i = 0; i < this.allYears.length; i++) {
            this.allYears[i] = currentYear - i;
        }

        this.selectedYear = toSignal(
            route.params.pipe(map(params => params["year"] ? parseInt(params["year"], 10) : currentYear)),
            {initialValue: currentYear},
        );


        this.participants = rxResource({
            request: this.selectedYear,
            loader: params => http.get<Participant[]>(`${apiUrl}/leaderboard/${params.request}`),
        });
    }
}
