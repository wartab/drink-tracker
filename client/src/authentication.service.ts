import {HttpClient, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {computed, effect, Inject, Injectable, signal} from "@angular/core";
import {firstValueFrom, Observable} from "rxjs";

interface User {
    id: number;
    name: string;
    email: string;
    password: string;
}

interface AccessTokenResponse {
    token: string;
    expiresIn: number;
}

interface AuthState {
    user: User | null;
    token: string | null;
    loggingIn: boolean;
    loading: boolean;
}


@Injectable({
    providedIn: "root",
})
export class AuthenticationService {

    private readonly authState = signal<AuthState>({
        user: null,
        token: sessionStorage.getItem("access_token"),
        loggingIn: false,
        loading: false,
    });

    public readonly user = computed(() => this.authState().user);
    public readonly token = computed(() => this.authState().token);
    public readonly loggingIn = computed(() => this.authState().loggingIn);
    public readonly loading = computed(() => this.authState().loading);

    public constructor(
        @Inject("apiUrl")
        private apiUrl: string,
        private http: HttpClient,
    ) {
        effect(() => {
            const accessToken = this.token();
            if (accessToken === null) {
                sessionStorage.removeItem("access_token");
            } else {
                sessionStorage.setItem("access_token", accessToken);
            }
        });
    }

    public async login(username: string, password: string) {
        this.authState.set({
            user: null,
            token: null,
            loggingIn: true,
            loading: false,
        });

        try {
            const accessToken = await firstValueFrom(this.http.post<AccessTokenResponse>(`${this.apiUrl}/login`, {
                username: username,
                password: password,
            }));

            this.loadAccount();
            return true;
        } catch (e) {
            this.authState.set({
                user: null,
                token: null,
                loggingIn: false,
                loading: false,
            });
            return false;
        }
    }

    public logout() {
        this.authState.set({
            user: null,
            token: null,
            loggingIn: false,
            loading: false,
        });
    }

    public loadAccount() {
        this.authState.set({
            user: null,
            token: this.token(),
            loggingIn: false,
            loading: true,
        });

        this.http.get<User>(`${this.apiUrl}/account`)
            .subscribe({
                next: user => {
                    this.authState.set({
                        user: user,
                        token: this.token(),
                        loggingIn: false,
                        loading: false,
                    });
                },
                error: () => {
                    this.logout();
                },
            });
    }
}


@Injectable()
export class AuthenticationInterceptor implements HttpInterceptor {
    public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const token = sessionStorage.getItem("access_token");

        if (!token) {
            return next.handle(req);
        }

        const headers = req.headers.set("Authorization", `Bearer ${token}`);
        const authReq = req.clone({headers});
        return next.handle(authReq);
    }
}
