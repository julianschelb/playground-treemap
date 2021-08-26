$(window).on('load', () => {
    console.log("Everything is ready!");
    drawTreeMap()
});

function drawTreeMap() {

    d3.json("flare.json").then(function(d){ 
        
        let root = d3.hierarchy(d).sum(function(d) { return d.value; });
    
        console.log(root);

        // set margins up for svg
        const margin = {
            top: 10, right: 30, bottom: 50, left: 5,
        };
        const width = 500 - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;

        // remove any preexisting plots/svgs
        d3.selectAll('svg').remove();

        // Append svg with margins
        const svg = d3.select('#plot_canvas_treemap')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform',
            // eslint-disable-next-line prefer-template
                'translate(' + margin.left + ',' + margin.top + ')');

        // create tooltip
        d3.select('#plot_canvas_treemap')
            .append('div')
            .style('opacity', 0)
            .attr('class', 'tooltip')
            .style('font-size', '16px')
            .style('min-width', '230px');

        // recursive slicing and dicing
        drawChild(svg, root, 0, 0, width, height)
    });
};



function drawChild(svg, root, x, y, width, height) {

    if (!('children' in root)) {
        return;
    } 

    // draw First level Childs
    var current_x = x;
    var current_y = y;
    var current_width = width;
    var current_height = height;
    var children = root.children;

    // create color scale based on each domain
    const colors = d3.scaleSequential(d3.interpolateViridis).domain([0,children.length]);


    // sort Children by value
    children.sort(function(a, b){return a.value - b.value});

    // get values of all childs
    var values = []
    for ( let i=0; i<children.length; i++ ) {
        values.push(children[i].value)
    }

    // summ of children values to calculate ratio
    const sum_values = d3.sum(values)


    // switching between horizontal and vertical split
    const odd_depth = (root.depth + 1) % 2 == 0;

    if (odd_depth) {
        console.log("horizontal split")

        var current_fix_position = current_x;
        var current_dynamic_position = current_y;

        var fix_position = "x";
        var dynamic_position = "y";
        var fix_dimension = "width";
        var dynamic_dimension = "height";
        var current_fix_dimension_value = current_width;
        var current_dynamic_dimension_value = current_height;

    } else {
        console.log("vertical split")

        var current_fix_position = current_y;
        var current_dynamic_position = current_x;

        var fix_position = "y";
        var dynamic_position = "x";
        var fix_dimension = "height";
        var dynamic_dimension = "width";
        var current_fix_dimension_value = current_height;
        var current_dynamic_dimension_value = current_width;
    }

    const tooltip = d3.select('#plot_canvas_treemap').select('.tooltip');

    // functions for changing the tooltip
    const mouseover = function () {
    tooltip.style('z-index', 999);

    tooltip
        .transition()
        .duration(0)
        .style('opacity', 1);
    tooltip
        .html('<div class = \'tooltip_header\'><span></span>'
            + `<span>${d3.select(this).attr('name')}<span></div>`
            + '<hr>'
            + '<div class = \'tooltip_row\'>'
                + `<div class = 'tooltip_attr'>Hierarchy Level:</div><div class = 'tooltip_value'>${d3.select(this).attr('depth')}</div>`
            + '</div>'
            + '<div class = \'tooltip_row\'>'
                + `<div class = 'tooltip_attr'>Number Siblings:</div><div class = 'tooltip_value'>${d3.select(this).attr('child_count')}</div>`
            + '</div>'
            + '<div class = \'tooltip_row\'>'
                + `<div class = 'tooltip_attr'>Value:</div><div class = 'tooltip_value'>${d3.select(this).attr('value')}</div>`
            + '</div>')
        .style('left', `${d3.event.pageX + 5}px`)
        .style('top', `${d3.event.pageY + 5}px`);
    };
    const mousemove = function () {
    tooltip
        .style('left', `${d3.event.pageX + 5}px`)
        .style('top', `${d3.event.pageY + 5}px`);
    };
    const mouseleave = function () {
    tooltip.style('z-index', -999);

    tooltip
        .transition()
        .duration(0)
        .style('opacity', 0);
    };


    // calculate ratios
    for ( let i=0; i<children.length; i++ ) {
        
        //console.log(i)

        var child_value = values[i];
        var fix_dimension_value = current_fix_dimension_value;
        var dynamic_dimension_value = current_dynamic_dimension_value * (child_value / sum_values) ;

        // Draw Children
        svg.append('rect')
        .attr('child_id', i)
        .attr('name', children[i].data.name)
        .attr('child_count', children.length - 1)
        .attr('depth', root.depth + 1)
        .attr(fix_position, current_fix_position)
        .attr(dynamic_position, current_dynamic_position)
        .attr(fix_dimension, fix_dimension_value)
        .attr(dynamic_dimension, dynamic_dimension_value)
        .attr('stroke', 'black')
        .attr('value', child_value)
        .attr('fill-opacity', 1)
        .attr('fill', colors(i))
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
        .on('mouseleave', mouseleave);


        if(odd_depth) {
            x = current_fix_position;
            y = current_dynamic_position;
            width = fix_dimension_value;
            height = dynamic_dimension_value;

            //console.log(x, y, width, height)
            //console.log(children[i].depth)
            drawChild(svg, children[i], x, y, width, height);

        } else {
            x = current_dynamic_position;
            y = current_fix_position;
            width = dynamic_dimension_value;
            height = fix_dimension_value;
            drawChild(svg, children[i], x, y, width, height);
        }

        // update x Position
        current_dynamic_position = current_dynamic_position + dynamic_dimension_value;

    }

}