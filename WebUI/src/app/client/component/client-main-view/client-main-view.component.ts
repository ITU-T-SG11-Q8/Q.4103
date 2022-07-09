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

import { Component, OnInit } from '@angular/core';
import { Subscription, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { HttpService } from '../../../service/http.service'
import { alert, confirm } from 'devextreme/ui/dialog';
import { ResizedEvent } from 'angular-resize-event';
import { ForceDirected } from './../../../model/force.directed.d3';

@Component({
  selector: 'app-client-main-view',
  templateUrl: './client-main-view.component.html',
  styleUrls: ['./client-main-view.component.scss']
})
export class ClientMainViewComponent implements OnInit {
  private webSocket: WebSocket = null;
  subscriptionList: Subscription[] = [];
  forceDirected: ForceDirected = null;
  isShowD3Eidtor: boolean = false;
  showPeerId: boolean = false;
  autoNodeColor: boolean = true;
  nodeColor: string = "rgb(49,163,84)";
  primaryLinkColor: string = "rgb(31,119,180)";
  candidateLinkColor: string = "rgb(255,127,14)";
  linkDistance: number = 200;
  peerId: string = "";
  overlayId: string = "";
  sendData: string = "";
  receivedDatas: string = "";
  logMessage: string = "";
  scanTreeData: any = null;
  // overlayCostmapData: any = null;
  isOwner: boolean = false;
  hasConnection: boolean = false;
  hasUdpConnection: boolean = false;
  ticketId: number = -1;
  isPortraitMode: boolean = false;
  onResizedSubject$ = new Subject<ResizedEvent>();
  onResized$ = this.onResizedSubject$.asObservable();
  clientWidth: number = 0;
  clientHeight: number = 0;
  fxLayouts = ["column", "row"]
  currentFxLayout: string = "row";
  browserMinWidth = 1920 * 0.4;
  isMobile: boolean = false;
  // d3DivHeight: string = "100%";

  constructor(private httpService: HttpService) {
    this.subscriptionList.push(this.onResized$.pipe(debounceTime(this.httpService.debounceTime)).subscribe((event) => {
      this.clientWidth = event.newWidth;
      this.clientHeight = event.newHeight;
      this.updateLayout();
    }));
  }

  ngOnInit() {
    this.isMobile = this.httpService.isMobile();
    console.log("ClientMainViewComponent...");
    window['control'] = this;
  }

  ngAfterViewInit() {
    //this.updateLayout();
    this.getInitData();
    this.forceDirected = new ForceDirected("forceDirected");
  }

  ngOnDestroy() {
    this.subscriptionList.map(item => item.unsubscribe());
    this.closeWebSocket();
  }

  onResized(event: ResizedEvent) {
    this.onResizedSubject$.next(event);
  }

  updateLayout() {
    if (this.isMobile) {
      this.isPortraitMode = window.innerWidth < window.innerHeight;
      // this.d3DivHeight = (window.innerHeight - 150) + "px";
    } else {
      this.isPortraitMode = this.clientWidth < this.browserMinWidth;
    }
    this.currentFxLayout = this.isPortraitMode ? this.fxLayouts[0] : this.fxLayouts[1];
    console.log(`ClientMainViewComponent  ====  UpdateLayout: ${this.isMobile ? "[ Mobile ]" : "[ PC ]"}`);
  }

  getInitData() {
    this.httpService.postInitData().subscribe(
      (data => {
        this.peerId = data.PEER_ID;
        this.overlayId = data.OVERLAY_ID;
        this.isOwner = data.IS_OWNER
        this.hasUdpConnection = data.HAS_UDP_CONNECTION;
        this.ticketId = data.TICKET_ID;
        this.hasConnection = data.HAS_CONNECTION;
        this.openWebSocket(data.WEB_SOCKET_PORT);
      }),
      (error => {
        console.error(error);
      }));
  }

  openWebSocket(port: number) {
    if (this.webSocket === null) {
      // let host = location.hostname === "localhost" ? "127.0.0.1" : location.hostname;
      // let url = "wss://" + host + ":" + port + "/ws";
      var host = window.location.host;
      var url = 'wss://' + host + '/ws';
      let webSocket = new WebSocket(url);

      webSocket.onopen = (event => {
        console.log("Open WebSocket: " + url);
      });

      webSocket.onclose = (event => {
        console.log("Close WebSocket: " + url);
      });

      webSocket.onerror = (event => {
        console.error(event);
      });

      webSocket.onmessage = (event => {
        let jsonData = JSON.parse(event.data);
        // console.log(event.data);
        if (jsonData.type == "log") {
          this.onReceivedLogMessage(jsonData);
        } else if (jsonData.type == "creation") {
          this.overlayId = jsonData.overlayId;
        } else if (jsonData.type == "received_data") {
          this.onReceivedData(jsonData);
        } else if (jsonData.type == "connection_change") {
          this.hasConnection = jsonData.hasConnection;
        } else if (jsonData.type == "scan_tree") {
          if (jsonData.data != null) {
            let reversedData = jsonData.data.reverse();
            this.updateForceDirected(reversedData);
          }
        } else if (jsonData.type == "iot") {
          this.onReceivedPublicData(jsonData.data);
        } else if (jsonData.type == "chat") {
          this.onReceivedChatData(jsonData.data);
        }
        // else if (jsonData.type == "overlay_costmap") {
        //   if (jsonData.data == null) {
        //     alert("요청 실패 하였습니다.", "Information");
        //     return
        //   }
        //   this.setOverlayCostmapData(jsonData.data.data);
        //   this.drawForceDirected();
        // } 
      });

      this.webSocket = webSocket;
    }
  }

  closeWebSocket() {
    if (this.webSocket !== null) {
      this.webSocket.close();
      this.webSocket = null;
    }
  }

  sendWebSocket(data: any) {
    if (this.webSocket !== null) {
      if (this.webSocket.OPEN) {
        this.webSocket.send(JSON.stringify(data));
      } else if (this.webSocket.CONNECTING) {
        setTimeout(() => {
          this.sendWebSocket(data);
        }, 500);
      }
    }
  }

  drawForceDirected() {
    if (this.scanTreeData !== null) {
      let nodeColor = this.autoNodeColor ? null : this.nodeColor;
      this.forceDirected.loadData(JSON.parse(JSON.stringify(this.scanTreeData)), nodeColor, this.primaryLinkColor, this.candidateLinkColor, this.showPeerId, this.linkDistance);
    }
  }

  updateForceDirected(data: any) {
    let appendNodes = [];
    let appendLinks = [];

    for (let index = 0; index < data.length; index++) {
      let item = data[index];
      let newNode = { "id": item[0], "ticket_id": item[1] };
      let findNode = this.scanTreeData.nodes.find((node: any) => { return node.id === newNode.id || node.ticket_id === newNode.ticket_id });

      if (findNode === undefined) {
        this.scanTreeData.nodes.push(newNode);
        appendNodes.push(newNode);
      }

      let item1 = index < data.length - 1 ? data[index + 1] : [this.peerId, this.ticketId];
      let newLink = { "source": item[0], "target": item1[0], "primary": true };

      let findLink = this.scanTreeData.links.find((link: any) => {
        return (link.source === newLink.source && link.target === newLink.target) || (link.source === newLink.target && link.target === newLink.source)
      });

      if (findLink === undefined) {
        this.scanTreeData.links.push(newLink);
        appendLinks.push(newLink);
      }
    }

    if (appendNodes.length > 0 || appendLinks.length > 0) {
      this.forceDirected.addItem(appendNodes, appendLinks)
    }
  }

  // drawForceDirected() {
  //   let forceDirectedData = null;

  //   if (this.scanTreeData !== null) {
  //     forceDirectedData = this.scanTreeData;
  //   } else if (this.overlayCostmapData !== null) {
  //     forceDirectedData = JSON.parse(JSON.stringify(this.overlayCostmapData));
  //   }

  //   if (forceDirectedData !== null) {
  //     let nodeColor = this.autoNodeColor ? null : this.nodeColor;
  //     this.forceDirected.loadData(forceDirectedData, nodeColor, this.primaryLinkColor, this.candidateLinkColor, this.showPeerId, this.linkDistance);
  //   }
  // }

  onD3EditorClick() {
    this.isShowD3Eidtor = !this.isShowD3Eidtor;
  }

  onSetD3ColorClick() {
    this.drawForceDirected();
  }

  onResetD3EditorClick() {
    this.showPeerId = false;
    this.autoNodeColor = true;
    this.nodeColor = "rgb(49,163,84)";
    this.primaryLinkColor = "rgb(31,119,180)";
    this.candidateLinkColor = "rgb(255,127,14)";
    this.linkDistance = 200;
  }

  onSendData() {
    if (this.hasConnection || this.hasUdpConnection) {
      this.sendWebSocket({ "type": "send_data", "data": this.sendData });
      this.sendData = "";
    }
  }

  onSendDataClick() {
    this.onSendData();
  }

  onSendDataEnterKey() {
    this.onSendData();
  }

  getCurrentDateTime(): string {
    let now = new Date()
    let month = (now.getMonth() + 1) < 10 ? "0" + (now.getMonth() + 1) : (now.getMonth() + 1)
    let date = now.getDate() < 10 ? "0" + now.getDate() : now.getDate();
    let hour = now.getHours() < 10 ? "0" + now.getHours() : now.getHours();
    let minutes = now.getMinutes() < 10 ? "0" + now.getMinutes() : now.getMinutes();
    let seconds = now.getSeconds() < 10 ? "0" + now.getSeconds() : now.getSeconds();

    return now.getFullYear() + "-" + month + "-" + date + " " + hour + ":" + minutes + ":" + seconds;
  }

  onReceivedLogMessage(log: any) {
    let message = "[Receive Time]: " + this.getCurrentDateTime() + "\r\n";
    message += "Message: " + log.message.replace(/\//gi, "") + "\r\n\r\n";
    this.logMessage = message + this.logMessage;
  }

  onReceivedData(data: any) {
    let message = "";
    if (this.peerId == data.source) {
      message = "[Send Time]: " + this.getCurrentDateTime() + "\r\n";
    } else {
      message = "[Receive Time]: " + this.getCurrentDateTime() + "\r\n";
      message += "Sender: " + data.sender + " / Source: " + data.source + "\r\n";
    }
    message += "Message: " + data.message.replace(/\//gi, "") + "\r\n\r\n";
    this.receivedDatas = message + this.receivedDatas;
  }

  onReceivedPublicData(data: any) {
    // let logMessage = "[Received Time]: " + this.getCurrentDateTime() + "\r\n";
    // logMessage += "Message: Received Public Data.\r\n\r\n";
    // this.logMessage = logMessage + this.logMessage;
    let message = "[Receive Time]: " + this.getCurrentDateTime() + "\r\n";
    // message += "====[PublicData] #DataTime: " + JSON.parse(data).dataTime + "\r\n";
    message += "==== [PublicData] " + "\r\n";
    message += data.replace(/\//gi, "") + "\r\n";
    message += "=====================================" + "\r\n\r\n";
    this.receivedDatas = message + this.receivedDatas;

    // if (this.hasConnection || this.hasUdpConnection) {
    //   this.sendWebSocket({ "type": "send_data", "data": data });
    // }
  }


  onReceivedChatData(data: any) {
    let message = "";
    if (this.peerId == data.source) {
      message = "@ [Chat] Send Time: " + this.getCurrentDateTime() + "\r\n";
      message += data.data.replace(/\//gi, "") + "\r\n";
    } else {
      message = "@ [Chat] Receive Time: " + this.getCurrentDateTime() + "\r\n";
      message += data.source + ": " + data.data.replace(/\//gi, "") + "\r\n";
    }

    this.receivedDatas = message + this.receivedDatas;
  }

  onScanTreeClick() {
    if (this.hasConnection) {
      if (this.scanTreeData !== null) {
        let result = confirm("현재 수집된 ScanTree 정보가 삭제됩니다. 그래도 하시겠습니까?", "Information");
        result.then(dialogResult => {
          if (dialogResult) {
            this.onStartScanTree();
          }
        });
      } else {
        this.onStartScanTree();
      }
    }
  }

  onStartScanTree() {
    this.scanTreeData = {
      "graph": [],
      "nodes": [{ "id": this.peerId, "ticket_id": this.ticketId, "seeder": true }],
      "links": [],
      "directed": false,
      "multigraph": true
    };
    this.drawForceDirected();
    this.sendWebSocket({ "type": "scan_tree" });
  }

  onRefreshClick() {
    this.drawForceDirected();
  }
  //onScanTreeClick() {
  // if (this.hasConnection) {
  //   if (this.overlayCostmapData !== null) {
  //     let result = confirm("Overlay CostMap 정보가 삭제됩니다. 그래도 하시겠습니까?", "Information");
  //     result.then(dialogResult => {
  //       if (dialogResult) {
  //         this.overlayCostmapData = null;

  //         if (this.scanTreeData !== null) {
  //           let result = confirm("현재 수집된 ScanTree 정보가 삭제됩니다. 그래도 하시겠습니까?", "Information");
  //           result.then(dialogResult => {
  //             if (dialogResult) {
  //               this.scanTreeData = null;
  //               this.sendWebSocket({ "type": "scan_tree" });
  //             }
  //           });
  //         } else {
  //           this.sendWebSocket({ "type": "scan_tree" });
  //         }
  //       }
  //     });
  //   } else {
  //     this.sendWebSocket({ "type": "scan_tree" });
  //   }
  // }

  // onGetOverlayCostMapClick() {
  //   if (this.scanTreeData !== null) {
  //     let result = confirm("ScanTree 정보가 삭제됩니다. 그래도 하시겠습니까?", "Information");
  //     result.then(dialogResult => {
  //       if (dialogResult) {
  //         this.scanTreeData = null;
  //         this.sendWebSocket({ "type": "overlay_costmap" });
  //       }
  //     });
  //   } else {
  //     this.sendWebSocket({ "type": "overlay_costmap" });
  //   }
  // }

  // setOverlayCostmapData(data: any) {
  //   for (let idx = 0; idx < data.nodes.length; idx++) {
  //     let node = data.nodes[idx];
  //     if (node.id !== this.peerId && node.seeder === true) {
  //       node.seeder = false;
  //     } else if (node.id === this.peerId) {
  //       node.seeder = true;
  //     }
  //   }
  //   this.overlayCostmapData = data;
  // }
}
