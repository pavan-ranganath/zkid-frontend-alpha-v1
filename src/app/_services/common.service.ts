import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CommonService {

    constructor() { }

        readFileContent(file: File): Promise<string> {
            return new Promise<string>((resolve, reject) => {
                if (!file) {
                    resolve('');
                }
    
                const reader = new FileReader();
                let text = '';
                reader.onload = (e) => {
                    if(reader.result) {
                         text = reader.result.toString();
                    }
                    
                    resolve(text);
    
                };
    
                reader.readAsText(file);
            });
        }
}