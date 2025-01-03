import {Component} from "@angular/core";
import {Router, RouterLink, RouterOutlet} from "@angular/router";
import {AuthenticationService} from "../../authentication.service";

@Component({
    imports: [
        RouterLink,
        RouterOutlet,
    ],
    templateUrl: "./main.component.html",
    styleUrl: "./main.component.scss",
})
export class MainComponent {
    public constructor(public authService: AuthenticationService,
                       private router: Router) {}

    public logout() {
        this.authService.logout();
        this.router.navigate(["/"]);
    }
}
