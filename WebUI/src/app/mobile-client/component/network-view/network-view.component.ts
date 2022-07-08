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
import { ResizedEvent } from 'angular-resize-event';
import { ForceD3 } from 'src/app/mobile-client/component/force.d3';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { HttpService } from 'src/app/service/http.service'

@Component({
  selector: 'app-network-view',
  templateUrl: './network-view.component.html',
  styleUrls: ['./network-view.component.scss']
})
export class NetworkViewComponent implements OnInit {
  fxLayouts = ["column", "row"]
  currentFxLayout: string = "row";
  documentId: string = "container";
  forceD3: ForceD3 = null;
  currentData: any = null;
  clientWidth: number = 0;
  clientHeight: number = 0;
  subscriptionList: Subscription[] = [];
  onResizedSubject$ = new Subject<ResizedEvent>();
  onResized$ = this.onResizedSubject$.asObservable();
  currentPeerList: PeerList[] = [];
  peerListKeys: string[] = ["Primary", "InComing", "OutGoing"];
  peerListTitle: string[] = ["P", "IC", "OG"];
  listHeight: number = 0;
  isPortraitMode: boolean = false;
  onResizedRefreshSubject$ = new Subject<void>();
  onResizedRefresh$ = this.onResizedRefreshSubject$.asObservable();
  isMobile: boolean = false;

  constructor(private httpService: HttpService) {
    this.subscriptionList.push(this.onResized$.pipe(debounceTime(this.httpService.debounceTime)).subscribe((event) => {
      this.clientWidth = event.newWidth;
      this.clientHeight = event.newHeight;
      this.updateLayout();
    }));

    this.subscriptionList.push(this.onResizedRefresh$.pipe(debounceTime(2000)).subscribe(() => {
      // this.onResizedRefresh();
    }));
  }

  ngOnInit() {
    this.isMobile = this.httpService.isMobile();
    console.log("NetworkViewComponent...");
    window['control'] = this;
  }

  ngOnDestroy() {
    this.subscriptionList.map(item => item.unsubscribe());
  }

  ngAfterViewInit() {
    //this.updateLayout();
    this.forceD3 = new ForceD3(this.documentId);
  }

  onResized(event: ResizedEvent) {
    // this.clientWidth = event.newWidth;
    // this.clientHeight = event.newHeight;
    // this.currentFxLayout = this.clientWidth > this.clientHeight ? this.fxLayouts[1] : this.fxLayouts[0];
    // this.listHeight = (this.currentFxLayout == this.fxLayouts[1] ? this.clientHeight : (this.clientHeight / 2)) - 100;
    this.onResizedSubject$.next(event);
  }

  updateLayout() {
    this.isPortraitMode = this.clientWidth < this.clientHeight;

    if (this.isMobile) {
      this.currentFxLayout = this.isPortraitMode ? this.fxLayouts[0] : this.fxLayouts[1];
      this.listHeight = (this.isPortraitMode ? (this.clientHeight / 2) : (this.clientHeight - 10)) - 60;
    } else {
      this.currentFxLayout = this.isPortraitMode ? this.fxLayouts[0] : this.fxLayouts[1];
      this.listHeight = (this.isPortraitMode ? (this.clientHeight / 2) : (this.clientHeight - 10)) - 60;
    }
    console.log(`NetworkViewComponent  ====  UpdateLayout: ${this.isMobile ? "[ Mobile ]" : "[ PC ]"}`);
    this.onResizedRefreshSubject$.next();

    // this.currentFxLayout = this.clientWidth > this.clientHeight ? this.fxLayouts[1] : this.fxLayouts[0];
    // this.listHeight = (this.currentFxLayout == this.fxLayouts[1] ? this.clientHeight - 10 : (this.clientHeight / 2)) - 60;
    // this.isPortraitMode = this.clientWidth < this.clientHeight;
    // let isChanged = this.isPortraitMode != isPortraitMode;
    // this.isPortraitMode = isPortraitMode;

    // console.log("NetworkViewComponent  ====   updateLayout");
    // if (this.currentData != null && isChanged) {
    //   setTimeout(() => {
    //     console.log("updateLayout  >>>>>>  onRefreshClick");
    //     this.onRefreshClick();
    //   }, 1000);
    // }

    // if (this.currentData != null) {
    //     let chartDiv = document.getElementById(this.documentId);
    //     this.forceD3.drawD3(this.currentData, chartDiv.clientWidth, chartDiv.clientHeight);
    // }
  }

  onResizedRefresh() {
    console.log("onResizedRefresh...");
    if (this.currentData != null) {
      let chartDiv = document.getElementById(this.documentId);
      this.forceD3.drawD3(this.currentData, chartDiv.clientWidth, chartDiv.clientHeight);
      console.log("drawD3...");
    }
  }

  onRefreshClick() {
    this.httpService.postMobileNetwork().subscribe(
      (data => {
        this.currentData = data;
        this.createTable();
        let chartDiv = document.getElementById(this.documentId);
        this.forceD3.drawD3(this.currentData, chartDiv.clientWidth, chartDiv.clientHeight);
      }),
      (error => {
        console.error(error);
      }));

    // let data = {
    //   'peer': {
    //     'peer_id': "Current", 'ticket_id': 5
    //   },
    //   'primary': [
    //     { 'peer_id': "Peer1ceqweqwedwqd", 'ticket_id': 1 },
    //     { 'peer_id': "Peer7ceqweqwedwqd", 'ticket_id': 7 },
    //     { 'peer_id': "Peer9ceqweqwedwqd", 'ticket_id': 9 }
    //   ],
    //   'in_coming_candidate': [
    //     { 'peer_id': "Peer6ceqweqwedwqd", 'ticket_id': 6 },
    //     { 'peer_id': "Peer8ceqweqwedwqd", 'ticket_id': 8 },
    //     { 'peer_id': "Peer10ceqweqwedwqd", 'ticket_id': 10 }
    //   ],
    //   'out_going_candidate': [
    //     { 'peer_id': "Peer2ceqweqwedwqd", 'ticket_id': 2 },
    //     { 'peer_id': "Peer3ceqweqwedwqd", 'ticket_id': 3 },
    //     { 'peer_id': "Peer4ceqweqwedwqd", 'ticket_id': 4 }
    //   ]
    // }

  }

  createTable() {
    if (this.currentData != null) {
      let primaryList = [];
      if (this.currentData.primary != null) {
        for (let i = 0; i < this.currentData.primary.length; i++) {
          let primary = this.currentData.primary[i];
          let peer = new Peer();
          peer.type = this.peerListKeys[0];
          peer.title = this.peerListTitle[0];
          peer.peerId = primary.peer_id;
          peer.ticketId = primary.ticket_id;
          primaryList.push(peer)
        }
      }

      let inComingList = [];
      if (this.currentData.in_coming_candidate != null) {
        for (let i = 0; i < this.currentData.in_coming_candidate.length; i++) {
          let inComing = this.currentData.in_coming_candidate[i];
          let peer = new Peer();
          peer.type = this.peerListKeys[1];
          peer.title = this.peerListTitle[1];
          peer.peerId = inComing.peer_id;
          peer.ticketId = inComing.ticket_id;
          inComingList.push(peer)
        }
      }

      let outGoingList = [];
      if (this.currentData.out_going_candidate != null) {
        for (let i = 0; i < this.currentData.out_going_candidate.length; i++) {
          let outGoing = this.currentData.out_going_candidate[i];
          let peer = new Peer();
          peer.type = this.peerListKeys[2];
          peer.title = this.peerListTitle[2];
          peer.peerId = outGoing.peer_id;
          peer.ticketId = outGoing.ticket_id;
          outGoingList.push(peer)
        }
      }

      let currentPeerList = [];
      let pPeer = new PeerList();
      pPeer.key = this.peerListKeys[0];
      pPeer.items = primaryList;
      currentPeerList.push(pPeer);

      let inPeer = new PeerList();
      inPeer.key = this.peerListKeys[1];
      inPeer.items = inComingList;
      currentPeerList.push(inPeer);

      let outPeer = new PeerList();
      outPeer.key = this.peerListKeys[2];
      outPeer.items = outGoingList;
      currentPeerList.push(outPeer);

      this.currentPeerList = currentPeerList;
    }
  }

}

export class PeerList {
  key: string;
  items: Peer[] = [];
}

export class Peer {
  title: string;
  type: string;
  peerId: string;
  ticketId: number;
}