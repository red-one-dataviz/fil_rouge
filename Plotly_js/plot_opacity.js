var composite_modes = [
    "source-over",
    "lighter",
    "destination-over",
    "darken"
];

var color = d3.scale.linear()
    .domain([-1, 1])
    .range(["cadetblue", "#049"])
    .interpolate(d3.interpolateLab);

// keep the charts in an array
var pc_compositing = [];

d3.selectAll(".parcoords-compositing")
    .each(function(d,i) {
        var mode = composite_modes[i];
        pc_compositing[i] = d3.parcoords()(this)
            .data(data3)
            .alpha(0.3)
            .composite(mode)
            .color(function(d) {
                return color(Math.sin(d["sin(x)"]*10));
            })
            .margin({
                top: 20,
                left: -10,
                bottom: 0,
                right: -10
            })
            .render()
            .axisDots(0.2);

        pc_compositing[i].ctx.highlight.fillText(mode, 130, 10);
    });

// opacity slider
d3.select("#compositing-opacity").on("change", function() {
    d3.select("#alpha-opacity").text(Math.round(this.value*100)/100);
    for (mode in pc_compositing) {
        pc_compositing[mode].alpha(this.value).render();
    };
});