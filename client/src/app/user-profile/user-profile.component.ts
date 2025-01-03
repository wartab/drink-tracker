import {DatePipe} from "@angular/common";
import {HttpClient} from "@angular/common/http";
import {Component, computed, Inject, ResourceRef, Signal, signal} from "@angular/core";
import {rxResource, toSignal} from "@angular/core/rxjs-interop";
import {MatMenuModule} from "@angular/material/menu";
import {MatTooltipModule} from "@angular/material/tooltip";
import {ActivatedRoute} from "@angular/router";
import {FaIconComponent} from "@fortawesome/angular-fontawesome";
import {faCircleNotch} from "@fortawesome/free-solid-svg-icons/faCircleNotch";
import {map} from "rxjs";
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

interface UserProfile {
    user_id: string;
    display_name: string;
    days: RegisteredDay[];
}


interface RegisteredDay {
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
    imports: [
        DatePipe,
        FaIconComponent,
        MatMenuModule,
        MatTooltipModule,
    ],
    templateUrl: "./user-profile.component.html",
    styleUrl: "./user-profile.component.scss",
})
export class UserProfileComponent {
    public loadingIcon = faCircleNotch;

    public months: ResourceRef<Month[]>;
    public searchParams: Signal<{year: number, userId: string} | undefined>;
    
    public isSelectable: Signal<boolean>;
    public displayName = signal("");

    public constructor(@Inject("apiUrl")
                       private apiUrl: string,
                       route: ActivatedRoute,
                       authService: AuthenticationService,
                       private http: HttpClient) {

        const currentYear = new Date().getFullYear();

        this.searchParams = toSignal(route.params.pipe(map(params => ({
            year: params["year"] ? parseInt(params["year"], 10) : currentYear,
            userId: params["id"] as string,
        }))), {
            initialValue: {
                year: new Date().getFullYear(),
                userId: route.snapshot.params["id"] as string,
            },
        });

        this.months = rxResource({
            request: this.searchParams,
            loader: ({request}) => {
                return this.http.get<UserProfile>(`${this.apiUrl}/user-days/${request!.userId}/${request!.year}`)
                    .pipe(map(profile => {
                        this.displayName.set(profile.display_name);

                        const days = profile.days;

                        const months = Array<Month>(12);

                        let readIndex = 0;

                        for (let i = 0; i < 12; ++i) {
                            months[i] = {
                                name: monthNames[i],
                                weeks: [{
                                    days: [null, null, null, null, null, null, null],
                                }],
                            };

                            const dayCount = new Date(request!.year, i + 1, 0).getDate();

                            let currentWeek = months[i].weeks[0];

                            for (let j = 0; j < dayCount; ++j) {
                                const date = new Date(request!.year, i, j + 1);
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

                        return months;
                    }));
            },
        });
        
        this.isSelectable = computed(() => {
            return authService.user()?.user_id === this.searchParams()?.userId;
        });
    }

    public changeLevel(day: Day, level: number) {
        if (!this.isSelectable()) {
            return;
        }

        const dateString = day.date.getFullYear() + "-" + (day.date.getMonth() + 1) + "-" + day.date.getDate();

        this.months.set(undefined);

        this.http.post(`${this.apiUrl}/register-day`, {
            date: dateString,
            level: level,
            comment: null,
        }).subscribe(() => {
            this.months.reload();
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
