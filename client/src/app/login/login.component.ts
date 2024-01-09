import {Component, signal} from "@angular/core";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {FormsModule} from "@angular/forms";
import {Router} from "@angular/router";
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
    public username = signal("");
    public password = signal("");

    public constructor(public authenticationService: AuthenticationService,
                       private router: Router) {

        this.authenticationService.loadAccount()
            .pipe(takeUntilDestroyed())
            .subscribe(user => {
                if (user) {
                    this.router.navigate(["/leaderboard"]);
                }
            });
    }

    public async submit(event: SubmitEvent) {
        event.preventDefault();
        this.error.set(false);
        const success = await this.authenticationService.login(this.username(), this.password());
        this.error.set(!success);
        this.router.navigate(["/leaderboard"]);
    }

    public register() {
        this.router.navigate(["/register"]);
    }
}
