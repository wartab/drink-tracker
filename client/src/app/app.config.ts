import {HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi} from "@angular/common/http";
import {ApplicationConfig, isDevMode, provideExperimentalZonelessChangeDetection} from "@angular/core";
import {MAT_TOOLTIP_DEFAULT_OPTIONS, MatTooltipDefaultOptions} from "@angular/material/tooltip";
import {provideAnimations} from "@angular/platform-browser/animations";
import {provideRouter} from "@angular/router";
import {AuthenticationGuard, AuthenticationInterceptor} from "../authentication.service";
import {routes} from "./app.routes";

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        {
            "provide": "apiUrl",
            "useValue": isDevMode() ? "http://localhost:6969" : "https://drink-api.wartab.best",
        },
        provideHttpClient(withInterceptorsFromDi()),
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthenticationInterceptor,
            multi: true,
        },
        {provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: {disableTooltipInteractivity: true} as MatTooltipDefaultOptions},

        AuthenticationGuard,
        provideAnimations(),
        provideExperimentalZonelessChangeDetection(),
    ],
};
