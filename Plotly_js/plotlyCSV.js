Plotly.d3.csv('https://raw.githubusercontent.com/red-one-dataviz/fil_rouge/plotly/Data2/csv_test.csv', function(err, rows){

    function unpack(rows, key) {
        return rows.map(function(row) {
            return row[key];
        });
    }

    var data = [{
        type: 'parcoords',
        line: {
            showscale: true,
            reversescale: true,
            colorscale: 'Jet',
            cmin: 0,
            cmax: 11000,
        },

        dimensions: [{
            constraintrange: [1000, 1850],
            range: [0, 8500],
            label: 'flight time',
            values: unpack(rows, 'flight time')
        }, {
            range: [-1, 10],
            label: 'phase n°',
            values: unpack(rows, 'phase_no')
        }, {
            label: 'altitude',
            range: [0, 1200],
            values: unpack(rows, 'altitude')
        }, {
            label: 'static pressure',
            range: [800, 1050],
            values: unpack(rows, 'static pressure')
        }, {
            range: [0, 260],
            label: 'ground speed',
            visible: true,
            values: unpack(rows, 'ground speed')
        }, {
            range: [0, 90],
            label: 'torque 1',
            values: unpack(rows, 'torque 1')
        }, {
            range: [0, 6],
            label: 'Oil pressure',
            values: unpack(rows, 'oil pressure 1')
        }, {
            range: [20, 90],
            label: 'Oil temp.',
            values: unpack(rows, 'oil temp. 1')
        }, {
            range: [0, 180],
            label: 'Fuel Flow',
            values: unpack(rows, 'fuel flow')
        }, {
            range: [90, 260],
            label: 'Fuel vol',
            values: unpack(rows, 'fuel vol.')
        }]
    }];

    Plotly.plot('graphDiv', data);

});