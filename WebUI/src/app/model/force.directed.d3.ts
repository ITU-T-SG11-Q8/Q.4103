import { Subject } from 'rxjs';

declare var d3: any;

export class ForceDirected {
    container: any;
    width: number;
    height: number;
    focus_node: any;
    highlight_node: any;
    color: any;
    highlight_trans: number;
    size: any;
    force: any;
    seeder_node_color: any;
    default_node_color: any;
    primary_link_color: any;
    default_link_color: any;
    node_size: number;
    text_size: number;
    ticket_text_size: number;
    stroke_width: number;
    svg: any;
    g: any;
    isExist: boolean;
    text: any;
    ticket_id: any;
    graph: any;
    node: any;
    link: any;
    linkedByIndex: any;
    ticket_id_count: number;
    isSingleColor: boolean;
    // current_data: any;
    linkDistance: number;
    divId: string;

    recoverySubject$ = new Subject<void>();
    public recovery$ = this.recoverySubject$.asObservable();

    constructor(id: string) {
        this.divId = id;
        let chartDiv = document.getElementById(this.divId);
        this.width = chartDiv.clientWidth; //chartDiv.offsetWidth; 
        this.height = chartDiv.clientHeight;

        this.focus_node = null;
        this.highlight_node = null;

        this.color = d3.scale.category20c();
        this.highlight_trans = 0.1;

        this.size = d3.scale.pow().exponent(1)
            .domain([1, 100])
            .range([8, 24]);

        this.seeder_node_color = "rgb(0,0,0)";
        this.default_node_color = "rgb(49,163,84)";
        this.primary_link_color = "rgb(31,119,180)";
        this.default_link_color = "rgb(255,127,14)";
        this.isSingleColor = false;

        this.node_size = 40;
        this.text_size = 12;
        this.ticket_text_size = 17;
        this.stroke_width = 5;
        this.svg = d3.select("#" + id).append("svg");
        this.g = this.svg.append("g");
        this.isExist = false;

        this.text = null;
        this.ticket_id = null;
        this.graph = null;
        this.node = null;
        this.link = null;
        this.linkedByIndex = {};
        this.ticket_id_count = 13;
    }

    removeAllSvg() {
        if (this.isExist) {
            this.g.selectAll(".link").remove();
            this.g.selectAll(".node").remove();
            this.g.selectAll(".text").remove();
            this.g.selectAll(".ticket_id").remove();
            this.svg.selectAll("marker").remove();
            this.force.stop();
        }
    }

    setLinkedByIndex() {
        try {
            this.linkedByIndex = {};
            this.graph.links = this.graph.links.filter((link: any) => {
                return link.source !== undefined && link.target !== undefined && link.source.id !== undefined && link.target.id !== undefined
            });
            this.graph.links.forEach((d: any) => this.linkedByIndex[d.source.id + "," + d.target.id] = true);
        }
        catch (e) {
            console.error(e);
            this.recoverySubject$.next();
        }
    }

    create(data: any, nodeColor: any, primaryLinkColor: any, candidateLinkColor: any, showPeerId: boolean, linkDistance: number) {
        if (nodeColor == null) {
            this.isSingleColor = false;
            this.seeder_node_color = "rgb(0,0,0)";
            this.default_node_color = "rgb(49,163,84)";
        } else {
            this.isSingleColor = true;
            this.seeder_node_color = nodeColor;
            this.default_node_color = nodeColor;
        }

        if (primaryLinkColor == null) {
            this.primary_link_color = "rgb(31,119,180)";
        } else {
            this.primary_link_color = primaryLinkColor;
        }

        if (candidateLinkColor == null) {
            this.default_link_color = "rgb(255,127,14)";
        } else {
            this.default_link_color = candidateLinkColor;
        }

        if (linkDistance == null) {
            this.linkDistance = 200;
        } else {
            this.linkDistance = linkDistance
        }

        this.force = d3.layout.force()
            .linkDistance(this.linkDistance)
            .charge(-500) //-500
            // .gravity(0.1)
            .size([this.width, this.height]);

        // this.current_data = JSON.parse(JSON.stringify(data));
        this.graph = data;
        // this.svg.attr("width", this.width).attr("height", this.height);
        this.svg.attr("width", "100%").attr("height", "100%");
        this.removeAllSvg();
        this.isExist = true;

        this.svg.append("svg:defs").selectAll("marker")
            .data(["start"])
            .enter().append("svg:marker")
            .attr("id", String)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", -12)
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("svg:path")
            .attr("d", "M0,0L10,-5L10,5")
            .style("fill", this.default_link_color);

        this.svg.append("svg:defs").selectAll("marker")
            .data(["end"])
            .enter().append("svg:marker")
            .attr("id", String)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 19)
            .attr("refY", 0)
            .attr("markerWidth", 3)
            .attr("markerHeight", 3)
            .attr("orient", "auto")
            .append("svg:path")
            .attr("d", "M0,-5L10,0L0,5")
            .style("fill", this.default_link_color);

        this.graph.nodes = this.graph.nodes.map((node: any) => {
            node.weight = 0;
            node.showPeerId = showPeerId;
            return node;
        });

        this.graph.links = this.graph.links.map((l: any) => {
            let sourceNode = this.graph.nodes.find((n: any) => {
                return n.id === l.source;
            });
            let targetNode = this.graph.nodes.find((n: any) => {
                return n.id === l.target;
            });

            if (sourceNode === undefined || targetNode === undefined) {
                return null;
            }

            return {
                source: sourceNode,
                target: targetNode,
                primary: l.primary
            };
        });
        this.graph.links = this.graph.links.filter((link: any) => { return link !== null });

        this.force.nodes(this.graph.nodes)
            .links(this.graph.links)
            .start();

        this.appendStyleAndAttr();
        this.setLinkedByIndex();

        d3.select(window).on("mouseup", () => {
            if (this.focus_node !== null) {
                this.focus_node = null;
                if (this.highlight_trans < 1) {
                    this.node.style("opacity", 1);
                    //node.style("stroke-opacity", 1);
                    this.text.style("opacity", 1);
                    this.ticket_id.style("opacity", 1);
                    this.link.style("opacity", 1);
                }
            }
            if (this.highlight_node === null) {
                this.exit_highlight();
            };
        });

        this.force.on("tick", () => {
            let default_x = 600;
            let default_y = 400;

            try {
                this.node.attr("transform", (d: any) => { return "translate(" + d.x + "," + d.y + ")"; });
                this.text.attr("transform", (d: any) => { return "translate(" + d.x + "," + d.y + ")"; });
                this.ticket_id.attr("transform", (d: any) => { return "translate(" + d.x + "," + d.y + ")"; });

                this.link.attr("x1", (d: any) => { return d.source !== undefined && d.source.x !== undefined ? d.source.x : default_x; })
                    .attr("y1", (d: any) => { return d.source !== undefined && d.source.y !== undefined ? d.source.y : default_y; })
                    .attr("x2", (d: any) => { return d.target !== undefined && d.target.x !== undefined ? d.target.x : default_x; })
                    .attr("y2", (d: any) => { return d.target !== undefined && d.target.y !== undefined ? d.target.y : default_y; });

                this.node.attr("cx", (d: any) => { return d.x; })
                    .attr("cy", (d: any) => { return d.y; });
            }
            catch (e) {
                console.error(e);
                this.recoverySubject$.next();
            }
        });
    }

    isConnected(a: any, b: any) {
        return this.linkedByIndex[a.id + "," + b.id] || this.linkedByIndex[b.id + "," + a.id] || a.id == b.id;
    }

    exit_highlight() {
        this.highlight_node = null;
        if (this.focus_node === null) {
            this.svg.style("cursor", "default");
            this.node.selectAll("path").style("stroke-opacity", 0);
            this.text.style("font-weight", "normal");
            this.ticket_id.style("font-weight", "normal");
        }
    }

    set_focus(d: any) {
        if (this.highlight_trans < 1) {
            this.node.style("opacity", (o: any) => {
                return this.isConnected(d, o) ? 1 : this.highlight_trans;
            });

            this.text.style("opacity", (o: any) => {
                return this.isConnected(d, o) ? 1 : this.highlight_trans;
            });

            this.ticket_id.style("opacity", (o: any) => {
                return this.isConnected(d, o) ? 1 : this.highlight_trans;
            });

            this.link.style("opacity", (o: any) => {
                return o.source.index == d.index || o.target.index == d.index ? 1 : this.highlight_trans;
            });
        }
    }

    set_highlight(d: any) {
        this.svg.style("cursor", "pointer");
        if (this.focus_node !== null) {
            d = this.focus_node;
        };
        this.highlight_node = d;

        this.node.selectAll("path").style("stroke-opacity", (o: any) => {
            return d == o ? 1 : 0;
        });
        this.text.style("font-weight", (o: any) => {
            return d == o ? "bold" : "normal";
        });
        this.ticket_id.style("font-weight", (o: any) => {
            return d == o ? "bold" : "normal";
        });
    }

    updateStatus() {
        this.clearItem();
        this.appendStyleAndAttr();
        this.setLinkedByIndex();

        this.force
            .nodes(this.graph.nodes)
            .links(this.graph.links)
            .start();

        // this.validationCheckingSubject$.next();
    }


    loadData(graph: any, nodeColor: any, primaryLinkColor: any, candidateLinkColor: any, showPeerId: boolean, linkDistance: number) {
        let chartDiv = document.getElementById(this.divId);
        this.width = chartDiv.clientWidth;
        this.height = chartDiv.clientHeight;
        // this.clearItem();
        this.graph = null;
        // this.current_data = null;
        this.create(graph, nodeColor, primaryLinkColor, candidateLinkColor, showPeerId, linkDistance);
    }

    clearData() {
        this.clearItem();
        this.removeAllSvg();
    }

    clearItem() {
        if (this.graph == null)
            return;

        this.link = this.link.data([]);
        this.link.exit().remove();

        this.node = this.node.data([]);
        this.node.exit().remove();

        this.text = this.text.data([]);
        this.text.exit().remove();

        this.ticket_id = this.ticket_id.data([]);
        this.ticket_id.exit().remove();
    }

    updateLink(peer_id: string, links: any[]) {
        try {
            let newlinks = Object.assign([], links);
            let deleteLinks = [];
            let deleteLinkData = [];

            let findCurrentLinks = this.graph.links.filter((g_link: any) => {
                return g_link.source.id == peer_id
            });

            for (let i = 0; i < findCurrentLinks.length; i++) {
                let currentLink = findCurrentLinks[i];
                let findLink = newlinks.find(link => {
                    return (currentLink.target.id == link.target)
                });
                if (findLink != null) {
                    currentLink.primary = findLink.primary;
                    findLink.handled = true;

                    // let find_current_data_link = this.current_data.links.find((c_link: any) => currentLink.source.id == c_link.source && currentLink.target.id == c_link.target);
                    // if (find_current_data_link !== undefined) {
                    //     find_current_data_link.primary = currentLink.primary;
                    // }
                } else {
                    deleteLinkData.push({ "source": currentLink.source.id, "target": currentLink.target.id, "primary": currentLink.primary })
                    deleteLinks.push(currentLink);
                }
            }

            for (let i = 0; i < newlinks.length; i++) {
                let link = newlinks[i];
                if (!link.handled) {
                    let findSameLink = this.graph.links.find((getLink: any) => {
                        if (getLink.source.id != null || getLink.target.id != null) {
                            return false;
                        }
                        return (getLink.source.id == link.source && getLink.target.id == link.target) || (getLink.source.id == link.target && getLink.target.id == link.source)
                    });

                    if (findSameLink === undefined) {
                        let source = this.graph.nodes.find((g_node: any) => { return g_node.id == link.source });
                        let target = this.graph.nodes.find((g_node: any) => { return g_node.id == link.target });

                        let newLink = {
                            source: source,
                            target: target,
                            primary: link.primary
                        }

                        //this.current_data.links.push(JSON.parse(JSON.stringify(link)));
                        this.graph.links.push(newLink);
                    }
                }
            }

            if (deleteLinks.length > 0) {
                this.graph.links = this.graph.links.filter((link: any) => { return !deleteLinks.includes(link) });
                this.graph.links = this.graph.links.filter((link: any) => { return link.source.id !== undefined && link.target.id !== undefined });
                // this.current_data.links = this.current_data.links.filter((link: any) => !deleteLinkData.includes(link));
            }
            this.updateStatus();
        } catch (e) {
            console.error(e)
            this.recoverySubject$.next();
        }

        // let newlinks = Object.assign([], links);
        // let findCurrentLinks = this.graph.links.filter((link: any) => {
        //     return link.source.id == peer_id
        // });

        // let deleteLinks = [];
        // for (let i = 0; i < findCurrentLinks.length; i++) {
        //     let currentLink = findCurrentLinks[i];
        //     let findLink = newlinks.find(link => link.target == currentLink.target.id);

        //     if (findLink != null) {
        //         currentLink.primary = findLink.primary;
        //         findLink.isOver = true;
        //     } else {
        //         deleteLinks.push(currentLink);
        //     }
        // }

        // for (let i = 0; i < newlinks.length; i++) {
        //     let link = newlinks[i];
        //     if (!link.isOver) {
        //         let findSameLink = this.graph.links.find((getLink: any) => {
        //             return (getLink.source.id == link.source && getLink.target.id == link.target && getLink.primary == link.primary) ||
        //                 (getLink.source.id == link.target && getLink.target.id == link.source && getLink.primary == link.primary)
        //         });

        //         if (findSameLink === undefined) {
        //             let source = this.graph.nodes.find((node: any) => node.id == link.source);
        //             let target = this.graph.nodes.find((node: any) => node.id == link.target);

        //             let newLink = {
        //                 source: source,
        //                 target: target,
        //                 primary: link.primary
        //             }
        //             this.graph.links.push(newLink);
        //         }
        //     }
        // }

        // this.graph.links = this.graph.links.filter((link: any) => !deleteLinks.includes(link));
        // this.updateStatus();
    }

    addItem(nodes: any, links: any) {
        if (nodes !== null && nodes.length > 0) {
            for (let nIndex = 0; nIndex < nodes.length; nIndex++) {
                let node = nodes[nIndex];
                let findNode = this.graph.nodes.find((n: any) => { return n.id == node.id || n.ticket_id == node.ticket_id });
                if (findNode === undefined) {
                    this.graph.nodes.push(node);
                }
            }
            this.updateStatus();
        }

        if (links !== null && links.length > 0) {
            for (let lIndex = 0; lIndex < links.length; lIndex++) {
                let link = links[lIndex];
                let findLink = this.graph.links.find((l: any) => {
                    return (l.source.id == link.source && l.target.id == link.target) || (l.source.id == link.target && l.target.id == link.source)
                });
                if (findLink === undefined) {
                    let source = this.graph.nodes.find((node: any) => { return node.id == link.source });
                    let target = this.graph.nodes.find((node: any) => { return node.id == link.target });

                    let newLink = {
                        source: source,
                        target: target,
                        primary: link.primary
                    }

                    this.graph.links.push(newLink);
                }
            }
            this.updateStatus();
        }
    }

    addNode(node: any, showPeerId: boolean) {
        // let find = this.current_data.nodes.find((n: any) => n.id == node.id || n.ticket_id == node.ticket_id);
        let find = this.graph.nodes.find((n: any) => { return n.id == node.id || n.ticket_id == node.ticket_id });

        if (find === undefined) {
            // this.current_data.nodes.push(JSON.parse(JSON.stringify(node)));
            node.showPeerId = showPeerId;
            this.graph.nodes.push(node);
            this.updateStatus();
        }
    }

    removeItem(peer_id: any) {
        this.removeNode(peer_id);
        this.removeLink(peer_id);
        this.updateStatus();
    }

    removeNode(id: any) {
        //this.current_data.nodes = this.current_data.nodes.filter((n: any) => n.id !== id);
        this.graph.nodes = this.graph.nodes.filter((n: any) => { return n.id !== id });

        // let c_find = this.current_data.nodes.find((n: any) => n.id == id);
        // let c_index = this.current_data.nodes.indexOf(c_find);
        // this.current_data.nodes.splice(c_index, 1);

        // let find = this.graph.nodes.find((n: any) => n.id == id);
        // let index = this.graph.nodes.indexOf(find);
        // this.graph.nodes.splice(index, 1);
    }

    removeLink(id: any) {
        try {
            //this.current_data.links = this.current_data.links.filter((l: any) => l.source !== id && l.target !== id);
            this.graph.links = this.graph.links.filter((l: any) => { return l.source.id !== id && l.target.id !== id });
        } catch (e) {
            console.error(e)
            this.recoverySubject$.next();
        }
    }

    appendStyleAndAttr() {
        this.link = this.g.selectAll(".link").data(this.graph.links);
        this.link.enter().append("line")
            .attr("class", "link")
            .style("stroke-width", this.stroke_width)
            .style("stroke-dasharray", (d: any) => { return d.primary ? "1,0" : "2,2"; })
            .style("stroke", (d: any) => { return d.primary ? this.primary_link_color : this.default_link_color; })
            // .attr("marker-start", (d: any) => { return d.primary ? null : "url(#start)"; });
            .attr("marker-end", (d: any) => { return d.primary ? null : "url(#end)"; });
        // 화살표 방향
        this.node = this.g.selectAll(".node").data(this.graph.nodes);
        this.node.enter().append("g")
            .attr("class", "node")
            .call(this.force.drag)
            .append("path")
            .attr("d", d3.svg.symbol()
                .size((d: any) => { return Math.PI * Math.pow(this.size(this.node_size), 2); })
                .type((d: any) => { return d.type; }))
            .style("fill", (d: any) => {
                if (this.isSingleColor) {
                    return this.default_node_color;
                } else {
                    return d.seeder ? this.seeder_node_color : this.color(d.ticket_id);
                }
            })
            .style("stroke-width", this.stroke_width)
            .style("stroke-opacity", 0)
            .style("stroke", "white");

        this.text = this.g.selectAll(".text").data(this.graph.nodes);
        this.text.enter().append("text")
            .attr("class", "text")
            .attr("dy", ".35em")
            .style("font-size", (d: any) => { return d.seeder ? (this.text_size + 2) + "px" : this.text_size + "px"; })
            .style("fill", "white")
            .attr("dx", this.size(this.node_size))
            .text((d: any) => { return d.showPeerId ? ('\u2002' + d.id) : ""; });

        this.ticket_id = this.g.selectAll(".ticket_id").data(this.graph.nodes);
        this.ticket_id.enter().append("text")
            .attr("class", "ticket_id")
            .attr("dy", ".35em")
            .style("font-size", (d: any) => { return d.seeder ? (this.ticket_text_size + 2) + "px" : this.ticket_text_size + "px"; })
            .style("fill", "white")
            .style("font-weight", "bold")
            .style("text-anchor", "middle")
            .text((d: any) => { return d.ticket_id; });

        this.node.on("mouseover", (d: any) => this.set_highlight(d))
            .on("mousedown", (d: any) => {
                d3.event.stopPropagation();
                this.focus_node = d;
                this.set_focus(d);
                if (this.highlight_node === null) {
                    this.set_highlight(d);
                }
            }).on("mouseout", (d: any) => this.exit_highlight());
    }
}