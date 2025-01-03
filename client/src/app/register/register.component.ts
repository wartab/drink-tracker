import {HttpClient} from "@angular/common/http";
import {Component, Inject, signal} from "@angular/core";
import {FormsModule} from "@angular/forms";
import {Router} from "@angular/router";
import {AuthenticationService} from "../../authentication.service";

@Component({
    imports: [
        FormsModule,
    ],
    templateUrl: "./register.component.html",
    styleUrl: "./register.component.scss",
})
export class RegisterComponent {
    public submitting = signal(false);
    public error = signal<string | null>(null);

    public username = signal("");
    public password = signal("");
    public confirmPassword = signal("");
    public displayName = signal("");


    public constructor(@Inject("apiUrl")
                       private apiUrl: string,
                       private http: HttpClient,
                       private authenticationService: AuthenticationService,
                       private router: Router,
    ) {
    }

    public submit($event: any) {
        this.submitting.set(true);

        const password = this.password();

        if (password !== this.confirmPassword()) {
            this.submitting.set(false);
            this.error.set("Les mots de passes ne correspondent pas");
            return;
        }

        const username = this.username();

        this.http.post(`${this.apiUrl}/register`, {
            username: username,
            password: password,
            display_name: this.displayName(),
        }).subscribe({
            next: async () => {
                this.submitting.set(false);
                this.error.set(null);

                await this.authenticationService.login(username, password);

                this.router.navigate(["/"]);
            },
            error: (error) => {
                console.log(error);

                this.submitting.set(false);
                this.error.set(error.error.error);
            },
        });
    }

    public login() {
        this.router.navigate(["/"]);
    }
}
