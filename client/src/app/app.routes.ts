import {Routes} from "@angular/router";
import {AuthenticationGuard} from "../authentication.service";

export const routes: Routes = [
    {path: "", loadComponent: () => import("./login/login.component").then(c => c.LoginComponent), pathMatch: "full"},
    {
        path: "", loadComponent: () => import("./main/main.component").then(c => c.MainComponent), children: [
            {
                path: "leaderboard",
                loadComponent: () => import("./leaderboard/leaderboard.component").then(c => c.LeaderboardComponent),
                pathMatch: "full",
            },
            {
                path: "dashboard",
                loadComponent: () => import("./dashboard/dashboard.component").then(c => c.DashboardComponent),
                pathMatch: "full",
            },
            {
                path: "user/:id",
                loadComponent: () => import("./user-profile/user-profile.component").then(c => c.UserProfileComponent),
                pathMatch: "full",
            },
        ], canActivate: [AuthenticationGuard],
    },
    {
        path: "register",
        loadComponent: () => import("./register/register.component").then(c => c.RegisterComponent),
        pathMatch: "full",
    },
];
