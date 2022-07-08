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

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import * as PlotlyJS from 'plotly.js/dist/plotly.js';
import { PlotlyModule } from 'angular-plotly.js';

import { AngularResizedEventModule } from 'angular-resize-event';
import { FlexLayoutModule } from '@angular/flex-layout';
import { DxListModule } from 'devextreme-angular/ui/list';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxColorBoxModule } from 'devextreme-angular/ui/color-box';
import { DxSwitchModule } from 'devextreme-angular/ui/switch';
import { DxTextAreaModule } from 'devextreme-angular/ui/text-area';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxAccordionModule } from 'devextreme-angular/ui/accordion';
import { DxRadioGroupModule } from 'devextreme-angular/ui/radio-group';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';

import { ServerRoutingModule } from './server/server-routing.module';
import { ClientRoutingModule } from './client/client-routing.module';

import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { ServerMainViewComponent } from './server/component/server-main-view/server-main-view.component';
import { ClientMainViewComponent } from './client/component/client-main-view/client-main-view.component';
import { NetworkViewComponent } from './mobile-client/component/network-view/network-view.component';
import { IotViewComponent } from './mobile-client/component/iot-view/iot-view.component';
import { MediaViewComponent } from './mobile-client/component/media-view/media-view.component';

const DevextremeModules = [DxListModule, DxButtonModule, DxColorBoxModule, DxSwitchModule, DxTextAreaModule, DxTextBoxModule, DxAccordionModule, DxRadioGroupModule, DxSelectBoxModule];
// TODO Server, Client 빌드 선택
// const RoutingModule = ServerRoutingModule; // Server
const RoutingModule = ClientRoutingModule; // Client

PlotlyModule.plotlyjs = PlotlyJS; // plotly.js/dist/plotly.js 수정 var d3_document = this.document; 문제 => }(); to }.apply(self);

@NgModule({
  declarations: [
    AppComponent,
    ServerMainViewComponent,
    HeaderComponent,
    FooterComponent,
    ClientMainViewComponent,
    NetworkViewComponent,
    IotViewComponent,
    MediaViewComponent
  ],
  imports: [
    BrowserModule,
    RoutingModule,
    DevextremeModules,
    FlexLayoutModule,
    HttpClientModule,
    AngularResizedEventModule,
    PlotlyModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
