import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { AccountService, AlertService, CommonService } from '@app/_services';
import { Buffer } from 'buffer';

import { readOpenSslKeys, sign, getSharedKey, decryptWithSharedKey, readOpenSslPrivateKeys, convertEd25519PrivateKeyToCurve25519, convertEd25519PublicKeyToCurve25519,encryptWithSharedKey } from '@app/_helpers/ed25519NewWrapper';
const zKID = 'ZKID_v1';


@Component({ templateUrl: 'register.component.html' })
export class RegisterComponent implements OnInit {
    form!: FormGroup;
    loading = false;
    submitted = false;
    registerDisabled = false;
    loginDisabled = false;
    userInfo: any;
    userList: any[] | undefined = [];
    registrationSuccess = false;

    constructor(
        private formBuilder: FormBuilder,
        private accountService: AccountService,
        private alertService: AlertService,
        private common: CommonService
    ) { }

    ngOnInit() {
        this.form = this.formBuilder.group({
            name: ['pavan ranganath', Validators.required],
            username: ['pavanranganath@egstech.org', Validators.required],
            privateKey: ['', Validators.required],
            publicKey: ['', Validators.required]
        });

    }


    // convenience getter for easy access to form fields
    get f() { return this.form.controls; }


    async register() {
        this.submitted = true;

        // reset alerts on submit
        this.alertService.clear();

        // stop here if form is invalid
        if (this.form.invalid) {
            return;
        }


        this.loading = true;

        let privKey = (await this.common.readFileContent(this.form.value.privateKey))
        let pubKey = (await this.common.readFileContent(this.form.value.publicKey))
        let plainMsg = `I, ${this.form.value.name} would like to register with email "${this.form.value.username}" to ${zKID} service`;
        let paredKeyPair = readOpenSslKeys(privKey, pubKey)
        let signature = sign(plainMsg, paredKeyPair.privateKey)

        this.accountService.entradaAuthRegister({ username: this.form.value.username, name: this.form.value.name, publicKey: pubKey, plainMsg: plainMsg, signature: signature.toHex() })
            .pipe(first())
            .subscribe({
                next: (opts: any) => {
                    sessionStorage.setItem(
                        this.form.value['username'], 
                        JSON.stringify({ 
                            username: this.form.value.username, 
                            privateKey: Buffer.from(paredKeyPair.privateKey).toString('base64'),  
                            publicKey: Buffer.from(paredKeyPair.publicKey).toString('base64')
                        }));
                    this.challengeReceived(opts, paredKeyPair.privateKey, paredKeyPair.publicKey, this.form.value['username']);
                },
                error: error => {
                    this.alertService.error(error);
                    this.loading = false;
                },
                complete: () => {
                },
            });
    }
    private storeUserKeys(username: string, value: Object) {
        let users = this.getUsers('users')
        if (users) { 
            let t = JSON.parse(users);
            t.push({...value})    
            localStorage.setItem('users', JSON.stringify(t));        
        } else {
            localStorage.setItem('users', JSON.stringify([{...value}]));
        }
       
    }
    private getUsers(users: string) {
        return localStorage.getItem(users)
    }
    async challengeReceived(respObj: any, clientPrivateKey: any, clientPublicKey: any, username: string) {
        const challengeEncrypt = respObj.challengeEncrypt;
        const ephemeralPubKey = Buffer.from(respObj.ephemeralPubKey, "base64");
        const userId = respObj.userId;

        // GENERATE SHARED SECRET
        let sharedKey = getSharedKey(
            convertEd25519PrivateKeyToCurve25519(clientPrivateKey),
            convertEd25519PublicKeyToCurve25519(ephemeralPubKey)
        )

        console.log('Client shared key (Base64):', Buffer.from(sharedKey).toString('base64'));

        // DECRYPT CHALLENGE USING USER PUBLIC KEY 
        let challenge = decryptWithSharedKey(challengeEncrypt, sharedKey);

        // CREATE MESSAGE AND SIGN
        let msgObj = {
            username: username,
            challenge: challenge,
            userId: userId
        }
        let encryptedData = encryptWithSharedKey(JSON.stringify(msgObj),sharedKey)
        let afterSignature = sign(encryptedData, clientPrivateKey);
        let reqObj = {
            signature: afterSignature.toHex(),
            encryptedData: encryptedData,
        }


        this.accountService.entradaAuthRegistrationVerification(reqObj)
            .pipe(first())
            .subscribe({
                next: (opts: any) => {
                    let userKeyStore = sessionStorage.getItem(username)
                    if (!userKeyStore) {
                        alert("Error!!, keystore not found")
                        return
                    }
                    let registrationCode = opts.registrationCode

                    // DECRYPT REGISTRATION CODE
                    let plainRegistrationCode = decryptWithSharedKey(registrationCode, sharedKey)
                    let tempKeyStoreObj = JSON.parse(userKeyStore)

                    // STORE USER INFO IN LOCAL STORAGE
                    this.storeUserKeys(username, { ...tempKeyStoreObj, userId: opts.userId, registrationCode: plainRegistrationCode, name: this.form.value.name })
                    this.userInfo = { ...tempKeyStoreObj, userId: opts.userId, registrationCode: plainRegistrationCode };
                    this.registrationSuccess = true;
                    alert("SUCCESS!! REGISTRATION COMPLETED")
                },
                error: error => {
                    this.alertService.error(error);
                    this.loading = false;
                },
                complete: () => {
                    this.loading = false;
                    this.registerDisabled = true;
                    this.loginDisabled = false;
                    sessionStorage.clear();
                },
            });

    }

}
