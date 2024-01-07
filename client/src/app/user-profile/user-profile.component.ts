import {DatePipe, JsonPipe} from "@angular/common";
import {HttpClient} from "@angular/common/http";
import {Component, computed, Inject, Signal, signal} from "@angular/core";
import {MatMenuModule} from "@angular/material/menu";
import {MatTooltipModule} from "@angular/material/tooltip";
import {ActivatedRoute} from "@angular/router";
import {FaIconComponent} from "@fortawesome/angular-fontawesome";
import {faCircleNotch} from "@fortawesome/free-solid-svg-icons/faCircleNotch";
import {AuthenticationService} from "../../authentication.service";

interface Day {
    level: number | null;
    date: Date;
}

interface Week {
    days: [Day | null, Day | null, Day | null, Day | null, Day | null, Day | null, Day | null];
}

interface Month {
    name: string;
    weeks: Week[];
}

interface RegisteredDay {
    registered_day_id: string;
    user_id: string;
    date: string;
    level: number;
    comment: string | null;
}

const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
];

@Component({
    standalone: true,
    imports: [
        FaIconComponent,
        JsonPipe,
        DatePipe,
        MatTooltipModule,
        MatMenuModule,
    ],
    templateUrl: "./user-profile.component.html",
    styleUrl: "./user-profile.component.scss",
})
export class UserProfileComponent {
    public loadingIcon = faCircleNotch;

    public months = signal<Month[]>([]);
    public loading = signal(false);
    public isSelectable: Signal<boolean>;

    private userId: string = null!;

    public constructor(@Inject("apiUrl")
                       private apiUrl: string,
                       route: ActivatedRoute,
                       authService: AuthenticationService,
                       private http: HttpClient) {
        route.params.subscribe(params => {
            this.userId = params["id"];

            this.load();
        });

        this.isSelectable = computed(() => {
            return authService.user()?.user_id === this.userId;
        });
    }

    private load() {
        this.loading.set(true);

        const year = new Date().getFullYear();

        this.http.get<RegisteredDay[]>(`${this.apiUrl}/user-days/${this.userId}/${year}`).subscribe(days => {

            const months = Array<Month>(12);

            let readIndex = 0;

            for (let i = 0; i < 12; ++i) {
                months[i] = {
                    name: monthNames[i],
                    weeks: [{
                        days: [null, null, null, null, null, null, null],
                    }],
                };

                const dayCount = new Date(year, i + 1, 0).getDate();

                let currentWeek = months[i].weeks[0];

                for (let j = 0; j < dayCount; ++j) {
                    const date = new Date(year, i, j + 1);
                    const weekDay = (date.getDay() + 6) % 7;

                    if (j !== 0 && weekDay === 0) {
                        currentWeek = {
                            days: [null, null, null, null, null, null, null],
                        };
                        months[i].weeks.push(currentWeek);
                    }

                    if (days[readIndex] && isSameDate(date, new Date(days[readIndex].date))) {
                        currentWeek.days[weekDay] = {
                            date: date,
                            level: days[readIndex].level,
                        };

                        ++readIndex;
                    } else {
                        currentWeek.days[weekDay] = {
                            date: date,
                            level: null,
                        };
                    }
                }
            }

            this.months.set(months);
            this.loading.set(false);
        });
    }

    public changeLevel(day: Day, level: number) {

        this.loading.set(true);

        const dateString = day.date.getFullYear() + "-" + (day.date.getMonth() + 1) + "-" + day.date.getDate();

        this.http.post(`${this.apiUrl}/register-day`, {
            date: dateString,
            level: level,
            comment: null,
        }).subscribe(() => {
            this.load();
        });
    }
}

export function isSameDate(date1: Date, date2: Date) {
    if (!date1 && !date2) {
        return true;
    }

    if (!date1 || !date2) {
        return false;
    }

    if (date1.getDate() !== date2.getDate()) {
        return false;
    }

    if (date1.getMonth() !== date2.getMonth()) {
        return false;
    }

    return date1.getFullYear() === date2.getFullYear();
}
