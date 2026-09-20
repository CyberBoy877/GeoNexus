const width = 1000;
const height = 500;

const svg = d3.select("#map")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%")
    .attr("height", "100%");

const projection = d3.geoNaturalEarth1()
    .scale(160)
    .translate([width / 2, height / 2]);

const path = d3.geoPath()
    .projection(projection);

const mapGroup = svg.append("g");

d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
    .then(data => {

        const countries = topojson.feature(
            data,
            data.objects.countries
        );

        mapGroup
            .selectAll("path")
            .data(countries.features)
            .enter()
            .append("path")
            .attr("class", "country")
            .attr("d", path)
            .on("click", function(event, d) {

                const countryName =
                    d.properties.name;

                showCountry(countryName);
            })
            .append("title")
            .text(d => d.properties.name);
    })
    .catch(error => {
        console.error("Map loading error:", error);

        document.getElementById("map").innerHTML =
            "<p>Unable to load the world map.</p>";
    });


function showCountry(countryName) {

    document.getElementById("country-info").innerHTML = `
        <h2>${countryName}</h2>
        <p>You selected this country.</p>
    `;
}


function searchCountry() {

    const input =
        document.getElementById("searchInput");

    const country =
        input.value.trim();

    if (country === "") {
        alert("Please enter a country name.");
        return;
    }

    showCountry(country);
}
