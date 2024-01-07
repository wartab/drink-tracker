import {Component} from "@angular/core";
import {RouterLink, RouterOutlet} from "@angular/router";
import {AuthenticationService} from "../../authentication.service";

@Component({
    standalone: true,
    imports: [
        RouterLink,
        RouterOutlet,
    ],
    templateUrl: "./main.component.html",
    styleUrl: "./main.component.scss",
})
export class MainComponent {
    public constructor(public authService: AuthenticationService) {}
}
