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

import { Component, OnInit, ViewChild } from '@angular/core';
import { ResizedEvent } from 'angular-resize-event';
import { Subscription, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { HttpService } from 'src/app/service/http.service'
import * as moment from "moment";

@Component({
  selector: 'app-iot-view',
  templateUrl: './iot-view.component.html',
  styleUrls: ['./iot-view.component.scss']
})
export class IotViewComponent implements OnInit {
  @ViewChild('plotly', { static: true }) plotly: any;

  mainViewFxFlex: number = 60;
  subViewFxFlex: number = 40;
  clientWidth: number = 0;
  clientHeight: number = 0;
  listHeight: number = 0;
  listWidth: number = 0;
  linePlot: LinePlot = new LinePlot();
  isPortraitMode: boolean = false;
  isShowSubView: boolean = true;
  browserMinWidth = 1920 * 0.4;
  isMobile: boolean = false;

  typesOption: string[] = ["Peer", "DataType"];
  selectedTypesOption: string = null;

  dataTypeList: string[] = ["Temperature", "Humidity", "Microdust"];
  testPeerList = ["Creator", "Peer-001", "Peer-002", "Peer-003", "Peer-004", "Peer-005", "ABC-0001", "ABC-0002", "ABC-1001", "ABC-1002", "ABC-2000"];
  peerList: Peer[] = [];
  showTemperature: boolean = true;
  showHumidity: boolean = true;
  showMicrodust: boolean = true;

  selectorItems: string[] = [];
  selectedSelectorItems: string = null;
  isSelectedPeerTypesOption: boolean = false;
  isSelectedDataTypesOption: boolean = false;
  isSkipEvent: boolean = false;

  timer: any = null;
  pullingInterval: number = 1000 * 3;
  maxXaxisSize: number = 50;
  mergedTimeOffset: number = 10;

  colors: string[] = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf', '#1f77b4', '#ff7f0e'];
  subscriptionList: Subscription[] = [];
  onResizedSubject$ = new Subject<ResizedEvent>();
  onResized$ = this.onResizedSubject$.asObservable();

  constructor(private httpService: HttpService) {
    this.subscriptionList.push(this.onResized$.pipe(debounceTime(this.httpService.debounceTime)).subscribe((event) => {
      this.clientWidth = event.newWidth;
      this.clientHeight = event.newHeight;
      this.updateLayout();
    }));
  }

  ngOnInit() {
    this.isMobile = this.httpService.isMobile();
    console.log("IotViewComponent...");
    window['control'] = this;
  }

  ngAfterViewInit() {
    // this.updateLayout();
    this.linePlot.maxDataSize = this.maxXaxisSize;
  }

  ngOnDestroy() {
    this.subscriptionList.map(item => item.unsubscribe());
    this.clearTimer();
  }

  onResized(event: ResizedEvent) {
    this.onResizedSubject$.next(event);
  }

  startPullingTimer() {
    console.log("[Start Timer]");
    this.clearTimer();

    this.timer = setInterval(() => {
      this.requestLastData();
    }, this.pullingInterval);
  }

  clearTimer() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
      console.log("[Clear Timer]");
    }
  }

  getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }

  updateLayout() {
    if (this.isMobile) {
      this.isPortraitMode = this.clientWidth < this.clientHeight;
      this.isShowSubView = this.isPortraitMode;
      this.mainViewFxFlex = this.isPortraitMode ? 60 : 100;
      this.subViewFxFlex = 100 - this.mainViewFxFlex;
      this.listHeight = this.isPortraitMode ? Math.floor((this.clientHeight * 0.4) - 120) : 0;
      this.listWidth = 330;

      window.dispatchEvent(new Event('resize'));
    } else {
      this.isPortraitMode = this.clientWidth < this.browserMinWidth;
      this.mainViewFxFlex = 60;
      this.subViewFxFlex = 40;
      this.isShowSubView = true;
      this.listHeight = Math.floor((this.clientHeight * 0.4) - 120);
      this.listWidth = Math.floor((this.clientWidth * 0.6));
    }
    console.log(`IotViewComponent  ====  UpdateLayout: ${this.isMobile ? "[ Mobile ]" : "[ PC ]"}`);
  }

  toDateString(date: Date) {
    return moment(new Date(date)).format("YYYY-MM-DD HH:mm:ss");
  }

  drawChart(dataList: any[]) {
    this.isSkipEvent = true;

    let times = [];
    let title = "";
    let traces = [];
    let ticksuffi = "";

    if (dataList.length > this.maxXaxisSize) {
      console.log("[MaxXaxisSize is Over]", dataList.length - this.maxXaxisSize);
      dataList = dataList.slice(dataList.length - this.maxXaxisSize);
    }

    if (this.isSelectedPeerTypesOption) {
      for (let i = 0; i < dataList.length; i++) {
        times.push(dataList[i].datetime);
      }

      let traceNams = this.dataTypeList;
      title = "Peer ID: " + this.selectedSelectorItems;
      this.showTemperature = true;
      this.showHumidity = true;
      this.showMicrodust = true;
      this.peerList = [];

      let temperatureList = [];
      let humidityList = [];
      let microdustList = [];
      let datas = [temperatureList, humidityList, microdustList];

      for (let timeIndex = 0; timeIndex < times.length; timeIndex++) {
        let temperature = NaN;
        let humidity = NaN;
        let microdust = NaN;

        for (let dataIndex = 0; dataIndex < dataList[timeIndex].data.length; dataIndex++) {
          let keyword = dataList[timeIndex].data[dataIndex].keyword.toLowerCase();
          let value = dataList[timeIndex].data[dataIndex].value;

          if (value != null) {
            if (keyword == "temperature") {
              temperature = Number(value);
            } else if (keyword == "humidity") {
              humidity = Number(value);
            } else if (keyword == "microdust") {
              microdust = Number(value);
            }
          }
        }

        temperatureList.push(temperature);
        humidityList.push(humidity);
        microdustList.push(microdust);
      }

      for (let index = 0; index < traceNams.length; index++) {
        traces.push(this.linePlot.createTrace(times, datas[index], traceNams[index], this.colors[index]));
      }

    } else {
      if (this.selectedSelectorItems == this.dataTypeList[0]) {
        ticksuffi = " (°C)";
      } else if (this.selectedSelectorItems == this.dataTypeList[1]) {
        ticksuffi = " (%)";
      } else if (this.selectedSelectorItems == this.dataTypeList[2]) {
        ticksuffi = " (㎍/㎥)";
      }
      title = this.selectedSelectorItems + ticksuffi;

      for (let listIndex = 0; listIndex < dataList.length; listIndex++) {
        let peerData = dataList[listIndex];
        for (let peerDataIndex = 0; peerDataIndex < peerData.data.length; peerDataIndex++) {
          let peerDateTime = peerData.data[peerDataIndex].datetime;
          let definePeerDateTime = peerDateTime.slice(0, -1) + "0";
          if (times.indexOf(definePeerDateTime) < 0) {
            times.push(definePeerDateTime);
          }
        }
      }

      let timeList = times.sort((a, b) => {
        if (a < b) { return -1; }
        else if (a > b) { return 1; }
        return 0;
      });

      for (let listIndex = 0; listIndex < dataList.length; listIndex++) {
        let peerData = dataList[listIndex];
        let datas = [];

        for (let i = 0; i < timeList.length; i++) {
          datas.push(NaN);
        }

        for (let peerDataIndex = 0; peerDataIndex < peerData.data.length; peerDataIndex++) {
          let peerDateTime = peerData.data[peerDataIndex].datetime;
          let definePeerDateTime = peerDateTime.slice(0, -1) + "0";
          let timeListIndex = times.indexOf(definePeerDateTime);
          if (timeListIndex > -1) {
            let value = peerData.data[peerDataIndex].data;
            if (value != null) {
              datas[timeListIndex] = Number(value);
            }
          }
        }
        traces.push(this.linePlot.createTrace(timeList, datas, peerData.peer_id, this.colors[listIndex]));
      }
    }

    this.linePlot.setYaxisTicksuffix(ticksuffi);
    this.linePlot.setTitle(title);
    this.linePlot.setData(traces);

    this.isSkipEvent = false;

    if ((this.isSelectedPeerTypesOption && this.selectorItems.length > 0 && this.selectedSelectorItems != null) || (!this.isSelectedPeerTypesOption && this.peerList.length > 0)) {
      this.startPullingTimer();
    }
  }

  addData(data: any) {
    if (this.isSelectedPeerTypesOption) {
      if (data.datetime !== null && this.linePlot.getLastXData() == data.datetime) {
        return;
      }

      let temperature = NaN;
      let humidity = NaN;
      let microdust = NaN;

      for (let dataIndex = 0; dataIndex < data.data.length; dataIndex++) {
        let keyword = data.data[dataIndex].keyword.toLowerCase();
        let value = data.data[dataIndex].value;
        if (value != null) {
          if (keyword == "temperature") {
            temperature = Number(value);
          } else if (keyword == "humidity") {
            humidity = Number(value);
          } else if (keyword == "microdust") {
            microdust = Number(value);
          }
        }
      }
      this.linePlot.addData(data.datetime, [temperature, humidity, microdust]);
    } else {
      let times = [];
      let hasNewPeer = false;

      for (let peerIndex = 0; peerIndex < data.length; peerIndex++) {
        let peerData = data[peerIndex];
        let findPeer = this.peerList.find(peer => peer.id == data[peerIndex].peer_id);
        if (findPeer == undefined) {
          hasNewPeer = true;
          break;
        }

        for (let dataIndex = 0; dataIndex < peerData.data.length; dataIndex++) {
          let peerDateTime = peerData.data[dataIndex].datetime;
          let definePeerDateTime = peerDateTime.slice(0, -1) + "0";
          if (times.indexOf(definePeerDateTime) < 0) {
            times.push(definePeerDateTime);
          }
        }
      }

      if (hasNewPeer) {
        console.log('[Redraw Chart]');
        this.clearTimer();
        this.requestPeerList(true);
        return;
      }

      let timeList = times.sort((a, b) => {
        if (a < b) { return -1; }
        else if (a > b) { return 1; }
        return 0;
      });

      let time = timeList.pop();
      let isCanAddData = true;
      if (time !== null && this.linePlot.getLastXData() == time) {
        isCanAddData = false;
      }

      let datas = [];
      if (isCanAddData) {
        for (let i = 0; i < this.peerList.length; i++) {
          datas.push(NaN);
        }
      }

      for (let peerIndex = 0; peerIndex < data.length; peerIndex++) {
        let peerData = data[peerIndex];
        let findPeer = this.peerList.find(peer => peer.id == peerData.peer_id);

        for (let dataIndex = 0; dataIndex < peerData.data.length; dataIndex++) {
          let typePeerData = peerData.data[dataIndex];
          let peerDateTime = typePeerData.datetime;
          let definePeerDateTime = peerDateTime.slice(0, -1) + "0";
          let value = typePeerData.data
          if (value != null) {
            if (time == definePeerDateTime && isCanAddData) {
              datas[findPeer.index] = Number(value);
            } else {
              this.linePlot.updateData(peerData.peer_id, definePeerDateTime, Number(value));
            }
          }
        }
      }

      if (isCanAddData) {
        console.log("[AddData] " + time);
        this.linePlot.addData(time, datas);
      }
    }
    this.plotly.plotly.getPlotly().redraw(this.plotly.plotlyInstance);
  }

  onDataTypeShowValueChanged(index: number) {
    if (this.isSkipEvent) {
      return;
    }

    if (index == 0) {
      this.linePlot.setVisible(index, this.showTemperature);
    } else if (index == 1) {
      this.linePlot.setVisible(index, this.showHumidity);
    } else if (index == 2) {
      this.linePlot.setVisible(index, this.showMicrodust);
    }
  }

  onPeerShowValueChanged(index: number) {
    if (this.peerList.length > 0) {
      this.linePlot.setVisible(index, this.peerList[index].show);
    }
  }

  onTypesOptionChanged() {
    if (this.isSkipEvent) {
      return;
    }

    this.selectorItems = [];
    this.isSelectedPeerTypesOption = this.selectedTypesOption == this.typesOption[0];
    this.isSelectedDataTypesOption = !this.isSelectedPeerTypesOption;
    this.requestPeerList();
  }

  requestPeerList(isAutoReload: boolean = false) {
    this.httpService.postMobileIoT({ query: 'peerlist' }).subscribe(
      (data => {
        this.setOptionControls(data.peerlist, isAutoReload);
      }),
      (error => {
        console.error(error);
      }));
  }

  setOptionControls(peerlist: string[], isAutoReload: boolean) {
    if (this.isSelectedPeerTypesOption) {
      this.showTemperature = true;
      this.showHumidity = true;
      this.showMicrodust = true;
      this.selectorItems = peerlist;
    } else {
      this.peerList = [];
      for (let i = 0; i < peerlist.length; i++) {
        this.peerList.push(new Peer(peerlist[i], i));
      }
      this.selectorItems = this.dataTypeList;
    }

    if (isAutoReload) {
      this.onSelectorItemsChanged();
    } else if (this.selectorItems.length > 0) {
      this.selectedSelectorItems = this.selectorItems[0];
    }
  }

  onSelectorItemsChanged() {
    if (this.isSkipEvent) {
      return;
    }
    this.clearTimer();

    if (this.isSelectedDataTypesOption && this.peerList.length < 1) {
      return;
    }
    this.requestDataList();
  }

  requestDataList() {
    if (this.selectedSelectorItems == null) {
      return;
    }
    let keyword = this.selectedSelectorItems.toLowerCase();
    this.httpService.postMobileIoT({ query: this.isSelectedPeerTypesOption ? "peer_data_list" : "type_data_list", keyword: keyword }).subscribe(
      (data => {
        this.drawChart(data);
      }),
      (error => {
        console.error(error);
      }));
  }

  requestLastData() {
    if (this.selectedSelectorItems == null) {
      return;
    }
    let keyword = this.selectedSelectorItems.toLowerCase();
    this.httpService.postMobileIoT({ query: this.isSelectedPeerTypesOption ? "peer_last_data" : "type_last_data", keyword: keyword }).subscribe(
      (data => {
        if ((this.isSelectedPeerTypesOption && data.datetime !== undefined) || (this.isSelectedDataTypesOption && data.length > 0)) {
          this.addData(data);
        }
      }),
      (error => {
        console.error(error);
      }));
  }


  // drawChart(selectedItem: string) {
  //   this.isSkipEvent = true;

  //   let times = [];
  //   let title = "";
  //   let now = new Date();
  //   for (let i = 0; i < 30; i++) {
  //     now.setSeconds(now.getSeconds() - 10);
  //     times.unshift(this.toDateString(now));
  //   }

  //   let traceNams = [];
  //   let ticksuffi = "";
  //   if (this.isSelectedPeerTypesOption) {
  //     traceNams = this.dataTypeList;
  //     title = "Peer ID: " + selectedItem;
  //     this.showTemperature = true;
  //     this.showHumidity = true;
  //     this.showMicrodust = true;
  //     this.peerList = [];

  //   } else {
  //     traceNams = this.testPeerList;
  //     for (let i = 0; i < traceNams.length; i++) {
  //       this.peerList.push(new Peer(traceNams[i], i));
  //     }

  //     if (selectedItem == this.dataTypeList[0]) {
  //       ticksuffi = " (°C)";
  //     } else if (selectedItem == this.dataTypeList[1]) {
  //       ticksuffi = " (%)";
  //     } else if (selectedItem == this.dataTypeList[2]) {
  //       ticksuffi = " (㎍/㎥)";
  //     }
  //     title = selectedItem + ticksuffi;
  //   }

  //   let traces = [];
  //   for (let i = 0; i < traceNams.length; i++) {
  //     let datas = [];
  //     for (let t = 0; t < times.length; t++) {
  //       datas.push(this.getRandomInt(0, 100));
  //     }
  //     traces.push(this.linePlot.createTrace(times, datas, traceNams[i], this.colors[i]));
  //   }

  //   this.linePlot.setYaxisTicksuffix(ticksuffi);
  //   this.linePlot.setTitle(title);
  //   this.linePlot.setData(traces);

  //   this.isSkipEvent = false;
  //   this.startPullingTimer();
  // }

  // addData() {
  //   console.log("addData");
  //   let time = this.toDateString(new Date());
  //   if (this.isSelectedPeerTypesOption) {
  //     let datas = [];
  //     for (let i = 0; i < this.dataTypeList.length; i++) {
  //       datas.push(this.getRandomInt(0, 100));
  //     }
  //     this.linePlot.addData(time, datas);
  //   } else {
  //     let datas = [];
  //     for (let i = 0; i < this.testPeerList.length; i++) {
  //       datas.push(this.getRandomInt(0, 100));
  //     }
  //     this.linePlot.addData(time, datas);
  //   }
  //   this.plotly.plotly.getPlotly().redraw(this.plotly.plotlyInstance);
  // }

  // # addData()
  // for (let peerDataIndex = 0; peerDataIndex < data.length; peerDataIndex++) {
  //   let peerDateTime = data[peerDataIndex].datetime;
  //   let definePeerDateTime = peerDateTime.slice(0, -1) + "0";
  //   if (times.indexOf(definePeerDateTime) < 0) {
  //     times.push(definePeerDateTime);
  //   }
  // }

  // let timeList = times.sort((a, b) => {
  //   if (a < b) { return -1; }
  //   else if (a > b) { return 1; }
  //   return 0;
  // });

  // let time = timeList.pop();
  // if (time !== null && this.linePlot.getLastXData() == time) {
  //   console.log("Same Time.");
  //   return;
  // }

  // let datas = [];
  // for (let i = 0; i < this.peerList.length; i++) {
  //   datas.push(NaN);
  // }

  // for (let peerDataIndex = 0; peerDataIndex < data.length; peerDataIndex++) {
  //   let findPeer = this.peerList.find(peer => peer.id == data[peerDataIndex].peer_id);
  //   if (findPeer !== undefined) {
  //     datas[findPeer.index] = data[peerDataIndex].data;
  //   } else {
  //     redrawChart = true;
  //   }
  // }
  // this.linePlot.addData(time, datas);
}

export class Peer {
  id: string = "";
  show: boolean = true;
  index: number = 0;
  constructor(id: string, index: number) {
    this.id = id;
    this.index = index;
  }
}

export class LineTrace {
  x: string[];
  y: number[];
  name: string;
  mode: string = 'lines+markers';
  marker: any = {
    color: ''
  };
  visible: string = 'true';
}

export class LinePlot {
  maxDataSize: number = 100;
  data: LineTrace[] = [];
  layout: any = {
    title: {
      text: "",
      font: {
        color: 'rgba(255, 255, 255, 0.9)',
        size: 27
      }
    },
    autosize: true,
    showlegend: true,
    paper_bgcolor: 'rgba(255, 255, 255, 0.0)',
    plot_bgcolor: 'rgba(255, 255, 255, 0)',
    margin: {
      l: 80,
      r: 20,
      b: 70,
      t: 110,
      pad: 1
    },
    xaxis: {
      showticklabels: true,
      tickfont: {
        color: 'rgba(255, 255, 255, 0.9)'
      },
      showexponent: 'All',
      zeroline: false,
      showgrid: false
    },
    yaxis: {
      title: {
        text: "",
        font: {
          color: 'rgba(255, 255, 255, 0.9)',
          size: 18
        }
      },
      showticklabels: true,
      ticksuffix: '',
      showticksuffix: 'all',
      tickfont: {
        color: 'rgba(255, 255, 255, 0.9)'
      },
      showexponent: 'All',
      gridcolor: 'rgba(255, 255, 255, 0.9)',
      zerolinecolor: 'rgba(255, 255, 255, 0.9)',
      zeroline: false
    },
    legend: {
      bgcolor: 'rgba(255, 255, 255, 0)',
      font: {
        color: 'rgba(255, 255, 255, 0.9)',
        size: 12
      },
      x: 0,
      y: 1.2,
      orientation: 'h'
    }
  };
  config: any = { displayModeBar: false };

  setTitle(title: string) {
    this.layout.title.text = title;
  }

  setVisible(index: number, isShow: boolean,) {
    if (this.data.length - 1 >= index) {
      this.data[index].visible = isShow ? 'true' : 'legendonly';
    }
  }

  setYaxisTicksuffix(ticksuffix: string) {
    this.layout.yaxis.ticksuffix = " " + ticksuffix;
  }

  createTrace(xData: string[], data: number[], name: string, color: string = null): LineTrace {
    let lineTrace = new LineTrace();
    lineTrace.x = xData;
    lineTrace.y = data;
    lineTrace.name = name;

    if (color != null) {
      lineTrace.marker.color = color;
    }
    return lineTrace;
  }

  getLastXData() {
    return this.data.length > 0 && this.data[0].x.length > 0 ? this.data[0].x[this.data[0].x.length - 1] : null;
  }

  addData(xData: string, data: number[]) {
    if (this.data.length != data.length) {
      let correctData = data.filter(d => !isNaN(d));
      if (this.data.length != correctData.length) {
        return;
      }
    }

    for (let i = 0; i < this.data.length; i++) {
      if (this.data[i].x.indexOf(xData) < 0) {
        this.data[i].x.push(xData);
      }
      this.data[i].y.push(data[i]);
    }

    if (this.data[0].x.length > this.maxDataSize) {
      let removeXData = this.data[0].x.shift();
      console.log("[Remove XData]" + removeXData);

      for (let i = 0; i < this.data.length; i++) {
        this.data[i].y.shift();
      }
    }
  }

  updateData(traceName: string, xData: string, yData: number) {
    for (let i = 0; i < this.data.length; i++) {
      if (traceName == this.data[i].name) {
        let index = this.data[i].x.indexOf(xData);
        if (index > -1 && isNaN(this.data[i].y[index])) {
          this.data[i].y[index] = yData;
          console.log("[UpdateData] " + traceName + " / " + xData + " => " + yData);
        }
        break;
      }
    }
  }

  setData(data: LineTrace[]) {
    this.data = data;
  }

}