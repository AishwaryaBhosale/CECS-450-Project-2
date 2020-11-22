const fileNames = ['mergedTree.csv', 'mergedGraph.csv']

let xScale, yScale, timeScale;
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
const updateTimeLabel = (val, n) => {
    d3.select(`#timeLabel${n}`).text(val);
}
var currentViewOption = ViewOption.XY;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM content loaded. Initiating all setups.');
    
    //setting global vars and drawing csv
    svgDivTree= document.getElementById("svgDivTree");
    svgWidth = +500;
    svgHeight = +500;

    svg1 = d3.select("#svgDivTree")
        .append("svg")
        .attr("width", '100%')
        .attr("height", '100%')
        .attr("id", "drawnSvg1");
    svg1.append('g').attr('id',`plot${fileNames[0].split('.csv')[0]}`);
    svg1.append('g').attr('id',`guide${fileNames[0].split('.csv')[0]}`);

    fetchCsvCallOthers(fileNames[0]);
	
	svgDivGraph = document.getElementById("svgDivGraph");
    svgWidth = +500;
    svgHeight = +500;
    sleep(3000);
    svg2 = d3.select("#svgDivGraph")
        .append("svg")
        .attr("width", '100%')
        .attr("height", '100%')
        .attr("id", "drawnSvg2");
    svg2.append('g').attr('id',`plot${fileNames[1].split('.csv')[0]}`);
    svg2.append('g').attr('id',`guide${fileNames[1].split('.csv')[0]}`);
	
	fetchCsvCallOthers(fileNames[1]);

});

const sleep = (delay) => {
    var start = new Date().getTime();
    while (new Date().getTime() < start + delay);
}


const fetchCsvCallOthers = (file) => {

    console.log('fetching csv data.');

    // Removing previously drawn circles
    if(document.getElementById("drawnSvg") != undefined) {
        
        d3.select('#'+file).select(`#plot${file.split('.csv')[0]}`).selectAll('*').remove();
        d3.select('#'+file).select(`#guide${file.split('.csv')[0]}`).selectAll('*').remove();
    }
    
    d3.csv(file)
    .then((data) => {
        //converting all rows to int
        data.forEach((d,i) => {
            d.number = +1;
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
    console.log('drawing circles.');
    console.log(`dataset:`)
    console.dir(dataset[0])
    var tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltipDiv")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .text("");
    if (file === fileNames[0]) {
        var plotG = svg1.select(`#plot${file.split('.csv')[0]}`);
    }
    else if (file === fileNames[1]) {
        var plotG = svg2.select(`#plot${file.split('.csv')[0]}`);
    }

    
    var convexhull = plotG.append("polygon")
        .attr('id','convexhull')
        .attr("class", "hull");
    //put scaled d.x and d.y into vertices
    vertices = [];
    mergedData.forEach((d,i) => {
        vertices[i] = [xScale(d.x), yScale(d.y)];   //for convex hull
    });
    convexhull.datum(d3.polygonHull(vertices))
        .attr("points", (d) => { return d.join(" "); });
        
   // showConvexhull(false);
    //showSaccades(true);

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
            return (d.avg_dilation=="") ? 'darkgray' : colorScale(+d.avg_dilation);
        })
        .on('mouseover', (d) => {
            const msg = "<b>#" + d.number + "</b><br>"
                      + "<b>time</b>     " + formatToMinuteSecond(d.time) + "<br>"
                      + "<b>x</b>:" + d.x+", <b>y</b>:"+d.y + "<br>"
                      + "<b>duration</b> " + d.duration + "ms <br>"
                      + "<b>dilation</b> "
                        + ((d.avg_dilation=="") ? "nan" : ((+d.avg_dilation).toFixed(2)+"mm"));
            tooltip.html(msg);
            tooltip.style("visibility", "visible");
        })
        .on("mousemove", (d, i) => {
            return tooltip.style("top",
                (d3.event.pageY-10)+"px")
                    .style("left",(d3.event.pageX+10)+"px");
        })
        .on('mouseout', (d, i) => {
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
            showTimeSlider(true);
        });
        
        
        //initial mode to xy
        currentViewOption = ViewOption.XY;
        d3.select('#viewOptions').selectAll('button').classed('active', false);
        d3.select('#viewOption-xy').classed('active', true);
}

const showTimeSlider = (show) => {
    if(show == true) {
        d3.select('#timeLabel0').style("visibility", "visible");
        d3.select('#timeLabel1').style("visibility", "visible");
    } else {
        d3.select('#timeLabel0').style("visibility", "hidden");    
        d3.select('#timeLabel1').style("visibility", "hidden");   
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
        .range([0+20, svgWidth-50])
        .nice();
    yScale = d3.scaleLinear()
        .domain([0, yMax])
        .range([0+20, svgHeight-50])
        .nice();
    rScale.domain([100, durationMax]).nice();
    colorScale.domain([0, 0.4, 1]);     //fixed with exagerated changes
        // .domain([0, (pupilMin+pupilMax)/2, pupilMax])   //show the distribution as it is
        // .domain([0, pupilMax*0.4, pupilMax])            //bit distorted
    timeScale = d3.scaleLinear()
        .domain([0, timeMax])
        .range([0, 10])
        .nice();
        
    //set time slider range
    if (file === fileNames[0]) {
        d3.select('#timeRange0').attr('max', timeMax/1000) 
        console.log(`timeSlider0.max: ${timeMax / 1000}`)
    }  
    else if (file === fileNames[1]) {
        d3.select('#timeRange1').attr('max', timeMax/1000) 
        console.log(`timeSlider1.max: ${timeMax / 1000}`)
    }
}


const filterByTime = (val, n) => {
    //showConvexhull('disable');
    if (n == 0) {
        d3.select('#timeRange0').attr('value', val);
        console.log(`timeSlider2.val: ${val}`);
    }
    else if (n == 1) {
        d3.select('#timeRange1').attr('value', val);
        console.log(`timeSlider1.val: ${val}`);
    }
    var milliSeconds = val * 1000;
    updateTimeLabel(formatToMinuteSecond(milliSeconds), n);
    if (n == 0) {
        svg1.select(`#plot${fileNames[n].split('.csv')[0]}`).selectAll('circle')
            .style('visibility', 'hidden')
            .filter((d) => {
                return (d.time <= milliSeconds);
            })
            .style('visibility', 'visible');
        svg1.select(`#plot${fileNames[n].split('.csv')[0]}`).selectAll('line')
        .style('visibility', 'hidden')
        .filter((d) => {
            return (d.time <= milliSeconds);
        })
        .style('visibility', 'visible');
    }
    else if (n === 1) {
        svg2.select(`#plot${fileNames[n].split('.csv')[0]}`).selectAll('circle')
            .style('visibility', 'hidden')
            .filter((d) => {
                return (d.time <= milliSeconds);
            })
            .style('visibility', 'visible');
        svg2.select(`#plot${fileNames[n].split('.csv')[0]}`).selectAll('line')
        .style('visibility', 'hidden')
        .filter((d) => {
            return (d.time <= milliSeconds);
        })
        .style('visibility', 'visible');
    }

}

const formatToMinuteSecond = (milliSeconds) => {
    var minutes = Math.floor(milliSeconds / 60000);
    var seconds = ((milliSeconds % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}