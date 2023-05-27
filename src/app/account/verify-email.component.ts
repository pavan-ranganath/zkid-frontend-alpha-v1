
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';

import { AccountService, AlertService } from '@app/_services';

@Component({ templateUrl: 'verify-email.component.html' })
export class VerifyEmailComponent implements OnInit {
    isEmailVerifiedReq: boolean = false;

    constructor(
        private route: ActivatedRoute,
        private accountService: AccountService,
        private alertService: AlertService
    ) { }

    ngOnInit() {
        this.route.queryParams
        .subscribe(params => {
            const token = params.token
            if (token) {
                this.accountService.verifyEmail(token)
                    .pipe(first())
                    .subscribe({
                        next: () => {
                            this.isEmailVerifiedReq = true;
                        },
                        error: error => {
                            console.log(error);
                            this.alertService.error(error);
                            this.isEmailVerifiedReq = false;
                        },
                    })
            }
        });
    }
}