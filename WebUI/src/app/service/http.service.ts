// 
// The MIT License
// 
// Copyright (c) 2022 ETRI
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// 

import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http'
import { catchError, map, retry } from 'rxjs/operators';
import { OverlayNetwork } from '../model/overlay';


@Injectable({
  providedIn: 'root'
})
export class HttpService {
  debounceTime: number = 100;
  retryCount: number = 1;
  constructor(private http: HttpClient) { }

  Get(url: string): Observable<any> {
    return this.http.get(url).pipe(
      map((res: any) => res),
      retry(this.retryCount),
      catchError(this.handleErrorObservable)
    );
  }

  Post(url: string, body: any): Observable<any> {
    return this.http.post(url, body).pipe(
      map((res: any) => res),
      retry(this.retryCount),
      catchError(this.handleErrorObservable)
    );
  }

  postInitData(): Observable<any> {
    return this.http.post("/api/InitData", {}).pipe(
      map((res: any) => res),
      retry(this.retryCount),
      catchError(this.handleErrorObservable)
    );
  }

  getInitData(): Observable<any> {
    return this.http.get("/api/InitData", {}).pipe(
      map((res: any) => res),
      retry(this.retryCount),
      catchError(this.handleErrorObservable)
    );
  }

  getOverlayList(): Observable<OverlayNetwork[]> {
    return this.http.get("/homs").pipe(
      map((res: any) => res),
      retry(this.retryCount),
      catchError(this.handleErrorObservable)
    );
  }

  deleteOverlay(overlayId: string): Observable<any> {
    return this.http.post("/api/HybridOverlayRemoval", { "overlay-id": overlayId }).pipe(
      map((res: any) => res),
      retry(this.retryCount),
      catchError(this.handleErrorObservable)
    );
  }

  postMobileNetwork(): Observable<any> {
    return this.http.post("/api/Mobile/Network", {}).pipe(
      map((res: any) => res),
      retry(this.retryCount),
      catchError(this.handleErrorObservable)
    );
  }

  postMobileIoT(param: any): Observable<any> {
    return this.http.post("/api/Mobile/IoT", param).pipe(
      map((res: any) => res),
      retry(this.retryCount),
      catchError(this.handleErrorObservable)
    );
  }

  private handleErrorObservable(error: Response | any) {
    return throwError(error.message || error);
  }

  isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  isIOS(): boolean {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
  }
}
