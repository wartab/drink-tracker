import {Routes} from "@angular/router";
import {AuthenticationGuard} from "../authentication.service";
import {DashboardComponent} from "./dashboard/dashboard.component";
import {LeaderboardComponent} from "./leaderboard/leaderboard.component";
import {LoginComponent} from "./login/login.component";
import {MainComponent} from "./main/main.component";
import {RegisterComponent} from "./register/register.component";
import {UserProfileComponent} from "./user-profile/user-profile.component";

export const routes: Routes = [
    {path: "", component: LoginComponent, pathMatch: "full"},
    {path: "", component: MainComponent, children: [
        {path: "main", component: MainComponent, pathMatch: "full"},
        {path: "leaderboard", component: LeaderboardComponent, pathMatch: "full"},
        {path: "dashboard", component: DashboardComponent, pathMatch: "full"},
        {path: "user/:id", component: UserProfileComponent, pathMatch: "full"},
    ], canActivate: [AuthenticationGuard]},
    {path: "register", component: RegisterComponent, pathMatch: "full"},
];
