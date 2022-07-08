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

import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ResizedEvent } from 'angular-resize-event';
import { Subscription, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { HttpService } from '../../../service/http.service';
import { alert } from 'devextreme/ui/dialog';

@Component({
  selector: 'app-media-view',
  templateUrl: './media-view.component.html',
  styleUrls: ['./media-view.component.scss']
})
export class MediaViewComponent implements OnInit {
  @ViewChild('chatTextArea', { static: true }) chatTextArea: ElementRef;
  private webSocket: WebSocket = null;
  isPortraitMode: boolean = false;
  subscriptionList: Subscription[] = [];
  clientWidth: number = 0;
  clientHeight: number = 0;
  fxLayouts = ["column", "row"];
  currentFxLayout: string = "row";
  portraitModeWidth = 800;
  onResizedSubject$ = new Subject<ResizedEvent>();
  onResized$ = this.onResizedSubject$.asObservable();
  peerId: string = "";
  overlayId: string = "";
  hasConnection: boolean = false;
  sendData: string = "";
  receivedDatas: string = "";
  textAreaHeight: string = "calc(100% - 100px)";
  isOwner: boolean = false;
  subFxFlex: number = 45;
  isConnected: boolean = false;
  chatDataList: any[] = [];
  peerConnection: RTCPeerConnection;
  isPrintLog: boolean = true;
  isPrintError: boolean = true;
  videoPlayerHeight: string = "100%";
  isMobile: boolean = false;
  browserMinWidth = 1920 * 0.4;

  constructor(private httpService: HttpService) {
    this.subscriptionList.push(this.onResized$.pipe(debounceTime(this.httpService.debounceTime)).subscribe((event) => {
      this.clientWidth = event.newWidth;
      this.clientHeight = event.newHeight;
      this.updateLayout();
    }));
  }

  ngOnInit() {
    this.isMobile = this.httpService.isMobile();
    console.log("MediaViewComponent...");
    window['control'] = this;
    // alert(this.httpService.isIOS() ? "true" : "false", "확인");
  }

  ngAfterViewInit() {
    //this.updateLayout();
    this.getInitData();
  }

  ngOnDestroy() {
    this.subscriptionList.map(item => item.unsubscribe());
    this.closeWebSocket();
  }

  onResized(event: ResizedEvent) {
    this.onResizedSubject$.next(event);
  }

  getInitData() {
    this.httpService.postInitData().subscribe(
      (data => {
        this.peerId = data.PEER_ID;
        this.overlayId = data.OVERLAY_ID;
        this.isOwner = data.IS_OWNER;
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
      let host = window.location.host;
      let url = 'wss://' + host + '/ws';
      let webSocket = new WebSocket(url);

      webSocket.onopen = (event => {
        console.log(`Open WebSocket: ${url}`);
      });

      webSocket.onclose = (event => {
        console.log(`Close WebSocket: ${url}`);
      });

      webSocket.onerror = (event => {
        console.log(`ws error ${event}`);
      });

      webSocket.onmessage = (event => {
        let jsonData = JSON.parse(event.data);
        // console.log(jsonData);
        if (jsonData.type == "sdp") {
          console.log("Set Remote");
          this.peerConnection.setRemoteDescription(jsonData.sdp);
        } else if (jsonData.type == "ice") {
          console.log("add ice");
          this.peerConnection.addIceCandidate(jsonData.ice);
        } else if (jsonData.type == "error") {
          this.clearPeerConnection();
          alert(jsonData.message, "Information");
        } else if (jsonData.type == "chat") {
          this.onReceivedChatData(jsonData);
        } else if (jsonData.type == "connection_change") {
          this.hasConnection = jsonData.hasConnection;
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

  onSendDataClick() {
    this.onSendData();
  }

  onSendDataEnterKey() {
    this.onSendData();
  }

  onReceivedChatData(data: any) {
    let chat = {
      isReceived: this.peerId != data.source,
      source: data.source,
      message: data.message,
      time: this.getCurrentDateTime()
    }
    this.chatDataList.unshift(chat);
    this.moveToScrollBottom();
  }

  onSendData() {
    if (this.hasConnection && this.sendData.length > 0) {
      console.log(`onSendData=> ${this.sendData}`);
      this.sendWebSocket({ type: "chat", source: this.peerId, message: this.sendData });
      this.sendData = "";
    }
  }

  getCurrentDateTime(): string {
    let now = new Date();
    let hour = now.getHours() < 10 ? "0" + now.getHours() : now.getHours();
    let minutes = now.getMinutes() < 10 ? "0" + now.getMinutes() : now.getMinutes();
    let seconds = now.getSeconds() < 10 ? "0" + now.getSeconds() : now.getSeconds();

    return hour + ":" + minutes + ":" + seconds;
  }

  printLog(msg: any) {
    if (this.isPrintLog) {
      console.log(msg);
    }
  }

  printError(msg: any) {
    if (this.isPrintError) {
      console.error(msg);
    }
  }

  createPeerConnection(): RTCPeerConnection {
    let pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun.l.google.com:19302'
        }
      ]
    });

    pc.oniceconnectionstatechange = (e: Event) => {
      this.printLog(pc.iceConnectionState);
    }
    pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate === null) {
        this.printLog(pc.localDescription);
        this.sendWebSocket({ type: "sdp", sdp: pc.localDescription });
      } else {
        this.printLog(event);
        this.sendWebSocket({ type: "ice", ice: event.candidate });
      }
    }
    return pc;
  }

  clearPeerConnection() {
    this.isConnected = false;
    this.peerConnection = null;
  }

  onBroadcastClick() {
    if (this.isConnected) {
      return;
    }

    if (this.isOwner) {
      this.onStartBroadcastClick();
    } else {
      this.onJoinBroadcastClick();
    }
  }

  onStartBroadcastClick() {
    this.isConnected = true;
    this.peerConnection = this.createPeerConnection();
    this.printLog("onStartBroadcastClick  == createPeerConnection");

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream: MediaStream) => {

        stream.getTracks().forEach((track: MediaStreamTrack) => this.peerConnection.addTrack(track, stream));
        // const $video = document.querySelector('video');
        // $video.setAttribute("playsinline", true);
        // $video.setAttribute('controls', true);
        // $video.setAttribute('playsinline', true);
        this.printLog("Get stream...");
        let videoPlayer = document.getElementById('videoPlayer');
        videoPlayer["muted"] = true;
        videoPlayer["playsinline"] = true;
        videoPlayer["controls"] = true;
        videoPlayer["srcObject"] = stream;

        this.peerConnection.createOffer()
          .then((description: RTCSessionDescriptionInit) => {
            this.peerConnection.setLocalDescription(description);
            this.printLog(description);
          })
          .catch((error) => this.printError(error));
      }).catch((error) => this.printError(error));
  }

  onJoinBroadcastClick() {
    this.isConnected = true;
    this.peerConnection = this.createPeerConnection();
    this.printLog("onJoinBroadcastClick  == createPeerConnection");

    this.peerConnection.addTransceiver('video');
    this.peerConnection.addTransceiver('audio');

    this.peerConnection.createOffer()
      .then((description: RTCSessionDescriptionInit) => {
        this.peerConnection.setLocalDescription(description);
        this.printLog(description);
      })
      .catch((error) => this.printError(error));

    this.peerConnection.ontrack = (event: RTCTrackEvent) => {
      this.printLog("Set stream...");

      let videoPlayer = document.getElementById('videoPlayer');
      videoPlayer["muted"] = false;
      videoPlayer["playsinline"] = true;
      videoPlayer["controls"] = true;
      videoPlayer["srcObject"] = event.streams[0];
    }
  }

  updateLayout() {
    if (this.isMobile) {
      this.isPortraitMode = this.clientWidth < this.clientHeight;
    } else {
      this.isPortraitMode = this.clientWidth < this.browserMinWidth;
    }
    this.currentFxLayout = this.isPortraitMode ? this.fxLayouts[0] : this.fxLayouts[1];
    this.subFxFlex = this.isPortraitMode ? 55 : 45;

    setTimeout(() => {
      let clientHeight = document.documentElement.clientHeight;
      this.textAreaHeight = this.isPortraitMode ? (Math.round(clientHeight * 0.55) - 155) + "px" : (clientHeight - 170) + "px";
      this.videoPlayerHeight = this.isPortraitMode ? (Math.round(clientHeight * 0.45) - 35) + "px" : (clientHeight - 75) + "px";
    }, 500);

    console.log(`MediaViewComponent  ====  UpdateLayout: ${this.isMobile ? "[ Mobile ]" : "[ PC ]"}`);
  }

  moveToScrollBottom() {
    if (this.httpService.isIOS()) {
      this.chatTextArea.nativeElement.scrollTop = this.chatTextArea.nativeElement.scrollTop == 0 ? -1 : 0;
    } else {
      this.chatTextArea.nativeElement.scrollTop = this.chatTextArea.nativeElement.scrollHeight;
    }
  }

}
