import { Component, Input, HostListener, ElementRef } from "@angular/core";
import { NG_VALUE_ACCESSOR } from "@angular/forms";

@Component({
    selector: 'file-upload',
    templateUrl: 'file-upload.component.html',
    providers: [
      {
        provide: NG_VALUE_ACCESSOR,
        useExisting: FileUploadComponent,
        multi: true
      }
    ]
  })
  export class FileUploadComponent {
    @Input() progress: any;
    onChange!: Function;
    file: File | null = null;
  
    @HostListener('change', ['$event.target.files']) emitFiles( event: FileList ) {
      const file = event && event.item(0);
      this.onChange(file);
      this.file = file;
    }
  
    constructor( private host: ElementRef<HTMLInputElement> ) {
    }
  
    writeValue( value: null ) {
      // clear file input
      this.host.nativeElement.value = '';
      this.file = null;
    }
  
    registerOnChange( fn: Function ) {
      this.onChange = fn;
    }
  
    registerOnTouched( fn: Function ) {
    }
  
  }