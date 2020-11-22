const fileNames = ['mergedTree.csv', 'mergedGraph.csv']

let rScale = d3.scaleLinear()
    .range([3,23]);
let colorScale = d3.scaleLinear()
    .range(['#6e34eb', '#eb347d', '#34ebd6'])
    .interpolate(d3.interpolateHcl);

var ViewOption = {
    XY: 1,
    TIMEDURATION: 2,
    TIMESACCADE: 3
};
var currentViewOption = ViewOption.XY;

document.addEventListener('DOMContentLoaded', () => {

    for (var i = 0; i < fileNames.length; i++) {
        console.log(`svg-div-${i}`)
        d3.select(`#svg-div-${i}`).append('g').attr('id',`plot${fileNames[i].split('.csv')[0]}`);
        
        fetchCsvCallOthers(fileNames[i],i);
    }
});

const fetchCsvCallOthers = (file,i) => {
    // Removing previously drawn circles
    if(document.getElementById(`svg-div-${i}`) != undefined) {
        d3.select(`#svg-div-${i}`).select(`#plot${file.split('.csv')[0]}`).selectAll('*').remove();
    }
    
    d3.csv(file)
    .then((data) => {
        //converting all rows to int
        data.forEach((d,i) => {
            d.number = +i;
            d.time = +d.time;
            d.duration = +d.duration;
            d.x = +d.screen_x;
            d.y = +d.screen_y;
        });
        mergedData = data;
        setScales(mergedData, file);
        render(mergedData, file);
    });
}

const render = (dataset, file) => {

    let tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltipDiv")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .text("");

    var plotG = d3.select(`#svg-div-${fileNames.indexOf(file)}`).select(`#plot${file.split('.csv')[0]}`);
    
    var convexhull = plotG.append("polygon")
        .attr('id','convexhull')
        .attr("class", "hull");
    //put scaled d.x and d.y into vertices
    vertices = [];
    mergedData.forEach((d,i) => {
        vertices[i] = [xScale(d.x), yScale(d.y)];  //for convex hull
    });
    convexhull.datum(d3.polygonHull(vertices))
        .attr("points", (d) => { return d.join(" "); });
        
    // Bind dataset to lines (for saccades)
    var saccades = plotG.selectAll("line")
        .data(dataset, (d) => {return d;}); //semantic binding
    // Add lines(saccades)
    saccades.enter().append("line")
        .classed('saccade', true)
        .attr('x1', (d,i) => {
            var prev = (i>0) ? dataset[i-1] : d;
            return xScale(prev.x);
        })
        .attr('y1', (d,i) => {
            var prev = (i>0) ? dataset[i-1] : d;
            return yScale(prev.y);
        })
        .attr('x2', d => xScale(d.x))
        .attr('y2', d => yScale(d.y))
        .attr('visibility','hidden')
        .transition()
            .delay((d, i) => {
                return timeScale(i*d.time);
            })
        .attr("visibility", "visible");

    // Bind dataset to circles (for fixations)
    var fixations = plotG.selectAll("circle")
        .data(dataset, (d) => { return d; }); //semantic binding
    // Add circles(fixations)
    fixations.enter().append("circle")
        .classed('fixation', true)
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y))
        .attr("r", d => rScale(d.duration))
        .attr("fill", (d) => {
            if (d.avg_dilation == 0.8550982142857144){ console.dir(d); }
            
            return (d.avg_dilation=="") ? 'darkgray' : colorScale(+d.avg_dilation);
        })
        .on('mouseover', (d) => {
            const msg = "<b>time</b>     " + formatSliderDisplay(d.time) + "<br>"
                      + "<b>x</b>:" + d.x+", <b>y</b>:"+d.y + "<br>"
                      + "<b>duration</b> " + d.duration + "ms <br>"
                      + "<b>dilation</b> "
                        + ((d.avg_dilation=="") ? "nan" : ((+d.avg_dilation).toFixed(2)+"mm"));
            tooltip.html(msg);
            tooltip.style("visibility", "visible");
        })
        .on("mousemove", () => {
            return tooltip.style("top",
                (d3.event.pageY-10)+"px")
                    .style("left",(d3.event.pageX+10)+"px");
        })
        .on('mouseout', () => {
            tooltip.style("visibility", "hidden");
            d3.select('#details').html('');
        })
        .attr("visibility","hidden")
        .transition()
            .delay((d, i) => {
                return timeScale(i*d.time);
            })
        .attr("visibility", "visible")
        .end()
        .then(() =>{
            showTimeSlider(true, fileNames.indexOf(file));
        });
        
        
        //initial mode to xy
        currentViewOption = ViewOption.XY;
        d3.select('#viewOptions').selectAll('button').classed('active', false);
        d3.select('#viewOption-xy').classed('active', true);
}

// Change the visibility of slider
const showTimeSlider = (show, i) => {
    if(show == true) {
        d3.select(`#time-label-${i}`).style("visibility", "visible");
    } else { 
        d3.select(`#time-label-${i}`).style("visibility", "hidden");
    }
}

const setScales = (data, file) => {
    console.log('setting scales.');

    const xValue = d => d.x;
    const yValue = d => d.y;
    const durationValue = d => d.duration;   // plot size
    const pupilValue = d => +d.avg_dilation;  // plot color
    const timeValue = d => d.time;
    xMax = d3.max(data, xValue);
    xMin = d3.min(data, xValue);
    console.log('x '+xMin+' : '+xMax);
    yMax = d3.max(data, yValue);
    yMin = d3.min(data, yValue);
    console.log('y '+yMin+' : '+yMax);
    durationMax = d3.max(data, durationValue);
    durationMin = d3.min(data, durationValue);
    console.log('duration '+durationMin+' : '+durationMax);
    pupilMax = d3.max(data, pupilValue);
    pupilMin = d3.min(data, pupilValue);
    console.log('pupil '+pupilMin+' : '+pupilMax);
    timeMax = d3.max(data, timeValue);
    timeMin = d3.min(data, timeValue);
    console.log('time '+timeMin+' : '+timeMax);

    xScale = d3.scaleLinear()
        .domain([0, xMax])
        .range([0+20, 450])
        .nice();
    yScale = d3.scaleLinear()
        .domain([0, yMax])
        .range([0+20, 450])
        .nice();
    rScale.domain([100, durationMax]).nice();
    colorScale.domain([0, 0.4, 1]);     //fixed with exagerated changes
    timeScale = d3.scaleLinear()
        .domain([0, timeMax])
        .range([0, 10])
        .nice();
        
    // Set time slider range
    d3.select(`#slider-${fileNames.indexOf(file)}`).attr('max', timeMax/1000) 
    console.log(`#slider-${fileNames.indexOf(file)}: ${timeMax / 1000}`)
    d3.select(`#pupilSlider-${fileNames.indexOf(file)}`).attr('max', (pupilMax + 0.005) *100) // Add 0.005 to fix rounding error when setting max value
    console.log(`#pupilSlider-${fileNames.indexOf(file)}: ${pupilMax* 100}`)
}


const filterByTime = (val, i) => {
    const ms = val * 1000;

    // Adjust the value of slider
    d3.select(`#timeRange${i}`).attr('value', val);

    // Update the time label
    updateTimeLabel(formatSliderDisplay(ms)+" m:ss", i);

    // Set visibility of circles
    d3.select(`#svg-div-${i}`).select(`#plot${fileNames[i].split('.csv')[0]}`).selectAll('circle')
        .style('visibility', 'hidden')
        .filter((d) => {
            return (d.time <= ms);
        })
        .style('visibility', 'visible');
    // Set visibility of lines
    d3.select(`#svg-div-${i}`).select(`#plot${fileNames[i].split('.csv')[0]}`).selectAll('line')
    .style('visibility', 'hidden')
    .filter((d) => {
        return (d.time <= ms);
    })
    .style('visibility', 'visible');
}

const filterByDilation = (val, i) => {
    const mm = val/100;

    // Adjust the value of slider
    d3.select(`#pupilRange${i}`).attr('value', val);

    // Update the time label
    updatePupilLabel(mm + " mm", i);

    // Set visibility of circles
    d3.select(`#svg-div-${i}`).select(`#plot${fileNames[i].split('.csv')[0]}`).selectAll('circle')
        .style('visibility', 'hidden')
        .filter((d) => {
            return (parseFloat(d.avg_dilation).toFixed(2) == mm );
        })
        .style('visibility', 'visible');
    // Set visibility of lines
    d3.select(`#svg-div-${i}`).select(`#plot${fileNames[i].split('.csv')[0]}`).selectAll('line')
    .style('visibility', 'hidden')
    .filter()
    .style('visibility', 'visible');
}


const updateTimeLabel = (val, i) => {
    d3.select(`#time-label-${i}`).text(val);
}

const updatePupilLabel = (val, i) => {
    d3.select(`#pupil-label-${i}`).text(val);
}

const formatSliderDisplay = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}
const clearFilters = () => {
    for (var i = 0; i < fileNames.length; i++) {
        console.log(`svg-div-${i}`)
        d3.select(`#svg-div-${i}`).append('g').attr('id',`plot${fileNames[i].split('.csv')[0]}`);
        
        fetchCsvCallOthers(fileNames[i],i);
    }
}