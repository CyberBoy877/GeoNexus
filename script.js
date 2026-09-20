/* =========================================
   GeoNexus
   Main JavaScript
   ========================================= */


/* MAP SIZE */

const width = 1000;

const height = 520;


/* =========================================
   CREATE SVG
   ========================================= */

const svg = d3
    .select("#map")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");


/* =========================================
   MAP PROJECTION
   ========================================= */

const projection = d3
    .geoNaturalEarth1()
    .scale(170)
    .translate([
        width / 2,
        height / 2
    ]);


/* =========================================
   MAP PATH
   ========================================= */

const path = d3
    .geoPath()
    .projection(projection);


/* =========================================
   MAP GROUP
   ========================================= */

const mapGroup = svg
    .append("g");


/* =========================================
   MAP DATA URL
   ========================================= */

const mapURL =
    "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";


/* =========================================
   LOAD WORLD MAP
   ========================================= */

fetch(mapURL)

    .then(response => {

        if (!response.ok) {

            throw new Error(
                "Unable to download world map data."
            );

        }

        return response.json();

    })

    .then(data => {


        /* CONVERT TO GEOJSON */

        const countries =
            topojson.feature(
                data,
                data.objects.countries
            );


        /* REMOVE LOADING MESSAGE */

        const loading =
            document.querySelector(".loading");

        if (loading) {
            loading.remove();
        }


        /* =========================================
           DRAW COUNTRIES
           ========================================= */

        mapGroup
            .selectAll(".country")
            .data(countries.features)
            .enter()
            .append("path")

            .attr("class", "country")

            .attr("d", path)


            /* CLICK */

            .on("click", function(event, d) {

                const countryName =
                    d.properties.name ||
                    "Unknown Country";

                showCountry(countryName);

            })


            /* COUNTRY NAME ON HOVER */

            .append("title")

            .text(d => {

                return (
                    d.properties.name ||
                    "Unknown Country"
                );

            });


        console.log(
            "GeoNexus world map loaded successfully."
        );

    })


    /* =========================================
       ERROR HANDLING
       ========================================= */

    .catch(error => {

        console.error(
            "GeoNexus map error:",
            error
        );


        const map =
            document.getElementById("map");


        map.innerHTML = `

            <div class="loading">

                <h3>
                    Map failed to load
                </h3>

                <p>
                    ${error.message}
                </p>

                <p>
                    Please refresh the page.
                </p>

            </div>

        `;

    });


/* =========================================
   SHOW COUNTRY
   ========================================= */

function showCountry(countryName) {

    const countryInfo =
        document.getElementById(
            "country-info"
        );


    countryInfo.innerHTML = `

        <h2>
            🌍 ${countryName}
        </h2>

        <p>
            You selected ${countryName}.
            Detailed geographic information
            will be added in a future version.
        </p>

    `;

}


/* =========================================
   SEARCH COUNTRY
   ========================================= */

function searchCountry() {

    const input =
        document.getElementById(
            "searchInput"
        );


    const country =
        input.value.trim();


    if (country === "") {

        alert(
            "Please enter a country name."
        );

        return;

    }


    showCountry(country);

}


/* =========================================
   ENTER KEY SEARCH
   ========================================= */

document
    .getElementById("searchInput")
    .addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {

                searchCountry();

            }

        }
    );
