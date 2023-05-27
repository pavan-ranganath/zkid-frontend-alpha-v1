import { Component } from '@angular/core';

import { AccountService } from '@app/_services';
import { User } from './_models';

@Component({ selector: 'app-root', templateUrl: 'app.component.html' })
export class AppComponent {
    user?: User | null;

    constructor(private accountService: AccountService) {
        if(this.accountService.user) {
            this.accountService.user.subscribe((x: User | null | undefined) => this.user = x);
        }
       
    }

    logout() {
        this.accountService.logout();
    }
}