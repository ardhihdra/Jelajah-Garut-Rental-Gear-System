console.log("hallo");

var margin = {top: 20, right: 20, bottom: 30, left: 50},
   width = 960 - margin.left - margin.right,
   height = 500 - margin.top - margin.bottom;

var valueline = d3.line()
  .x(function(d) { return x(d.waktu_booking); })
  .y(function(d) { return y(d.total_biaya); });

var svg = d3.select("body").append("svg")
 .attr("width", width + margin.left + margin.right)
 .attr("height", height + margin.top + margin.bottom)
 .append("g").attr("transform",
 "translate(" + margin.left + "," + margin.top + ")");

d3.csv("pemasukan.csv", function(error, data) {
  if (error) throw error;
  // format the data
      data.forEach(function(d) {
         d.waktu_booking = d.waktu_booking;
         d.total_biaya = +d.total_biaya;
      });
      console.log(data);

      // Scale the range of the data
      x.domain(d3.extent(data, function(d) { return d.waktu_booking; }));
      y.domain([0, d3.max(data, function(d) { return d.total_biaya; })]);

      // Add the valueline path.
      svg.append("path")
         .data([data])
         .attr("class", "line")
         .attr("d", valueline);

      // Add the X Axis
      svg.append("g")
         .attr("transform", "translate(0," + height + ")")
         .call(d3.axisBottom(x));

      // Add the Y Axis
      svg.append("g")
         .call(d3.axisLeft(y));

});
