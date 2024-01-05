import {HTTP_INTERCEPTORS, HttpClientModule, provideHttpClient} from "@angular/common/http";
import {ApplicationConfig, isDevMode} from "@angular/core";
import {provideRouter} from "@angular/router";
import {AuthenticationInterceptor} from "../authentication.service";
import {routes} from "./app.routes";

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        {
            "provide": "apiUrl",
            "useValue": isDevMode() ? "http://localhost:4000" : "https://api.example.com",
        },
        provideHttpClient(),
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthenticationInterceptor,
            multi: true,
        },
    ],
};
