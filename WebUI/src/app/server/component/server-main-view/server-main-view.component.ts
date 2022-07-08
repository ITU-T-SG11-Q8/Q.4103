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
import { Overlay } from '../../../model/overlay';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { HttpService } from '../../../service/http.service'
import { confirm } from 'devextreme/ui/dialog';
import { ForceDirected } from './../../../model/force.directed.d3';

@Component({
  selector: 'app-server-main-view',
  templateUrl: './server-main-view.component.html',
  styleUrls: ['./server-main-view.component.scss']
})
export class ServerMainViewComponent implements OnInit {
  private webSocket: WebSocket = null;
  overlayList: Overlay[] = [];
  subscriptionList: Subscription[] = [];
  eventHandled: boolean = false;
  forceDirected: ForceDirected = null;
  selectOverlay: Overlay = null;
  isInitForceDirected: boolean = false;
  isShowD3Eidtor: boolean = false;
  showPeerId: boolean = false;
  autoNodeColor: boolean = true;
  nodeColor: string = "rgb(49,163,84)";
  primaryLinkColor: string = "rgb(31,119,180)";
  candidateLinkColor: string = "rgb(255,127,14)";
  linkDistance: number = 200;
  log_message: string = "";
  headerTitle: string = "HP2P Server";
  isClient: boolean = false;

  constructor(private httpService: HttpService) {
  }

  ngOnInit() {
    console.log("ServerMainViewComponent...");
    window['control'] = this;
  }

  ngAfterViewInit() {
    this.getAndSetOverlayList();
    this.getInitData();

    this.forceDirected = new ForceDirected("forceDirected");
    this.subscriptionList.push(this.forceDirected.recovery$.pipe(debounceTime(1000)).subscribe(() => {
      this.sendWebSocket({ "server": true, "action": "get", "overlay-id": this.selectOverlay["overlay-id"] });
    }));
  }

  ngOnDestroy() {
    this.subscriptionList.map(item => item.unsubscribe());
    this.closeWebSocket();
  }

  getInitData() {
    this.httpService.getInitData().subscribe(
      ((data: any) => {
        this.openWebSocket(data.WEB_SOCKET_PORT);
      }),
      ((error: any) => {
        console.error(error);
      }));
  }

  openWebSocket(port: number) {
    if (this.webSocket === null) {
      let host = location.hostname === "localhost" ? "127.0.0.1" : location.hostname;
      let url = "ws://" + host + ":" + port;
      let webSocket = new WebSocket(url);

      webSocket.onopen = ((event: any) => {
        console.log("Open WebSocket: " + url);
        webSocket.send(JSON.stringify({ "server": true, "action": "hello" }));
      });

      webSocket.onclose = ((event: any) => {
        console.log("Close WebSocket: " + url);
      });

      webSocket.onerror = ((event: any) => {
        console.error(event);
      });

      webSocket.onmessage = (event => {
        // console.log(event.data);
        let jsonData = JSON.parse(event.data);

        if (jsonData.type == "overlay") {
          if (jsonData.action == "create") {
            this.getAndSetOverlayList();
          } else if (jsonData.action == "remove") {
            this.getAndSetOverlayList();
            if (this.selectOverlay !== null && jsonData.overlay_id === this.selectOverlay["overlay-id"]) {
              if (this.isInitForceDirected) {
                this.forceDirected.clearData();
              }
            }
          }
        } else if (jsonData.type == "peer") {
          if (this.selectOverlay !== null && jsonData.overlay_id === this.selectOverlay["overlay-id"]) {
            if (this.isInitForceDirected) {
              if (jsonData.action == "current_cost_map") {
                let nodeColor = this.autoNodeColor ? null : this.nodeColor;
                this.forceDirected.loadData(jsonData.data, nodeColor, this.primaryLinkColor, this.candidateLinkColor, this.showPeerId, this.linkDistance);
              }
              else {
                if (jsonData.action == "add_peer") {
                  this.forceDirected.addNode(jsonData.node, this.showPeerId);
                } else if (jsonData.action == "delete_peer") {
                  this.forceDirected.removeItem(jsonData.peer_id);
                } else if (jsonData.action == "update_connection") {
                  this.forceDirected.updateLink(jsonData.peer_id, jsonData.links);
                }
                // this.checkedD3DataSubject$.next(); 
              }
            } else if (jsonData.action == "current_cost_map") {
              this.isInitForceDirected = true;
              let nodeColor = this.autoNodeColor ? null : this.nodeColor;
              this.forceDirected.loadData(jsonData.data, nodeColor, this.primaryLinkColor, this.candidateLinkColor, this.showPeerId, this.linkDistance);
            }
          }
        } else if (jsonData.type == "log") {
          this.onReceivedMessage(jsonData)
        }
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

  getAndSetOverlayList() {
    this.httpService.getOverlayList().subscribe(
      ((data: any) => {
        let overlayList = [];
        for (let i = 0; i < data.length; i++) {
          overlayList.push(data[i].overlay);
        }
        this.overlayList = overlayList;
      }),
      ((error: any) => {
        console.error(error);
      }));
  }

  onRemoveOverlayClick(overlay: Overlay) {
    this.eventHandled = true;
    setTimeout(() => { this.eventHandled = false }, 500);

    let result = confirm("선택한 채널을 삭제 하시겠습니까?", "Information");
    result.then((dialogResult: any) => {
      if (dialogResult) {
        this.httpService.deleteOverlay(overlay["overlay-id"]).subscribe(
          ((data: any) => {
            console.log(data);
          }),
          ((error: any) => {
            console.error(error);
          }));
      }
    });
  }

  onOverlayItemClick(event: any) {
    if (this.eventHandled)
      return;

    this.getOverlayCostmapAndDrawD3(event.itemData);
  }

  onReloadOverlayClick() {
    this.getAndSetOverlayList();
  }

  getCurrentDateTime(): string {
    let now = new Date()
    return now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate() + " " + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
  }

  onReceivedMessage(log: any) {
    let message = "[Received Time]: " + this.getCurrentDateTime() + "\r\n";
    message += "Overlay ID: " + log.overlay_id + "\r\n";
    message += "Peer ID: " + log.peer_id + "\r\n";
    message += "Message: " + log.message.replace(/\//gi, "") + "\r\n\r\n";

    this.log_message = message + this.log_message;
  }

  getOverlayCostmapAndDrawD3(overlay: Overlay) {
    this.selectOverlay = overlay;
    this.isInitForceDirected = false;
    this.sendWebSocket({ "server": true, "action": "get", "overlay_id": this.selectOverlay["overlay-id"] });
  }

  onD3EditorClick() {
    this.isShowD3Eidtor = !this.isShowD3Eidtor;
  }

  onSetD3ColorClick() {
    if (this.isInitForceDirected) {
      this.sendWebSocket({ "server": true, "action": "get", "overlay_id": this.selectOverlay["overlay-id"] });
    }
  }

  onResetD3EditorClick() {
    this.showPeerId = false;
    this.autoNodeColor = true;
    this.nodeColor = "rgb(49,163,84)";
    this.primaryLinkColor = "rgb(31,119,180)";
    this.candidateLinkColor = "rgb(255,127,14)";
    this.linkDistance = 200;

    // if (this.isInitForceDirected) {
    //   this.sendWebSocket({ "server": true, "action": "get", "overlay_id": this.selectOverlay.overlay_id });
    // }
  }

  // checkedD3Data() {
  //   if (this.isInitForceDirected && this.selectOverlay.overlay_id !== null) {
  //     // this.forceDirected.checkedNodesAndLinks();
  //   }
  // }

}