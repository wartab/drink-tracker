import {Component, signal} from "@angular/core";
import {FormsModule} from "@angular/forms";
import {FaIconComponent} from "@fortawesome/angular-fontawesome";
import {faCircleNotch} from "@fortawesome/free-solid-svg-icons/faCircleNotch";
import {AuthenticationService} from "../../authentication.service";

@Component({
    standalone: true,
    imports: [
        FormsModule,
        FaIconComponent,
    ],
    templateUrl: "./login.component.html",
    styleUrl: "./login.component.scss",
})
export class LoginComponent {
    public loadingIcon = faCircleNotch;

    public error = signal(false);
    public email = signal("");
    public password = signal("");

    public constructor(public authenticationService: AuthenticationService) {
        this.authenticationService.loadAccount();
    }

    public async submit(event: SubmitEvent) {
        event.preventDefault();
        this.error.set(false);
        const success = await this.authenticationService.login(this.email(), this.password());
        this.error.set(!success);
    }
}
