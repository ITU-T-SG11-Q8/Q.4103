declare var d3: any;

export class ForceD3 {
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
    stroke_width: number;
    svg: any;
    g: any;
    isExist: boolean;
    text: any;
    ticket_id: any;
    graph: any;
    node: any;
    link: any;
    linkDistance: number;
    nodeList: any[] = []
    linkList: any[] = []

    constructor(id: string) {
        this.width = 0;
        this.height = 0;

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

        this.node_size = 40;
        this.text_size = 12;
        this.stroke_width = 2;
        this.svg = d3.select("#" + id).append("svg");
        this.g = this.svg.append("g");
        this.isExist = false;

        this.text = null;
        this.ticket_id = null;
        this.graph = null;
        this.node = null;
        this.link = null;
    }

    setSize(newWidth: number, newHeight: number) {
        this.width = newWidth;
        this.height = newHeight;
        this.force = d3.layout.force()
            .linkDistance(90)
            .charge(-100)
            .size([this.width, this.height]);
    }

    remove() {
        if (this.isExist) {
            this.g.selectAll(".link").remove();
            this.g.selectAll(".node").remove();
            this.g.selectAll(".text").remove();
            this.g.selectAll(".ticket_id").remove();
            this.force.stop();
        }
    }

    create(data: any) {
        this.graph = data;
        this.svg.attr("width", this.width).attr("height", this.height);
        this.remove();
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
            .data(["pStart"])
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
            .style("fill", this.primary_link_color);

        this.svg.append("svg:defs").selectAll("marker")
            .data(["end"])
            .enter().append("svg:marker")
            .attr("id", String)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 20)
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("svg:path")
            .attr("d", "M0,-5L10,0L0,5")
            .style("fill", this.default_link_color);

        this.graph.links = this.graph.links.map((l: any) => {
            let sourceNode = this.graph.nodes.find((n: any) => {
                return n.id === l.source;
            });
            let targetNode = this.graph.nodes.find((n: any) => {
                return n.id === l.target;
            });
            sourceNode.weight = 0;
            targetNode.weight = 0;

            return {
                source: sourceNode,
                target: targetNode,
                primary: l.primary
            };
        });

        this.force.nodes(this.graph.nodes)
            .links(this.graph.links)
            .start();

        this.updateAttrAndStyle();

        // d3.select(window).on("mouseup", () => {
        //     if (this.focus_node !== null) {
        //         this.focus_node = null;
        //         if (this.highlight_trans < 1) {
        //             this.node.style("opacity", 1);
        //             //node.style("stroke-opacity", 1);
        //             this.text.style("opacity", 1);
        //             this.ticket_id.style("opacity", 1);
        //             this.link.style("opacity", 1);
        //         }
        //     }
        //     if (this.highlight_node === null) {
        //         this.exitHighlight();
        //     };
        // });

        this.force.on("tick", () => {
            this.node.attr("transform", (d: any) => { return "translate(" + d.x + "," + d.y + ")"; });
            this.text.attr("transform", (d: any) => { return "translate(" + d.x + "," + d.y + ")"; });
            this.ticket_id.attr("transform", (d: any) => { return "translate(" + d.x + "," + d.y + ")"; });

            this.link.attr("x1", (d: any) => { return d.source.x; })
                .attr("y1", (d: any) => { return d.source.y; })
                .attr("x2", (d: any) => { return d.target.x; })
                .attr("y2", (d: any) => { return d.target.y; });

            this.node.attr("cx", (d: any) => { return d.x; })
                .attr("cy", (d: any) => { return d.y; });
        });
    }

    // exitHighlight() {
    //     this.highlight_node = null;
    //     if (this.focus_node === null) {
    //         this.svg.style("cursor", "default");
    //         this.node.selectAll("path").style("stroke-opacity", 0);
    //         this.text.style("font-weight", "normal");
    //         this.ticket_id.style("font-weight", "normal");
    //     }
    // }

    // setHighlight(d: any) {
    //     this.svg.style("cursor", "pointer");
    //     if (this.focus_node !== null) {
    //         d = this.focus_node;
    //     };
    //     this.highlight_node = d;

    //     this.node.selectAll("path").style("stroke-opacity", (o: any) => {
    //         return d == o ? 1 : 0;
    //     });
    //     this.text.style("font-weight", (o: any) => {
    //         return d == o ? "bold" : "normal";
    //     });
    //     this.ticket_id.style("font-weight", (o: any) => {
    //         return d == o ? "bold" : "normal";
    //     });
    // }

    createD3Data(data: any) {
        this.nodeList = []
        this.linkList = []
        let ticket_id = data.peer.ticket_id;
        let peer_id = data.peer.peer_id;

        this.nodeList.push({ "id": peer_id, "ticket_id": ticket_id, "currentPeer": true });

        this.addNodeAndLink(peer_id, ticket_id, data.primary, true);
        this.addNodeAndLink(peer_id, ticket_id, data.in_coming_candidate, false);
        this.addNodeAndLink(peer_id, ticket_id, data.out_going_candidate, false);

        return {
            "graph": [],
            "nodes": this.nodeList,
            "links": this.linkList,
            "directed": false,
            "multigraph": true
        }
    }

    addNodeAndLink(peer_id: string, ticket_id: number, dataList: any[], isPrimary: boolean) {
        if (dataList != null) {
            for (let i = 0; i < dataList.length; i++) {
                let peer = dataList[i];
                this.nodeList.push({ "id": peer.peer_id, "ticket_id": peer.ticket_id });
                let source = ticket_id > peer.ticket_id ? peer.peer_id : peer_id;
                let target = ticket_id > peer.ticket_id ? peer_id : peer.peer_id;
                this.linkList.push({ "source": source, "target": target, "primary": isPrimary });
            }
        }
    }

    drawD3(data: any, newWidth: number, newHeight: number) {
        this.setSize(newWidth, newHeight);
        let d3Data = this.createD3Data(data);
        this.create(d3Data);
    }

    updateAttrAndStyle() {
        this.link = this.g.selectAll(".link").data(this.graph.links);
        this.link.enter().append("line")
            .attr("class", "link")
            .style("stroke-width", this.stroke_width)
            .style("stroke-dasharray", (d: any) => { return d.primary ? "1,0" : "2,2"; })
            .style("stroke", (d: any) => { return d.primary ? this.primary_link_color : this.default_link_color; })
            .attr("marker-start", (d: any) => { return d.primary ? "url(#pStart)" : "url(#start)"; });

        this.node = this.g.selectAll(".node").data(this.graph.nodes);
        this.node.enter().append("g")
            .attr("class", "node")
            .call(this.force.drag)
            .append("path")
            .attr("d", d3.svg.symbol()
                .size(() => { return Math.PI * Math.pow(this.size(this.node_size), 2); })
                .type((d: any) => { return d.type; }))
            .style("fill", (d: any) => { return d.currentPeer ? this.seeder_node_color : this.color(d.ticket_id); })
            .style("stroke-width", this.stroke_width)
            .style("stroke-opacity", (d: any) => { return d.currentPeer ? 1 : 0 })
            .style("stroke", "white");

        this.text = this.g.selectAll(".text").data(this.graph.nodes);
        this.text.enter().append("text")
            .attr("class", "text")
            .attr("dy", ".35em")
            .style("font-size", (d: any) => { return d.currentPeer ? "15px" : this.text_size + "px"; })
            .style("font-weight", (d: any) => { return d.currentPeer ? "bold" : ""; })
            .style("fill", "white")
            .attr("dx", this.size(this.node_size))
            .text((d: any) => { return '\u2002' + d.id; });

        this.ticket_id = this.g.selectAll(".ticket_id").data(this.graph.nodes);
        this.ticket_id.enter().append("text")
            .attr("class", "ticket_id")
            .attr("dy", ".35em")
            .style("font-size", "11px")
            .style("fill", "white")
            .style("font-weight", "bold")
            .style("text-anchor", "middle")
            .text((d: any) => { return d.ticket_id; });

        // this.node.on("mouseover", (d: any) => this.setHighlight(d))
        //     .on("mousedown", (d: any) => {
        //         d3.event.stopPropagation();
        //         this.focus_node = d;
        //         if (this.highlight_node === null) {
        //             this.setHighlight(d);
        //         }
        //     }).on("mouseout", () => this.exitHighlight());
    }
}