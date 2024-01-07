import {HttpClient, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {computed, effect, Inject, Injectable, signal} from "@angular/core";
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from "@angular/router";
import {first, firstValueFrom, Observable, of, tap} from "rxjs";

interface User {
    user_id: string;
    username: string;
    display_name: string;
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

            this.authState.set({
                user: null,
                token: accessToken.token,
                loggingIn: false,
                loading: true,
            });

            await Promise.resolve();

            this.loadAccount().subscribe();
            return true;
        } catch (e) {
            console.error(e);

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
        console.log("logout");
        this.authState.set({
            user: null,
            token: null,
            loggingIn: false,
            loading: false,
        });
    }

    public loadAccount(): Observable<null | User> {

        const token = this.token();

        this.authState.set({
            user: null,
            token: token,
            loggingIn: false,
            loading: true,
        });

        if (!token) {
            this.logout();
            return of(null);
        }

        return this.http.get<User>(`${this.apiUrl}/account`)
            .pipe(tap({
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
            }));
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

@Injectable()
export class AuthenticationGuard implements CanActivate {

    public constructor(private authService: AuthenticationService,
                       private router: Router) {
    }

    public canActivate(): Promise<boolean> {
        return new Promise(resolve => {
            this.authService.loadAccount()
                .pipe(first())
                .subscribe({
                    next: user => {
                        if (user) {
                            resolve(true);
                        } else {
                            this.router.navigate(["/"]);
                            resolve(false);
                        }
                    },
                    error: () => {
                        this.router.navigate(["/"]);
                        resolve(false);
                    },
                });
        });
    }
}
