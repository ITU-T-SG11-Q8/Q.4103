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

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ClientMainViewComponent } from './component/client-main-view/client-main-view.component';
import { NetworkViewComponent } from '../mobile-client/component/network-view/network-view.component';
import { IotViewComponent } from '../mobile-client/component/iot-view/iot-view.component';
import { MediaViewComponent } from '../mobile-client/component/media-view/media-view.component';

const routes: Routes = [
  { path: '', component: ClientMainViewComponent },
  { path: 'iot', component: IotViewComponent },
  { path: 'network', component: NetworkViewComponent },
  { path: 'media', component: MediaViewComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class ClientRoutingModule { }
