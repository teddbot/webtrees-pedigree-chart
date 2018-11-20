/*jslint es6: true */
/*jshint esversion: 6 */
/**
 * See LICENSE.md file for further details.
 */

import * as d3 from "./d3"

const SEX_MALE   = "M";
const SEX_FEMALE = "F";

/**
 * Shared code for drawing ancestors or descendants.
 *
 * `direction` is either 1 (forward) or -1 (backward).
 */
export class Tree
{
    /**
     * Constructor.
     *
     * @param {Object} svg       The SVG object instance
     * @param {Number} direction The direction to draw (1 = right-left, 0 = left-right)
     * @param {Array}  data      The ancestor data to display
     */
    constructor(svg, direction, data)
    {
        this.boxWidth   = 250;
        this.boxHeight  = 80;
        this.nodeWidth  = 200;
        this.nodeHeight = 0;
        this.separation = 0.5;
        this.svg        = svg;
        this.direction  = direction;

        // Declares a tree layout and assigns the size
        const treeLayout = d3.tree()
            .nodeSize([this.nodeWidth, this.nodeHeight])
            .separation(d => this.separation);

        this.root = d3.hierarchy(data);

        // maps the node data to the tree layout
        this.treeNodes = treeLayout(this.root);
    }

    /**
     * Draw the tree.
     *
     * @public
     */
    draw()
    {
        if (this.root) {
            let nodes = this.treeNodes.descendants();
            let links = this.treeNodes.links();

            // Normalize for fixed-depth.
            nodes.forEach(function (d) { d.y = d.depth * 300; });

            this.drawLinks(links);
            this.drawNodes(nodes);
        } else {
            throw new Error("Missing root");
        }

        return this;
    }

    /**
     * Draw the person boxes.
     *
     * @param {Array} nodes Array of descendant nodes
     *
     * @private
     */
    drawNodes(nodes)
    {
        let self = this;

        let node = self.svg
            .selectAll("g.person")
            .data(nodes);

        let nodeEnter = node
            .enter()
            .append("g")
            .attr("class", "person")
            .attr("transform", d => `translate(${d.y}, ${d.x})`);

        nodeEnter.append("title")
            .text(d => d.data.name);

        nodeEnter.append("rect")
            .attr("class", d => {
                if (d.data.sex === SEX_FEMALE) {
                    return "female";
                }

                if (d.data.sex === SEX_MALE) {
                    return "male";
                }
            })
            .attr("rx", 40)
            .attr("ry", 40)
            .attr("x", -(self.boxWidth / 2))
            .attr("y", -(self.boxHeight / 2))
            .attr("width", self.boxWidth)
            .attr("height", self.boxHeight)
            .attr("fill-opacity", "0.5")
            .attr("fill", d => d.data.color);

        this.addImage(nodeEnter);

        // Name
        nodeEnter.append("text")
            .attr("dx", -(self.boxWidth / 2) + 80)
            .attr("dy", "-12px")
            .attr("text-anchor", "start")
            .attr("class", "name")
            .text(d => self.getName(d));

        // Birth date
        nodeEnter.append("text")
            .attr("dx", -(self.boxWidth / 2) + 81)
            .attr("dy", "4px")
            .attr("text-anchor", "start")
            .attr("class", "born")
            .text(d => {
                return "\u204E";
            });

        nodeEnter.append("text")
            .attr("dx", -(self.boxWidth / 2) + 90)
            .attr("dy", "4px")
            .attr("text-anchor", "start")
            .attr("class", "born")
            .text(d => {
                return d.data.born;
            });

        // Death date
        nodeEnter.append("text")
            .attr("dx", -(self.boxWidth / 2) + 80 + 0.3)
            .attr("dy", "18px")
            .attr("text-anchor", "start")
            .attr("class", "died")
            .text(d => {
                return "\u271D";
            });

        nodeEnter.append("text")
            .attr("dx", -(self.boxWidth / 2) + 90)
            .attr("dy", "18px")
            .attr("text-anchor", "start")
            .attr("class", "died")
            .text(d => {
                return d.data.died;
            });
    }

    /**
     * Returns the name of the individual.
     *
     * @param {Object} data D3 data object
     */
    getName(data)
    {
        let splitted = data.data.name.split(" ");
        let length   = splitted.length;

        splitted[0] = splitted[0].substring(0, 1) + ".";

        return splitted.join(" ");

        return data.data.name;
    }

    /**
     * Add the individual thumbnail image to the node.
     *
     * @param {Object} node D3 object
     */
    addImage(node)
    {
        // let border = node.append("circle")
        //     .attr("cx", -(this.boxWidth / 2) + 40)
        //     .attr("cy", -(this.boxHeight / 2) + 40)
        //     .attr("r", 25)
        //     .attr("fill", d => "#fff");

        let image = node.append("svg:image")
            .attr("xlink:href", d => {
                if (d.data.sex === SEX_FEMALE) {
                    return "modules_v3/webtrees-pedigree-chart/images/silhouette_female.png";
                }

                if (d.data.sex === SEX_MALE) {
                    return "modules_v3/webtrees-pedigree-chart/images/silhouette_male.png";
                }

                return "modules_v3/webtrees-pedigree-chart/images/silhouette_unknown.png";
            })//d.data.thumbnail)
            .attr("x", -(this.boxWidth / 2) + 5)
            .attr("y", -(this.boxHeight / 2) + 5)
            .attr("height", 70)
            .attr("width", 70);

        let border = node.append("rect")
            .classed("image", true)
            .attr("rx", 35)
            .attr("ry", 35)
            .attr("x", -(this.boxWidth / 2) + 5)
            .attr("y", -(this.boxHeight / 2) + 5)
            .attr("width", 70)
            .attr("height", 70)
            .attr("fill", "none");

        // let fo = border.append("foreignObject")
        //     .attr("x", -(this.boxWidth / 2) + 5)
        //     .attr("y", "-37px")
        //     .attr("width", "40px")
        //     .attr("height", "50px");
        //
        // fo.append("xhtml:body")
        //     .html(d => d.data.thumbnail);
    }

    /**
     * Draw the connecting lines.
     *
     * @param {Array} links Array of links
     *
     * @private
     */
    drawLinks(links)
    {
        let link = this.svg
            .selectAll("path.link")
            .data(links);

        link.enter()
            .append("path")
            .classed("link", true)
            .attr("d", data => this.elbow(data));
    }

    /**
     * Draw the connecting lines between the profile boxes.
     *
     * @param {Object} data D3 data object
     *
     * @private
     */
    elbow(data)
    {
        let sourceX = data.source.x,
            sourceY = data.source.y + (this.boxWidth / 2),
            targetX = data.target.x,
            targetY = data.target.y - (this.boxWidth / 2);

        return "M" + (this.direction * sourceY) + "," + sourceX +
            "H" + (this.direction * (sourceY + (targetY - sourceY) / 2)) +
            "V" + targetX +
            "H" + (this.direction * targetY);
    }
}